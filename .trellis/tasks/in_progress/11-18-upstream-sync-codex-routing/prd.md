# 同步冻结上游并实现 Codex 分层主动路由

## Goal

承接根任务 codegraph-context-mode-upstream-sync 已接受且获准的第2版合同，完成 CodeGraph 上游合并、Codex 路由、回归和正式双包发行。

## Requirements

- 在既有 main 合并冻结上游 ac6149c5536804af3181997e0a6ef601ce883fb0，本地基线为 5291a22e0da6b359c650ad5806430617cdbbed73，不追逐新提交。
- 按根任务 conflict-analysis.md 的 CG01—CG10 核对双方意图、调用者和最终方案；保留工作树绑定、来源、宿主配置及 Pennix 双包合同，整合上游修复。
- 实现根任务第 2 版 design.md 的 Codex 分层主动行为和原生 installer 定义：高相关紧凑前置、不确定提醒、无关无动作；受信本树可用索引、输入／输出及实际超时边界，不自动 index／sync，不写宿主信任。
- Lifecycle 管理生产接入及精确信任，源码归本仓；正式发行 @pennixrv/codegraph 与 Linux x64 平台包同版，拟 1.6.3-pennix.1，公开资产不可变。
- 原生定向和完整测试、类型、构建及发行门禁；根任务负责两机安装和一轮真实模型验收，不在组件重复消费预算。

## Acceptance Criteria

- [ ] 冻结上游为合并祖先，CG01—CG10 处置有理由、来源与回归。
- [ ] 工作树／配置／来源／关闭行为不倒退，分层主动与拒绝反例通过。
- [ ] 类型、构建、完整测试及真实双包载荷验证通过，受限项明确。
- [ ] 维护线、tag、CI、公开双包身份一致，根侧集成接受本组件。

## Notes

具体方案由根任务持有，绝对引用为 /home/penn/devel/codex-workflow-optimization/.trellis/tasks/in_progress/11-18-codegraph-context-mode-upstream-sync/design.md；执行顺序见同目录 implement.md。根 Task CLI 已接受该合同，并记录实施授权，revision=a34b47fa44dff204f9e35cd2dfde9c58d0f8f61d2268ea204f7b427febf72bdc。组件不重开已定需求／选择，也不新增第二总体路线。

## 验收覆盖

| 接受条件 | 工作包 | Owner | 验证入口 | 交付证据 | 停止条件 |
| --- | --- | --- | --- | --- | --- |
| 完整冻结上游及冲突处置 | 根 W01 | CodeGraph | Git ancestry、CG01—CG10、定向回归 | execution.md | 关键冲突未核验不发布 |
| 分层路由与边界 | 根 W03 | CodeGraph／Lifecycle | 原生 Hook、真实图、信任／跨树／超时 | execution.md、根 validation.md | 权限／来源倒退停止 |
| 原生质量与双包发行 | 根 W01／W04 | CodeGraph | 测试、类型、构建、release workflow | execution.md、根 releases.md | 失败／未知资产不算完成 |
| 根组合接受 | 根 W05／W06 | 根协调 owner | 双机 MCP／Hook 与集成门禁 | 根 device-acceptance.md | 未被根接受不收尾 |
