/** Disposable read-only graph work. Its parent owns the process group and the deadline. */
import { execFileSync, spawn } from 'child_process';
import { createInterface } from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import CodeGraph from './index';
import type { Node } from './types';
import { extractCodeTokens } from './directory';
import { BoundWorktree } from './sync/worktree';
import { isRebuildInProgress } from './mcp/writer-lock';
import { validateAnswerFiles } from './mcp/answer-freshness';
import { CODEX_GRAPH_NUDGE, HOOK_INPUT_BYTES, boundedGraphContext, decodeCodexPrompt, promptIntent } from './codex-prompt-hook';

type ObjectValue = Record<string, unknown>;
const object = (v: unknown): v is ObjectValue => !!v && typeof v === 'object' && !Array.isArray(v);

/** Ask the installed host; never infer trust from a repo or write a trust decision. */
async function trustedProject(root: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const host = spawn('codex', ['app-server'], { cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    let done = false;
    const finish = (trusted = false): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      host.kill('SIGKILL');
      resolve(trusted);
    };
    const timer = setTimeout(() => finish(), 650);
    host.on('error', () => finish());
    host.on('exit', () => finish());
    host.stdin.on('error', () => finish());
    const lines = createInterface({ input: host.stdout });
    lines.on('line', (line) => {
      let reply: unknown;
      try { reply = JSON.parse(line); } catch { return; }
      if (!object(reply) || reply.error) return finish();
      if (reply.id === 1) {
        host.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
        host.stdin.write(JSON.stringify({ id: 2, method: 'config/read', params: { cwd: root, includeLayers: true } }) + '\n');
      } else if (reply.id === 2 && object(reply.result) && object(reply.result.config)) {
        const config = reply.result.config;
        const extra = object(config.additionalProperties) ? config.additionalProperties : config;
        const projects = object(extra.projects) ? extra.projects : null;
        const project = projects && object(projects[root]) ? projects[root] : null;
        finish(project?.trust_level === 'trusted');
      }
    });
    host.stdin.write(JSON.stringify({ id: 1, method: 'initialize', params: {
      clientInfo: { name: 'codegraph-prompt-hook', version: '1' }, capabilities: { experimentalApi: true },
    } }) + '\n');
  });
}

async function contextFor(value: unknown): Promise<string> {
  const input = decodeCodexPrompt(value);
  if (!input) return '';
  const intent = promptIntent(input);
  if (intent === 'none') return '';
  const root = fs.realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: input.cwd, windowsHide: true, encoding: 'utf8', timeout: 250, stdio: ['ignore', 'pipe', 'ignore'],
  }).trim());
  if (!await trustedProject(root)) return '';
  const bound = new BoundWorktree(root);
  if (!bound.resolve() || isRebuildInProgress(root)) return '';
  const cg = CodeGraph.openSync(root, { readOnly: true, strictWorktree: true });
  try {
    if (cg.isIndexStale() || cg.getIndexState() !== 'complete' || cg.getPendingReferenceCount() !== 0 || cg.getIndexHealth().needsReindex.length > 0) return '';
    if (intent === 'nudge') return CODEX_GRAPH_NUDGE;
    const paths = [...input.prompt.matchAll(/(?:`([^`\s]+)`|(?:[\w.-]+\/)+[\w.-]+\.[\w]+)/g)]
      .map(m => m[1] ?? m[0]);
    const candidates = [...new Set([...paths, ...extractCodeTokens(input.prompt)])].slice(0, 4);
    const anchors: Node[] = [];
    const fileAnchors: Node[] = [];
    for (const token of candidates) {
      const relative = path.isAbsolute(token) ? path.relative(root, token) : token;
      const file = cg.getFile(relative);
      if (file) {
        fileAnchors.push(...cg.getNodesInFile(relative).filter(n => ['function', 'method', 'class'].includes(n.kind)).slice(0, 2));
        continue;
      }
      const nodes = cg.getNodesByName(token);
      if (nodes.length > 1) continue;
      for (const node of nodes) if (!anchors.some(n => n.id === node.id) && anchors.length < 2) anchors.push(node);
    }
    // A file is a fallback anchor; explicit symbols must not lose to unrelated declarations.
    if (anchors.length === 0) anchors.push(...fileAnchors.slice(0, 2));
    if (anchors.length === 0) return CODEX_GRAPH_NUDGE;
    const contributing = new Map<string, { path: string; contentHash: string | null }>();
    const label = (node: Node): string => `${node.qualifiedName || node.name} (${node.filePath}:${node.startLine})`;
    const remember = (node: Node): void => {
      bound.assertSources([{ path: node.filePath }]);
      const file = cg.getFile(node.filePath);
      contributing.set(node.filePath, { path: node.filePath, contentHash: file?.contentHash ?? null });
    };
    const lines: string[] = [];
    for (const node of anchors) {
      remember(node);
      lines.push('Symbol: ' + label(node));
      // Same one-hop relationship queries as the native compact node view; no source bodies.
      for (const [direction, found] of [['Incoming', cg.getCallers(node.id)], ['Outgoing', cg.getCallees(node.id)]] as const) {
        for (const relation of found.slice(0, 12)) {
          remember(relation.node);
          lines.push(`${direction} ${relation.edge.kind}: ${label(relation.node)}`);
        }
        if (found.length > 12) lines.push(`${direction}: more relationships omitted; query the native tool.`);
      }
    }
    const freshness = await validateAnswerFiles(root, [...contributing.values()]);
    if (freshness.stale.length || freshness.unchecked.length) return '';
    return boundedGraphContext(
      `CodeGraph local graph summary (partial; use codegraph_explore for full evidence).\nprojectPath: ${JSON.stringify(root)}`,
      lines,
    );
  } finally { cg.close(); }
}

let size = 0;
const input: Buffer[] = [];
process.stdin.on('data', (chunk: Buffer) => {
  size += chunk.length;
  if (size > HOOK_INPUT_BYTES) process.exit(0);
  input.push(chunk);
});
process.stdin.on('end', () => {
  void (async () => {
    try {
      const value: unknown = JSON.parse(Buffer.concat(input).toString('utf8'));
      const decoded = decodeCodexPrompt(value);
      if (!decoded) return;
      const additionalContext = await contextFor(decoded);
      if (additionalContext) process.stdout.write(JSON.stringify({ hookSpecificOutput: {
        hookEventName: decoded.hook_event_name, additionalContext,
      } }));
    } catch { /* Additive context must never break a user's prompt. */ }
  })();
});
