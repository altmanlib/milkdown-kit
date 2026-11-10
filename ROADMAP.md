# Roadmap

任务按类目管理: 待决策/进行中/下一步/规划中/暂缓/已完成. 流转: 规划中 → 下一步 → 进行中 → 已完成; 现阶段明确不做的进「暂缓」, 要重新考虑时再移回「规划中」

- 编号 `R###` 全局唯一递增, 待决策与暂缓项也占用; 一经分配不重用/不重排, 移动类目时不变; 新任务取文件中现有最大编号加 1(历史编号保留原写法, 如 R02 / R14)
- 容量: 进行中最多 1 项, 下一步 1~3 项, 已完成倒序保留最近约 10 项(更早的历史靠 `git log` 与各包 `CHANGELOG.md`)
- 条目格式: `R006 [标题] 说明(依赖 R00x)`; 大功能(判据见 `AGENTS.md`「设计文档」)追加 `设计: <文件名>`; 提交信息末尾附编号, 如 `feat: add paste handler (R14)`
- 「已完成」条目只写结果摘要(一两句), 方案与取舍在设计文档里; 版本历史归各包 `CHANGELOG.md`, 不在这里累积功能清单
- 断点写在「进行中」任务下, 分三行: 已做/未做/注意
- 触发条件只写外部事件. 无界读取这类形状缺陷不登记成「数量到了再做」, 直接修
- 「暂缓」: 已定现阶段不做/暂不使用/场景未定, 不参与选任务; 保留编号与说明, 触发条件写在条目里; 不删; 触发后移回「规划中」, 不在暂缓里直接开工
- 设计总览见 [docs/design/editor-architecture.md](docs/design/editor-architecture.md); 尚未入路线图的候选见 [docs/design/editor-candidate-goals.md](docs/design/editor-candidate-goals.md)

| 阶段 | 规则 |
|---|---|
| 执行前 | 先看「待决策」, 有项阻塞要做的任务时先向用户确认, 不要自行假设; 选任务: 「进行中」有就按断点继续, 否则取「下一步」第一项; 大功能先有经用户确认的 `draft` 设计, 没有就先写设计; 把任务移入「进行中」并写初始断点, 随首个工作提交一起提交; 不从「暂缓」直接开工 |
| 执行中 | 完成子步骤就更新断点; 方案变了先改设计文档再改代码; 发现新任务取新编号放入「规划中」, 不插队; 现阶段明显不做的放入「暂缓」; 需要用户拍板的放入「待决策」并注明阻塞的任务编号, 当前任务无法继续时移回「下一步」或「规划中」; 暂停但未完成时提交一次本文件, 保证断点不丢 |
| 执行后 | 验证通过后在同一 commit 里移入「已完成」, 大功能同时把设计文档修订为只留核心决策与方案(删实施细节)并改 `published`; 从「规划中」把依赖已满足的任务提升到「下一步」; 用户拍板的决策先把结论写入设计文档, 再从「待决策」删除, 被阻塞的任务随之解除; 修剪过长的「已完成」 |

## 待决策

无

## 进行中

无

## 下一步

无

## 规划中

无

## 暂缓

- R02 [交互 E2E] 把 §6 的手动交互验证写成 playwright 用例, 在 CI 中针对 playground 运行. 触发: 交互层出现回归, 或交互改动变得频繁. 设计: editor-architecture.md
- R05 [公式支持] 在 `FeatureName` 中增加 `latex`, 动态 import, 不启用时不打包 KaTeX. 触发: 有使用方需要公式. 设计: editor-architecture.md
- R07 [列表符号] 导出无序列表用 `-` 而非 `*`. 触发: 使用方要求导出 `-`. 设计: editor-architecture.md
- R08 [外层 token] 把主题 token 同时定义到宿主元素上. 触发: 使用方需要在编辑器外框上使用主题 token. 设计: editor-architecture.md
- R09 [删除图片 Markdown 规避] 上游修复 §2.2 缺陷后删除本包规避代码, 往返测试保证行为不变. 触发: 上游修复该缺陷. 设计: editor-architecture.md
- R10 [TypeScript 7] 升到 TypeScript 7. 触发: vue-tsc 和 rolldown-plugin-dts 支持 TypeScript 7 的原生编译器. 设计: editor-architecture.md
- R11 [Dependabot 管理 npm 依赖] npm 依赖改由 Dependabot 管理. 触发: Dependabot 的 bun 更新器支持 `bun.lock` 的 `lockfileVersion` 2. 设计: release.md
- R12 [各包独立版本号] 把 changesets `fixed` 改为 `linked` 或移除. 触发: 某个框架包需要升 major, 而其他框架的使用方不应该跟着升. 设计: editor-architecture.md
- R14 [VS Code Markdown 粘贴] 剪贴板含 `vscode-editor-data` 且 `mode === 'markdown'` 时按 Markdown 解析粘贴. 触发: 使用方频繁从 VS Code / Cursor 粘贴 `.md` 并反馈被当成代码块. 设计: editor-architecture.md

## 已完成

- R04 [体积上限检查] `scripts/check-size.ts` 按使用方方式打包核心包, 超 gzip 上限或产物含 KaTeX 时失败, 并入 CI
- R03 [API 冻结评审] 功能开关按用户可见面重命名, 去掉可关的 `cursor`/`list-item`, 收敛公开 token; 随 0.4.0 发布. 设计: editor-architecture.md
- R13 [放弃 React 18] 明确只支持 React 19, 从路线图移除 React 18 兼容计划
- R01 [公开 API 参考] 新增 [docs/reference/api.md](docs/reference/api.md): JS 导出, 框架组件, 样式入口, CSS token, DOM 约定
