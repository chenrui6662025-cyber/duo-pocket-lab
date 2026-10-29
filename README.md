# Duo Pocket Lab

一个独立、无后端的口袋工具箱 PWA，适配 iPhone Safari 与主屏幕 Web App。

**交付状态：应用已完成并通过测试；用户已手动创建 Public 仓库，但当前 GitHub App 尚未获授这个新仓库的访问权限，实际推送返回 HTTP 403。Pages 尚未部署。** 预计站点路径是 `https://chenrui6662025-cyber.github.io/duo-pocket-lab/`，此地址目前返回 404，不是已上线站点。详见 [验证记录](VERIFICATION.md)。

## 功能

- 点击计数器：加一、减一、确认后清零，最多 999,999。
- 幸运骰子：Web Crypto 随机点数，拒绝采样避免取模偏差，保留最近 10 次结果。
- 专注计时器：5 / 25 / 45 分钟预设，自定义 1–180 分钟，暂停、继续、重置和完成次数。
- 按截止时间计算，刷新、锁屏或切换应用后返回时校准；完成次数不会在刷新时重复累计。
- 深色响应式界面，适配安全区域与横竖屏，支持键盘与减少动画偏好。
- Manifest、180 / 192 / 512 像素图标、maskable 图标、iOS 主屏幕独立窗口。
- Service Worker 完整预缓存，首次联网准备好后可以断网刷新和操作；按内容哈希更新缓存，有新版本时可手动更新。
- 本地保存，无服务器、账号、外部字体、统计脚本或第三方运行时依赖。

`iPhone Duo` 按用户设备称呼处理；界面不依赖某个未确认的硬件型号。测试使用 iPhone 尺寸与 WebKit 引擎，不能代替真机验收。

## 本地启动

需要 Node.js 22 或更新版本；上线验证脚本还需要 `curl`。

```sh
npm ci
npm run build
npm run preview
```

浏览器打开 `http://localhost:4173/duo-pocket-lab/`。预览路径故意与 GitHub Pages 的项目子路径一致。`npm run dev` 可直接使用源码，验证正式离线缓存时请使用 build + preview。

手机访问非 localhost 的普通 HTTP 地址不能启用 Service Worker；真机安装和离线验收请使用部署后的 HTTPS 站点。

## 测试

```sh
npm test
npm run build
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

逻辑测试覆盖状态校验、计数边界、计时恢复与完成幂等、随机数拒绝采样。浏览器测试覆盖保存与刷新、清零确认、点数呈现、计时控制、无存储权限降级、安装素材、320–1440px 布局，以及离线子路径刷新。

若环境已提供 Chromium，可以用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` 为该命令指定现有浏览器；GitHub Actions 会安装自己的 Chromium 与 WebKit。

## GitHub 权限与部署

用户已手动创建 `chenrui6662025-cyber/duo-pocket-lab`，不需要重新建仓。当前身份可以读取这个 Public 仓库，但实际 `git push` 返回 HTTP 403。`GET /user/installations/129148100/repositories` 确认该仓库不在当前 App 的授权列表中。

打开 [GitHub App 安装配置](https://github.com/settings/installations/129148100)，在 **Repository access → Only select repositories** 中加入 `duo-pocket-lab`，保留原有仓库选择并保存。当前 App 是 `chatgpt-codex-connector`，已获 Contents、Workflows、Actions 写权限；新仓库必须加入访问范围后才能实际使用这些权限。

这个 App 的权限列表中没有 Pages 管理权限，创建 Pages 的实际请求也返回 403；不应假设安装配置界面能自行增加 App 未申请的权限。代码推送后，在 [仓库 Pages 设置](https://github.com/chenrui6662025-cyber/duo-pocket-lab/settings/pages) 的 **Build and deployment → Source** 中选择 **GitHub Actions**。**不要把明文令牌写入文件、聊天或提交记录。**

在仓库授权完成后，从已有的本地项目目录运行：

若使用下载的交付 ZIP，它不包含 `.git`；先执行 `git init -b main`、`git add .` 和 `git commit -m "Initialize Duo Pocket Lab PWA"`，再执行下面的命令。本次云端工作目录已完成本地 Git 初始化与提交，无需重复。

```sh
# 当前云端工作目录已设置 origin；下载源码包的情况先添加此远程地址。
git remote -v
# git remote add origin https://github.com/chenrui6662025-cyber/duo-pocket-lab.git
git fetch origin
# 检查远程分支是否存在及其内容；当前首次检查为空仓库。
# 若远程后来已有提交，应先整合；不要强制推送覆盖用户修改。
git push -u origin main

# 接着在 GitHub 网页的 Settings → Pages 中选择 GitHub Actions。

# 如果初次 push 的运行早于 Pages 启用，再触发一次部署。
gh workflow run deploy.yml --repo chenrui6662025-cyber/duo-pocket-lab --ref main
gh run list --repo chenrui6662025-cyber/duo-pocket-lab --limit 5
```

如果 Pages 已启用，用 GitHub 网页 **Settings → Pages → Build and deployment → Source → GitHub Actions** 检查即可，不要重复创建。已有远程仓库的情况应先检查其内容，再推送，不要使用强制推送覆盖远程 README 或其他修改。

工作流 `.github/workflows/deploy.yml` 会在 `main` 推送时运行单元测试、构建、Chromium 手机/桌面与 WebKit iPhone 测试，成功后上传静态产物并用 OIDC 发布到 Pages。Pull Request 只测试，不部署。工作流不使用个人访问令牌，也不需要 npm 发布权限。

上线后运行：

```sh
gh run list --repo chenrui6662025-cyber/duo-pocket-lab --limit 5
npm run verify:live
```

核实工作流成功、仓库是 Public、Pages 配置为 Actions、站点及所有缓存资源返回 200；然后在真机验证离线刷新。构建成功或配置文件存在本身不等于部署成功。

## 在 iPhone Duo 上安装

以下步骤仅在站点成功部署后适用：

1. 用 **Safari** 打开部署完成的 HTTPS 网址。
2. 等待页面显示 **“离线已就绪”**。
3. 轻点 Safari 的**分享**按钮，选择**“添加到主屏幕”**；若出现**“作为网页 App 打开”**，将它开启。
4. 确认名称并轻点**“添加”**。从主屏幕图标重新打开一次，联网等待离线缓存准备好。
5. 先点击计数或掷骰子，再开启飞行模式，关闭并重新打开主屏幕 App，确认结果保留且仍可操作。

应用右上角也有安装说明。iOS 不提供网页直接调用“添加到主屏幕”的通用接口，需手动使用分享菜单。

## 数据与计时边界

- 状态保存在 `localStorage` 的 `duo-pocket-lab:v1` 键中。数据不上传、不跨设备同步；Safari 与主屏幕 Web App 的存储在不同 iOS 版本下可能隔离，请在主屏幕 App 内建立正式记录。
- 清除网站数据、浏览器自动回收存储或移除 App 可能丢失记录；存储被拒绝时会显示提示，当前会话仍可操作。
- 多个窗口同时操作时以最后一次写入为准；这不是多用户协作应用。
- iOS 会暂停后台脚本，不能保证在锁屏时响铃或弹出通知。计时器在返回前台时依据截止时间恢复，完成后显示提示。
- 不请求麦克风、定位、通知或账户权限。没有付费服务或后端密钥。

## 目录

```text
index.html                  页面与安装说明
src/app.js                  UI、本地保存、安装与更新
src/model.js                可测试的状态逻辑
src/styles.css              深色响应式样式
public/                     Manifest、Service Worker、图标
scripts/                    静态构建、预览、上线验证
tests/                      逻辑与 Playwright 浏览器测试
.github/workflows/          测试及 Pages 自动部署
```

项目仅在独立的 `/workspace/duo-pocket-lab` 目录开发，不依赖或修改任何途鱼业务仓库。
