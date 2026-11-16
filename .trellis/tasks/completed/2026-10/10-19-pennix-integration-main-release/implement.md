# 实施与验收步骤

以下步骤按序执行，前项未通过不得进入后续依赖阶段。

1. **配置上下文与基线**：按 CodeGraph `trellis-before-dev` 加载实际适用 spec；将本任务绑定当前会话。确认本地/远端 main 和 `codex/pennix-integration` 仍为 PRD 基线，工作树干净，tag 与 npm 候选版本未占用。保存两侧 tip、merge-base、任务开始状态及远端回读。
2. **切换 main 并封存任务**：保留现有集成分支及其远端引用，切换到当前 `main`，确认对应 `origin/main`。使用本任务的 Planning Seal 与根任务已经给出的真实批准依据完成原生批准，再执行 `python3 ./.trellis/scripts/task.py start .trellis/tasks/10-19-pennix-integration-main-release`。
3. **普通合并**：在 main 上普通合并集成分支，不 cherry-pick/rebase/reset，不删除原分支。逐个审查冲突和共同修改文件，确保 main 新功能、Pennix 包/安装/指引/发布、双方测试及生成所有权均保留；两侧原始 tip 都必须成为合并结果祖先。
4. **本机质量门禁**：用 `PATH=/home/penn/.local/lib/node_modules/@pennixrv/codegraph/node_modules/@pennixrv/codegraph-linux-x64:$PATH` 下的 Node 24 执行 lockfile 对应依赖安装、TS/UI 构建、完整 `npm test` 和现有打包检查。用 `bash scripts/build-kernel.sh` 从当前源码构建 host kernel，并运行 `CODEGRAPH_KERNEL_EXPECT=1` 下对应完整 parity suites。读取失败和完整错误；只有在批准范围内修复根因并重新通过所有必需门禁才继续。
5. **版本与准备推送**：核对 `1.6.2-pennix.2` 的 GitHub tag、Release、两个 npm 包版本未被占用；按仓库现有机制同步 package/lock/UI/changelog 版本与发布内容。审阅最终 diff、fork 身份、包名、平台限制、生成块和 staged 内容，然后普通推送 main。远端变化或权限拒绝即停止，不强推。
6. **正式发行**：普通推送不会触发 release。执行 `gh workflow run release.yml --repo PennixRv/CodeGraph --ref main`，保存 workflow run URL/ID 并观察完成。核验完整 CI 测试、Linux kernel、bundle、SHA256SUMS、provenance、GitHub tag/release/资产、npm shim 和 Linux x64 包/dist-tag；逐项回读 tag 实际源码提交及资产摘要。任一必需发行失败或内容不一致则停在发行停止点，不删除或覆盖已发布内容。
7. **收尾**：fetch 并保留 Actions 推回 main 的 changelog 提交；按 CodeGraph 原生 finish/check 约定复核，记录两个原始 tip、merge commit、tag commit、workflow、发布资产与校验信息。提交并普通推送 task 归档/记录，验证 `HEAD == origin/main`、工作树干净、原 integration refs 仍在，随后原生归档本任务。

根任务的 lifecycle 版本适配、本机 bootstrap 安装、`pennix repair codegraph-cli`、MCP 新进程验收及根索引建立均在本子任务停止后执行，不得在此任务越界实施。
