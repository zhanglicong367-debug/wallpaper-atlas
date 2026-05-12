# Clash Atlas

一个可以直接部署到 GitHub Pages 的 Clash 免费订阅站点导航。

## 功能

- 打开页面后自动从 GitHub Search API 搜集公开 Clash 免费订阅相关仓库
- 每 10 分钟自动刷新，也可以手动点击“立即更新”
- 合并内置搜索入口和本地浏览器缓存
- 支持关键词搜索、分类筛选、今日更新和收藏
- 支持明暗主题切换

## 说明

本站只聚合公开 GitHub 项目入口，不托管、不检测、不转发代理节点。免费订阅经常失效，请进入对应仓库 README 查看最新说明，并自行确认使用合规性。

## 本地预览

直接用浏览器打开 `index.html` 即可。

## 部署到 GitHub Pages

1. 将 `index.html`、`styles.css`、`script.js` 和 `README.md` 上传到仓库。
2. 打开仓库 `Settings`。
3. 进入 `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`，保存。
