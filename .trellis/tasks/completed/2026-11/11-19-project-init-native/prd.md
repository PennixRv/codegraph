# 补齐受限项目自动初始化原生能力

## Goal

承接根任务 project-init-trust-automation 已批准 P1；统一项目根边界、禁止 Git Hook 回退、健康核验及失败退出，正式发布并配合集成。

## Requirements

- 根任务 `.trellis/tasks/in_progress/11-19-project-init-trust-automation` 的 P1 已获整体批准；用户要求“现在开始推进到停止点吧”，根原生路线 revision 2 已接受并授权。此任务承接明确组件范围，不重复索取相同批准。
- 提供 --project-only，复用已有严格 scan／watch／read 边界并约束 MCP 启动根，适用于 Git 和非 Git 项目；local Codex 配置保留自身边界和用户策略。
- 提供 init --no-git-hooks，修正索引结果和失败退出、重复初始化及严格健康门禁，不用绕过信任或强制解锁处理错误。
- 执行适用原生测试、构建和正式发行，沿 main 维护线；真实 home-network 不修改，不新增付费模型验证。

## Acceptance Criteria

- [ ] 首次索引、sync、index、MCP 相同边界；无祖先索引和根外链接混入，非 Git 可用。
- [ ] 禁止 Git Hook 回退与 --yes 组合有效；已有安装策略与边界保留。
- [ ] failed／partial／锁冲突不会误报 ready，资源释放；类型、定向及完整适用测试通过。
- [ ] 正式公开来源与发行可核验，组件原生归档；根任务另负责两机和集成。

## 验收覆盖

| 接受条件 | 工作包 | Owner | 验证入口 | 交付证据 | 停止条件 |
| --- | --- | --- | --- | --- | --- |
| 项目边界一致 | P1 | CodeGraph | CLI／MCP／installer fixture | 本任务 execution.md | 越界或参数丢失 |
| 初始化副作用受限且失败真实 | P1 | CodeGraph | init／状态与锁回归 | 测试及类型结果 | 假成功或 Git Hook 意外写入 |
| 来源发行完成 | P1 | CodeGraph | 原生 CI／公开载荷／维护引用 | 发行版本和提交 | 身份不一致 |

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
