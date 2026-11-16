# CodeGraph 实施合同

执行根任务已批准合同cafeaf12543e5aa07154ed5416439f58f1016bc64ce522c90be7421bf64899fa的W03；批准来源为根任务approval.md。沿main，不新建工作树，不操作真实项目索引。只吸收固定上游329dd12f7adcf5c6d5e68acb217496ac0123f7ee中相关TOML词法定位与stdout关闭模块，保留许可证和Pennix发行、绑定工作树及受管安装合同。

TOML修改到共享helpers、Codex消费者及其fixture：语义识别引号／缩进／dotted／inline和多行伪表头；仅更新本owner的command、args，保留未知策略字段与其他owner。无法安全改写的已有定义显式拒绝且不写文件；移除不误删其他owner。平台shim的下载必须有唯一匹配摘要，缺清单、缺条目、摘要冲突或篡改拒绝；受管入口拒绝缺失平台包后的缓存／下载替代，Lifecycle调用方在W04闭合。

stdout断管沿原生MCP关闭流程释放资源，验证error／close幂等及真实子进程断管退出。活动AGENTS保留fork事实、原生Trellis块与按需背景入口，删除未经证明的环境和预算断言；有效预算由原生配置与加载证据核验。旧项目资产只通过Trellis原生update和migrate-layout，保留手工规则、任务与自定义配置。

先定向反例再完整类型、build和测试。通过后提交推送、正式未占用patch发行，载荷验证及两端原生repair归根W08—W11。任何必要失败停止依赖发布，不以局部通过宣布最终完成。

## 验收覆盖

| 接受条件 | 工作包 | Owner | 验证入口 | 交付证据 | 停止条件 |
| --- | --- | --- | --- | --- | --- |
| TOML定位与受控保留 | W03 | CodeGraph | helper及真实Codex installer回归 | 合法形式／伪表头／未知字段／幂等 | 重复定义、误删或冲突后写入 |
| 平台载荷可信 | W03/W04 | CodeGraph/Lifecycle | 本地HTTPS、缺包及摘要反例 | 不执行未验证下载或受管替代 | 缺摘要仍执行、平台身份不符 |
| MCP断管释放 | W03 | CodeGraph | 纯模块与真实stdio进程 | 尾部关闭、幂等与退出 | 父进程仍活时资源滞留 |
| fork规则和有效预算准确 | W03/W11 | CodeGraph/宿主 | 活动入口、配置及加载核验 | 精简入口和可追溯背景 | 原生／fork冲突或无证据预算 |
| 生成资产与交付同源 | W03/W08—W11 | Trellis/CodeGraph/Lifecycle | 原生迁移、完整测试、发行和repair | 历史保留、受测源与载荷相同 | 手改生成hash或no-op冒重装 |
