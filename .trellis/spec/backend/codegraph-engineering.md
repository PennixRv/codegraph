# CodeGraph 工程边界

本指南保留原 AGENTS 中与当前源码一致的架构与验证信息。上游机器、账户、发布目标、固定检索配额和未经核验的有效配置不构成本 fork 合同。

## 源码导航

`src/index.ts` 的 CodeGraph 类是公开接口。文件经 `src/extraction/` 的 tree-sitter／worker 提取到 `src/db/`，再由 `src/resolution/` 解析引用；`src/graph/` 提供调用、影响及共享派生，`src/context/` 负责呈现。多个消费者需要的同一派生放在 graph 层，避免 MCP 与 viewer 各实现一份。节点和边类型以 `src/types.ts` 为准。

`src/db/sqlite-adapter.ts` 使用 `node:sqlite`，实际数据库启用 WAL／FTS5。数据库测试使用合成文件和真实 SQLite，不能以 mock 代替写锁与关闭证明。源码 Node 范围与 `src/bin/node-version-check.ts`、package.json 一起核验。

`src/mcp/transport.ts` 管理 stdio／socket，`proxy.ts` 管理本地握手、daemon 连接与回退引擎。stdio 的 stdin 或 stdout 终止必须走原生关闭流程，等待本 session 的引擎资源退出；不能停止其他 daemon 客户端。`src/mcp/server-instructions.ts` 是 initialize 工具说明来源。

## 安装与配置

`src/installer/targets/registry.ts` 登记宿主，types.ts 定义 AgentTarget。各 target 管理自己的 JSON／JSONC／TOML 路径；shared.ts 复用原子写入和项目短块机制。安装器回归在 `__tests__/installer-targets.test.ts`，覆盖首次、重复、移除、兄弟配置与局部状态。

Codex 全局路径遵守 CODEX_HOME，local 路径锚定明确项目；local 生效还依赖原生项目 trust。绑定工作树在 refresh 时保留，不支持的既有 args 需明确 bound-worktree，不能猜测或去除边界。TOML 结构扫描不验证整个文件，但不得生成语义重复定义；只替换提供的连接键，用户策略及其他 owner 保留。卸载移除本 owner 的表／子表，不改父 inline 中其他 owner，无法安全编辑则拒绝且保持原文。

Codex／OpenCode 全局操作不改用户 AGENTS；明确 local 安装仅管理 marker 短块。其他宿主沿既有兼容行为；新增平台或宿主行为必须另有需求。Cursor 的 cwd 兼容参数和 JSONC 的注释保留不可因公共 helper 改动而丢失。

Codex prompt-hook 的父进程拥有输入、输出、总时限及整个子进程组；读取图与宿主配置放在可终止的隔离 worker，不在输入链路启动 daemon、遥测或写索引。只有宿主已信任的当前 Git 根、独立完整索引、唯一锚点及实际源码 hash 校验通过才预取有界关系；其他情况提示或静默。原生 installer 只生成定义，确切信任交 Lifecycle；共享 Hook 更新保留其他 owner 的位置，撤回中间项可留空槽。完整结构结论仍由原生查询和当前证据支撑。

## 构建、回归与发行

`npm run build` 顺序运行 tsc、copy-assets、build:ui 并设置 CLI 可执行权限。schema.sql、全部 grammar WASM 和 dist/viewer 必须进入载荷，`scripts/check-ui-build.mjs` 核验。`build:lib` 是独立 UI 库构建，不属于普通 build；不因维护 CLI 而发布该私有库。

Vitest workspace 区分 engine（Node）与 ui（jsdom／browser resolution），不可把 browser 条件加给 engine。完整入口为 `npm test`；evaluation 有独立 runner，不能把完整测试等同于付费模型评测。测试的 HOME／USERPROFILE、XDG、Git 配置等由 setup-home-sandbox 隔离；新增写入仍显式注入。平台条件测试说明实际运行环境，不假称在 macOS／Windows 验证。

语言／框架的深度验证方法与历史案例按需看 `docs/design/dynamic-dispatch-coverage-playbook.md`、`docs/design/callback-edge-synthesis.md` 和 `docs/benchmarks/`；这些材料不自行授权真实模型、外部项目写入或跨设备操作。普通安装、配置与进程修复采用对应确定性回归。

本 fork `.github/workflows/release.yml` 从正式维护引用 dispatch，检查测试和 Linux x64 kernel，构建自带运行时载荷、生成 SHA256SUMS、创建 GitHub Release 并发布 scoped npm shim／平台包。不能直接 npm publish 源 package 代替 bundle。按当前任务批准选择未占用版本，回读实际 tag／资产／摘要与 npm 内容，禁止覆盖已有不可变发行。CHANGELOG 的 Unreleased 由原生 prepare-release.mjs 在 CI 提升；以实际 CI 和发行结果判定发布完成。
