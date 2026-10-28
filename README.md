# Rex 模块仓库说明

个人模块仓库：[zt001110/rex-modules](https://github.com/zt001110/rex-modules)。今后新做的 Rex 模块默认在这个仓库中保存、校验并发布，再由 Rex 模块控制面板从 GitHub Raw 地址导入。不要只把唯一一份模块留在控制面板里。

## 仓库当前内容

截至 2026-10-28，`main` 分支包含：

| 文件 | 用途 |
|---|---|
| `marvel-mcu-rex.js` | 漫威宇宙模块源码，含电影和电视剧列表；版本 `1.1.0`。 |
| `encrypted/marvel-mcu-rex.js` | 由 Rex 官方加密服务生成的导入文件。 |
| `peach-logo.png` | 模块使用的图片素材。 |
| `.github/workflows/encrypt-modules.yml` | 源码推送到 `main` 后自动生成或更新加密发布文件。 |
| `tools/encrypt-modules.mjs` | 调用 Rex 官方加密接口并检查返回格式。 |
| `README.md` | 本说明。 |

红果和爱奇艺目前不在这个 GitHub 仓库里。仓库内容以 GitHub `main` 分支的实际文件列表为准；新增或移除文件后应同步维护本表。

## 控制面板里的模块从哪里来

截至 2026-10-28，Rex 模块控制面板显示三个模块：

| 模块 | 当前来源 | 更新方式 |
|---|---|---|
| 漫威宇宙 | 本仓库的 `marvel-mcu-rex.js`，版本 `1.1.0`。 | 更新本仓库文件、递增版本并推送；在控制面板刷新来源。 |
| 红果漫剧 | `hongguo-rex-mlitm.mlitm.workers.dev`。这是部署在个人 Cloudflare 账号里的 Worker；面板通过它获取红果模块。模块元数据署名为“桃子🍑”，说明代码来源不是个人仓库原创。 | Worker 仍在提供模块/接口服务，不是无用资源。面板刷新只会重新读取这个 Worker 当前提供的内容；上游红果网站变化不会自动更新 Worker。需要先取得或修改兼容代码并部署 Worker，再刷新面板。 |
| 爱奇艺 | 外部仓库 `MakkaPakka518/Rex_Widget` 的 `iqiyi.js` Raw 地址。该文件是 `REXENC` 加密格式。 | 上游更新同一分支文件后，在控制面板对该模块执行“刷新”，面板才会重新拉取；不会随 GitHub 提交自动更新。加密文件的元数据无法从明文直接读取，所以面板不显示版本号不代表文件一定没有内部版本。 |

Cloudflare 的 `hongguo-rex-mlitm` 和 `rex-panel` 是两个不同 Worker：前者提供红果模块/接口，后者是模块控制面板。截图中的 Worker 清单不是 GitHub 模块清单；删除红果 Worker 会影响面板当前引用的红果来源或接口。

## GitHub 与控制面板的更新关系

控制面板“链接添加”时会从 URL 下载文件并保存一份，同时记住来源 URL。导入不是实时代理，也不会因为 GitHub 有新提交就立即改变面板里的副本。要更新：

1. 上游更新了文件，或我们修改了个人仓库中的模块。
2. 对个人维护的模块递增 `WidgetMetadata.version`，提交并推送到 `main`。
3. 在控制面板该模块的菜单中点“刷新”，从已保存的 Raw URL 重新拉取文件。
4. 确认面板显示的文件和版本；如 Rex 播放器仍使用缓存，再按播放器内的刷新/重新导入流程同步。

个人模块建议导入加密发布文件的 Raw URL：

```text
https://raw.githubusercontent.com/zt001110/rex-modules/main/encrypted/<文件名>.js
```

例如，漫威模块源码链接和加密导入链接分别是：

```text
源码：https://raw.githubusercontent.com/zt001110/rex-modules/main/marvel-mcu-rex.js
加密导入：https://raw.githubusercontent.com/zt001110/rex-modules/main/encrypted/marvel-mcu-rex.js
```

作者把模块放在外部仓库时，也可以导入其公开 Raw URL。刷新只会重新下载该 URL 对应的文件；网站或 API 本身变化不会自动修复模块代码。若上游更改文件路径或仓库权限，需先更新控制面板保存的来源地址。

## 以后新增个人模块

默认工作流程：

1. 在本仓库根目录新增 `<模块名>.js`，保持 `WidgetMetadata.id` 稳定且唯一。
2. 依据 Rex/ForwardWidget 约定实现列表、详情、搜索或媒体功能，并在本地做语法及针对性测试。
3. 发布更新时递增 `WidgetMetadata.version`；不要把密码、Cookie、Token 或 API 密钥写入公开仓库。
4. 把源码提交并推送到本仓库 `main`，在 README 的文件表补上新模块。
5. GitHub Actions 会调用 Rex 官方加密服务，为变更的根目录 `.js` 文件生成 `encrypted/<文件名>.js`，并把产物提交回 `main`。加密失败会让工作流失败，不会用明文代替密文。
6. 等加密工作流成功后，首次将 `encrypted/<文件名>.js` 的 Raw URL 添加到控制面板；以后更新时对现有条目点“刷新”。
7. 在 Rex 中刷新或重新导入，并用 Rex 内置模块测试确认真实运行结果。

仓库保留未加密源码，`encrypted/` 存放单独生成的加密产物；不要手工用密文覆盖源码。加密接口会接收源码，因此只提交本来就允许公开的代码，不要把密码、Cookie、Token 或 API 密钥放进模块。不要把未取得授权的第三方模块改名后当作原创发布；保留作者署名，并遵循上游许可。

## 本地检查

```bash
node --check marvel-mcu-rex.js
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
