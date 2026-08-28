# WB-004 · 内容生产设计包

## 目标

将 ArtFlow 的角色、动作、技能、特效、场景、关卡和 UI 生产环节，落为 El Guapo 中可审核、可交接、可被 Agent 读取的项目范围设计包。

## 验收条件

- [x] 设计包必须属于一个已注册项目，并可选择七个内容模块之一。
- [x] 每个设计包均包含标题、设计说明及下游交接说明。
- [x] 设计包采用 Draft → In review → Approved / Changes requested 的受控流转；批准后不可直接改回。
- [x] 每次创建及状态流转均写入项目审计记录。
- [x] Agent 项目上下文包含资产与内容设计包，便于按现有规范执行后续任务。
- [x] 页面只保存设计与 Git LFS 资产引用，不上传或公开实际源资产。
- [x] `npm run check`、`npm run build`、`npm run test` 在实现提交前通过。

## 构建影响

仅影响本地 API、SQLite 数据和本地工作台；GitHub Pages 继续只显示公开演示，不显示项目数据。
