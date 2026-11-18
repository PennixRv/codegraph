import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import { buildTomlTable, getTomlTable, removeTomlTable, tomlDefinesTable, upsertTomlConnection as upsertTomlTable } from '../src/installer/targets/toml';

const header = 'mcp_servers.codegraph';
const block = buildTomlTable(header, { command: 'codegraph', args: ['serve', '--mcp'] });
function parse(text: string) {
  const r = spawnSync('python3', ['-c', 'import sys,tomllib,json; print(json.dumps(tomllib.loads(sys.stdin.read())))'], { input: text, encoding: 'utf8' });
  expect(r.status, r.stderr).toBe(0);
  return JSON.parse(r.stdout);
}

describe('TOML policy boundaries', () => {
  it.each(['  [ mcp_servers . "codegraph" ] # owner', "['mcp_servers'.'codegraph']", '[mcp_servers."codegr\\u0061ph"]'])('updates semantic header %s and preserves policy', (heading) => {
    const original = `${heading}\r\nenabled = false\r\ndisabled_tools = ["write"]\r\ncommand = "old"\r\nargs = [\r\n "old"\r\n]\r\n# next owner\r\n[mcp_servers.other]\r\ncommand = "keep"\r\n`;
    expect(tomlDefinesTable(original, header)).toBe(true);
    expect(getTomlTable(original, header)).toContain('enabled = false');
    const updated = upsertTomlTable(original, header, block);
    const data = parse(updated.content);
    expect(data.mcp_servers.codegraph).toEqual({ enabled: false, disabled_tools: ['write'], command: 'codegraph', args: ['serve', '--mcp'] });
    expect(updated.content).toContain('# next owner\r\n[mcp_servers.other]\r\ncommand = "keep"\r\n');
    expect(upsertTomlTable(updated.content, header, block)).toEqual({ content: updated.content, action: 'unchanged' });
    const removed = removeTomlTable(updated.content, header);
    expect(removed.action).toBe('removed');
    expect(parse(removed.content).mcp_servers).toEqual({ other: { command: 'keep' } });
  });

  it.each([
    'mcp_servers.codegraph.command = "old"\n',
    '[mcp_servers]\ncodegraph = { command = "old" }\n',
    'mcp_servers = { codegraph = { command = "old" }, other = {command = "keep"} }\n',
    '[[mcp_servers.codegraph]]\ncommand = "old"\n',
    '[mcp_servers.codegraph]\ncommand = "old"\n[mcp_servers."codegraph"]\ncommand = "other"\n',
  ])('refuses ambiguous or unsupported edits without rewriting %s', (original) => {
    expect(tomlDefinesTable(original, header)).toBe(true);
    expect(() => upsertTomlTable(original, header, block)).toThrow(/Cannot safely edit/);
  });

  it('does not see a multiline string header as a definition', () => {
    const original = 'description = """\n[mcp_servers.codegraph]\ncommand = "fake"\n"""\n';
    expect(tomlDefinesTable(original, header)).toBe(false);
    const updated = upsertTomlTable(original, header, block);
    expect(updated.content.startsWith(original)).toBe(true);
    expect(parse(updated.content).mcp_servers.codegraph.command).toBe('codegraph');
  });

  it('preserves unknown multiline values and nested env while adding missing args', () => {
    const original = '[mcp_servers.codegraph]\ncommand = "old"\nnotes = """\n[mcp_servers.fake]\n"""\n[mcp_servers.codegraph.env]\nTOKEN_NAME = "synthetic"\n';
    const updated = upsertTomlTable(original, header, block);
    const data = parse(updated.content).mcp_servers.codegraph;
    expect(data.env).toEqual({ TOKEN_NAME: 'synthetic' });
    expect(data.notes).toContain('[mcp_servers.fake]');
    expect(data.args).toEqual(['serve', '--mcp']);
    expect(upsertTomlTable(updated.content, header, block).action).toBe('unchanged');
  });

  it('removes direct dotted definitions but refuses a parent inline value', () => {
    expect(removeTomlTable('mcp_servers.codegraph.command = "old"\nmcp_servers.other.command = "keep"\n', header).content).toBe('mcp_servers.other.command = "keep"\n');
    const original = 'mcp_servers = { codegraph = {command = "old"}, other = {command = "keep"} }\n';
    expect(removeTomlTable(original, header)).toMatchObject({ content: original, action: 'conflict' });
  });
});
