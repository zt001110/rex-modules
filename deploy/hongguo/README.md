# 红果短剧自建 Worker

这个 Worker 是 Rex 模块的统一入口。它直接读取红果官网频道、题材、热播榜和封面，并连接你自己的目录接口和播放模型 Worker。Rex 只填统一入口的 HTTPS 根地址。

## 部署

1. 在 `wrangler.jsonc` 将 `CATALOG_API` 改为自己的红果目录 API 根地址，将 `services[0].service` 改为同一 Cloudflare 账号内的播放模型 Worker 名称。
2. 在本目录运行 `npx wrangler deploy`。再运行 `npx wrangler secret put RELAY_KEY`，输入播放模型 Worker 的密钥。
3. 导入 [Rex 模块链接](https://raw.githubusercontent.com/zt001110/rex-modules/main/encrypted/modules/hongguo-short-drama.js)。在模块全局参数填写刚部署的 Worker 根地址，例如 `https://rex-hongguo.example.workers.dev`。密钥只存放在 Cloudflare。

## 上游接口

| 上游 | 所需接口 |
| --- | --- |
| 目录 API | `GET /v1/search?q=…&page=1` 和 `GET /v1/rankings?group=…&rank=…&page=1` 返回 `{ items: [{ id, title, cover, description, season }] }`。榜单可带 `filter`。 |
| 目录 API | `GET /v1/series/<剧集ID>?episodesOnly=1` 返回 `{ id, title, cover, description, season, episodes: [{ id, episode, duration, disabled }] }`。 |
| 播放模型 Worker | `POST /<RELAY_KEY>/play` 接收 `{ vids: ["分集ID"] }`，返回 `{ ok: true, models: { "<分集ID>": <播放模型> } }`。 |

目录和分集 ID 应保留为字符串。播放模型 Worker 只提供取流能力时，需要同时准备目录 API。此模板提供统一入口，目录 API 和播放模型 Worker 由部署者自行维护。
