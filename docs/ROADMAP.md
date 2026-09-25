---
title: 路线图
type: design
status: draft
updated: 2026-09-25
---

# 路线图

## 1. 编号规则

每个计划有一个固定编号 `Rnn`，用于在 issue、PR、commit 和 changeset 中引用

| 规则 | 说明 |
|---|---|
| 分配 | 新计划取「已分配到」的下一个编号，不按优先级排序 |
| 不变 | 计划调整阶段、改名或拆分时，原编号保留；拆出的新计划分配新编号 |
| 不复用 | 完成或放弃的计划从本文删除，编号不再分配给其他计划 |
| 记录 | 完成的计划由 changeset 生成的 `CHANGELOG.md` 记录，对应 changeset 或 PR 中注明编号 |

已分配到：R13

## 2. 当前状态

当前版本 0.3.0：核心包 `@altmanlib/milkdown-kit` 提供 `createEditor()` 和主题样式，Vue 包 `@altmanlib/milkdown-kit-vue` 与 React 包 `@altmanlib/milkdown-kit-react` 提供各自的 `MdEditor` 组件。方案和已实现的能力见 [editor-architecture.md](design/editor-architecture.md)

`0.x` 阶段允许不兼容变更（[editor-architecture.md](design/editor-architecture.md) §5）。1.0 表示对外 API 和 CSS token（[api.md](reference/api.md)）稳定，之后不兼容变更只进 major

## 3. 1.0 之前

| 编号 | 项 | 理由 | 验收标准 |
|---|---|---|---|
| R03 | API 冻结评审 | 1.0 之后删除或重命名都要升 major，需要在 `0.x` 内完成所有不兼容调整 | 逐项确认 [api.md](reference/api.md) 中每个导出、prop 和 token 的去留与命名，包括 §7 中名称带公开前缀的内部变量；需要的不兼容变更已在 `0.x` 版本中发布 |
| R04 | 体积上限 | 1.0 之后体积回退同样影响使用方，需要在 CI 中发现 | 以 [editor-architecture.md](design/editor-architecture.md) §6 的基线数据设定各产物的 gzip 上限，超出时 CI 失败 |

## 4. 按需触发

以下计划不排期，满足触发条件时再做，处理方式见各自的链接

| 编号 | 项 | 触发条件 | 详情 |
|---|---|---|---|
| R02 | 交互 E2E | 交互层出现回归，或交互改动变得频繁 | [editor-architecture.md](design/editor-architecture.md) §9 |
| R05 | 公式支持 | 有使用方需要公式 | [editor-architecture.md](design/editor-architecture.md) §9 |
| R07 | 列表符号 | 使用方要求导出 `-` 而不是 `*` | [editor-architecture.md](design/editor-architecture.md) §9 |
| R08 | 外层 token | 使用方需要在编辑器外框上使用主题 token | [editor-architecture.md](design/editor-architecture.md) §9 |
| R09 | 删除图片 Markdown 规避 | 上游修复 §2.2 的缺陷 | [editor-architecture.md](design/editor-architecture.md) §5 |
| R10 | TypeScript 7 | vue-tsc 和 rolldown-plugin-dts 支持 TypeScript 7 的原生编译器 | [editor-architecture.md](design/editor-architecture.md) §4.7 |
| R11 | Dependabot 管理 npm 依赖 | Dependabot 的 bun 更新器支持 `bun.lock` 的 `lockfileVersion` 2 | [release.md](guide/release.md) §3.1 |
| R12 | 各包独立版本号 | 某个框架包需要升 major，而其他框架的使用方不应该跟着升 | [editor-architecture.md](design/editor-architecture.md) §4.9 |

## 5. 明确不做

见 [editor-architecture.md](design/editor-architecture.md) §8
