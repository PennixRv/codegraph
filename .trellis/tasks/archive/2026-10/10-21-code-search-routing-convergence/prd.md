# Code retrieval routing convergence

## 目标（Goal）

承接根协调任务 code-search-routing-convergence 已展示并获明确批准的四 owner 方案，仅修正本组件返回源码区段的完整性、复用与继续读取说明。

## 需求（Requirements）

- 在 main 维护 MCP 工具尾注，与 server-instructions.ts 的原生协议保持一致，不绑定 Pennix 工具名。
- 真实返回的源码区段可复用，未返回部分、强制全文、陈旧或受限图不能被声明为完整已读；充分结构证据不要求重复读取。
- 不修改评分／扩展算法、索引、MCP schema 或安装器。沿既有 CI 正式发布下一可用 Pennix 补丁；主包和 Linux x64 平台包同版。

## 验收标准（Acceptance Criteria）

- [ ] 既有完整性／MCP 领域回归和完整必需门禁通过。
- [ ] 真实正式制品、版本、来源、摘要和目标内容经根任务核验。
- [ ] 本仓库完成原生记录、归档／journal、推送与实时 origin/main 同步；根负责原生安装、驻留 MCP 与组合验收。

## 批准依据（Notes）

用户明确批准同一四 owner 完整方案：“同意封口并批准按以上方案推进，持续直到上述唯一停止点”。本任务只投影其中已经展示的 CodeGraph 范围，不引入新策略。
