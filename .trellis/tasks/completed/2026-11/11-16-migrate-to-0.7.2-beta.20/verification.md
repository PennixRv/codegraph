# 原生迁移任务核验

原生 update 生成的本任务由父任务 11-16-workflow-health-remediation 在根已批准合同下完成。本次仅核验、接纳已实施迁移结果，不重新授权代码变更或回退父任务。

旧 beta.54 资产已由原生 Trellis 更新和任务布局迁移到 beta.20；AGENTS 的活动正文也已按父任务明确范围缩短。原生最终 update --dry-run exit0，仅把既有自定义 .trellis/config.yaml 与 .codex/hooks.json 列为须保留的差异，没有新待应用文件；两项按既定保留决策未覆盖。task.py migrate-layout 返回 moves={}、changed_files=[]，历史任务、当前路径与父子关系有效。

本仓 7141 项测试及类型／构建、实际发行与双机 MCP 查询见父任务 delivery-review.md。没有重建真实项目索引、删除历史或手改模板 hash。原生 analysis 核验路线接受后 complete，由父任务记录 integrated；任务记录不改变正式载荷。
