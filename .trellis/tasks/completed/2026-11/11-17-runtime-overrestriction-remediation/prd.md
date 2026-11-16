# Node runtime capability admission

## Goal

Implement approved parent W04: remove unsupported future-major ban with real isolated Node and grammar evidence, preserve actual runtime requirements, publish Linux x64 bundle.

## Requirements

承接根任务 `workflow-overrestriction-remediation` 已批准 W04，合同摘要 `5970565880f9176ffebc77cd8d04628aedb951cc299c44e4b93422b9cff7e956`，批准来源为根任务 `implementation-approval.md`。沿 main，不新建分支、工作树，不委派写入，不变更系统 Node。

以真实隔离 Node/V8 和 grammar 验证替代未来主版本全局禁用，移除 Node >=25 拒绝和 engines 上限；保留 SQLite 等实际能力下限、Liftoff 规避及原生崩溃错误。同步启动路径、文档、测试与正式 Linux x64 bundle。

## Acceptance Criteria

- [ ] 官方摘要核验的 Node 25／26 能运行真实 grammar；CLI help/version 不因 WASM 历史问题被拒绝。
- [ ] 实际必要运行时下限与错误仍可说明，未来版本不被历史白名单拒绝。
- [ ] 完整必要门禁和原生发布、公开载荷核验通过，由根任务完成双端部署。

## Notes

- 生产 Paseo、系统包、NAS、用户索引和凭据保持原生 owner 管理，不发模型请求。
