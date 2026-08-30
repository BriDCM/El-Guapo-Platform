# WB-007 · GitHub-only El Guapo 工作台

## 目标

让 El Guapo 在 GitHub Pages 上运行，不再依赖 `localhost`、Cloudflare 或数据库服务。

## 验收条件

- [x] GitHub Pages 构建启用 GitHub-only 模式，而非公开演示或远程 API。
- [x] 未提供浏览器会话令牌时，页面不读取或显示真实项目数据。
- [x] 令牌只保存于 `sessionStorage`，不进入仓库、构建变量、日志或数据文件。
- [x] 项目、玩法、任务、资产与内容设计包均可通过 GitHub Contents API 读取与写入私有数据仓库。
- [x] 每次写入产生带描述的 Git 提交；数据冲突会返回错误而非静默覆盖。
- [x] 文档限制令牌为单一私有数据仓库的 `Contents: Read and write` 权限。
- [ ] 使用所有者创建的私有数据仓库和细粒度令牌，在 GitHub Pages 完成端到端手动验证。

## 影响

新增浏览器侧 GitHub 数据适配层；不创建外部数据库、不迁移本地 SQLite 数据，也不保存任何 Unity 源资产。
