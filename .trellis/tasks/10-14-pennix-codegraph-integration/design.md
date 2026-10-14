# 实施设计

复用原生 target/shared helper、TOML writer、upgrade 和 bundle/shim 打包器，保持 CLI 名称 `codegraph`。所有用户级说明文件保持不写入；Codex 项目短块由显式 local install 管理，其他宿主仅兼容，不扩大功能保障。

先检查所有 instructions writer/remover 和共享 AGENTS 消费者，在共同 helper 统一校验路径与 marker，避免仅修 Codex 一处。install 在改配置前验证目标说明文件；卸载保留有其他已配置 target 使用的项目块。短块不重复 MCP 手册，不据目录字面缺失断言无能力。

Linux x64 fork 发布沿现有 Release workflow：固定版本与锁文件、构建内核和 bundle、平台包先于 shim 发布、逐包 registry 幂等核验、GitHub Release 与 provenance。Secret 只由 CI 读取。安装和 AUR 迁移由 pennix-skills lifecycle 负责。
