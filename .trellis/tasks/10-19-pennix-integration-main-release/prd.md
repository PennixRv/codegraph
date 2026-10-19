# Pennix integration to main and release

## 目标（Goal）

将 CodeGraph 的 Pennix 集成内容和现行 `main` 合并到同一维护分支，保留两侧历史及 Pennix 专属安装/发行合同，并通过现有 Linux x64 发布流水线发布新版本。根任务已批准本子方案；本任务负责 CodeGraph 源码合并、构建测试、正式发行与组件任务收尾，不负责 lifecycle 版本适配或本机安装升级。

## 需求（Requirements）

- 维护目标为 `origin/main`；将 `codex/pennix-integration` 普通合并到 `main`，保留两侧提交，不重置、改写或删除原分支。
- 保留 main 上游新增的解析、提取、DB/daemon 与 UI 行为，以及 Pennix Linux x64 包名、安装器、MCP/宿主指引、测试和现行发布工作流。
- 使用兼容 Node 24 和本机 host Rust 工具链完成源码构建、全量测试与 native kernel parity；不得复用旧源码 kernel 二进制作为新源码验证。
- 采用候选版本 `1.6.2-pennix.2`，实施时先核对 tag、GitHub Release、npm 两个包版本均未占用；版本按现有发布机制制作。
- 普通推送 main 后显式派发 `release.yml` 的 `workflow_dispatch`，核验正式 GitHub/npm 产物及来源；将 Actions 自动推进的 changelog 提交并入最终 main。
- 不开展 lifecycle catalog/VERSION 适配、工具安装或本机 CodeGraph repair；这些由批准的根任务后续阶段负责。

## 验收标准（Acceptance Criteria）

- [x] 合并前的 main 与集成分支 tip 均可从最终 main 到达；两侧既有独特功能和测试保留，普通提交历史完整。
- [x] Node 24 下构建、完整 `npm test`、新建 Linux kernel 与 `CODEGRAPH_KERNEL_EXPECT=1` parity 通过，发布打包检查通过。
- [x] `v1.6.2-pennix.2` GitHub Release、Linux x64 资产摘要/provenance、`@pennixrv/codegraph` shim 和 `@pennixrv/codegraph-linux-x64` 平台包均可回读并对应到经验证源码。
- [x] Actions 产生的 main 提交、CodeGraph 任务收尾提交均已保留并推送；任务归档与日志提交完成后，最终本地 main 与实时 `origin/main` 一致且工作树干净。
- [x] 本任务记录发布源码提交、tag、workflow run、资产校验和限制；完成 CodeGraph 原生 task 归档。

## 备注（Notes）

- 根批准依据：用户明确批准 `.trellis/tasks/10-19-managed-component-source-relocation/` 中完整方案，包含 CodeGraph `main` 合并、正式发行以及 lifecycle 后续适配和本机升级。
- 当前已核实基线：main `242862182bf4460a1551118d86fe5f47581ad5a4`，集成分支 `e34171f236dc3ad31c1a54ac51f1720372d82ec1`，共同祖先 `6560052a6f856855d3f71eee838fd66ccfa4285d`；候选版本当前 GitHub Release 未发现。执行时必须重新核实远端和注册表。
- CodeGraph `release.yml` 只有 `workflow_dispatch`，推送 main 不会自动发布；派发命令为 `gh workflow run release.yml --repo PennixRv/CodeGraph --ref main`。
- 复杂任务的设计、实施步骤及停止/回退点见同目录 `design.md` 与 `implement.md`。
