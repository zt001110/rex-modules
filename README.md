# Rex 模块仓库说明

个人模块仓库：[zt001110/rex-modules](https://github.com/zt001110/rex-modules)。本机工作副本位于 `~/Library/Mobile Documents/com~apple~CloudDocs/Codex/Rex模块`。新做和维护的 Rex 模块都在这个仓库保存、校验和发布，再由 Rex 模块控制面板导入；不要只把唯一一份模块留在控制面板里。

## 仓库当前内容

截至 2026-10-28，`main` 分支包含：

| 文件 | 用途 |
|---|---|
| `modules/marvel-mcu-rex.js` | 漫威宇宙模块源码，含电影和电视剧列表；版本 `1.1.0`。以后个人模块源码统一放在 `modules/`。 |
| `encrypted/modules/marvel-mcu-rex.js` | 自动加密生成的控制面板导入文件。 |
| `peach-logo.png` | 模块使用的图片素材。 |
| `.github/workflows/encrypt-modules.yml` | 源码推送到 `main` 后自动生成或更新加密发布文件。 |
| `tools/encrypt-modules.mjs` | 调用 Rex 官方加密接口并检查返回格式。 |
| `README.md` | 本说明。 |

红果 Worker、控制面板 Worker 和爱奇艺模块都不在这个 GitHub 仓库里。模块源码及其加密导入件以 GitHub `main` 分支实际文件为准；新增或移除个人模块后同步维护本表。

## 仓库、Cloudflare 和控制面板

- **GitHub 模块仓库**：`zt001110/rex-modules`。个人 Rex 模块源码、GitHub Actions 加密流程和加密产物都在这里。
- **本机仓库目录**：`~/Library/Mobile Documents/com~apple~CloudDocs/Codex/Rex模块`。在 Codex 新窗口继续维护时，打开这个目录并先读本 README 和 `Rex模块开发` skill。
- **Cloudflare 部署**：登录 Cloudflare Dashboard，进入 **Workers & Pages**。`hongguo-rex-mlitm` 是红果 API/模块 Worker；`rex-panel` 是独立的模块控制面板 Worker。它们不是 `rex-modules` 仓库里的 GitHub Actions 部署。
- **红果自定义域名**：`https://hongguo-rex.tli.li`；模块脚本为 `/hongguo.js`，API 参数 `apiBase` 填域名根地址。Cloudflare 添加域名不会自动改写控制面板保存的脚本来源或 Rex 客户端参数。
- **Worker 源码位置**：当前 `rex-modules` 仓库不含这两个 Worker 的源码或 Wrangler 配置。改个人模块只需更新本仓库；要改 Worker 的 API/部署设置，则在 Cloudflare 的对应 Worker 中单独维护和部署，不能指望模块仓库的加密工作流替它发布。

## 作者控制面板项目的同步与更新监视

- **作者上游项目**：[MakkaPakka518/Rex-Widgets-Hub](https://github.com/MakkaPakka518/Rex-Widgets-Hub)。这是作者的 Rex 模块管理面板项目；本人的 `rex-panel` 是部署在 Cloudflare 上的独立实例。
- **最近核对记录**：2026-10-28 对照作者仓库 `main` 最新提交 `8b454497`（2026-10-09，登录限流从 KV 改为内存实现）。此前线上页面仍是旧版；本次已用作者 `main/index.js` 重新部署 `rex-panel`，Cloudflare 新版本 ID 为 `545a8fe7-94e5-425b-b7ef-92dcf38fcb3c`，并保留现有 `REX_KV`（命名空间 `rex-kv`）、Secrets 和自定义域名。后续应以监视提醒时的上游最新提交和线上版本重新核对，不要把这条记录当成永久最新状态。
- **自动监视**：Codex 中有一个名为“监视 Rex-Widgets-Hub 作者更新”的每日监视任务，检查作者仓库 `main` 是否出现新提交。没有新提交时不打扰；发现提交后会给出日期、标题和改动摘要，并提醒检查是否需要同步。
- **监视只负责提醒**：它不会自动拉取代码、修改 `rex-panel`、部署 Worker、改 KV 数据或替换管理员/公共用户设置。收到提醒后仍需先审查上游 diff，再决定是否升级。
- **本地实例补丁**：2026-10-28 在同步作者前端后，为 `rex-panel` 增加了“退出登录”按钮和 `/api/logout`，会清除管理员、订阅者、公共用户三类 Cookie；海报墙仍保留作者原来的 96 张图片填充和 eager 加载逻辑，没有为追求速度减少作者的视觉内容。
- **加载修复**：2026-10-28 又将前端认证改为单次 `/api/session` 请求，登录不再依次尝试三套接口；模块和合集并行读取；所有前端请求带 12 秒超时，避免某个接口卡住时整页无限等待。部署版本为 `383861fc-417b-4d3e-a754-d35ffd35a0b2`。
- **交互反馈修复**：2026-10-28 部署版本 `0506cf66-b382-458d-a1b1-a3dee8ecdbd4` 增加首屏认证状态、登录中动态进度条、登录成功提示、密码错误抖动提示、退出成功提示，并保留各项保存/导入/刷新操作的成功或失败 Toast。登录按钮在请求期间会锁定，避免重复提交。
- **认证兼容修复**：2026-10-28 部署版本 `1b947275-2a76-4379-8135-d1368fdcecc0` 将管理员登录同时兼容 KV 旧密码哈希和当前 `ADMIN_SECRET`，并缓存认证配置/订阅者列表 30 秒，减少错误密码、访客密码和订阅密码的等待；订阅者与公共用户设置页均加入退出按钮。

收到更新提醒后的处理步骤：

1. 打开提醒中的提交链接，检查 `index.js` 和 README 的部署说明，确认改动目的、所需绑定和环境变量；特别留意 KV 键结构、管理员登录/限流、订阅功能、API 路由和前端资源的变化。
2. 将新旧代码与线上 `rex-panel` 对照。确认需要升级后，先备份控制面板的数据；不要删除或重建现有 KV 命名空间。部署时保留 Cloudflare 当前 Worker 的 KV 绑定、环境变量/Secrets 和 `rexmodel.tli.li` 自定义域名配置。若上游要求变更这些项目，先评估迁移影响，不要覆盖现有设置。
3. 通过 Cloudflare Dashboard 的 **Workers & Pages → rex-panel → Edit code** 更新并部署代码。部署完成后检查自定义域名可访问、管理员可登录、模块列表与合集仍在，并测试模块导入/刷新等关键操作。
4. 验证通过后，把新的上游提交号、升级日期和实际验证结果补记到本节。若改动不适用于个人实例或风险不明确，暂不部署，先保留当前线上版本。

注意：`rex-panel` 目前独立部署，不是由 `rex-modules` 的 GitHub Actions 自动发布。更新个人 Rex 模块只需走本仓库的加密流程；更新控制面板后端则需要单独审查并在 Cloudflare 部署。

### 为什么界面和作者截图不同

作者截图中的“21 个模块 / 只读模块池”是作者实例的数据和订阅者模式，不会随 `index.js` 代码升级自动复制到个人 KV。管理员登录后的个人实例显示“独立模块管理”，只显示自己 KV 中已有的模块；当前个人库是 1 个漫威模块。要看到作者的模块，需要逐个导入其公开链接，或使用作者提供的合集订阅链接；不能直接复制作者 KV 数据。

如果页面偶尔打开很慢，先分别测试 `https://rex-panel.mlitm.workers.dev` 和 `https://rexmodel.tli.li`。Worker 原始域名响应正常而自定义域名卡住时，应检查 Cloudflare 自定义域名、DNS 和边缘连接；不要先删除海报墙或改动作者前端的图片数量。

截至 2026-10-28，红果 Worker 的旧 `workers.dev` 入口仍可访问。弃用该入口需要在 Cloudflare 的 `hongguo-rex-mlitm` Worker 设置里关闭 `workers.dev`；仅改文档、模块参数或添加自定义域名不会关闭它。

## 控制面板里的模块从哪里来

截至 2026-10-28，Rex 模块控制面板显示三个模块：

| 模块 | 当前来源 | 更新方式 |
|---|---|---|
| 漫威宇宙 | 本仓库的 `modules/marvel-mcu-rex.js`，版本 `1.1.0`。 | 更新源码、递增版本并推送；等待 Actions 加密成功后，在控制面板刷新来源。 |
| 红果漫剧 | 切换目标为 `https://hongguo-rex.tli.li/hongguo.js`；控制面板中已保存的旧来源仍需管理员登录后替换。模块元数据署名为“桃子🍑”，说明代码来源不是个人仓库原创。 | 新域名绑定到个人 Cloudflare 账号中的红果 Worker，提供模块和 API。上游红果网站变化不会自动更新 Worker；需要先取得或修改兼容代码并部署 Worker。 |
| 爱奇艺 | 外部仓库 `MakkaPakka518/Rex_Widget` 的 `iqiyi.js` Raw 地址。当前导入文件是 `REXENC` 加密格式。 | 上游更新同一分支文件后，在控制面板对该模块执行“刷新”，面板才会重新拉取；不会随 GitHub 提交自动更新。截图中该文件没有显示版本号，表示面板没有从这个文件识别出可显示的版本；不能据此判断它是否最新。 |

Cloudflare 的 `hongguo-rex-mlitm` 和 `rex-panel` 是两个不同 Worker：前者提供红果模块/接口，后者是模块控制面板。截图中的 Worker 清单不是 GitHub 模块清单；删除红果 Worker 会影响面板当前引用的红果来源和红果 API。

红果模块的 `apiBase` 参数应填写 API 根地址，不要加 `/v1` 或 `/api/v2`。目前推荐填写：

```text
https://hongguo-rex.tli.li
```

该自定义域名绑定到 `hongguo-rex-mlitm`，并已验证 `/health` 和 `/hongguo.js` 可用。红果模块来源及 Rex 客户端的 `apiBase` 都应切换为这个自定义域名；`apiBase` 不要加 `/v1` 或 `/api/v2`。Cloudflare 添加域名不会自动改写控制面板已保存的模块来源或客户端本地参数，需分别更新并保存。截至 2026-10-28，旧 `workers.dev` 入口仍可访问；要彻底弃用它，还需在 Cloudflare 的 Worker 设置中关闭 `workers.dev`。

## GitHub 与控制面板的更新关系

控制面板“链接添加”时会从 URL 下载文件并保存一份，同时记住来源 URL。导入不是实时代理，也不会因为作者在 GitHub 更新就自动改变面板里的副本。作者更新了**同一 Raw URL** 后，要在对应模块右侧 `…` 菜单点“刷新”，面板才会重新下载。若作者改了仓库、分支或文件路径，要先把面板保存的来源 URL 改成新链接，或删除旧条目后重新添加。

个人模块更新流程：

1. 修改 `modules/<模块名>.js`，保持 `WidgetMetadata.id` 稳定；有功能更新时递增 `WidgetMetadata.version`。
2. 提交并推送到 `main`。GitHub Actions 自动加密本次变动的模块，并把生成文件提交到仓库；不需要手动运行加密。
3. 确认 GitHub 仓库 **Actions → Encrypt Rex modules** 成功，且对应 `encrypted/modules/<模块名>.js` 已更新。
4. 在控制面板对应模块的 `…` 菜单点“刷新”，从已保存的 Raw URL 重新拉取。加密文件无法显示版本时，以源码的 `WidgetMetadata.version` 和 GitHub Actions 成功状态确认。
5. 若 Rex 客户端没有同步面板更新，再在 Rex 中刷新或重新导入并做实际运行检查。

个人模块建议导入加密发布文件的 Raw URL：

```text
https://raw.githubusercontent.com/zt001110/rex-modules/main/encrypted/modules/<文件名>.js
```

例如，漫威模块源码链接和加密导入链接分别是：

```text
源码：https://raw.githubusercontent.com/zt001110/rex-modules/main/modules/marvel-mcu-rex.js
加密导入：https://raw.githubusercontent.com/zt001110/rex-modules/main/encrypted/modules/marvel-mcu-rex.js
```

文件路径会映射到加密产物路径：`modules/foo.js` → `encrypted/modules/foo.js`。重命名或移动源码时，Actions 会删除旧密文并生成新路径的密文，不用手动改密文；但控制面板不会自动更改保存的 Raw URL，必须同步改成新路径。为避免这一步，尽量保持模块文件路径稳定。

作者把模块放在外部仓库时，也可以导入其公开 Raw URL。刷新只会重新下载该 URL 对应的文件；网站或 API 本身变化不会自动修复模块代码。若上游更改文件路径或仓库权限，需先更新控制面板保存的来源地址。

### 为什么爱奇艺没有版本号

截图里爱奇艺条目没有版本标签，而漫威和红果有。这个爱奇艺文件是外部作者发布的 `REXENC` 加密文件；控制面板当前没有从它识别出可展示的版本元数据。加密文件的显示能力取决于文件格式和元数据是否可识别，不能简单认为所有加密模块都没有版本。版本标签为空也不代表模块没有更新；需要按上面的步骤手动刷新来源。

## 以后新增个人模块

默认工作流程：

1. 在本仓库 `modules/` 新增 `<模块名>.js`，保持 `WidgetMetadata.id` 稳定且唯一。GitHub 网页端可进入 `modules/` 后选 **Add file → Create new file**，文件名写成 `modules/<模块名>.js`；本机/Codex 则直接在该目录新建。
2. 依据 Rex/ForwardWidget 约定实现列表、详情、搜索或媒体功能，并在本地做语法及针对性测试。
3. 发布更新时递增 `WidgetMetadata.version`；不要把密码、Cookie、Token 或 API 密钥写入公开仓库。
4. 把源码提交并推送到本仓库 `main`，在 README 的文件表补上新模块。
5. 推送到 `main` 后，GitHub Actions 会调用 Rex 官方加密服务，为变更的 `modules/*.js` 生成 `encrypted/modules/<文件名>.js`，并把产物提交回 `main`。加密失败会让工作流失败，不会用明文代替密文。
6. 等加密工作流成功后，首次把 `encrypted/modules/<文件名>.js` 的 Raw URL 添加到控制面板；以后同路径更新时对现有条目点“刷新”。
7. 在 Rex 中刷新或重新导入，并用 Rex 内置模块测试确认真实运行结果。

仓库保留未加密源码，`encrypted/` 存放单独生成的加密产物；不要手工用密文覆盖源码。加密接口会接收源码，因此只提交本来就允许公开的代码，不要把密码、Cookie、Token 或 API 密钥放进模块。不要把未取得授权的第三方模块改名后当作原创发布；保留作者署名，并遵循上游许可。

## 本地检查

```bash
node --check modules/marvel-mcu-rex.js
```

新模块也应运行对应文件的 `node --check` 和有针对性的本地测试。离线测试通过不代表 Rex 内实际导入、列表显示、详情或播放已经验证；交付时要分别说明验证范围。

## 开发约定

- `WidgetMetadata.id` 稳定且唯一；版本升级时递增 `version`，不要随意更换 ID。
- 普通列表处理器放在 `modules` 中，通过 `functionName` 连接处理函数；全局搜索使用顶层 `search` 配置。
- TMDB 项目使用正确的 `id` 和 `mediaType`；不要凭直觉改 `VideoItem` 字段名。
- 自定义详情使用 `type: "url"` 和顶层 `loadDetail(link)`；动态播放线路按 Rex 约定实现 `loadResource`。
- HTTP 请求使用 `Widget.http`；TMDB 请求使用 `Widget.tmdb`。两者返回结构不同，按模块开发 skill 中的说明读取。
- 播放资源必须校验模块来源和目标影片身份，不能把任意外部 `id` 直接拼成播放地址。

详细开发和测试约定见 Codex skill：`Rex模块开发`（内部调用名 `writing-forward-widgets`）。
