# 工作流体检整改交付审查

本仓 HA04／17／19／20／26／40 已完成。受测功能提交 066e43c4，原生发布流程仅提升 changelog 到 fdeda3e995fe609bed561835e6435d08dfcd4a8c；正式 1.6.2-pennix.5 已发布并推送 main。本次任务收尾不改变功能或载荷。

TOML 结构识别与受控写入保留未知字段；无摘要、条目缺失、篡改及受管平台包缺失均失败关闭；stdout EPIPE 释放子资源。AGENTS 活动入口由约 40KB 收敛到 4119 字节，实际规则链 13851 字节低于宿主默认 32768 字节预算。项目资产由 Trellis 原生更新到 beta.20，手工正文与历史数据保留。

574 文件、7141 测试通过、36 既有条件跳过，stdio 专项 3 项、类型和构建通过。CI 43848337984 的构建、测试、kernel parity、attestation、GH 与 npm 发布成功，最后 5 分钟 registry 可见性等待失败；之后原生 resolver 真实取得主包及 Linux x64 平台包并验证两份 SHA512，组合锁 SHA256 29e7dbf7b912b9d80720d667aebb1d75cb2d7c3c0ea5ee15712a27aa091650dc。保留 CI 失败，不重跑会覆盖既有资产的发布步骤。

两台设备均通过 Lifecycle 可信旧主包→新双载荷升级及真实 repair。公开平台包的 Copilot writer 与 Lifecycle 环境守卫差异在 Lifecycle 0.3.25 修复并使用实际公开包验证。双机合成项目实际索引、CLI explore、MCP initialize／tools/list／tools/call 和原生 uninit 通过；真实项目索引与数据库未修改。全局 Codex 只发现已选 codegraph_explore，版本 .5，无工具加载错误。

本仓没有合同内实现缺口或未结写入资源；根最终 full-local 57 通过、0 失败／阻断。详细载荷、宿主及外部网关兼容限制见根 validation.md、releases.md、device-acceptance.md。本次开发记录提交不需要新运行版本。
