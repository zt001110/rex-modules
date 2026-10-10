# Rex 模块开发起步

## 当前文件说明

| 文件 | 用途 |
|---|---|
| `marvel-mcu-rex.js` | 当前唯一启用的 MCU 电影模块，负责分类、排序和 TMDB 刮削。 |
| `rex-collection.json` | Rex 模块合集清单，后续新增模块时在 `widgets` 中继续添加。 |
| `README.md` | 中文使用说明、发布地址和后续维护方法。 |

当前仓库只保留 MCU 模块和合集清单；通用示例模板已经删除。

`rex-module-starter.js` 是一个最小的 Rex/ForwardWidget JavaScript 模块骨架。把它复制成自己的文件，替换 `WidgetMetadata` 和三个 `TODO` 区域即可开始。

如果你的目标是维护自己的电影/电视剧收藏，优先从 `rex-curated-library.js` 开始。它把分类和片目写在文件顶部，使用 TMDB ID 交给 Rex 自动补全详情。

第一份实际模块示例是 `marvel-mcu-rex.js`：它复刻了你截图中的多级选择和排序方式，通过 TMDB 的 Marvel Studios 电影库自动生成电影列表，并提供复仇者联盟、钢铁侠、美国队长等子系列筛选。

## 模块合集与自动刷新

`rex-collection.json` 是合集清单。以后新增 `mcu-series-rex.js`、`disney-rex.js` 等文件，只需在这个清单的 `widgets` 数组中增加一项。将合集地址导入 Rex 后，Rex 的“刷新”会重新读取清单和模块 URL。

当前发布仓库是 `zt001110/rex-modules`。Rex 推荐导入 GitHub Pages 的标准 JSON 地址：`https://zt001110.github.io/rex-modules/rex-collection.json`。模块升级时同时递增对应的 `version`，避免客户端继续使用旧缓存。

## 本地校验

```bash
node --check rex-module-starter.js
```

仓库中的 ForwardWidgets 项目还提供脚手架：

```bash
git clone https://github.com/InchStudio/ForwardWidgets.git
cd ForwardWidgets
node scaffold/create-widget.js --id com.example.rex.demo --title "我的 Rex 模块" --output widgets
```

## 导入 Rex

1. 将 `.js` 文件放在一个可通过 HTTPS 访问的地址，或直接保存到手机/电脑。
2. 在 Rex 的模块管理/模块导入处选择本地文件，或粘贴远程 `.js` / `.fwd` 订阅链接。
3. 导入后刷新模块；用内置模块测试工具检查请求、参数和返回数据。

如果要分享多个模块，可以使用 `InchStudio/forward-widget-hub` 自托管模块仓库，它能托管 `.js` / `.fwd` 并生成订阅链接。

## 关键约定

- `WidgetMetadata.id` 必须稳定且唯一；升级只改 `version`。
- 普通列表模块放在 `modules` 中，处理函数通过 `functionName` 关联。
- 列表项至少返回 `id`、`type`、`title`；`type` 常用 `url`、`tmdb`、`douban`、`imdb`。
- `type: "url"` 的项目可用顶层 `loadDetail(link)` 补充详情、剧集和 `videoUrl`。
- 自定义片单推荐使用 `type: "tmdb"`：电影 ID 写成 `movie.数字`，剧集 ID 写成 `tv.数字`。Rex 会根据 TMDB ID 自动补全海报、简介、演员、评分和剧集信息。
- `LIBRARY` 中的 `title` 适合做片单中的显示名称；如果必须覆盖详情页里的官方片名，则改用 `type: "url"` 并自己实现 `loadDetail`。
- 临时签名、直播线路或多线路播放应增加 `id: "loadResource"`、`type: "stream"` 的模块，在播放时返回 `{name, url, customHeaders, playerType}`。
- `Widget.http.get/post` 负责请求，`Widget.html.load` 或 `Widget.dom.parse/select` 负责 HTML 解析；可用 `Widget.storage` 做脚本私有缓存。

## 加密与发布

Rex 官方加密页：<https://rexnow.tv/encrypt/>。它要求源码中存在唯一的顶层 `WidgetMetadata`，可编辑模块信息后生成 Rex 可用的加密文件。源码会上传到服务端处理，因此保留未加密备份，且不要把密码、Cookie 或 API 密钥写进模块。
