/**
 * The marker-fenced agent-instructions block the installer writes into each
 * agent's instructions file (CLAUDE.md / AGENTS.md / GEMINI.md).
 *
 * History: pre-#529 the installer wrote a full usage playbook here, which
 * duplicated the MCP `initialize` instructions for the main agent — so it
 * was removed and `mcp/server-instructions.ts` became the single source of
 * truth. A much smaller block returned for #704, because the MCP
 * instructions cannot reach two audiences that the instructions FILE does
 * reach:
 *
 *  - **Task-tool subagents** — they receive the project instructions file
 *    in their context but NOT the MCP initialize instructions. They hold
 *    the codegraph MCP tools only as deferred names and rarely think to
 *    load them: measured on a forced-delegation flow question (excalidraw,
 *    sonnet, high effort), subagents loaded + used codegraph in ~1 of 9
 *    runs without this block, and consistently with it — including runs
 *    with zero Read/grep fallback.
 *  - **Non-MCP harnesses** — agents with no MCP client at all can still
 *    run the `codegraph explore` CLI, which prints the same output as the
 *    MCP tool.
 *
 * Keep this block SHORT. The main agent reads it every turn on top of the
 * server instructions — the #529 duplication-cost argument still bounds
 * its size. Command names and the two surfaces, nothing more.
 */

/** Markers used by the marker-based section write/removal. */
export const CODEGRAPH_SECTION_START = '<!-- CODEGRAPH_START -->';
export const CODEGRAPH_SECTION_END = '<!-- CODEGRAPH_END -->';

/**
 * The full block, markers included, exactly as written to disk.
 *
 * The wording is deliberately CONDITIONAL ("in repositories indexed by…"):
 * a global install writes this into a user-scope file (~/.claude/CLAUDE.md,
 * ~/.codex/AGENTS.md) that applies to every project the user opens —
 * including unindexed ones, where an unconditional "this repository is
 * indexed" claim would send subagents into failing codegraph calls (the
 * noise the unindexed-session policy exists to prevent).
 */
export const CODEGRAPH_INSTRUCTIONS_BLOCK = `${CODEGRAPH_SECTION_START}
## CodeGraph

When this project has an approved, usable CodeGraph index, use CodeGraph for structural code questions and follow the native MCP instructions or CLI help:

- **MCP** (when exposed by the host): \`codegraph_explore\` returns source and call paths; load deferred tools through the host's native discovery.
- **CLI** (when installed): \`codegraph explore "<symbol names or question>"\` provides the same query surface.

Check native index status and project/worktree support before use. Missing capability, an absent or stale index, or a different working directory does not authorize installation, initialization or reindexing; report the limit and use bounded source evidence.
${CODEGRAPH_SECTION_END}`;
