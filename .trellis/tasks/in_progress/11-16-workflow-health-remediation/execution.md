# W03 源码验收记录

候选版本1.6.2-pennix.5；npm精确版本404且正式tag不存在。原生npm version同步根、ui与lock；未发布。上游固定329dd12f选择性吸收TOML语义扫描／移除与stdout关闭模块，不合并其他新功能。

配置按真实解码路径定位，刷新只替换提供的连接键，保留策略、环境、未知多行值和兄弟owner；inline／dotted／重复定义拒绝且不写入。Codex detect同步语义，移除父inline冲突先拒绝，不删除AGENTS。新增Python tomllib交叉解析、真实Codex安装器、幂等及失败原文保留用例。

下载摘要缺失、无精确条目、路径别名、重复条目及不匹配均拒绝，受管入口CODEGRAPH_MANAGED拒绝缺平台包后的缓存／下载替代；Lifecycle平台包完整性和该标记传递仍属W04，不能以本仓单测代替。stdout error／close共享一次关闭，真实direct释放writer lock、proxy等待本地engine并仅断开自己的daemon连接。

原生Codex app-server config/read（cwd为本仓，includeLayers=true，3层）返回project_doc_max_bytes=32768；用户配置无显式提高。旧AGENTS 39898字节，现4119字节；用户5806＋根3926＋本仓4119的候选链共13851字节，低于默认预算。这里只证明当前原生配置及候选字节，不冒充未来两端新会话加载。原生Trellis块原样保留，工程背景按需进入spec，不保留上游Mac／VM／账户及人工发布假设。

原生Trellis update --create-new --migrate将0.7.0-beta.54升级至0.7.2-beta.20，migrate-layout原生预览8项并apply，状态与历史保留；迁移子任务已原生关联。未手改模板hash。生成资产仍须随最终正式安装复核。

验证：tsc --noEmit通过，npm run build通过；定向4文件284通过／8条件跳过，真实stdout子进程3通过；最终npm test为574文件、7141通过／36既有条件跳过，exit0。未访问真实项目索引或模型，真实预算仍0/12。正式发行、两端载荷、合成索引及repair归根W08—W11。
