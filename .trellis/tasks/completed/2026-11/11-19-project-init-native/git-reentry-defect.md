# 安装版本 Git 重入缺口

根任务使用两机实际公开安装版本进行最终验收。pennix-wsl 的非 Git 链路通过；home-wsl 的 Git 首次初始化通过，但再次调用原有 trellis init --codex 时，CodeGraph local installer 报 Cannot safely refresh existing Codex project binding，保留已有配置，未完成整体接受。

根因是 writeMcpEntry 解析已有 --bound-worktree 时使用 boundWorktree ??= args[++i]。调用方显式传入相同绑定时，空值赋值短路使 ++i 未执行，下一轮把路径误当未知参数。非 Git 模式不带该参数，原用例未覆盖此组合。

沿原 P1 合同修复共享解析位置，补实际 Git 绑定的显式重入、默认 refresh 保留和不同绑定拒绝测试。已公开的 .3 不改写；修复后发布新补丁 .4，再由根任务通过 Lifecycle 部署两机并重新验收。本文件记录新证据，不改写此前接受的发行事实；通过原生 reopen／阶段回流恢复实施。
