# 合并与路由实施

## 已批准范围与基线

根任务第 2 版合同已经用户明确批准，本组件原生阶段及授权映射均有效，路线 revision=2。维护 main，本地基线 5291a22e0da6b359c650ad5806430617cdbbed73，冻结上游 ac6149c5536804af3181997e0a6ef601ce883fb0。普通待提交合并已执行，未发布或部署。

## 当前冲突处置

- CG01：serve 同时保留 bound-worktree 和 no-telemetry，原生关闭流程保持。
- CG02：同时传递 boundWorktree、onWorkBegins 和 deferIndexRecovery；绑定树关闭共享查询池。
- CG03：上游惰性 orchestrator 继续传入 strictWorktree；scanDirectoryAsync 本地第四参数不变，manifest evidence 位于第五参数，全部调用者已检索核对。
- CG04：精确 escapesRoot 与工作树来源过滤共同保留。
- CG05：来源核验、provenance、陈旧及版本提示共同返回，不因警告吞掉正文。
- CG06：上游 stdout 处理与本地正常退出一致，未恢复旧整文件。
- CG07：Codex 用连接字段更新保留用户策略，歧义定义拒绝；通用 TOML 保留上游完整表接口，共享一个扫描器。项目 Codex／OpenCode 保留严格规则及块外字节，其他宿主沿上游链接和 marker 修复。相反的测试预期按各 owner 合同调整，保留回归场景。
- CG08：Pennix 包源、受管升级边界与上游 local install 识别共同保留；新增回归使用真实 NPM_PACKAGE 路径。
- CG09：新版本 1.6.3-pennix.1，npm 原生处理锁冲突并按锁更新依赖，保持 Node 能力判定与 Linux 双包。
- CG10：AGENTS 保留本地紧凑工程入口，两侧 CHANGELOG 历史保留，main 新修复进入 Unreleased；发行保持 Linux x64，吸收 registry 传播等待且保留错误输出。

自动合并复核补上 BoundWorktree 的上游敏感目录拒绝，真实 Git 私密目录回归通过。原生类型、完整 build 通过；七文件定向 745 通过、8 条件跳过、0 失败。完整 npm test 执行中，新增语言解析失败待核对，不能据定向通过宣称合并验收完成。

W03 已实现原生 Codex 分层处理器及两类 Hook 定义，保留默认 Claude 分支，详见 README。路由 17 项与安装器、通用安装回归组合 646 项中 638 通过、8 条件跳过。真实 Codex 原生 hooks/list、handler、幂等、撤回的隔离测试通过；Context Mode／Trellis／外部 Hook 共存时真实本地请求收到调用者关系，原生压缩恢复收到提示，未调用外部模型。

完整测试重建原生 kernel 后，11,485 项中 11,422 通过、2 expected failure、60 skip、1 失败。唯一失败是新增三处子进程遗漏上游 windowsHide 静态守卫，已补齐且该 33 项定向通过。前轮 daemon 就绪竞争和缺失文件多余祖先遍历已修复并复验，Rust 27 项通过。最终正式 CI 继续完整复验；尚未把本地合并报告为已发布或双设备完成。

发行前复核发现文件节点可能抢占提示中的明确符号锚点；新增“常量先于函数”的真实图夹具重现两项失败。处理器现优先唯一符号，未找到符号时才从文件的函数／方法／类取有界锚点，避免用文件头部无关常量预取。首次未发布 workflow 已取消，沿相同未占用版本修复并重新发行，不覆盖已发布资产。
