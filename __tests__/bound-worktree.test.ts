import { afterEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import CodeGraph from '../src/index';
import { ToolHandler } from '../src/mcp/tools';
import { BoundWorktree, isWorktreeSource } from '../src/sync/worktree';
import { scanDirectory } from '../src/extraction';
import { codexTarget } from '../src/installer/targets/codex';

const roots: string[] = [];
const graphs: CodeGraph[] = [];
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cg-bound-')));
  roots.push(root);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.com');
  fs.writeFileSync(path.join(root, 'source.ts'), 'export function baseline() { return 0; }\n');
  git(root, 'add', '.');
  git(root, '-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture');
  return root;
}
async function index(root: string, symbol: string) {
  fs.writeFileSync(path.join(root, 'source.ts'), `export function ${symbol}() { return '${symbol}'; }\nexport function caller${symbol}() { return ${symbol}(); }\n`);
  const cg = await CodeGraph.init(root);
  await cg.indexAll();
  graphs.push(cg);
  return cg;
}
afterEach(() => {
  vi.unstubAllEnvs();
  for (const cg of graphs.splice(0)) cg.close();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});
describe('native bound worktree', { timeout: 60_000 }, () => {
  it('retains the upstream sensitive-folder refusal for an explicitly bound Git checkout', () => {
    const home = fixture();
    const secret = path.join(home, '.ssh');
    fs.mkdirSync(secret);
    git(secret, 'init', '-b', 'main');
    vi.stubEnv('HOME', home);
    vi.stubEnv('USERPROFILE', home);
    const bound = new BoundWorktree(secret);
    expect(() => bound.resolve()).toThrow(/Refusing to operate on sensitive directory/);
  });

  it('keeps same-HEAD dirty graphs and source separate, refuses both directions and revalidates symlinks', async () => {
    const a = fixture(), b = path.join(a, 'nested-b'), c = path.join(a, 'nested-c');
    git(a, 'worktree', 'add', '--detach', b, 'HEAD');
    git(a, 'worktree', 'add', '--detach', c, 'HEAD');
    expect(git(a, 'rev-parse', 'HEAD')).toBe(git(b, 'rev-parse', 'HEAD'));
    const handlers = [];
    for (const [root, symbol] of [[a, 'onlyAlpha'], [b, 'onlyBeta'], [c, 'onlyGamma']]) {
      const cg = await index(root, symbol);
      const bound = new BoundWorktree(root);
      const handler = new ToolHandler(cg, bound);
      handlers.push(handler);
      const result = await handler.execute('codegraph_explore', { query: symbol });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result)).toContain(symbol);
      expect(cg.getFiles().map(f => f.path)).toEqual(['source.ts']);
    }
    expect((await handlers[0].execute('codegraph_explore', { query: 'onlyBeta', projectPath: b })).isError).toBe(true);
    expect((await handlers[1].execute('codegraph_explore', { query: 'onlyAlpha', projectPath: a })).isError).toBe(true);
    expect((await handlers[1].execute('codegraph_explore', { query: 'onlyGamma', projectPath: c })).isError).toBe(true);
    fs.mkdirSync(path.join(b, 'src'));
    expect((await handlers[1].execute('codegraph_explore', { query: 'onlyBeta', projectPath: path.join(b, 'src') })).isError).not.toBe(true);
    expect(scanDirectory(a)).toEqual(['source.ts']);
    fs.symlinkSync(path.join(b, 'source.ts'), path.join(a, 'redirect.ts'));
    expect(isWorktreeSource(a, 'redirect.ts', true)).toBe(false);
    fs.renameSync(path.join(b, '.codegraph'), path.join(b, '.codegraph-saved'));
    fs.symlinkSync(path.join(a, '.codegraph'), path.join(b, '.codegraph'));
    expect((await handlers[1].execute('codegraph_explore', { query: 'onlyBeta' })).isError).toBe(true);
  });

  it('never borrows an ancestor index and keeps ordinary submodule sources', async () => {
    const a = fixture();
    await index(a, 'primaryOnly');
    const b = path.join(a, 'without-index');
    git(a, 'worktree', 'add', '--detach', b, 'HEAD');
    const bound = new BoundWorktree(b);
    expect(bound.resolve()).toBeNull();
    const result = await new ToolHandler(null, bound).execute('codegraph_explore', { query: 'primaryOnly' });
    expect(JSON.stringify(result)).toContain('No local index');
    const sub = fixture();
    git(a, '-c', 'protocol.file.allow=always', 'submodule', 'add', sub, 'normal-submodule');
    expect(isWorktreeSource(a, 'normal-submodule/source.ts', true)).toBe(true);
    expect(scanDirectory(a)).toContain('normal-submodule/source.ts');
  });

  it('keeps bound sync, watcher and reopen on the local dirty tree after reset', async () => {
    const a = fixture(), b = path.join(a, 'nested-b');
    git(a, 'worktree', 'add', '--detach', b, 'HEAD');
    await index(a, 'mainOnly');
    const prepared = await index(b, 'nodeOnly');
    prepared.close();
    graphs.splice(graphs.indexOf(prepared), 1);
    const cg = await CodeGraph.open(b, { strictWorktree: true });
    graphs.push(cg);
    const handler = new ToolHandler(cg, new BoundWorktree(b));
    fs.symlinkSync(path.join(a, 'source.ts'), path.join(b, 'outside.ts'));
    await cg.sync();
    expect(cg.getFiles().map(f => f.path)).toEqual(['source.ts']);
    git(b, 'restore', 'source.ts');
    await cg.sync();
    expect(JSON.stringify(await handler.execute('codegraph_explore', { query: 'nodeOnly' }))).not.toContain('function nodeOnly');
    const changed = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('bound watcher did not observe local source')), 10_000);
      cg.watch({ debounceMs: 30, onSyncComplete: () => { clearTimeout(timer); resolve(); } });
    });
    fs.writeFileSync(path.join(b, 'source.ts'), 'export function afterResume() { return 9; }\n');
    await changed;
    cg.unwatch();
    await cg.sync();
    expect(JSON.stringify(await handler.execute('codegraph_explore', { query: 'afterResume' }))).toContain('afterResume');
    expect(JSON.stringify(await new ToolHandler(graphs[0], new BoundWorktree(a)).execute('codegraph_explore', { query: 'mainOnly' }))).toContain('mainOnly');
    expect(cg.getFiles().map(f => f.path)).toEqual(['source.ts']);
  });

  it('retains local Codex binding on refresh and preserves unrelated user config', () => {
    const root = fixture(), before = process.cwd();
    try {
      process.chdir(root);
      fs.mkdirSync(path.join(root, '.codex'));
      fs.writeFileSync(path.join(root, '.codex/config.toml'), 'model = "unchanged"\n');
      codexTarget.install('local', { autoAllow: false, boundWorktree: root });
      codexTarget.install('local', { autoAllow: false });
      const config = fs.readFileSync(path.join(root, '.codex/config.toml'), 'utf8');
      expect(config).toContain('model = "unchanged"');
      expect(config).toContain('--bound-worktree');
      expect(config).toContain(root);
    } finally { process.chdir(before); }
  });
});
