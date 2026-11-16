# Pennix 集成合入 main 并发布

## 目标和边界

在 `main` 上普通合并 `codex/pennix-integration`，通过 Pennix 现行 Linux x64 发布链路发行新版本。只修改本仓库源码、测试、发布所需版本/变更说明和本任务记录。lifecycle catalog、lifecycle `VERSION`、已安装文件及用户级配置由根任务后续阶段处理。

## 已核实的合并依据

- 当前 main `242862182bf4460a1551118d86fe5f47581ad5a4`，集成 tip `e34171f236dc3ad31c1a54ac51f1720372d82ec1`，共同祖先 `6560052a6f856855d3f71eee838fd66ccfa4285d`；合并前需再次核对本地与实时远端 tip。
- main 与集成分支分别有 125 和 5 个独有提交。main 的改动主要覆盖提取/解析、同步、DB/daemon 健康检查和测试；集成侧主要覆盖 Pennix 包/平台身份、安装器、Linux 发行、MCP/宿主指引及相关测试。
- 四个两侧共同修改文件的外部 `git merge-file --diff3` 检查未产生文本冲突。该结果仅是规划依据；执行时需要真实普通 merge、逐项查看冲突和差异并验证调用行为。
- 必须保留 Pennix fork 约束与生成块、npm 包名、Linux x64 发布脚本、MCP/安装文档和集成测试；也必须保留 main 新增的行为。不能让上游 main 的包名、发布或身份默认值覆盖 Pennix 合同。

## 构建与发布合同

源码声明支持 Node `>=20 <25`，当前 shell Node 26 不符合范围。使用已安装 CodeGraph Linux x64 bundle 中 Node 24.16.0，其路径为 `/home/penn/.local/lib/node_modules/@pennixrv/codegraph/node_modules/@pennixrv/codegraph-linux-x64/node`；只通过将其目录置于 `PATH` 前端隔离运行，不修改全局 Node。

在本机用新 Rust 源码和现有 host `cargo`/`rustc` 生成 kernel，再以 `CODEGRAPH_KERNEL_EXPECT=1` 运行相应 parity 测试；禁止用迁移前的 prebuild 证明新源码正确。完整 `npm test`、TS/UI 构建、安装器、MCP/宿主指引、npm shim/SDK、升级和打包已有测试均纳入门禁。发布 CI 还需成功构建 Linux x64 kernel、bundle、校验清单、provenance 和发布资产。

候选发布版本为 `1.6.2-pennix.2`。发布前对 Git tag、GitHub Release 和 npm shim/平台包分别查询可用性，任一已占用就停止并重新规划，不覆盖或重发已有版本。推送 main 后使用现有 `workflow_dispatch` 手动触发 `release.yml`；流水线会提升 changelog 并将其提交推回 main，因此需回读并保留 CI 产生的提交。最终 main 的维护远端必须包含合并提交、自动变更说明提交及任务收尾提交。

## 正常停止点

以下全部达成后，记录证据、提交并推送本任务收尾提交，原生归档本任务：两侧基线 tip 都是最终 main 祖先；必需本机构建/测试/parity 与正式发布 workflow 均成功；GitHub Release、资产、摘要、provenance、两个 npm 包和对应提交均可回读；本地 `main` 与 `origin/main` 同 SHA 且工作树干净。

## 提前停止与回退

若合并前远端推进、出现未预期提交/改动、关键语义冲突、完整测试或 kernel parity 失败、候选版本被占用、CI 或 npm 部分发行失败、正式产物与 tag 源码不一致，则停止依赖动作并记录现场。未推送合并可用原生 `git merge --abort` 回到合并前基线；已推送 main 使用普通反向提交恢复，不强推或改写历史。已发行 tag/npm 版本不可通过删除或覆盖视作撤销；保留部分发行事实和资产，待根任务决定后续恢复路径。不得清除原始分支。
