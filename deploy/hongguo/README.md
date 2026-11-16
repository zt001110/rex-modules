# 红果短剧自建 Worker

这个 Worker 是 Rex 模块的统一入口。它直接读取红果官网频道、题材、热播榜和封面，并连接你自己的目录接口和播放模型 Worker。Rex 填统一入口的 `HTTPS 根地址/访问密钥`。

## 部署

1. 在 `wrangler.jsonc` 将 `CATALOG_API` 改为自己的红果目录 API 根地址，将 `services[0].service` 改为同一 Cloudflare 账号内的播放模型 Worker 名称。
2. 在本目录运行 `npx wrangler deploy`。再运行 `npx wrangler secret put RELAY_KEY`，输入播放模型 Worker 的密钥。运行 `npx wrangler secret put ACCESS_KEY`，设置 Rex 访问统一入口用的独立密钥。可用 `openssl rand -hex 32` 生成。
3. 导入 [Rex 模块链接](https://raw.githubusercontent.com/zt001110/rex-modules/main/encrypted/modules/hongguo-short-drama.js)。在模块全局参数填写 `https://你的Worker/访问密钥`，斜杠后填 `ACCESS_KEY`。已有模块刷新后，也需更新原先只填根域名的配置。

`ACCESS_KEY` 保护频道、榜单、搜索、封面、分集和媒体接口。部署后以 `/v1/search` 测试，省略路径密钥或填写错误密钥都会收到 HTTP 401。`RELAY_KEY` 只供 Worker 调用播放模型接口。

## 上游接口

| 上游 | 所需接口 |
| --- | --- |
| 目录 API | `GET /v1/search?q=…&page=1` 和 `GET /v1/rankings?group=…&rank=…&page=1` 返回 `{ items: [{ id, title, cover, description, season }] }`。榜单可带 `filter`。 |
| 目录 API | `GET /v1/series/<剧集ID>?episodesOnly=1` 返回 `{ id, title, cover, description, season, episodes: [{ id, episode, duration, disabled }] }`。 |
| 目录 API | `GET /v1/series/<剧集ID>` 返回当前季详情、`complete: true` 和完整的 `seasons: [{ id, season, episodeCount, available }]`。已上线季度使用实际 ID，已公布但未上线的季度用 `{ id: null, season, available: false }`。如提供 `availableSeasonCount` 和 `announcedSeasonCount`，模块会核对目录数量。 |
| 播放模型 Worker | `POST /<RELAY_KEY>/play` 接收 `{ vids: ["分集ID"] }`，返回 `{ ok: true, models: { "<分集ID>": <播放模型> } }`。 |

目录和分集 ID 应保留为字符串。播放模型 Worker 只提供取流能力时，需要同时准备目录 API。此模板提供统一入口，目录 API 和播放模型 Worker 由部署者自行维护。
