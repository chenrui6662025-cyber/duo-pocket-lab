# 交付验证记录

最近检查日期：2026-10-30（UTC）。项目目录：`/workspace/duo-pocket-lab`。

## 最终上线验证：成功

- 正式网址：**https://chenrui6662025-cyber.github.io/duo-pocket-lab/**，实际 HTTPS GET 返回 200；HTTPS 已强制启用。
- 用户在仓库设置中将 Pages Source 设为 GitHub Actions 后，读取到 `build_type=workflow` 与正确的 `html_url`。
- [工作流 41007197251](https://github.com/chenrui6662025-cyber/duo-pocket-lab/actions/runs/41007197251) 的第二次尝试已完成，结论为 **success**；Configure Pages 和 Deploy to GitHub Pages 均成功。只重跑失败的部署任务，沿用第一次运行通过的测试、构建和 artifact。
- 云端构建验证：11 项模型测试、27 项 Chromium/WebKit 浏览器测试全部通过；构建缓存版本为 `b1e17a65f3d206c3`，正式站点的 `sw.js` 中版本完全一致。
- 仓库脚本 `npm run verify:live` 已对正式站点成功运行，核验 Public 仓库、成功工作流、Pages Actions 配置、HTTPS HTML、Manifest 和离线资源。
- 在一个全新、独立的 Chromium 浏览器上下文中，以 iPhone 13 的尺寸和触屏配置访问正式站点，完成以下线上交互核验，所有断言通过且没有未捕获 JavaScript 错误：
  - 首页返回 200，Service Worker 实际控制 `https://chenrui6662025-cyber.github.io/duo-pocket-lab/` 范围，页面显示“离线已就绪”。
  - Manifest 为 standalone，start_url/scope 为相对 `./`；JS、CSS、Service Worker、180/192/512/maskable PNG 图标均实际返回 200。
  - 计数器加一、减一，刷新后保留计数。
  - 骰子点数与实际可见骰点一致；刷新后保留结果与历史。
  - 计时器启动、暂停、继续、刷新恢复、完成后只累计一次；时长推进采用 Playwright 受控浏览器时钟进行验证。
  - 浏览器断网后重新加载正式 URL，页面显示“离线使用中”，计数、骰子、计时器三个工具仍然可以操作。
- 本次恢复部署未改动任何应用源代码，最终文档以 `[skip ci]` 提交记录结果，不触发与应用产物无关的重复测试。自动部署工作流保留正常 `main` 代码推送触发行为。
- 尚未替用户进行真实 iPhone 硬件上的主屏幕安装操作；安装方法见 README。iOS 锁屏后台无法保证响铃的限制仍然适用。

下文保留此前的权限和 Pages 未启用问题作为历史记录；这些阻碍现已解除，不能将历史 403/404 当作当前部署状态。

## 仓库授权保存后的检查

- 用户保存仓库授权后，安装 `129148100` 的仓库列表已包含 `duo-pocket-lab`。
- 实际 `git push -u origin main` 成功，完整源码、PWA 配置、README 与 `.github/workflows/deploy.yml` 已写入 Public 仓库。业务代码沿用已通过测试的原始提交，没有重新开发。
- 工作流运行：[41007197251](https://github.com/chenrui6662025-cyber/duo-pocket-lab/actions/runs/41007197251)。`test-build` 成功，涵盖 npm ci、11 项模型测试、静态构建、27 项 Chromium/WebKit 浏览器测试和 Pages artifact 上传。
- `deploy` 在 Configure Pages 步骤失败：仓库的 Pages 尚未启用。读取 Pages 返回 404，尝试创建 Pages 返回 403 `Resource not accessible by integration`。App 授权列表中没有 Pages 管理权限。
- 按 Browser 技能检查后，本会话没有可用的浏览器控制工具，无法代替用户在 GitHub 网页中点选设置。需要在 [Pages 设置](https://github.com/chenrui6662025-cyber/duo-pocket-lab/settings/pages) 把 Build and deployment → Source 设为 GitHub Actions。
- 预计站点在独立 Chromium 浏览器中实测 HTTP 404，标题为 Site not found · GitHub Pages。因此尚未宣称上线或完成线上功能验收；设置生效后可只重跑失败的 deploy 任务，复用通过测试的同一发布产物。

## 用户手动创建仓库后的继续检查

- 仓库 `chenrui6662025-cyber/duo-pocket-lab` 已存在且为 Public；初次 fetch 成功，但仓库没有任何 refs，是空仓库。
- 继续使用原有已测试提交 `63088bdc8b655dc378d732a665342e9f9603ed66`，未重新开发或重复运行已通过的功能测试。
- GitHub 仓库元数据的 `permissions.push/admin` 为 true；但使用当前集成凭据的实际 `git push -u origin main` 返回 HTTP 403，代码与工作流未推送成功。
- 当前安装为 `chatgpt-codex-connector`，安装 ID `129148100`，`repository_selection=selected`。其权限包含 Contents、Workflows、Actions 写，但 `GET /user/installations/129148100/repositories` 的目标仓库筛选结果为空，确认新仓库未加入授权范围。
- 需要在 `https://github.com/settings/installations/129148100` 的 Repository access 中加入 `duo-pocket-lab` 并保存，保留原有选择。不能凭仓库元数据中 push/admin=true 推断集成可以写入。
- Pages 配置读取返回 404；实际 `POST /repos/chenrui6662025-cyber/duo-pocket-lab/pages`（`build_type=workflow`）返回 403 `Resource not accessible by integration`，App 权限列表没有 Pages。代码推送后需在 `https://github.com/chenrui6662025-cyber/duo-pocket-lab/settings/pages` 手动将 Source 设为 GitHub Actions。
- 目前 Actions 运行列表为空；预期站点仍返回 HTTP 404，没有完成线上功能与离线缓存验收。先前本地测试结果继续保留在下方，不冒充线上测试。

下面是首次交付时的历史验证记录。

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
