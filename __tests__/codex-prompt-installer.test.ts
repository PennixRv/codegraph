import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { codexTarget, CODEX_PROMPT_COMMAND } from '../src/installer/targets/codex';

describe.runIf(process.platform === 'linux')('Codex hook definitions without automatic trust', () => {
  let home: string;
  let file: string;
  beforeEach(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'cg-codex-install-'));
    file = path.join(home, 'hooks.json');
    vi.stubEnv('CODEX_HOME', home);
  });
  afterEach(() => { vi.unstubAllEnvs(); fs.rmSync(home, { recursive: true, force: true }); });

  it('merges two native events, preserves foreign order and AGENTS, and stays idempotent', () => {
    const other = { hooks: [{ type: 'command', command: 'other-owner' }] };
    const foreign = { hooks: { UserPromptSubmit: [other], Stop: [other] }, extra: 'keep' };
    fs.writeFileSync(file, JSON.stringify(foreign));
    fs.writeFileSync(path.join(home, 'AGENTS.md'), 'manual rules\n');
    const first = codexTarget.install('global', { autoAllow: false, promptHook: true });
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(doc.hooks.UserPromptSubmit[0]).toEqual(other);
    expect(doc.hooks.Stop).toEqual([other]);
    expect(doc.extra).toBe('keep');
    for (const event of ['UserPromptSubmit', 'SessionStart']) {
      expect(doc.hooks[event].at(-1).hooks).toEqual([{ type: 'command', command: CODEX_PROMPT_COMMAND, timeout: 2, additionalContextLimit: 0 }]);
    }
    expect(first.notes?.join(' ')).toContain('trust');
    expect(fs.readFileSync(path.join(home, 'config.toml'), 'utf8')).not.toContain('trusted_hash');
    const before = fs.readFileSync(file, 'utf8');
    expect(codexTarget.install('global', { autoAllow: false, promptHook: true }).files.every(f => f.action === 'unchanged')).toBe(true);
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
    expect(fs.readFileSync(path.join(home, 'AGENTS.md'), 'utf8')).toBe('manual rules\n');
  });

  it('uninstall keeps later foreign positions, while undefined leaves definitions alone', () => {
    codexTarget.install('global', { autoAllow: false, promptHook: true });
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    const later = { hooks: [{ type: 'command', command: 'later-owner' }] };
    doc.hooks.UserPromptSubmit.push(later);
    fs.writeFileSync(file, JSON.stringify(doc));
    const before = fs.readFileSync(file, 'utf8');
    codexTarget.install('global', { autoAllow: false });
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
    codexTarget.uninstall('global');
    const after = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(after.hooks.UserPromptSubmit).toEqual([{ hooks: [] }, later]);
    expect(JSON.stringify(after)).not.toContain(CODEX_PROMPT_COMMAND);
  });

  it('refuses invalid and mixed owned groups before changing MCP config', () => {
    fs.writeFileSync(file, '{ invalid');
    expect(() => codexTarget.install('global', { autoAllow: false, promptHook: true })).toThrow();
    expect(fs.existsSync(path.join(home, 'config.toml'))).toBe(false);
    const mixed = { hooks: { UserPromptSubmit: [{ hooks: [
      { type: 'command', command: CODEX_PROMPT_COMMAND }, { type: 'command', command: 'foreign' },
    ] }] } };
    fs.writeFileSync(file, JSON.stringify(mixed));
    expect(() => codexTarget.install('global', { autoAllow: false, promptHook: true })).toThrow(/mixed/);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual(mixed);
    expect(fs.existsSync(path.join(home, 'config.toml'))).toBe(false);
  });
});
