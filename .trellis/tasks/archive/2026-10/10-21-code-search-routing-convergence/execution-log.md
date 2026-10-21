# 实施记录

同一四 owner 方案经原生 revision 1 seal／approve／start 执行；封口 PRD／设计／实现计划保持冻结。本仓库仅校准 MCP 原生指令与 explore 实际源码区段、完整性及后续读取说明，未更改索引、评分、扩展算法或 schema。沿既有完整性测试验证真实返回区段和裁剪，不为每句文案新增镜像断言。

候选 1.6.2-pennix.3 经远端 tag／registry 未占用检查后，由 npm version 更新根及 UI manifest／lock；CHANGELOG 仍使用发行流程所需的 Unreleased 区块。定向四领域 79 项通过；完整 npm test 7110 通过、36 跳过、0 失败，npm run build 通过。完整门禁使用已安装平台包携带的 Node 24.16.0，遵守 >=20 <25；没有修改全局 Node 26、依赖或安装脚本权限。

正式制品必须沿 workflow_dispatch Release 构建 Linux x64 kernel、正式 bundle 和同版主／平台 npm 包。官方 CI、registry 版本及摘要、真实驻留 MCP 新提示和 root 组合验收仍待执行；本地绿色不表示任务完成。

平台包的首次 registry 查询在原运行等待 30 次后仍返回 404，原运行以 registry 验证失败结束；后续 npm registry 已解析该精确版本。官方 tarball 的 SHA-512 与 registry 元数据完全一致，临时目录以 `--ignore-scripts` 安装后 `npm audit signatures --json` 返回 `invalid: []`、`missing: []`；SLSA provenance 指向本仓库 `main` 提交 `8f3f4aa1ebe2eb4e13bec63dc4669adea47f2296` 和原 workflow run `39525601362`。已按工作流的既有幂等规则原生重跑失败 release job；registry 中已存在的版本会被跳过，当前正重跑 Full test gate。恢复门禁通过前不将正式发行标记为成功。

源码提交 8f3f4aa1ebe2eb4e13bec63dc4669adea47f2296 已推送 main，官方原始 Release 运行 39525601362 的 full test、Linux x64 kernel、完整 walker parity 及 bundle 构建均通过。自动生成的纯 CHANGELOG 提交 7236a5d02f4645b51d685639a57cc9fcab97a6cf 已审阅并快进同步；正式 v1.6.2-pennix.3 的 tag 指向该发行记账提交。

已下载 GitHub 正式 codegraph-linux-x64.tar.gz，SHA-256 为 1e37c71d37c5728772596ae94fa52345f3a1e13064621375e1345c3baed748d9，与 SHA256SUMS、Release 资产摘要一致；原生 gh attestation verify 退出 0。包内 mcp/tools.js、mcp/server-instructions.js 与本地验收编译文件逐字节相同，版本正确且包含 kernel。npm 发布步骤成功后，主／平台包首次精确查询仍 E404，当前等待原流水线的 registry 验证，不重发同版或改渠道；尚未传播安装。

首次正式发行的最终结果为 failure：2026-10-21T01:24:35Z，Verify every package is actually on the registry 在 30 次、约 5 分钟等待后报告 @pennixrv/codegraph-linux-x64@1.6.2-pennix.3 never appeared。已完整检查失败步骤和发布回执：平台包在 01:19:14Z、主包在 01:19:27Z 都由 npm 报告发布成功；主包的原生 catalog 精确 endpoint 后续 HTTP 200，平台包仍 HTTP 404。该结果不是源码测试失败，但正式发行门禁未通过；不安装、不覆盖 tag，不重复发布掩盖，继续核对原发行传播与可用原生恢复入口。

## 根集成续记

原 release run 经官方 `--failed` 恢复后最终 success；registry 验证步骤确认同版主包和 Linux x64 平台包均已存在并跳过重复发布。根已核验 npm 下载摘要、签名审计、SLSA provenance、CLI `.3` 版本和正式 GitHub Linux 制品；原始失败保留为历史事实。

本地真实 CodeGraph MCP 工具已由根会话调用，并返回当前源码区段及结构关系；CodeGraph CLI 安装版本为 `1.6.2-pennix.3`。根仍需在 Context Mode MCP 重载后完成跨组件真实宿主验收。当前没有增加 CodeGraph 算法、schema 或其他实现范围。根任务执行记录维护最终宿主状态和组合门禁。
