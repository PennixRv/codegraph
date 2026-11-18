import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import CodeGraph from '../src/index';
import { boundedGraphContext, CODEX_GRAPH_NUDGE, decodeCodexPrompt, HOOK_CONTEXT_BYTES, promptIntent } from '../src/codex-prompt-hook';

describe('Codex prompt relevance and output bounds', () => {
  const input = (prompt: string) => ({ hook_event_name: 'UserPromptSubmit' as const, cwd: '/project', prompt });
  it.each([
    ['Who calls helperLeaf?', 'candidate'], ['分析 helperLeaf 的影响范围', 'candidate'],
    ['支付模块依赖哪些服务？', 'candidate'], ['解释 helperLeaf 的实现', 'nudge'],
    ['分析代码调用链 ' + 'long '.repeat(500), 'nudge'],
    ['```js\nhelperLeaf()\n```\n分析调用链', 'nudge'],
    ['读取 config.json 的端口号', 'none'], ['Read the source code in src/main.ts', 'none'],
    ['阅读 helperLeaf 的源文件', 'none'], ['上游有没有 issue 提到 CodeGraph 调用不足？', 'none'],
    ['先核验交接包后停止 ' + 'history '.repeat(500), 'none'], ['把这段文案改为简体中文', 'none'],
  ])('%s => %s', (prompt, expected) => expect(promptIntent(input(prompt))).toBe(expected));

  it('rejects malformed events and limits complete UTF-8 relationship lines', () => {
    expect(decodeCodexPrompt({ ...input('calls'), cwd: '../elsewhere' })).toBeNull();
    expect(decodeCodexPrompt({ ...input('<task-notification>result</task-notification>') })).toBeNull();
    expect(decodeCodexPrompt({ hook_event_name: 'PreToolUse', cwd: '/project' })).toBeNull();
    expect(decodeCodexPrompt({ hook_event_name: 'SessionStart', cwd: '/project', source: 'compact' })).not.toBeNull();
    expect(Buffer.byteLength(CODEX_GRAPH_NUDGE)).toBeLessThanOrEqual(320);
    const line = 'Caller: 调用者 (src/中文.ts:12)';
    const text = boundedGraphContext('partial', Array(1000).fill(line));
    expect(Buffer.byteLength(text)).toBeLessThanOrEqual(HOOK_CONTEXT_BYTES);
    expect(text.split('\n').slice(1).every(s => s === line)).toBe(true);
    expect(text).not.toContain('\uFFFD');
  });
});

describe.runIf(process.platform === 'linux')('Codex native CLI hook over a real read-only graph', () => {
  let root: string;
  let bin: string;
  const cli = path.resolve(__dirname, '../dist/bin/codegraph.js');
  const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  const run = (prompt: string, extra: NodeJS.ProcessEnv = {}, cwd = root, event = 'UserPromptSubmit') => {
    const r = spawnSync(process.execPath, [cli, 'prompt-hook', '--agent', 'codex'], {
      cwd, encoding: 'utf8', timeout: 4000,
      input: JSON.stringify({ hook_event_name: event, source: 'compact', cwd, prompt }),
      env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH, CODEGRAPH_TELEMETRY: '0', ...extra },
    });
    expect(r.status, r.stderr).toBe(0);
    expect(r.error).toBeUndefined();
    return r.stdout;
  };
  beforeAll(async () => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cg-codex-hook-')));
    bin = path.join(root, 'host-bin');
    fs.mkdirSync(bin);
    git(root, 'init', '-b', 'main');
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src', 'main.ts'), 'export const unrelatedOne = 1;\nexport const unrelatedTwo = 2;\nexport function helperLeaf() { return 1; }\nexport function entryPoint() { return helperLeaf(); }\n');
    fs.writeFileSync(path.join(root, 'src', 'a.ts'), 'export function ambiguousHook() { return 1; }\n');
    fs.writeFileSync(path.join(root, 'src', 'b.ts'), 'export function ambiguousHook() { return 2; }\n');
    git(root, 'add', 'src');
    const cg = await CodeGraph.init(root, { index: true });
    cg.close();
    // Exact config/read shape; actual native Codex delivery is tested separately with a local Responses fixture.
    fs.writeFileSync(path.join(bin, 'codex'), `#!${process.execPath}\nconst fs=require('fs');const rl=require('readline').createInterface({input:process.stdin});fs.writeFileSync(${JSON.stringify(path.join(root, 'host.pid'))},String(process.pid));rl.on('line',l=>{const m=JSON.parse(l);if(process.env.CG_TEST_HANG)return;if(m.id===1)console.log(JSON.stringify({id:1,result:{}}));if(m.id===2)console.log(JSON.stringify({id:2,result:{config:{additionalProperties:{projects:{[m.params.cwd]:{trust_level:process.env.CG_TEST_TRUST??'trusted'}}}}}}));});\n`, { mode: 0o755 });
  });
  afterAll(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('frontloads verified symbols and file impact, while literals and external research stay silent', () => {
    const text = run('Who calls helperLeaf?');
    const result = JSON.parse(text).hookSpecificOutput;
    expect(result.hookEventName).toBe('UserPromptSubmit');
    expect(result.additionalContext).toContain('entryPoint');
    expect(result.additionalContext).toContain('src/main.ts');
    expect(Buffer.byteLength(result.additionalContext)).toBeLessThanOrEqual(HOOK_CONTEXT_BYTES);
    expect(run('分析 `src/main.ts` 的影响范围')).toContain('helperLeaf');
    expect(run('读取 config.json 的端口号')).toBe('');
    expect(run('上游有没有 issue 提到 CodeGraph 调用不足？')).toBe('');
  });

  it('only nudges uncertain or long prompts and after native compaction', () => {
    expect(JSON.parse(run('Who calls missingSymbol912?')).hookSpecificOutput.additionalContext).toBe(CODEX_GRAPH_NUDGE);
    expect(JSON.parse(run('调用链 helperLeaf ' + 'long '.repeat(500))).hookSpecificOutput.additionalContext).toBe(CODEX_GRAPH_NUDGE);
    expect(JSON.parse(run('', {}, root, 'SessionStart')).hookSpecificOutput.additionalContext).toBe(CODEX_GRAPH_NUDGE);
  });

  it('prioritizes an explicit symbol over unrelated declarations in its named file', () => {
    const text = JSON.parse(run('分析 `src/main.ts` 中 entryPoint 的调用链')).hookSpecificOutput.additionalContext;
    expect(text).toContain('Symbol: entryPoint');
    expect(text).toContain('Callee: helperLeaf');
    expect(text).not.toContain('Symbol: helperLeaf');
    expect(text).not.toContain('unrelatedOne');
  });

  it('keeps a verified unique anchor when another code token is ambiguous', () => {
    expect(run('Who calls helperLeaf? Also ambiguousHook.')).toContain('Caller: entryPoint');
    expect(JSON.parse(run('Who calls ambiguousHook?')).hookSpecificOutput.additionalContext).toBe(CODEX_GRAPH_NUDGE);
  });

  it('fails open for missing trust, timeout, kill switch and an independent child repo without an index', () => {
    expect(run('Who calls helperLeaf?', { CG_TEST_TRUST: 'untrusted' })).toBe('');
    expect(run('Who calls helperLeaf?', { CODEGRAPH_NO_PROMPT_HOOK: '1' })).toBe('');
    const began = Date.now();
    expect(run('Who calls helperLeaf?', { CG_TEST_HANG: '1' })).toBe('');
    expect(Date.now() - began).toBeLessThan(2500);
    const pid = Number(fs.readFileSync(path.join(root, 'host.pid'), 'utf8'));
    expect(() => process.kill(pid, 0)).toThrow();
    const child = path.join(root, 'independent');
    fs.mkdirSync(child);
    git(child, 'init', '-b', 'main');
    expect(run('Who calls helperLeaf?', {}, child)).toBe('');
    expect(fs.existsSync(path.join(child, '.codegraph'))).toBe(false);
  });

  it('refuses changed source instead of frontloading stale facts', () => {
    fs.appendFileSync(path.join(root, 'src', 'main.ts'), '\nexport const changed = true;\n');
    expect(run('Who calls helperLeaf?')).toBe('');
  });
});
