/**
 * OpenAI Codex CLI target.
 *
 *   - MCP server entry to `config.toml` as the dotted-key table
 *     `[mcp_servers.codegraph]`. TOML — not JSON — handled by the
 *     narrow serializer in `./toml.ts`.
 *   - Instructions to `AGENTS.md`.
 *
 * Both locations are supported (#1531):
 *   - global: `$CODEX_HOME/config.toml` + `$CODEX_HOME/AGENTS.md`,
 *     falling back to `~/.codex` when the env var is unset (#1627)
 *   - local:  `<cwd>/.codex/config.toml` + `<cwd>/AGENTS.md`
 *
 * Codex has a first-class project config layer: `.codex/config.toml`
 * is layer 4 of the loader's stack, above the user config (layer 6),
 * merged recursively top-over-bottom
 * (`codex-rs/config/src/loader/README.md` in openai/codex). It landed
 * in openai/codex#8354 (2025-12-22), so the "Codex has no
 * project-local config" note this file used to carry was never
 * accurate. The project layer strips a denylist of settings that
 * repo contents shouldn't get to choose (base URLs, model providers,
 * `notify`, profiles, otel — `loader/mod.rs`), and `mcp_servers` is
 * NOT on it, so a project-scoped `[mcp_servers.codegraph]` is honored.
 *
 * Caveat surfaced as an install note: project layers are "loaded but
 * disabled when untrusted," so a local install only takes effect in a
 * project the user has marked trusted.
 *
 * No permissions concept.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  AgentTarget,
  DetectionResult,
  InstallOptions,
  Location,
  WriteResult,
} from './types';
import {
  atomicWriteFileSync,
  getMcpServerConfig,
  removeFileUnlessLinked,
  removeProjectInstructionsEntry,
  validateProjectInstructionsFile,
  upsertInstructionsEntry,
} from './shared';
import { buildTomlTable, getTomlTable, removeTomlTable, tomlDefinesTable, tomlLineBreak, upsertTomlConnection } from './toml';
import { BoundWorktree } from '../../sync/worktree';

const TOML_HEADER = 'mcp_servers.codegraph';
export const CODEX_PROMPT_COMMAND = 'codegraph prompt-hook --agent codex';

/** Plan before writing the MCP entry, so an invalid shared hook file changes nothing. */
function promptHookPlan(enabled: boolean): { file: string; content: string; changed: boolean } | null {
  const file = path.join(configDir('global'), 'hooks.json');
  if (!fs.existsSync(file) && !enabled) return null;
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const doc = before ? JSON.parse(before) : {};
  const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!object(doc) || (doc.hooks !== undefined && !object(doc.hooks))) throw new Error('Cannot safely edit Codex hooks.json: invalid hook object.');
  if (!enabled && doc.hooks === undefined) return null;
  const hooks = doc.hooks ??= {};
  for (const event of ['UserPromptSubmit', 'SessionStart']) {
    const groups = hooks[event] ?? [];
    if (!Array.isArray(groups) || groups.some(g => !object(g) || !Array.isArray(g.hooks))) throw new Error(`Cannot safely edit Codex ${event} hooks.`);
    const owned = groups.map((g, i) => ({ g, i })).filter(({ g }) => g.hooks.some((h: unknown) => object(h) && h.command === CODEX_PROMPT_COMMAND));
    if (owned.length > 1 || owned.some(({ g }) => g.hooks.length !== 1 || Object.keys(g).some(k => k !== 'hooks'))) {
      throw new Error(`Cannot safely edit mixed, duplicate or customized CodeGraph ${event} hooks.`);
    }
    if (!enabled && owned.length === 0) continue;
    const desired = { hooks: [{ type: 'command', command: CODEX_PROMPT_COMMAND, timeout: 2, additionalContextLimit: 0 }] };
    if (owned.length) {
      const { i } = owned[0]!;
      // A vacant slot preserves every later foreign handler's native trust key.
      groups[i] = enabled ? desired : { hooks: [] };
      if (!enabled && i === groups.length - 1) groups.pop();
    } else if (enabled) groups.push(desired);
    if (groups.length) hooks[event] = groups;
    else delete hooks[event];
  }
  const changed = JSON.stringify(before ? JSON.parse(before) : {}) !== JSON.stringify(doc);
  return { file, content: JSON.stringify(doc, null, 2) + '\n', changed };
}

function configDir(loc: Location): string {
  if (loc !== 'global') return path.join(process.cwd(), '.codex');
  // Codex resolves its user layer from `CODEX_HOME` and only falls back to
  // `~/.codex` (#1627). Installing to the fallback while Codex reads the
  // override is a silent no-op: the files are written, and Codex never looks
  // at them. Same resolution the copilot-cli target already does for
  // `COPILOT_HOME`. Only the user layer moves — the project layer below is
  // anchored to the project, not the profile.
  const override = process.env.CODEX_HOME;
  if (override && override.trim().length > 0) return override;
  return path.join(os.homedir(), '.codex');
}
function tomlConfigPath(loc: Location): string {
  return path.join(configDir(loc), 'config.toml');
}
function instructionsPath(loc: Location): string {
  // Global AGENTS.md lives under ~/.codex/; project-local AGENTS.md
  // lives at the project root (NOT under .codex/) — that's the file
  // Codex reads for repo instructions, and it matches the local
  // layout the opencode and gemini targets already use.
  return loc === 'global'
    ? path.join(configDir('global'), 'AGENTS.md')
    : path.join(process.cwd(), 'AGENTS.md');
}

/**
 * Project layers are "loaded but disabled when untrusted" (openai/codex
 * `loader/mod.rs`), so a local install can be written correctly and
 * still do nothing. Say so rather than reporting silent success.
 */
function trustNote(): string {
  return `Codex applies ${tomlConfigPath('local')} only in a project marked trusted — otherwise the layer is loaded but disabled. Trust this project in Codex to activate it.`;
}

class CodexTarget implements AgentTarget {
  readonly id = 'codex' as const;
  readonly displayName = 'Codex CLI';
  readonly docsUrl = 'https://github.com/openai/codex';

  supportsLocation(_loc: Location): boolean {
    return true;
  }

  detect(loc: Location): DetectionResult {
    const tomlPath = tomlConfigPath(loc);
    let alreadyConfigured = false;
    if (fs.existsSync(tomlPath)) {
      try {
        const content = fs.readFileSync(tomlPath, 'utf-8');
        // However the table is written — an indented or quoted header,
        // dotted keys, an inline table (#2562).
        alreadyConfigured = tomlDefinesTable(content, TOML_HEADER);
      } catch { /* ignore */ }
    }
    // Global: ~/.codex/ existing means Codex has run here. Local: the
    // project only counts as "Codex-enabled" once it actually has a
    // .codex/ dir or config file of its own.
    const installed = fs.existsSync(configDir(loc)) || fs.existsSync(tomlPath);
    return { installed, alreadyConfigured, configPath: tomlPath };
  }

  install(loc: Location, opts: InstallOptions): WriteResult {
    const files: WriteResult['files'] = [];
    if (loc === 'local') validateProjectInstructionsFile(instructionsPath(loc));
    if (opts.boundWorktree && loc !== 'local') throw new Error('Worktree binding requires a local Codex installation.');
    const hook = loc === 'global' && opts.promptHook !== undefined && process.platform === 'linux'
      ? promptHookPlan(opts.promptHook) : null;
    if (opts.projectOnly && loc !== 'local') throw new Error('Project-only binding requires a local Codex installation.');
    files.push(writeMcpEntry(loc, opts.boundWorktree, opts.projectOnly));

    // AGENTS.md gets the short marker-fenced CodeGraph block (#704):
    // subagents and non-MCP harnesses read AGENTS.md but never the MCP
    // initialize instructions. Upsert self-heals a stale pre-#529 block.
    if (loc === 'local') files.push(upsertInstructionsEntry(instructionsPath(loc)));

    if (hook) {
      const existed = fs.existsSync(hook.file);
      if (hook.changed) atomicWriteFileSync(hook.file, hook.content);
      files.push({ path: hook.file, action: hook.changed ? existed ? 'updated' : 'created' : 'unchanged' });
    }
    return loc === 'local' ? { files, notes: [trustNote()] }
      : hook && opts.promptHook ? { files, notes: ['Codex requires review and trust of these exact hooks; Pennix Lifecycle manages that step. Project trust and indexes are unchanged.'] }
      : { files };
  }

  uninstall(loc: Location): WriteResult {
    const files: WriteResult['files'] = [];
    if (loc === 'local') validateProjectInstructionsFile(instructionsPath(loc));
    const hook = loc === 'global' ? promptHookPlan(false) : null;

    const tomlPath = tomlConfigPath(loc);
    if (fs.existsSync(tomlPath)) {
      const content = fs.readFileSync(tomlPath, 'utf-8');
      const result = removeTomlTable(content, TOML_HEADER);
      if (result.action === 'conflict') {
        throw new Error(`Cannot safely remove ${TOML_HEADER}: ${result.conflict.form} at line ${result.conflict.line}; file unchanged.`);
      }
      const { content: nextContent, action } = result;
      if (action === 'removed') {
        if (nextContent.trim() === '') {
          removeFileUnlessLinked(tomlPath, '');
        } else {
          atomicWriteFileSync(tomlPath, nextContent.trimEnd() + tomlLineBreak(content));
        }
        files.push({ path: tomlPath, action: 'removed' });
      } else {
        files.push({ path: tomlPath, action: 'not-found' });
      }
    } else {
      files.push({ path: tomlPath, action: 'not-found' });
    }

    if (loc === 'local') files.push(removeProjectInstructionsEntry(instructionsPath(loc), this.id));
    if (hook?.changed) {
      atomicWriteFileSync(hook.file, hook.content);
      files.push({ path: hook.file, action: 'removed' });
    }

    return { files };
  }

  printConfig(loc: Location): string {
    const block = buildCodegraphBlock();
    return `# Add to ${tomlConfigPath(loc)}\n\n${block}\n`;
  }

  describePaths(loc: Location): string[] {
    return loc === 'local' ? [tomlConfigPath(loc), instructionsPath(loc)] : [tomlConfigPath(loc), path.join(configDir(loc), 'hooks.json')];
  }
}

function buildCodegraphBlock(boundWorktree?: string, projectRoot?: string): string {
  const mcp = getMcpServerConfig();
  if (boundWorktree) mcp.args.push('--bound-worktree', boundWorktree);
  if (projectRoot) mcp.args.push('--path', projectRoot, '--project-only');
  return buildTomlTable(TOML_HEADER, {
    command: mcp.command,
    args: mcp.args,
  });
}

function writeMcpEntry(loc: Location, boundWorktree?: string, projectOnly?: boolean): WriteResult['files'][number] {
  const file = tomlConfigPath(loc);
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Single read — `existing === ''` derives both "is the file empty
  // or absent" and "what was its content," avoiding a TOCTOU window
  // between two `fs.existsSync` calls.
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
  const ownTable = getTomlTable(existing, TOML_HEADER);
  if (ownTable?.includes('--bound-worktree') || ownTable?.includes('--project-only')) {
    // Preserve an existing safety boundary during install/upgrade refresh.
    const raw = ownTable.match(/^args\s*=\s*(\[.*\])\s*$/m)?.[1];
    const args: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(args) || args[0] !== 'serve' || args[1] !== '--mcp') {
      throw new Error('Cannot safely refresh existing Codex worktree binding; use an explicit --bound-worktree.');
    }
    let savedRoot: string | undefined;
    let savedProjectOnly = false;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--bound-worktree' && typeof args[i + 1] === 'string') {
        const savedBoundRoot = args[++i];
        if (boundWorktree && fs.realpathSync(boundWorktree) !== fs.realpathSync(savedBoundRoot)) {
          throw new Error('Existing Codex worktree binding does not match the requested checkout.');
        }
        boundWorktree ??= savedBoundRoot;
      }
      else if (args[i] === '--path' && typeof args[i + 1] === 'string') savedRoot = args[++i];
      else if (args[i] === '--project-only') savedProjectOnly = true;
      else throw new Error('Cannot safely refresh existing Codex project binding.');
    }
    if (savedProjectOnly && (!savedRoot || fs.realpathSync(savedRoot) !== fs.realpathSync(process.cwd()))) {
      throw new Error('Existing Codex project binding does not match the current project.');
    }
    projectOnly ||= savedProjectOnly;
  }
  if (boundWorktree) {
    const bound = new BoundWorktree(boundWorktree);
    if (bound.root !== fs.realpathSync(process.cwd())) throw new Error('Local Codex binding must match the current checkout root.');
    boundWorktree = bound.root;
  }
  const projectRoot = projectOnly ? new BoundWorktree(process.cwd(), true).root : undefined;
  const block = buildCodegraphBlock(boundWorktree, projectRoot);
  const created = existing.length === 0;
  const { content: nextContent, action } = upsertTomlConnection(existing, TOML_HEADER, block);

  if (action === 'unchanged') {
    return { path: file, action: 'unchanged' };
  }
  atomicWriteFileSync(file, nextContent);
  return { path: file, action: created ? 'created' : 'updated' };
}

export const codexTarget: AgentTarget = new CodexTarget();
