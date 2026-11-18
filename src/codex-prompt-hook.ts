/** Codex-only frontloading. The default Claude prompt-hook keeps its native behavior. */
import { spawn } from 'child_process';
import * as path from 'path';

export const HOOK_INPUT_BYTES = 64 * 1024;
export const HOOK_CONTEXT_BYTES = 2048;
export const HOOK_NUDGE_BYTES = 320;
export const HOOK_WORK_MS = 1250;

export interface CodexPrompt {
  hook_event_name: 'UserPromptSubmit' | 'SessionStart';
  cwd: string;
  prompt: string;
  source?: string;
}

export function decodeCodexPrompt(value: unknown): CodexPrompt | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.cwd !== 'string' || v.cwd.length > 4096 || !path.isAbsolute(v.cwd)) return null;
  if (v.hook_event_name === 'UserPromptSubmit' && typeof v.prompt === 'string') {
    if (/<(?:task-notification|agent-message)\b/.test(v.prompt)) return null;
    return { hook_event_name: v.hook_event_name, cwd: v.cwd, prompt: v.prompt };
  }
  if (v.hook_event_name === 'SessionStart' && typeof v.source === 'string' &&
      ['startup', 'resume', 'fork', 'clear', 'compact'].includes(v.source)) {
    return { hook_event_name: v.hook_event_name, cwd: v.cwd, prompt: '', source: v.source };
  }
  return null;
}

const RELATION = /调用链|调用路径|调用者|调用关系|谁调用|影响范围|依赖|哪些测试|数据流|call(?:er|ers| path| graph| chain|s)\b|blast.radius|dependenc|impact|data.flow/i;
const CODE_INTENT = /函数|源码|代码|模块|架构|function|source.code|module|architecture/i;
const EXTERNAL = /上游|issue|pull.request|发行|发布|版本|交接|handoff|文案|技术文档|用户规则/i;

/** Keywords nominate candidates; only an indexed, unambiguous anchor can frontload facts. */
export function promptIntent(input: CodexPrompt): 'none' | 'nudge' | 'candidate' {
  if (input.hook_event_name === 'SessionStart') return 'nudge';
  const text = input.prompt.slice(0, 2048);
  if (EXTERNAL.test(text)) return 'none';
  if (input.prompt.length > 2048 || text.includes('```')) {
    return RELATION.test(text) && (CODE_INTENT.test(text) || /[a-z][A-Z]|`/.test(text)) ? 'nudge' : 'none';
  }
  if (RELATION.test(text)) return 'candidate';
  const explanation = /解释|分析|explain/i.test(text) && (CODE_INTENT.test(text) || /[a-z][A-Z]|`/.test(text));
  return explanation || /架构|architecture/i.test(text) ? 'nudge' : 'none';
}

export const CODEX_GRAPH_NUDGE = 'Use CodeGraph for calls, dependencies and impact in this trusted indexed checkout. Discover codegraph_explore, or use codegraph explore if MCP is unavailable. Check freshness; use text tools for literals and config.';

/** Keep complete semantic lines. A clipped relationship is not evidence. */
export function boundedGraphContext(header: string, lines: string[], cap = HOOK_CONTEXT_BYTES): string {
  if (Buffer.byteLength(header) > cap) return '';
  let result = header;
  for (const line of lines) {
    if (Buffer.byteLength(result + '\n' + line) > cap) break;
    result += '\n' + line;
  }
  return result;
}

export async function runCodexPromptHook(): Promise<void> {
  // Pennix publishes Linux x64; other platforms retain their existing native routes.
  if (process.platform !== 'linux' || process.stdin.isTTY || process.env.CODEGRAPH_NO_PROMPT_HOOK === '1' || process.env.CODEGRAPH_PROMPT_HOOK === '0') return;
  await new Promise<void>((resolve) => {
    let child: ReturnType<typeof spawn> | undefined;
    let done = false;
    let size = 0;
    const input: Buffer[] = [];
    const output: Buffer[] = [];
    let outputBytes = 0;
    const finish = (answer = ''): void => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      process.stdin.destroy();
      // Includes the worker's Git/config-read children, even if the worker already exited.
      if (child?.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } }
      if (answer) process.stdout.write(answer);
      resolve();
    };
    const timer = setTimeout(() => finish(), HOOK_WORK_MS);
    process.stdin.on('error', () => finish());
    process.stdin.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > HOOK_INPUT_BYTES) finish();
      else input.push(chunk);
    });
    process.stdin.on('end', () => {
      if (done) return;
      let decoded: CodexPrompt | null;
      try { decoded = decodeCodexPrompt(JSON.parse(Buffer.concat(input).toString('utf8'))); } catch { return finish(); }
      if (!decoded || promptIntent(decoded) === 'none') return finish();
      // Keep one extra character to preserve the long-prompt downgrade in the worker.
      decoded.prompt = decoded.prompt.slice(0, 2049);
      try {
        child = spawn(process.execPath, [path.join(__dirname, 'codex-prompt-worker.js')], {
          detached: true, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'],
          env: { ...process.env, CODEGRAPH_TELEMETRY: '0', CODEGRAPH_NO_DAEMON: '1' },
        });
        child.stdin!.on('error', () => finish());
        child.stdout!.on('data', (chunk: Buffer) => {
          outputBytes += chunk.length;
          if (outputBytes > 4096) finish();
          else output.push(chunk);
        });
        child.on('error', () => finish());
        child.on('close', (code) => {
          if (done || code !== 0 || !decoded) return finish();
          try {
            const response = JSON.parse(Buffer.concat(output).toString('utf8')).hookSpecificOutput;
            if (response?.hookEventName !== decoded.hook_event_name || typeof response.additionalContext !== 'string' ||
                Buffer.byteLength(response.additionalContext) > HOOK_CONTEXT_BYTES) return finish();
            finish(JSON.stringify({ hookSpecificOutput: response }) + '\n');
          } catch { finish(); }
        });
        child.stdin!.end(JSON.stringify(decoded));
      } catch { finish(); }
    });
  });
}
