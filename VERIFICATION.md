# 交付验证记录

日期：2026-10-29（UTC）。项目目录：`/workspace/duo-pocket-lab`。

## GitHub 与网络检查

| 检查 | 实测结果 |
| --- | --- |
| 云端环境 | 就绪；HTTP 网络策略 unrestricted 且 enforced |
| GitHub 身份 | `chenrui6662025-cyber`；通过 `gh api user` 验证 |
| GitHub / REST API / npm | HTTPS 请求均返回 200 |
| Playwright 下载网络 | WebKit 与 FFmpeg 成功下载 |
| 新仓库检查 | `GET /repos/chenrui6662025-cyber/duo-pocket-lab` 返回 404 |
| 创建 Public 仓库并初始化 README | `POST /user/repos`，`name=duo-pocket-lab`、`private=false`、`auto_init=true`；返回 403 `Resource not accessible by integration` |
| Pages 配置读取 | 目标仓库 `/pages` API 返回 404；尚无法验证 Pages 管理权限 |
| 预期站点 | `https://chenrui6662025-cyber.github.io/duo-pocket-lab/` 实测 HTTP 404 |
| 自动化上线核验 | `npm run verify:live` 退出码 1，明确报告仓库 API 404、部署未通过验证 |

结论：当前集成没有完成创建个人仓库所需的授权；本次没有成功创建远程仓库、推送代码或发布 Pages，不能宣称站点可访问。GitHub Actions 配置已写好，但尚未在 GitHub 上执行。没有读取、索取或写入明文访问令牌。

解除阻碍的方式：通过 GitHub 官方授权界面赋予当前连接创建个人仓库能力；或者在 GitHub 网页手动建立目标 Public 仓库（可勾选 README），将它加入连接的授权范围。后续还需能够写入该仓库的代码与工作流、管理 Pages，并读取/触发 Actions。若集成本身不提供创建或 Pages 管理能力，需在 GitHub 网页操作，不能仅靠聊天中的同意扩大其技术权限。

## 本地功能与构建验证

最后一次完整验证：

```text
npm ci                           成功
npm test                         11 passed, 0 failed, 0 skipped
npm run build                    成功；内容缓存版本 b1e17a65f3d206c3
npm run test:e2e                  27 passed, 0 failed, 0 skipped
  chromium-mobile                 9 passed
  webkit-iphone                   9 passed
  chromium-desktop                9 passed
```

构建在 `/duo-pocket-lab/` 子路径预览，浏览器检查覆盖：

- 点击计数、本地持久化、刷新恢复、清零确认、零边界。
- 骰子点数与可见骰点一致、历史记录、刷新后保留。
- 自定义计时、暂停期间不扣时、刷新恢复、继续与重置。
- 保存的到期计时器恢复后只累计一次完成次数。
- 损坏存储恢复、存储写入被拒绝时继续工作并显示提示。
- iPhone 安装说明、Manifest 及所有 PNG 图标的可访问性。
- 320、375、390、430、768、1024、1440 像素宽度没有横向溢出。
- Service Worker 控制页面后，断网并重新加载子路径，三个工具继续工作。
- 页面无未捕获 JavaScript 错误。

11 个模型测试还覆盖了最大计数、数据校验、截止时间与暂停/恢复边界、完成幂等、拒绝采样与历史记录截断。

测试环境：Node.js 24.19.0、Playwright 1.64.1、系统 Chromium 与 Playwright WebKit 27.2；CI 配置使用 Node.js 22，并安装对应 Playwright Chromium/WebKit。

云端没有 root 包安装权限，WebKit 所需的 Debian 共享库在 `/tmp/duo-browser-libs` 下载并链接到用户拥有的 Playwright 浏览器缓存中。启动测试时使用 `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1` 只跳过依赖全局 `ldconfig` 的系统库预检查，**未跳过任何应用测试**；WebKit 确实启动并运行全部 9 项用例。此本机适配不属于项目代码，也没有写入 GitHub Actions 工作流。

已人工查看 390px 手机宽度与 1440px 桌面截图，未见裁切或横向溢出。此处是浏览器引擎及尺寸模拟，尚未进行 iPhone 真机主屏幕安装验收。

## 范围与剩余验收

所有源码、构建配置和本地 Git 写入均在独立项目目录；没有访问或改动途鱼业务仓库。交付 ZIP 包含源码、README、工作流、测试和构建好的 `dist/`，不包含 `.git`、凭据、`node_modules`、测试运行缓存或云端浏览器库。

授权完成后仍需：创建/确认 Public 仓库、推送代码、将 Pages Source 设置为 GitHub Actions、观察工作流部署成功、运行 `npm run verify:live`，并在 iPhone 上完成安装与飞行模式重启验收。安装步骤见 README。
