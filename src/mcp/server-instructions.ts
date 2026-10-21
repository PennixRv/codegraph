/**
 * Server-level instructions emitted in the MCP `initialize` response.
 *
 * MCP clients (Claude Code, Cursor, opencode, LangChain, OpenAI Agent
 * SDK, …) surface this text in the agent's system prompt automatically,
 * giving the agent a high-level playbook for the codegraph toolset
 * before it sees individual tool descriptions.
 *
 * Goals when editing this:
 *   - Explain structural queries, native capabilities and index limitations
 *   - Respect host routing, project authorization and correctness verification
 *
 * Keep it tight. The agent reads this every session — long instructions
 * burn tokens. The DEFAULT MCP surface is `codegraph_explore` ALONE (see
 * DEFAULT_MCP_TOOLS in tools.ts) — reference only that tool here. The other
 * tools (node/search/callers/…) stay defined and are re-enablable via
 * CODEGRAPH_MCP_TOOLS, but they are NOT listed to agents, so don't name them.
 */
export const SERVER_INSTRUCTIONS = `# Codegraph — code intelligence over an indexed knowledge graph

Codegraph is a SQLite knowledge graph of every symbol, edge, and file in
the workspace — pre-computed structure you would otherwise re-derive by
reading files (cached intelligence: thousands of parse/trace decisions you
don't pay to re-reason each run). It indexes 30+ languages
(TypeScript/JavaScript, Python, Go, Rust, Java, C#, C/C++, PHP, Ruby, Swift,
Kotlin, and more). Use it for structural code questions in explicitly approved
projects with a usable index. Follow the host's tool routing and project rules;
installation, initialization and reindexing require their own authorization.
The index may lag writes; verify freshness when correctness depends on current
source. Missing tools or an unusable index permit bounded local source evidence.

## One tool: codegraph_explore — structural context and source

There is a single tool, \`codegraph_explore\`, and it is Read-equivalent. It
takes either a natural-language question or a bag of symbol/file names and
returns the **verbatim, line-numbered source** of the relevant symbols
grouped by file — the same \`<n>\\t<line>\` shape \`Read\` gives you, safe to
\`Edit\` from — PLUS the call path among them (including dynamic-dispatch hops
like callbacks, React re-render, and JSX children that grep can't follow) and
a blast-radius summary of what depends on them.

For architecture, callers, impact or a flow, \`codegraph_explore\` can return
relevant source and relationships together. Exact text, configuration, ordinary
file operations and verification follow the host's chosen local execution tools;
native MCP calls keep their host interface rather than being forwarded by an executor.
Reuse delivered current-source spans. File names, gap markers and signatures do
not prove whole-file reading; required full-file reads must obtain all text.

## How to query

- **Architecture, callers, impact or a flow** → \`codegraph_explore\` with the relevant names or short code terms. A capped call returns source grouped by file and the relationships among matches.
- **"How does X reach/become Y? / the flow / the path from X to Y"** → \`codegraph_explore\`, naming the symbols that span the flow (e.g. \`mutateElement renderScene\`) — it surfaces the call path among them, riding dynamic-dispatch hops, and returns their source.
- **Structural context for a known file or symbol** → use its name or file path to obtain source, call paths and dependents. Overloaded names may return several definitions; resolve ambiguity before editing.
- **Need more?** Query missing symbols by name, or use the host's local tools for missing detail, mandatory full-file reading or verification. Reuse unchanged source already available in the current context; correctness checks remain necessary.
- Qualified symbol names accept dots, \`::\`, or slashes, including containers whose names contain dots (for example, \`AppWeb.Format.group\`).
- Named-symbol call paths require exact matches; partial or mistyped names are never silently substituted as flow endpoints. If a graph query reports a missing symbol with did-you-mean suggestions, query the suggested name explicitly.
- Explore matches names and indexed code words lexically, not by meaning; an empty result reports word matches and may suggest indexed candidate names to retry with \`codegraph_explore\`.

## Anti-patterns

- **Treat graph relationships as evidence with stated limits.** Resolution can be heuristic or ambiguous; verify material conclusions against current source and tests where needed.
- **Use structural queries for structural questions.** Use the host's local file tools for exact text, configs, docs, unsupported or stale source, and required verification.
- **Don't reconstruct a flow by hand** — name the endpoints in one \`codegraph_explore\` and it surfaces the path between them, dynamic-dispatch hops included.
- **After editing, check the staleness banner.** When a tool response starts with "⚠️ Some files referenced below were edited since the last index sync…", the listed files are pending re-index — Read those specific files for accurate content. Every file NOT in that banner is fresh, so still trust codegraph. A different, rarer banner — "⚠️ CodeGraph auto-sync is DISABLED…" or "⚠️ CodeGraph auto-sync is RECOVERING…" — means the whole index may be stale; until the full catch-up completes, Read files directly to confirm anything that may have changed. If a response refuses to answer from changed files or says freshness could not be verified within its budget, retry after sync or narrow the query; that refusal is not an error in the tool.
- **A file flagged "⚠ changed on disk after the last index sync" drifted from its index** (most common on projects queried via \`projectPath\`, which have no live watcher). Codegraph never serves a possibly-mis-sliced body from such a file — it either shows the file's full CURRENT source (trust it as a Read) or omits the source with this flag. When the source was omitted, Read that specific file; line numbers referencing it elsewhere in the response may be shifted until that project's next sync. All unflagged files remain trustworthy.

- **Source is re-served on every call by default**, including for fresh subagents and after context compaction. Cross-call dedup requires \`CODEGRAPH_EXPLORE_DEDUP=1\` and is only suitable for hosts that guarantee one durable context per connection. With that opt-in, **"Already sent earlier in this conversation"** points to exact, unchanged source returned by an earlier \`codegraph_explore\` in that context. Use that copy; don't re-fetch it and don't Read the file. The bytes it freed went into source you have not seen yet, elsewhere in the same response.

## Limitations

- If a project has no usable \`.codegraph/\` index, use local source tools. Project initialization or reindexing requires explicit authorization and an exact project path.
- Index lags file writes by ~1 second.
- Cross-file resolution is best-effort name matching; ambiguous calls may return multiple candidates.
- No live correctness validation — that's still the TypeScript compiler / test suite / linter's job. Codegraph supplements those with structural context they don't have.
`;

/**
 * Instructions variant sent when the server's own root has NO codegraph index.
 *
 * The tools are still exposed (gating tool availability on whether `./` has an
 * index is the bug behind #964: it breaks monorepos where only sub-projects are
 * indexed, and a server that started before `codegraph init` never surfaces the
 * tools afterward). Instead of an "inactive" note, this variant tells the agent
 * codegraph works **per project**: there's no default project to query, so pass
 * a `projectPath` to any project that HAS a `.codegraph/`. The full single-
 * project playbook ({@link SERVER_INSTRUCTIONS}) is sent instead when the root
 * IS indexed, so the common case stays tight.
 */
export const SERVER_INSTRUCTIONS_NO_ROOT_INDEX = `# Codegraph — available (per-project; pass projectPath)

Codegraph is a SQLite knowledge graph of a codebase's symbols, edges, and
files (30+ languages): one \`codegraph_explore\` call returns the verbatim, line-numbered source
of the relevant symbols PLUS the call paths between them and a blast-radius
summary. Follow the host's tool routing and verify material conclusions where needed.

This server started somewhere with no \`.codegraph/\` of its own, so there is no
default project — but the tools are available and work **per project**:

- To query an explicitly approved project that HAS a usable \`.codegraph/\` index (e.g. a service inside a
  monorepo, or a second repo), pass its path as \`projectPath\` to
  \`codegraph_explore\` (and any other codegraph tool). Codegraph resolves the
  nearest \`.codegraph/\` at or above that path and answers from it — for as many
  projects as you like in one session.
- For a project with no usable \`.codegraph/\`, use local source tools.
  Initialization or reindexing requires explicit authorization and an exact
  project path; when approved, run \`codegraph init\` in that project. A newly
  created index is picked up live without a server restart.
`;
