/**
 * Structural TOML edits, selectively ported from upstream 329dd12f.
 * Decode key paths and skip multiline values; preserve user policy and siblings.
 * shortcut: this is not a general TOML validator; unsupported definitions fail
 * before writing. Use a full parser if the installer must rewrite inline values.
 */
/**
 * Serialize a record into the body lines of a TOML table. Values
 * supported: string, string[]. Other types throw — the codex MCP
 * config only needs these two.
 */
export function serializeTomlTableBody(values: Record<string, string | string[]>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      lines.push(`${key} = ${quoteString(value)}`);
    } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      const parts = value.map(quoteString).join(', ');
      lines.push(`${key} = [${parts}]`);
    } else {
      throw new Error(`Unsupported TOML value type for key "${key}"`);
    }
  }
  return lines.join('\n');
}

function quoteString(s: string): string {
  // TOML basic strings: backslash and double-quote escapes; control
  // chars not expected in our payload (paths/args).
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/**
 * Build a full table block: header line + body. Suitable for direct
 * insertion into a TOML file.
 */
export function buildTomlTable(header: string, values: Record<string, string | string[]>): string {
  return `[${header}]\n${serializeTomlTableBody(values)}`;
}

/** Read only one unambiguous writer-owned table. */
export function getTomlTable(content: string, header: string): string | null {
  const layout = layoutOf(content, header.split('.'));
  assertWritable(layout, header);
  const table = layout.tables[0];
  return table ? content.slice(table.start, table.end) : null;
}

export interface TomlConflict {
  kind: 'defined' | 'blocked';
  line: number;
  form: 'dotted keys' | 'an inline table' | 'a value' | 'an array of tables';
  key: string;
}

function assertWritable(layout: TableLayout, header: string): void {
  const conflict = layout.blocked ?? layout.defined;
  if (conflict) throw new Error(`Cannot safely edit ${header}: ${conflict.form} at line ${conflict.line}; file unchanged.`);
  if (layout.tables.length > 1) throw new Error(`Cannot safely edit duplicate ${header} tables; file unchanged.`);
}

/** Replace only supplied keys, retaining unknown settings, comments and subtables. */
export function upsertTomlTable(
  content: string,
  header: string,
  block: string,
): { content: string; action: 'inserted' | 'replaced' | 'unchanged' } {
  const target = header.split('.');
  const layout = layoutOf(content, target);
  assertWritable(layout, header);
  const eol = tomlLineBreak(content);
  const table = layout.tables[0];
  if (!table) {
    const sep = content.length === 0 ? '' : content.endsWith(eol + eol) ? '' : content.endsWith(eol) ? eol : eol + eol;
    return { content: content + sep + block.replace(/\r?\n/g, eol) + eol, action: 'inserted' };
  }
  const statements = scanTomlStatements(content);
  const updates = scanTomlStatements(block).filter((s) => s.kind === 'key');
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const missing: string[] = [];
  for (const update of updates) {
    const matches = statements.filter((s) => s.kind === 'key' && s.path && update.path && samePath(s.path, update.path));
    if (matches.length > 1 || statements.some((s) => s.path && update.path && startsWithPath(s.path, update.path) && (s.kind !== 'key' || !samePath(s.path, update.path)))) {
      throw new Error(`Cannot safely edit duplicate or nested key in ${header}; file unchanged.`);
    }
    const text = block.slice(update.start, update.end).replace(/(?:\r?\n)+$/, '').replace(/\r?\n/g, eol) + eol;
    if (matches[0]) edits.push({ start: matches[0].start, end: matches[0].end, text });
    else missing.push(text);
  }
  if (missing.length) edits.push({ start: table.end, end: table.end, text: (content.slice(0, table.end).endsWith('\n') ? '' : eol) + missing.join('') });
  let next = content;
  // Stable ordering keeps an insertion after the last replaced statement.
  for (const edit of edits.sort((a, b) => b.start - a.start)) next = next.slice(0, edit.start) + edit.text + next.slice(edit.end);
  return { content: next, action: next === content ? 'unchanged' : 'replaced' };
}

function keepFinalLineBreak(original: string, content: string, eol: string): string {
  return content.length > 0 && original.endsWith('\n') && !content.endsWith('\n') ? content + eol : content;
}

/**
 * Remove a top-level dotted-key TOML table block. Returns the
 * possibly-empty new content + an action flag.
 *
 * Removes every definition of the table: each `[header]` block however
 * its line is written, its sub-tables (`[header.env]` alone would leave a
 * server entry with no command), and keys that define it with dotted keys
 * or an inline table. `'conflict'` (content untouched) when it is defined
 * inside a parent's inline table, which can't be edited safely.
 */
export function removeTomlTable(
  fileContent: string,
  header: string,
):
  | { content: string; action: 'removed' | 'not-found' }
  | { content: string; action: 'conflict'; conflict: TomlConflict } {
  const layout = layoutOf(fileContent, header.split('.'));
  if (layout.inParentValue) return { content: fileContent, action: 'conflict', conflict: layout.inParentValue };

  const eol = tomlLineBreak(fileContent);
  const blocks = [...layout.tables, ...layout.subTables];
  const removals = [
    ...blocks.map((b) => ({ ...b, isBlock: true })),
    ...layout.keys.map((k) => ({ start: k.start, end: k.end, isBlock: false })),
  ].sort((a, b) => b.start - a.start);
  if (removals.length === 0) return { content: fileContent, action: 'not-found' };

  let content = fileContent;
  for (const r of removals) {
    content = r.isBlock ? spliceBlock(content, r, null, eol) : content.slice(0, r.start) + content.slice(r.end);
  }
  return { content: keepFinalLineBreak(fileContent, content, eol), action: 'removed' };
}

/**
 * Whether the file defines the table in any form — a `[header]` block
 * however it is written, a sub-table of it, dotted keys, or an inline
 * table. What a Codex install counts as "already configured".
 */
export function tomlDefinesTable(fileContent: string, header: string): boolean {
  const layout = layoutOf(fileContent, header.split('.'));
  return layout.tables.length > 0 || layout.subTables.length > 0 || layout.defined !== null;
}
/** The line break `content` uses (its first one); `\n` when it has none. */
export function tomlLineBreak(content: string): '\n' | '\r\n' {
  const nl = content.indexOf('\n');
  return nl > 0 && content[nl - 1] === '\r' ? '\r\n' : '\n';
}

/**
 * Replace (or, with `replacement` null, remove) the block at `range`,
 * rejoining what's around it with one blank line, in the file's line
 * breaks — the shape the installer has always left.
 */
function spliceBlock(content: string, range: { start: number; end: number }, replacement: string | null, eol: string): string {
  const before = content.substring(0, range.start).replace(/(?:\r?\n)+$/, '');
  const after = content.substring(range.end).replace(/^(?:\r?\n)+/, '');
  if (replacement === null) return before + (before && after ? eol + eol : '') + after;
  return before + (before ? eol + eol : '') + replacement + (after ? eol + eol : eol) + after;
}

// ---------------------------------------------------------------------------
// Structure scan
// ---------------------------------------------------------------------------

interface TomlStatement {
  kind: 'table' | 'array-table' | 'key';
  /** The decoded key path; for a key, including the table it sits in. Null when unreadable. */
  path: string[] | null;
  /** The table a key sits in (for a header, its own path). */
  table: string[] | null;
  /** Offset of the statement's first line. */
  start: number;
  /** Offset just past the statement's last line (its line break included). */
  end: number;
  /** 1-based line of the statement's first line. */
  line: number;
  /** For a key: whether its value is an inline table (`{`). */
  inlineTable?: boolean;
}

interface TableLayout {
  /** `[path]` blocks: from the header line to the next header or EOF. */
  tables: Array<{ start: number; end: number }>;
  /** Blocks of headers below `path` (`[path.env]`, `[[path.x]]`). */
  subTables: Array<{ start: number; end: number }>;
  /** Key statements that define `path` outside its own blocks. */
  keys: TomlStatement[];
  /** The first definition of `path` in a form other than a `[path]` block. */
  defined: TomlConflict | null;
  /** The first statement that makes a `[path]` header invalid. */
  blocked: TomlConflict | null;
  /** `path` set inside a parent's value (e.g. `mcp_servers = { codegraph = … }`). */
  inParentValue: TomlConflict | null;
}

function layoutOf(content: string, path: string[]): TableLayout {
  const statements = scanTomlStatements(content);
  // A header's block runs to the end of its last key, so blank and comment
  // lines before the next header (a comment heading the next table) stay
  // with what follows.
  const blockOf = (i: number) => {
    let end = statements[i]!.end;
    for (let j = i + 1; j < statements.length && statements[j]!.kind === 'key'; j++) end = statements[j]!.end;
    return { start: statements[i]!.start, end };
  };
  const layout: TableLayout = { tables: [], subTables: [], keys: [], defined: null, blocked: null, inParentValue: null };
  const keyText = path.join('.');

  statements.forEach((s, i) => {
    if (!s.path) return;
    if (s.kind !== 'key') {
      if (s.kind === 'table' && samePath(s.path, path)) {
        layout.tables.push(blockOf(i));
      } else if (startsWithPath(s.path, path)) {
        // `[path.env]`, `[[path.x]]` — and `[[path]]`, which also defines the
        // table as an array of tables we don't rewrite.
        layout.subTables.push(blockOf(i));
        if (samePath(s.path, path)) {
          const conflict: TomlConflict = { kind: 'defined', line: s.line, form: 'an array of tables', key: keyText };
          layout.defined ??= conflict;
          layout.blocked ??= { ...conflict, kind: 'blocked' };
        }
      } else if (s.kind === 'array-table' && startsWithPath(path, s.path)) {
        layout.blocked ??= { kind: 'blocked', line: s.line, form: 'an array of tables', key: s.path.join('.') };
      }
      return;
    }
    // A key inside the table's own blocks is its body, not a definition.
    if (s.table && startsWithPath(s.table, path)) return;
    if (startsWithPath(s.path, path)) {
      layout.keys.push(s);
      const form = s.path.length > path.length ? 'dotted keys' : s.inlineTable ? 'an inline table' : 'a value';
      layout.defined ??= { kind: 'defined', line: s.line, form, key: s.path.join('.') };
    } else if (startsWithPath(path, s.path)) {
      // A parent set as a value: `mcp_servers = { … }`. No `[path]` header
      // can follow it, and anything of ours inside it can't be edited.
      const conflict: TomlConflict = {
        kind: 'blocked', line: s.line, form: s.inlineTable ? 'an inline table' : 'a value', key: s.path.join('.'),
      };
      layout.blocked ??= conflict;
      const text = content.substring(s.start, s.end);
      const last = path[path.length - 1]!;
      if (new RegExp(String.raw`(^|[{,.\s])["']?${escapeRegExp(last)}["']?\s*[=.]`).test(text.slice(text.indexOf('=') + 1))) {
        layout.inParentValue ??= { ...conflict, kind: 'defined' };
        layout.defined ??= { ...conflict, kind: 'defined' };
      }
    }
  });
  return layout;
}

function samePath(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function startsWithPath(a: readonly string[], prefix: readonly string[]): boolean {
  return prefix.length <= a.length && prefix.every((x, i) => x === a[i]);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split `content` into statements. A line counts only when it starts
 * outside a multiline value; the lines of a value that spans several are
 * folded into the key statement that opened it.
 */
function scanTomlStatements(content: string): TomlStatement[] {
  const statements: TomlStatement[] = [];
  const state: TomlLexState = { multilineString: null, arrayDepth: 0, inlineTableDepth: 0 };
  let table: string[] | null = [];
  let open: TomlStatement | null = null;
  let lineStart = 0;
  let line = 1;

  while (lineStart < content.length) {
    const newlineIdx = content.indexOf('\n', lineStart);
    const lineEnd = newlineIdx === -1 ? content.length : newlineIdx;
    const next = newlineIdx === -1 ? content.length : newlineIdx + 1;
    const text = content.slice(lineStart, lineEnd);
    const clean = state.multilineString === null && state.arrayDepth === 0 && state.inlineTableDepth === 0;

    if (!clean) {
      if (open) open.end = next;
    } else {
      open = null;
      if (isTomlTableHeader(text)) {
        const parsed = parseTableHeader(text);
        table = parsed.path;
        statements.push({ kind: parsed.array ? 'array-table' : 'table', path: parsed.path, table, start: lineStart, end: next, line });
      } else {
        const key = parseKeyValueStart(text);
        if (key) {
          open = {
            kind: 'key',
            path: key.path && table ? [...table, ...key.path] : null,
            table,
            start: lineStart,
            end: next,
            line,
            inlineTable: key.inlineTable,
          };
          statements.push(open);
        }
      }
    }

    scanTomlLine(text, state);
    lineStart = next;
    line++;
  }
  return statements;
}

/** `[a.b]` / `[[a.b]]` (already known to be a header line) → its decoded path. */
function parseTableHeader(text: string): { array: boolean; path: string[] | null } {
  let i = skipWs(text, 0) + 1;
  const array = text[i] === '[';
  if (array) i++;
  const key = parseDottedKey(text, skipWs(text, i));
  return { array, path: key ? key.path : null };
}

/** `key = …` at the start of a line → the key's decoded path. */
function parseKeyValueStart(text: string): { path: string[] | null; inlineTable: boolean } | null {
  const start = skipWs(text, 0);
  if (start >= text.length || text[start] === '#' || text[start] === '\r') return null;
  const key = parseDottedKey(text, start);
  if (!key) return null;
  const eq = skipWs(text, key.end);
  if (text[eq] !== '=') return null;
  return { path: key.path, inlineTable: text[skipWs(text, eq + 1)] === '{' };
}

function skipWs(text: string, i: number): number {
  while (i < text.length && (text[i] === ' ' || text[i] === '\t')) i++;
  return i;
}

/**
 * A dotted key at `i`: bare parts, `"basic"` parts (escapes decoded) and
 * `'literal'` parts, joined by dots with optional spaces around them.
 * Returns the decoded parts and the offset just past the key, or null.
 */
function parseDottedKey(text: string, i: number): { path: string[]; end: number } | null {
  const path: string[] = [];
  for (;;) {
    const part = parseKeyPart(text, i);
    if (!part) return null;
    path.push(part.value);
    const dot = skipWs(text, part.end);
    if (text[dot] !== '.') return { path, end: part.end };
    i = skipWs(text, dot + 1);
  }
}

function parseKeyPart(text: string, i: number): { value: string; end: number } | null {
  const ch = text[i];
  if (ch === '"') {
    let j = i + 1;
    while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
    if (j >= text.length) return null;
    const value = decodeBasicString(text.slice(i + 1, j));
    return value === null ? null : { value, end: j + 1 };
  }
  if (ch === "'") {
    const j = text.indexOf("'", i + 1);
    return j === -1 ? null : { value: text.slice(i + 1, j), end: j + 1 };
  }
  let j = i;
  while (j < text.length && /[A-Za-z0-9_-]/.test(text[j]!)) j++;
  return j === i ? null : { value: text.slice(i, j), end: j };
}

const SIMPLE_ESCAPES: Record<string, string> = {
  b: String.fromCharCode(8), t: String.fromCharCode(9), n: String.fromCharCode(10), f: String.fromCharCode(12),
  r: String.fromCharCode(13), e: String.fromCharCode(27), '"': '"', '\\': '\\',
};

/** The value of a TOML basic string's body, or null for an invalid escape. */
function decodeBasicString(raw: string): string | null {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '\\') {
      out += raw[i];
      continue;
    }
    const esc = raw[++i] ?? '';
    if (esc in SIMPLE_ESCAPES) {
      out += SIMPLE_ESCAPES[esc];
      continue;
    }
    const width = esc === 'x' ? 2 : esc === 'u' ? 4 : esc === 'U' ? 8 : 0;
    const hex = raw.slice(i + 1, i + 1 + width);
    if (width === 0 || hex.length !== width || !/^[0-9A-Fa-f]+$/.test(hex)) return null;
    const codePoint = parseInt(hex, 16);
    if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return null;
    out += String.fromCodePoint(codePoint);
    i += width;
  }
  return out;
}

type MultilineStringDelimiter = '"""' | "'''";

interface TomlLexState {
  multilineString: MultilineStringDelimiter | null;
  arrayDepth: number;
  inlineTableDepth: number;
}

const TOML_KEY_PART = String.raw`(?:[A-Za-z0-9_-]+|"(?:\\.|[^"\\])*"|'[^']*')`;
const TOML_DOTTED_KEY = String.raw`${TOML_KEY_PART}(?:[ \t]*\.[ \t]*${TOML_KEY_PART})*`;
const TOML_TABLE = String.raw`\[[ \t]*${TOML_DOTTED_KEY}[ \t]*\]`;
const TOML_ARRAY_TABLE = String.raw`\[\[[ \t]*${TOML_DOTTED_KEY}[ \t]*\]\]`;
const TOML_TABLE_HEADER = new RegExp(
  String.raw`^[ \t]*(?:${TOML_TABLE}|${TOML_ARRAY_TABLE})[ \t]*(?:#.*)?\r?$`
);

function isTomlTableHeader(line: string): boolean {
  return TOML_TABLE_HEADER.test(line);
}

/** Track value constructs that may legally span lines so bracket-shaped string
 * content and nested arrays cannot be mistaken for sibling table headers. */
function scanTomlLine(line: string, state: TomlLexState): void {
  for (let i = 0; i < line.length;) {
    if (state.multilineString !== null) {
      const end = findMultilineStringEnd(line, i, state.multilineString);
      if (end === -1) return;
      i = end + state.multilineString.length;
      state.multilineString = null;
      continue;
    }

    if (line[i] === '#') return;

    const multiline = line.startsWith('"""', i)
      ? '"""'
      : line.startsWith("'''", i)
        ? "'''"
        : null;
    if (multiline !== null) {
      state.multilineString = multiline;
      i += multiline.length;
      continue;
    }

    const ch = line[i]!;
    if (ch === '"' || ch === "'") {
      i = skipSingleLineString(line, i, ch);
      continue;
    }
    if (ch === '[') state.arrayDepth++;
    else if (ch === ']' && state.arrayDepth > 0) state.arrayDepth--;
    else if (ch === '{') state.inlineTableDepth++;
    else if (ch === '}' && state.inlineTableDepth > 0) state.inlineTableDepth--;
    i++;
  }
}

function findMultilineStringEnd(
  line: string,
  from: number,
  delimiter: MultilineStringDelimiter,
): number {
  let end = line.indexOf(delimiter, from);
  while (delimiter === '"""' && end !== -1 && isBackslashEscaped(line, end)) {
    end = line.indexOf(delimiter, end + 1);
  }
  return end;
}

function isBackslashEscaped(line: string, index: number): boolean {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && line[i] === '\\'; i--) backslashes++;
  return backslashes % 2 === 1;
}

function skipSingleLineString(line: string, start: number, quote: '"' | "'"): number {
  for (let i = start + 1; i < line.length; i++) {
    if (quote === '"' && line[i] === '\\') {
      i++;
      continue;
    }
    if (line[i] === quote) return i + 1;
  }
  return line.length;
}
