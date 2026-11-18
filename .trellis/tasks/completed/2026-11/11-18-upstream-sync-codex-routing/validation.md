# 实施验收

冻结上游 ac6149c5536804af3181997e0a6ef601ce883fb0 为当前维护线祖先。普通 merge 3a2a79028925ca237af0243249e3aaf8cfaf7937 保留双方历史，CG01—CG10、自动合并发现及回归见 execution.md。最终公开 v1.6.3-pennix.2 指向 69bcdf77baad24183798c21a1b86044329ce535a；原生 release workflow 44260948881 的完整测试、kernel 全语言 parity、构建、证明与双 npm 包传播检查均通过。

55 项最终定向通过。公开 GitHub 与 npm platform 的 1,596 个 bundle 文件逐字节一致，主 shim 只绑定同版本 Linux x64；摘要和 provenance 通过。输入／输出／deadline、真实图、信任、跨树、陈旧与关闭边界已核验。大仓库真实反馈促成 .2 的重名次要候选跳过及真实 edge.kind 呈现，不覆盖 .1 已发布资产。

根实际完成 .2 部署、精确根重建／同步和新独立 bound MCP 查询，整体 full-local 为 57 passed、0 failed／blocked、4 个原有覆盖边界 not_run。本机唯一真实 Codex 轮次三输入／一压缩，111.02 秒：结构与恢复阶段实际图查询三次、Context Mode 五次，纯配置轮不调用图，来源及答案复核通过。

用户随后明确取消 Laptop 独立验证并要求直接部署收尾；根继续原生部署，仅保留安装必要后置检查，不建立 Laptop 索引或调用模型。本组件软件交付已由根接受，双机安装结果仍由根 device-acceptance.md 持有，不另耗模型预算。没有未解决的源码缺口；旧平台及其他宿主不扩称为已验收。
