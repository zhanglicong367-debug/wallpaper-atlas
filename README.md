# Wallpaper Atlas

一个可以直接部署到 GitHub Pages 的电脑壁纸自动搜集网站。

## 功能

- 启动后自动从 Wikimedia Commons 和 Picsum 搜集高清图片
- “继续搜集”按钮，可不断追加更多壁纸
- 高清壁纸网格
- 分类筛选和关键词搜索
- 收藏壁纸，本地浏览器保存
- 预览弹窗、打开原图、复制图片链接
- 明暗主题切换

## 本地预览

直接用浏览器打开 `index.html` 即可。

## 部署到 GitHub Pages

1. 在 GitHub 新建一个仓库。
2. 上传本目录里的 `index.html`、`styles.css`、`script.js` 和 `README.md`。
3. 进入仓库的 `Settings`。
4. 打开 `Pages`，选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`，保存。

发布完成后，GitHub 会给出一个 `https://用户名.github.io/仓库名/` 的访问地址。
