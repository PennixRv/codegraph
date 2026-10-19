# 实施证据

- 依据用户对完整修订包的明确批准实施；固定基线为上游 `v1.6.2`，fork 为 `PennixRv/codegraph`，工作分支为 `codex/pennix-integration`。
- Codex/OpenCode 全局 install、refresh 和 uninstall 不再修改用户级 AGENTS；项目 writer 检验路径、符号链接和 marker，保留手工正文及 Trellis 块，共享 target 保留仍有消费者的块。
- 原生项目导航及 MCP 指令按实际接入、索引和协议条件收敛；CLI 保持 `codegraph`，发布仅支持 Linux x64，双包版本为 `1.6.2-pennix.1`。
- 本地完整测试：444 个文件通过、14 个跳过，5,749 项通过、236 项跳过。独立原生内核测试：17 个文件、214 项通过。
- 原生内核、Linux x64 bundle、双包 pack 均通过；临时安装两个 tarball 后，真实 shim 输出 `1.6.2-pennix.1`。构建包含 UI/WASM/内核检查。
- 发布工作流使用仓库 `NPM_TOKEN`，Release tag 显式指向实际构建提交；秘密由 stdin 设置，未输出值。远端 CI、Release、registry 与部署证据待实际结果续记，不能以本地通过冒充发布完成。
- 宿主实际工具描述的最终复核发现 `tools.ts` 仍有无条件优先调用的旧措辞；停止尚未发布的首轮 CI 后补齐该描述和两种 server instructions。最终重跑覆盖已构建内核：458 个文件、5,963 项通过、36 项跳过，完整 build 通过。
- 新 fork 的默认分支设为固定上游基线上的维护分支 `codex/pennix-integration`，GitHub 随后登记 Release 工作流；没有将上游 main 的其他功能混入首发。

## 最终发布、安装与场景验收

- 最终源 HEAD 为 `87d24b1ffb038a6c6f81d71cdd434f66b9bccb4e`。GitHub Actions run `38535137183` 的 kernel 与 release job 均成功，Release `v1.6.2-pennix.1` 已发布。Linux x64 tarball 与 SHA256SUMS 已生成；npm registry 已确认 `@pennixrv/codegraph@1.6.2-pennix.1` 和 `@pennixrv/codegraph-linux-x64@1.6.2-pennix.1` 可见。
- 首轮 CI 暴露的 `mcp-unindexed` 旧断言已按实际授权边界修正并重新提交；最终全量本地检查为 458 个文件、5,963 项通过、36 项跳过，build、kernel 测试、bundle/双包 pack 和相关 6 文件 360 项测试均通过。首轮发布 CI 的 registry propagation 失败按原生 GitHub failed-job rerun 完成，最终 run 成功。
- 通过 `pennix-component-lifecycle` 完成 AUR `codegraph-bin 1.6.2-1` 到 npm fork 双包的精确迁移；当前 CLI 为 `1.6.2-pennix.1`，命令解析到 npm shim，`codegraph upgrade --check` 报告已是最新，旧包不再由 pacman 提供。用户级 AGENTS 与 Codex 配置未因迁移被改写。
- 独立临时项目验证了既有手工正文与 CodeGraph 项目块共存、索引状态 `complete`、CLI query/explore 和原生 MCP `codegraph_explore` 的结果一致性。新进程 MCP smoke 还确认服务端指令及工具描述已移除无条件优先调用语义，保留项目授权、索引状态和宿主路由边界。
- 本任务不负责 GitNexus 项目特定块迁移、大型仓库性能基线或其他宿主的完整生效证明；本轮仅证明 Linux x64、Codex 项目场景和实际 MCP/CLI 入口。
