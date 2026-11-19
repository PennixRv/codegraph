import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import CodeGraph from '../src/index';
import { BoundWorktree } from '../src/sync/worktree';
import { ToolHandler } from '../src/mcp/tools';
import { codexTarget } from '../src/installer/targets/codex';

const roots: string[] = [];
const graphs: CodeGraph[] = [];
const bin = path.resolve(__dirname, '../dist/bin/codegraph.js');
function fixture() {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cg-project-init-')));
  roots.push(root);
  return root;
}
function cli(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd: root, encoding: 'utf8', timeout: 60_000,
    env: { ...process.env, CODEGRAPH_TELEMETRY: '0', CODEGRAPH_NO_WATCH: '1' },
  });
}
afterEach(() => {
  for (const cg of graphs.splice(0)) cg.destroy();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('project-only initialization', { timeout: 90_000 }, () => {
  it('keeps non-Git init, sync, rebuild and MCP reads inside the same root', async () => {
    const root = fixture(), outside = fixture();
    fs.writeFileSync(path.join(root, 'source.ts'), 'export function localOnly() { return 1; }');
    fs.writeFileSync(path.join(outside, 'secret.ts'), 'export function outsideOnly() { return 2; }');
    fs.symlinkSync(outside, path.join(root, 'redirect'));
    const cg = await CodeGraph.init(root, { index: true, strictWorktree: true });
    graphs.push(cg);
    expect(cg.getFiles().map(f => f.path)).toEqual(['source.ts']);
    fs.writeFileSync(path.join(root, 'added.ts'), 'export function addedLater() { return 3; }');
    await cg.sync();
    const handler = new ToolHandler(cg, new BoundWorktree(root, true));
    expect(JSON.stringify(await handler.execute('codegraph_explore', { query: 'addedLater' }))).toContain('addedLater');
    expect((await handler.execute('codegraph_explore', { query: 'outsideOnly', projectPath: outside })).isError).toBe(true);
    cg.destroy();
    graphs.splice(graphs.indexOf(cg), 1);
    const rebuilt = await CodeGraph.recreate(root, { strictWorktree: true });
    graphs.push(rebuilt);
    await rebuilt.indexAll();
    expect(rebuilt.getFiles().map(f => f.path).sort()).toEqual(['added.ts', 'source.ts']);
  });

  it('does not borrow an ancestor index and rejects schema-only init as ready', async () => {
    const parent = fixture();
    const cg = await CodeGraph.init(parent, { index: true });
    cg.destroy();
    const child = path.join(parent, 'child');
    fs.mkdirSync(child);
    const result = cli(child, 'status', '--json', '--strict', '--project-only');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).projectPath).toBe(child);
    expect(JSON.parse(result.stdout).initialized).toBe(false);
    const empty = CodeGraph.initSync(child);
    empty.destroy();
    const init = cli(child, 'init', '--yes', '--project-only', '--no-git-hooks');
    expect(init.status).toBe(1);
    expect(init.stdout + init.stderr).toContain('not ready');
  });

  it('keeps empty projects valid and --yes never adds Git hooks when opted out', () => {
    const root = fixture();
    expect(spawnSync('git', ['init', '-q'], { cwd: root }).status).toBe(0);
    const hooks = path.join(root, '.git/hooks');
    const before = fs.readdirSync(hooks).sort();
    const result = cli(root, 'init', '--yes', '--project-only', '--no-git-hooks', '--local-only');
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(fs.readdirSync(hooks).sort()).toEqual(before);
    const status = cli(root, 'status', '--json', '--strict', '--project-only');
    expect(status.status, status.stdout + status.stderr).toBe(0);
    expect(JSON.parse(status.stdout).index.state).toBe('complete');
    expect(cli(root, 'init', '--yes', '--project-only', '--no-git-hooks').status).toBe(0);
  });

  it('rejects a broader Git binding combined with an exact child project', () => {
    const root = fixture();
    expect(spawnSync('git', ['init', '-q'], { cwd: root }).status).toBe(0);
    const child = path.join(root, 'child');
    fs.mkdirSync(child);
    const result = cli(root, 'serve', '--mcp', '--path', child, '--project-only', '--bound-worktree', root);
    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr).toContain('same project root');
  });

  it('preserves project-only MCP wiring on native refresh and user policy fields', () => {
    const root = fixture(), before = process.cwd();
    try {
      process.chdir(root);
      fs.mkdirSync('.codex');
      fs.writeFileSync('.codex/config.toml', '[mcp_servers.codegraph]\nenabled = false\n');
      codexTarget.install('local', { autoAllow: false, projectOnly: true });
      codexTarget.install('local', { autoAllow: false });
      const config = fs.readFileSync('.codex/config.toml', 'utf8');
      expect(config).toContain('enabled = false');
      expect(config).toContain('--project-only');
      expect(config).toContain(root);
      expect(config.match(/CODEGRAPH_START/g)).toBeNull();
      expect(fs.readFileSync('AGENTS.md', 'utf8').match(/CODEGRAPH_START/g)).toHaveLength(1);
    } finally { process.chdir(before); }
  });
});
