# Pennix CodeGraph 受限 fork

交付根协调任务 `10-14-project-agents-governance-plan` revision 1 已批准的 CodeGraph 子范围。上游基线为 `v1.6.2`，维护仓库为 `PennixRv/codegraph`，工作分支为 `codex/pennix-integration`。

## 需求与验收

- 禁止 install/refresh/upgrade 向用户级 AGENTS 写入；明确接入的项目保留原生短块。MCP 配置仍由原生 installer 管理。
- 写入和移除拒绝缺失、重复、逆序 marker 与 symlink；保留块外正文。共享项目块仅在最后消费者卸载时移除。
- 原生 MCP instructions 是协议权威；项目块只保留条件、入口和受众必要导航。
- 包名为 `@pennixrv/codegraph`，平台包为 `@pennixrv/codegraph-linux-x64`，升级与发布指向 fork，仅交付 Linux x64。
- CI 使用 NPM_TOKEN Secret，凭据不进入源码、文档或日志；双包版本、精确依赖、Release、校验和及 provenance 一致。
- 通过原生 installer/upgrade fixture、完整测试、构建、内核和两包 smoke 后提交推送、发布；实际结果写入 execution.md。

不扩展平台、不自动同步上游、不做大型性能评测、不迁移其他真实项目。
