# 实施与验证

已完成根 P1：CodeGraph 原生 --project-only 贯穿 init／index／sync／status／serve／local install；复用 BoundWorktree 的严格扫描、查询及源读取，新增无 Git 项目模式，不增加扫描器或持久绑定文件。新增 init --no-git-hooks；修正 init 重入和失败退出、严格健康门禁；local 原生重入保留绑定与用户策略。

真实 TypeScript 检查和完整 build 通过。六个定向测试文件 645 passed、8 skipped；完整测试 915 passed 文件、2 skipped 文件，11429 passed、2 expected fail、60 skipped。新增测试使用真实 SQLite、CLI、非 Git 源码、根外 symlink、祖先索引、schema-only、空项目及 Git Hook 差异，不以 mock 代替数据库和路径边界。

根跨组件 fixture 已证明 Lifecycle 声明 → Trellis 原生 init → Codex 原生信任 → CodeGraph 接入、首次索引和重入；新独立 MCP 实测启动 catch-up、修改／新增／删除监听收敛和根外查询拒绝，通过后进程正常退出。无真实业务项目索引变更或模型调用。

本机系统 npm／npx 入口为空，最初无执行的退出 0 不计通过；后续使用 SHA512 核验的隔离 npm 11.6.4 和项目已有编译／测试入口，未修补系统包。正式发行候选 1.6.3-pennix.3 已核对 registry 404、远端 tag 未占用；下一步按原生 Release CI 完成公开交付。
