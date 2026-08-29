# WB-005 · 本地工作台连接修复

## 目标

让 macOS 浏览器通过 `localhost:5173` 稳定访问本地运行的 El Guapo 工作台。

## 验收与验证

- [x] Vite 开发服务器显式监听 `127.0.0.1`，避免仅监听 IPv6 `::1` 时 IPv4 `localhost` 被拒绝。
- [x] API 继续只监听本机 `127.0.0.1:3001`，不向局域网暴露项目数据。
- [x] `curl http://127.0.0.1:3001/health` 返回健康状态。
- [x] `curl http://127.0.0.1:5173/` 及 `curl http://localhost:5173/` 均返回 El Guapo 页面。
- [x] `npm run check`、`npm run build`、`npm run test` 通过；尚无独立 UI 自动化测试，现有工作区测试命令已明确说明该限制。
- [x] README 记录启动方式和 `ERR_CONNECTION_REFUSED` 的处理方法。

## 影响

仅影响开发服务器绑定与本地启动说明；不改变数据库、项目数据、公开 GitHub Pages 或网络访问范围。
