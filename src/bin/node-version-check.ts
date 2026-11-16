/**
 * Node.js version compatibility check.
 *
 * The floor follows node:sqlite availability. WASM compiler safety is
 * handled by wasm-runtime-flags rather than a future-major ban.
 */

/**
 * Lowest supported Node.js major version. Matches the `engines` floor in
 * package.json. Below this, CodeGraph relies on language features / native APIs
 * that aren't present, and the combination is untested. `engines` alone only
 * *warns* on install (unless the user set `engine-strict`), so the CLI bootstrap
 * also hard-blocks here to actually enforce the floor.
 */
export const MIN_NODE_MAJOR = 22;
export const MIN_NODE_MINOR = 5;

export function isSupportedNodeVersion(version: string): boolean {
  const [major = NaN, minor = NaN] = version.split('.').map(Number);
  return Number.isInteger(major) && Number.isInteger(minor) &&
    (major > MIN_NODE_MAJOR || (major === MIN_NODE_MAJOR && minor >= MIN_NODE_MINOR));
}

/**
 * Build the bordered banner shown when CodeGraph detects a Node.js major below
 * {@link MIN_NODE_MAJOR}. Pinned via unit test so the recovery commands and the
 * override env var can't be silently stripped by future edits.
 *
 * Uses ASCII glyphs to stay readable on Windows OEM-codepage consoles
 * (see ../ui/glyphs.ts for the rationale).
 */
export function buildNodeTooOldBanner(nodeVersion: string): string {
  const sep = '-'.repeat(72);
  return [
    sep,
    `[CodeGraph] Unsupported Node.js version: ${nodeVersion}`,
    sep,
    `CodeGraph requires Node.js ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR} or newer for node:sqlite.`,
    '',
    'Fix: install Node.js 22 LTS:',
    '  nvm install 22 && nvm use 22                          # nvm',
    '  brew install node@22 && brew link --overwrite --force node@22  # Homebrew',
    '',
    'To override (NOT recommended - unsupported):',
    '  CODEGRAPH_ALLOW_UNSAFE_NODE=1 codegraph ...',
    sep,
  ].join('\n');
}
