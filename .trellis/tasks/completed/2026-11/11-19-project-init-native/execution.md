# 实施与验证

已完成根 P1：CodeGraph 原生 --project-only 贯穿 init／index／sync／status／serve／local install；复用 BoundWorktree 的严格扫描、查询及源读取，新增无 Git 项目模式，不增加扫描器或持久绑定文件。新增 init --no-git-hooks；修正 init 重入和失败退出、严格健康门禁；local 原生重入保留绑定与用户策略。

真实 TypeScript 检查和完整 build 通过。六个定向测试文件 645 passed、8 skipped；完整测试 915 passed 文件、2 skipped 文件，11429 passed、2 expected fail、60 skipped。新增测试使用真实 SQLite、CLI、非 Git 源码、根外 symlink、祖先索引、schema-only、空项目及 Git Hook 差异，不以 mock 代替数据库和路径边界。

根跨组件 fixture 已证明 Lifecycle 声明 → Trellis 原生 init → Codex 原生信任 → CodeGraph 接入、首次索引和重入；新独立 MCP 实测启动 catch-up、修改／新增／删除监听收敛和根外查询拒绝，通过后进程正常退出。无真实业务项目索引变更或模型调用。

本机系统 npm／npx 入口为空，最初无执行的退出 0 不计通过；后续使用 SHA512 核验的隔离 npm 11.6.4 和项目已有编译／测试入口，未修补系统包。正式发行候选 1.6.3-pennix.3 已核对 registry 404、远端 tag 未占用；下一步按原生 Release CI 完成公开交付。

## 正式发行与来源验证

追加双边界参数冲突拒绝及真实回归后，发布门禁首次发现 UI 子包版本仍为 .2；未发布的失败流程 44456247882 保留。修正版本后，相关三个文件 28 项测试通过；最终正式流程 [44459361737](https://github.com/PennixRv/codegraph/actions/runs/44459361737) 全部成功，包括完整回归、编译内核的契约／walker parity、构建、来源证明及公开 registry 确认。期间另一次旧流程在发布前取消，不计通过。

发行 tag v1.6.3-pennix.3 指向 b99815fedceca9fac8c7348fa16a3a879a6b6ff1；CI 构建来源为 6eb9c79c579369fbde63a1e9481e64ca95f0e7bf，其后仅原生 CHANGELOG 提升。维护 main 已 fetch 并快进至发行提交，与 origin/main 差异 0/0。

实际公开 codegraph-linux-x64.tar.gz SHA256 为 8f958a96822fd1285e6e25acbbf154d975afda2e5572db5933327f223cac6653，与 SHA256SUMS 匹配；gh attestation verify 成功，来源绑定本仓原生 Release CI。实际 npm 主包 SHA256 为 3e94277f94c951ddd280999acd1f487d9841db12a753852b7240d8d569517ca5，依赖精确同版 Linux 包；后者 SHA256 为 f60c20d82629875f472100690a5db5de3d7d9ea5343f8769d35156a036e17f2c，registry SHA512 完整性匹配，其 1596 个发行载荷文件与 GitHub 包逐一相同。新增的根 package.json 属 npm 平台元数据。

根侧已沿 Lifecycle 在 home-wsl、pennix-wsl 安装同一 .3 目标（owner 组合身份 be5678c9fa96ac7289b7d1d6d44cf4143ff41516ba2b62e0885f02bd378c25a1），两机安装平台包的 1597 个普通文件与公开 npm 包逐一匹配。两机后续消费方及新进程验收归根任务，不在组件范围伪报整体完成。

## 最终验收返工

根侧安装版本 Git 重入发现缺口，详见 git-reentry-defect.md；本任务已原生 reopen，恢复不变 P1 合同、原有整体授权并进入实施，不把 .3 的归档事实当作新缺口完成。终态 reopen 会清除授权，已沿原生方案重新接受及 authorize 恢复，而非手写状态。

修复共享参数解析：先取 savedBoundRoot 并消费索引，再归并显式绑定；不同已有绑定明确拒绝且保持原文。新增真实 Git 根、同根显式重复、默认 refresh 和不同根拒绝回归。类型与 build 通过；安装器两文件 624 passed、8 skipped；同步 root／UI 补丁版本后的项目及 UI 回归 24 passed。原失败 Git fixture 使用真实已安装 Trellis .23 和 CodeGraph 修复源码再次调用原入口，重入通过。

修复提交 684b4927d46e0dd1a11cf8f9c4e2508b59475b1c 已推送 main，新不可变补丁候选为 1.6.3-pennix.4，正式 CI 44464297868 运行中。根侧已针对这一源码重新完成 full-local：57 passed、0 failed／blocked、4 个通用 fixture 既有覆盖边界 not_run，ok=true。正式 .4 公开载荷、两机替换和完整安装版本验收仍待完成；此前 .3 公开载荷身份不迁作 .4 证据。

## 最终 .4 交付

正式 CI 44464297868 全部成功：898 文件通过、19 跳过，10883 passed、2 expected fail、441 skipped；实际编译内核的 18 文件、312 项通过。tag v1.6.3-pennix.4 指向 427a71b6fba47aaa76ed11cd46501b8b53ae2bb6，相对测试来源 684b4927 仅原生 CHANGELOG 提升；维护 main 已 fetch／快进，0/0。

公开 GitHub Linux 包 SHA256 431818bcd1ce5ba9295a20552d51f6c7062c72ce2d18b61b71374b7e675c414e 与唯一清单项匹配，gh attestation verify 成功。实际 npm 主包 SHA256 da8c036d11ea78233ab866bab30806db0a11cbf724210553fa00a918c92200b8，平台包 a608574d2ca8329fb1b583341d9acebadb2c6ea089cd2655a57651fe1e0364c5，均通过 registry SHA512；平台 1596 个运行载荷文件与 GitHub 包逐一相同。原生 owner 组合身份为 d11b04d1e956d1f2997e442d0107916bffed1663902cb7071f8fb35c53c8215f。

曾出现版本元数据可见而平台 tarball 404；两机 update 在候选阶段失败，未改变安装。确认真实 tarball 返回 200 后重新核验上述载荷，再原生部署两机 .4；安装平台的 1597 个普通文件逐一匹配公开 npm。两机定向 update .4 均 no-op，相关包 owner／MCP current 或 match，recover idle；本机 npm 探针使用已验证的隔离 npm，不宣称预先损坏的系统 npm 已修复。

最终真实安装版本全链路均通过：home-wsl Git fixture /tmp/pennix-installed-project-init-v7h92fel、pennix-wsl 非 Git fixture /tmp/pennix-installed-project-init-blzpmb9f。两机实际 CLI 版本 .4、Trellis .23；首次／重入、精确目录及四个 Hook、开发者工作区及 bootstrap、真实新 Codex 线程的 MCP 调用、增删改监听、根外拒绝、重启 catch-up 均通过；0 model turns。宿主及 fixture 进程已全部结束，/tmp 私有证据保留。此前 .3 Git 缺口已关闭，不保留为合同内遗留。
