# CodeGraph：Pennix fork 工程入口

本仓同步 upstream v1.6.3 及冻结 main 修复，正式发行仅支持 Linux x64：`@pennixrv/codegraph` 与 `@pennixrv/codegraph-linux-x64`，源与发行归 `PennixRv/codegraph`。其他宿主适配保留兼容，不代表本轮扩大平台支持。发布、推送、安装和真实调用遵守当前 Trellis 任务及用户授权；上游文档中的机器、账户、路径和人工发布假设不适用于本环境。

源码运行需要 Node >=22.5；发行包自带满足要求的 Node，SQLite 使用 `node:sqlite`，不增加原生数据库依赖。WASM 编译通过现有 Liftoff 启动参数规避已知故障，不按未来 Node 主版本禁用整个 CLI。先读相关源码与调用方；结构查询仅在已有获准且可用索引时采用 CodeGraph，不能因缺索引自动初始化或重建。按实际问题选检索工具，不设强制查询配额，不限制必要的原生读取。

- 构建：`npm run build`；包含 TypeScript、SQL／WASM 复制和 viewer 构建，`scripts/check-ui-build.mjs`核验载荷。
- 类型：`npx tsc --noEmit`；定向回归用 `npx vitest run __tests__/<file>.test.ts`，完整检查用 `npm test`，先等待构建完成。
- 测试使用 `__tests__/setup-home-sandbox.ts` 的隔离 HOME／XDG；新增全局状态写入仍显式注入，不访问真实用户配置或索引。
- 架构、安装写入及验证边界按需读 `.trellis/spec/backend/codegraph-engineering.md`。新语言／框架的上游深度验证材料在 `docs/design/dynamic-dispatch-coverage-playbook.md`；真实模型、外部仓库和平台验证另按当前任务授权与预算，不继承上游机器假设。
- Codex／OpenCode 全局 install、refresh、uninstall 保持用户 AGENTS 字节不变；明确的 local 安装仅管理项目短块。MCP `initialize` 的 `src/mcp/server-instructions.ts`是工具协议说明来源，避免在 AGENTS 复制长篇手册。
- Codex TOML 只更新本 owner 的连接字段，保留禁用、工具过滤、环境等用户策略；不安全的重复／inline／dotted 定义明确拒绝，不能假报已配置。
- 受管安装的平台包缺失由 Lifecycle repair 处理，不执行缓存或网络替代。普通下载必须验证当前资产唯一 SHA256SUMS 条目后才能执行。

活动入口保持紧凑，不假设 `project_doc_max_bytes` 已增大；有效值须由目标宿主核验。不要把窗口大小、压缩阈值与项目文档字节预算混为一谈。

<!-- TRELLIS:START -->
# Trellis Instructions

Use `trellis-start` for a new session and `trellis-continue` to resume;
reuse already loaded context. Follow `.trellis/workflow.md`.
The Task CLI owns task and phase state.

Before editing, read the applicable `.trellis/spec/` guidelines.
Without hook context, run `python3 ./.trellis/scripts/get_context.py --mode phase`
and, when a task exists, `python3 ./.trellis/scripts/task.py phase show <task>`.

Use the host's available Trellis skills or commands. If unavailable, read
`.trellis/workflow.md` for the native CLI route.

Managed by Trellis. Updates preserve content outside this block.
<!-- TRELLIS:END -->
