# 实施进度

## 已完成

- CodeGraph 原生任务 `10-19-pennix-integration-main-release` 的 Planning Seal revision 1 已批准并启动，状态为 `in_progress`。用户批准依据来自根任务完整方案。普通合并后已通过原生 `task.py set-branch` 将当前任务分支绑定到 `main`。
- 在 `main` 上完成普通合并，提交为 `611b504310e490b1ea43c8ede8fe7544af3ea424`，双亲分别为原 main tip `242862182bf4460a1551118d86fe5f47581ad5a4` 与集成分支 tip `e59b421576ff8a8bd25da70d4823374eaec44f99`。两侧历史均完整保留，原集成分支及远端分支未改写或删除。
- 合并共纳入 177 个路径，Git 无冲突；共同修改的 `AGENTS.md`、`CHANGELOG.md`、`src/bin/codegraph.ts` 和 `src/mcp/tools.ts` 已审阅合并差异。`git diff --check` 报告两处新加入 Trellis 文档的行尾空格及一处 workspace journal 文件末尾空行，均为文档排版，不涉及产品源码。
- 本地 `main` 当前为 `611b504310e490b1ea43c8ede8fe7544af3ea424`，比 `origin/main` 超前 7 个提交；`origin/codex/pennix-integration` 仍为 `e59b421576ff8a8bd25da70d4823374eaec44f99`。合并完成时工作树干净；任务记录更新后需再次提交。
- 发布候选 `1.6.2-pennix.2` 尚未占用：Git tag 查询无结果，GitHub Release 返回 not found；两个 npm 包查询候选版本均为 404，而现有 `1.6.2-pennix.1` 与 dist-tag 可正常读取，已确认 npm registry 查询有效。
- 构建机可用 Node `v24.16.0`，`cargo` 与 `rustc` 均为 `1.99.0`；仓库已有 `node_modules` 和 Linux x64 kernel 预构建文件。后者不是本次源码验证证据，必须先从当前 Rust 源码重新构建，再运行要求的 parity tests。
- 首轮完整测试暴露真实集成缺陷：当前包版本为 `1.6.2-pennix.1`，而 `src/mcp/version.ts` 只把纯 `MAJOR.MINOR.PATCH` 当作可比较版本，导致 launcher 不会替换旧 daemon。已将版本解析收敛为仅额外接受本 fork 的 `-pennix.N` 后缀，保留其他 prerelease/build/unknown 不可比较的安全边界，并补充版本行为测试。原因是版本格式与 daemon 替换合同之间的集成缺口，不是测试环境负载问题。
- 修复后的构建通过；定向 `daemon-older-version.test.ts` 通过 8 项（21 项按筛选跳过），包括旧 daemon 停止、不可探测旧 daemon 停止、更新会话只读接管和新版 daemon 不被停止的场景。
- 发布候选已提升为 `1.6.2-pennix.2`，`package.json`、`ui/package.json` 与 lockfile 版本一致；CHANGELOG 已加入 daemon 升级修复说明。npm registry 当前仍返回两个候选包均未发布（404）。
- 对候选版本重新执行 `npm ci` 成功（183 packages）；npm 报告 13 项依赖审计告警（5 moderate、6 high、2 critical），本任务未批准依赖升级且不以其为本次发布门槛。Node 24 下 `npm run build` 与 UI/wasm 资源完整性检查通过。
- 候选版本全量 `CODEGRAPH_KERNEL_EXPECT=1 npm test` 通过：570 个测试文件通过，7,112 项通过、34 项跳过（总计 7,146）。
- Linux x64 Rust kernel 已从当前源码重建；强制 parity 套件 17 个文件、296 项测试全部通过。`npm pack --dry-run --json` 确认 shim 包版本 `1.6.2-pennix.2`、1,263 个文件且包含修复后的 `dist/mcp/version.js`，不包含测试文件。

## 变更边界

- 本子任务的目标是把已批准的 Pennix 集成和 main 上的上游演进保留在受维护的 `main`，通过本机与 CI 质量门禁后发布 Linux x64 版本。版本更新范围按当前发布机制核对 `package.json`、lockfile、UI 包版本和 `CHANGELOG.md`；若测试揭示集成缺陷，只修复阻断该任务验收的根因并补齐相应回归验证。
- 不在本子任务新增 CodeGraph 功能或扩大平台支持；不处理 lifecycle catalog / VERSION 适配、本机安装、`pennix repair codegraph-cli`、MCP 新进程验收或根仓库索引，这些属于根任务后续阶段。

## 当前状态与下一步

- 当前 checkout 为 `main`；本地 main 尚未推送。原 `codex/pennix-integration` 本地和远端引用均保留。
- 先用 Node 24 重新执行完整 `npm test`，并复核源码 kernel 产物未被测试过程误用旧文件；全量门禁通过后再同步发布版本与变更说明、普通推送 main 并执行已批准的 `workflow_dispatch`。
- 发行成功后回读 tag、GitHub Release、npm 包和 Actions 自动推回 main 的 changelog 提交，提交并推送任务归档记录；最终核对 `HEAD == origin/main`、工作树干净、原集成分支引用保留，再用 CodeGraph 原生 CLI 归档本任务。
