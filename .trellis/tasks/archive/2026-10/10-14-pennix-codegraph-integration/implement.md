# 实施与检查

1. 读取 `AGENTS.md`、原生 installer/targets/shared、调用方和 fixture；核验已有 Trellis init 生成资产，保留源码基线。
2. 修复用户级 writer、marker/path/symlink、共享消费者、短块导航和对应 tests。
3. 修改 package/lock、upgrade URL、pack-npm、Release workflow 与 fork 说明；保持上游来源与许可证。
4. 运行相关 installer/upgrade tests，再运行完整 npm test、npm run build、Linux x64 kernel/bundle、双包结构与安装 smoke。
5. 经当前明确授权提交推送必要发布，核验 registry 两包、Release、依赖和 provenance；回写精确源提交与版本，不将部分成功当作完成。

恢复：隔离 fixture 不接触真实用户文件；失败先核验当前状态，不重复发布已存在版本；发布受限时保存源提交与失败证据并阻断依赖部署。
