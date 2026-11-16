# 实施与发行验证

已完成根合同 W04：移除 Node>=25 全局拒绝与源码 engines 上限，最低版本按 node:sqlite 调整为22.5；保留 Liftoff、各 launcher 与 worker 继承以及实际运行错误。更新手工 AGENTS 的上限说明，TRELLIS 生成块保持原文。

隔离官方 Node25.9.0／26.13.1 发行与 SHASUMS256 核对后，均加载并解析32种grammar、使用SQLite、运行CLI help／version，并通过原生 init 在合成两文件项目完成索引；status=complete、0 parse errors。系统 Node 未变，不初始化用户项目。类型／build、16项定向回归通过；完整7138项通过、36条件跳过。

源码提交62a2ebe1已推送main，版本1.6.2-pennix.6；原生Release run43945317253完成kernel、完整测试、bundle、GitHub资产及npm发布，最后registry查询五分钟超时。原脚本丢弃stderr，不能恢复原错误或归因为认证／workspace／版本；同版npm11.21.2及目录、认证对照不能复现。原run保持failure，不以重跑覆盖既有资产。

当前实际公开@pennixrv/codegraph与平台包精确版本、SHA512完整性可核验；提取相同原生registry门禁运行exit=0，两个包均verified。公开Linux x64 archive SHA256为e646409da6dab68891b05638c9797f15cf6c3b4fc2d3fedbfa92f25a785fde5c，GitHub digest与SHA256SUMS一致，公开bundle help／version实际通过。CI自动changelog提交b8080f74已快进同步；仅追加保留registry底层stderr的诊断修正，不改变已经发布的runtime输入。

Pennix和PennixLaptop均通过Lifecycle原生update实际changed至同一正式版本，shim＋平台组合摘要均为62b85d470eb31f1b8edb7d43cb205467b2502a558232654db6a5e2d5fdf8b1b3。两端完整native check通过、recover idle，配置／秘密／认证与Paseo PID／身份／0.15.4版本保持。

根full-local为57passed、0failed、0blocked、4项既有覆盖边界not_run；独立handoff1项、runner单元8项与self-test11项通过。没有系统Node变更、真实用户项目索引或模型调用。诊断修正9c15ff05已推送main，不改变既有公开runtime载荷；原registry超时run仍保留failure，现态原生命令通过的证据单独记录。
