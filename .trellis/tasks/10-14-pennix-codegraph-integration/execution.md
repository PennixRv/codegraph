# 实施证据

- 依据用户对完整修订包的明确批准实施；固定基线为上游 `v1.6.2`，fork 为 `PennixRv/codegraph`，工作分支为 `codex/pennix-integration`。
- Codex/OpenCode 全局 install、refresh 和 uninstall 不再修改用户级 AGENTS；项目 writer 检验路径、符号链接和 marker，保留手工正文及 Trellis 块，共享 target 保留仍有消费者的块。
- 原生项目导航及 MCP 指令按实际接入、索引和协议条件收敛；CLI 保持 `codegraph`，发布仅支持 Linux x64，双包版本为 `1.6.2-pennix.1`。
- 本地完整测试：444 个文件通过、14 个跳过，5,749 项通过、236 项跳过。独立原生内核测试：17 个文件、214 项通过。
- 原生内核、Linux x64 bundle、双包 pack 均通过；临时安装两个 tarball 后，真实 shim 输出 `1.6.2-pennix.1`。构建包含 UI/WASM/内核检查。
- 发布工作流使用仓库 `NPM_TOKEN`，Release tag 显式指向实际构建提交；秘密由 stdin 设置，未输出值。远端 CI、Release、registry 与部署证据待实际结果续记，不能以本地通过冒充发布完成。
- 宿主实际工具描述的最终复核发现 `tools.ts` 仍有无条件优先调用的旧措辞；停止尚未发布的首轮 CI 后补齐该描述和两种 server instructions。最终重跑覆盖已构建内核：458 个文件、5,963 项通过、36 项跳过，完整 build 通过。
- 新 fork 的默认分支设为固定上游基线上的维护分支 `codex/pennix-integration`，GitHub 随后登记 Release 工作流；没有将上游 main 的其他功能混入首发。
