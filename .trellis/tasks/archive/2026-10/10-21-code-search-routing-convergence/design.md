# 技术设计

本仓库是 CodeGraph 源码 owner，维护分支 main。完整跨组件设计位于父检出的根协调任务 `.trellis/tasks/10-21-code-search-routing-convergence/design.md`；本地任务实现其中同一已展示、已批准范围。

仅校准 src/mcp/tools.ts 的源码完整性／预算尾注和 src/mcp/server-instructions.ts 的必要一致性措辞，复用既有完整性测试。返回的行号区段可作为当前源码证据；未返回区段不算已读，具名结构问题继续 explore，强制全文或图不能提供所需证据时允许本地源码核验。充分证据不触发机械重复读取。该例外服从用户明确要求及宿主权限，不绑定具体执行载体。

不改输出选取、评分、扩展、索引、schema、安装器或其他宿主保证。版本发行前核对远端 tag／registry，沿既有正式 Release workflow 发布同版主包／Linux x64 平台包，不手工 npm publish、不覆盖历史 tag。根任务核验真实制品并通过 Lifecycle 物化。

失败先保留原始回执并核对状态；源码恢复用新提交，已发行错误用后续正式补丁或现有 owner 恢复入口。本地完成要求全部门禁、原生收尾和远端同步；根唯一停止点还包括真实驻留 MCP、安装和组合验收，发布成功不能单独结束。
