import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getTarget } from '../src/installer/targets/registry';
import { refreshTargets } from '../src/installer';
import { CODEGRAPH_SECTION_START as start, CODEGRAPH_SECTION_END as end } from '../src/installer/instructions-template';

describe('Pennix project instructions safety', () => {
  let cwd: string;
  let project: string;
  const codex = getTarget('codex')!;
  const opencode = getTarget('opencode')!;
  beforeEach(() => {
    cwd = process.cwd();
    project = fs.mkdtempSync(path.join(os.tmpdir(), 'pennix-instructions-'));
    process.chdir(project);
  });
  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(project, { recursive: true, force: true });
  });

  it.each([`${start} missing end`, `${end}\n${start}`, `${start}\n${end}\n${start}\n${end}`, `missing start ${end}`])(
    'refuses ambiguous markers before changing config: %s', content => {
      const file = path.join(project, 'AGENTS.md');
      fs.writeFileSync(file, content);
      for (const target of [codex, opencode]) {
        expect(() => target.install('local', { autoAllow: false })).toThrow(/markers/);
        expect(() => target.uninstall('local')).toThrow(/markers/);
        expect(fs.readFileSync(file, 'utf8')).toBe(content);
        expect(target.detect('local').alreadyConfigured).toBe(false);
      }
    });

  it('preserves manual and Trellis bytes through local install, refresh and uninstall', () => {
    const file = path.join(project, 'AGENTS.md');
    const manual = '  # Project\n\n<!-- TRELLIS:START -->\nTrellis\n<!-- TRELLIS:END -->\n\n';
    fs.writeFileSync(file, manual);
    codex.install('local', { autoAllow: false });
    const installed = fs.readFileSync(file, 'utf8');
    expect(installed.startsWith(manual)).toBe(true);
    refreshTargets([codex], 'local');
    expect(fs.readFileSync(file, 'utf8')).toBe(installed);
    codex.uninstall('local');
    expect(fs.readFileSync(file, 'utf8')).toBe(manual + '\n');
  });

  it.each([[codex, opencode], [opencode, codex]])('keeps the shared block until the last consumer exits', (first, last) => {
    first.install('local', { autoAllow: false });
    last.install('local', { autoAllow: false });
    const file = path.join(project, 'AGENTS.md');
    const content = fs.readFileSync(file, 'utf8');
    expect(first.uninstall('local').files.find(f => f.path === file)?.action).toBe('kept');
    expect(fs.readFileSync(file, 'utf8')).toBe(content);
    last.uninstall('local');
    expect(fs.existsSync(file)).toBe(false);
  });

  it('keeps the block when another consumer config is unreadable or ambiguous', () => {
    codex.install('local', { autoAllow: false });
    fs.writeFileSync(path.join(project, 'opencode.jsonc'), '{ broken codegraph');
    const file = path.join(project, 'AGENTS.md');
    const content = fs.readFileSync(file, 'utf8');
    expect(codex.uninstall('local').files.find(f => f.path === file)?.action).toBe('kept');
    expect(fs.readFileSync(file, 'utf8')).toBe(content);
  });

  it.runIf(process.platform === 'linux')('refuses symlink instructions without replacing the link or target', () => {
    const file = path.join(project, 'AGENTS.md');
    const target = path.join(project, 'manual.md');
    fs.writeFileSync(target, 'manual');
    fs.symlinkSync(target, file);
    expect(() => codex.install('local', { autoAllow: false })).toThrow(/unsafe/);
    expect(fs.lstatSync(file).isSymbolicLink()).toBe(true);
    expect(fs.readFileSync(target, 'utf8')).toBe('manual');
    expect(codex.detect('local').alreadyConfigured).toBe(false);
  });

  it('global install, refresh and uninstall preserve user AGENTS', () => {
    for (const target of [codex, opencode]) {
      const config = target.detect('global').configPath!;
      const file = path.join(path.dirname(config), 'AGENTS.md');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${start}\nlegacy\n${end}\nmanual`);
      const content = fs.readFileSync(file, 'utf8');
      target.install('global', { autoAllow: false });
      refreshTargets([target], 'global');
      target.uninstall('global');
      expect(fs.readFileSync(file, 'utf8')).toBe(content);
    }
  });
});
