# CodeGraph W5：工作树绑定与索引隔离

## 目标（Goal）

承接父任务 W5 的已批准实施合同，完成原生 --bound-worktree 绑定、逐树索引/扫描/watch/源码边界及真实 Git SQLite 回归；仅组件实施，交主控最终接受与发布。

## 需求（Requirements）

## 本次变更

本包只在已批准的 W5 范围实现工作树绑定与源码边界，不重开架构或增加 provider；原生发布目标为 Linux x64。

## 验证

运行 bound-worktree、worktree-detection、installer-targets 回归、构建及类型检查，发布后验证安装入口。

## 停止条件

错树读取、共享索引、非原生安装或未通过必需检查时停止发布。

## 回退方案

源码以原基线 f5addf2 回退；发布后的机器通过 Lifecycle 固定安装前一已验证版本，保留各树索引和用户配置，不删除未接受的成果。

- 原生 `serve --mcp --bound-worktree PATH` 固定 checkout 身份，拒绝显式其他树或祖先索引借用；同 HEAD 不代表相同源码。
- 每树独立 SQLite、扫描、watch、源码读取及查询缓存；嵌套 linked worktree 排除，正常 submodule 保留。
- Codex 本地安装与刷新保留绑定，不修改全局用户 AGENTS；同机部署通过原生发布重装。
- 用户已授权当前主会话实施、验证、提交和发布重装；不使用实施子代理。

## 验收标准（Acceptance Criteria）

- [ ] A/B/C 同 HEAD 不同 dirty symbols 双向隔离与错树拒绝通过。
- [ ] 缺索引、链接重定向、reset、watch、reopen、Codex 本地刷新测试通过。
- [ ] 原生构建、相关回归与 Linux x64 bundled 发布安装核验通过；根任务负责组合接受。

## 备注（Notes）

- 让 `prd.md` 聚焦需求、约束和验收标准。
- 轻量任务可以只保留 PRD。
- 复杂任务在 `task.py start` 前增加 `design.md` 记录技术设计，增加 `implement.md` 记录执行计划。
