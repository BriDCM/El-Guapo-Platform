# WB-006 · 云端 El Guapo 工作台

## 目标

以 GitHub Pages + Cloudflare Worker/D1 + GitHub OAuth 取代日常使用中的 `localhost` 工作台入口。

## 验收条件

- [x] Worker 具有与本地工作台相同的项目、玩法、任务、资产和设计包核心 API。
- [x] D1 迁移仅保存元数据和审计记录，不保存 Unity 源资产或本地仓库文件。
- [x] GitHub OAuth 仅允许 `OWNER_GITHUB_LOGIN` 指定的账号，并签发短期浏览器会话。
- [x] 前端可通过 `VITE_API_BASE_URL` 使用远程 API，并在未登录时显示 GitHub 登录入口。
- [x] Pages 构建从 GitHub Actions 变量 `EL_GUAPO_API_URL` 注入 API 地址；未配置时仍可保留公开演示。
- [x] 配置、密钥与外部资源创建步骤已文档化，且没有任何真实秘密写入仓库。
- [ ] 在所有者创建 Cloudflare D1、Worker 和 GitHub OAuth 应用后，完成生产部署与手动登录验收。

## 影响

新增 `services/cloud-api/` 和 D1 数据库；保留本地 Fastify + SQLite 作为离线开发适配器。生产资源创建及本地数据导入均需要单独确认。
