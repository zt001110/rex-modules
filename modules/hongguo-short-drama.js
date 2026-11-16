WidgetMetadata = {
  id: "personal.mlitm.hongguo-short-drama",
  title: "红果短剧",
  version: "1.2.0",
  requiredVersion: "0.0.1",
  description: "红果真人短剧、漫剧和 AI 短剧的官方分类、榜单筛选、搜索和分集。请在全局参数填写自建 Worker 地址。",
  author: "桃子🍑",
  site: "https://github.com/zt001110/rex-modules",
  globalParams: [{ name: "workerUrl", title: "Worker 地址", type: "input", value: "" }],
  detailCacheDuration: 180,
  modules: [
    {
      id: "rankings",
      title: "红果",
      functionName: "loadRankings",
      cacheDuration: 120,
      params: hgBrowseParams()
    },
    { id: "loadResource", title: "红果播放", functionName: "loadResource", type: "stream", cacheDuration: 0, params: [] }
  ],
  search: {
    title: "搜索红果短剧",
    functionName: "search",
    params: [
      { name: "keyword", title: "剧名", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ]
  }
};

const HG_WORKER_KEY = "hongguo-short-drama:worker:v1";
const HG_COMIC_RECOMMENDED = "comic_series_hot_rank";
const HG_COMIC_POPULAR = "comic_series_hot_play";
const HG_MENUS = hgOfficialMenus();
const HG_CACHE_MS = 180000;
const HG_CACHE_KEY = "hongguo-short-drama:recent-season:v2";
const hgPending = new Map();
let hgRecent;

function hgId(value) {
  return typeof value === "string" && /^[1-9]\d{0,20}$/.test(value);
}

function hgPositive(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : 0;
}

function hgWorker(value) {
  const match = typeof value === "string" &&
    /^https:\/\/([a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)+)(?::(\d{1,5}))?\/?$/i.exec(value.trim());
  if (!match || (match[2] && (+match[2] < 1 || +match[2] > 65535))) return "";
  return "https://" + match[1].toLowerCase() + (match[2] ? ":" + match[2] : "");
}

function hgConfiguredWorker(value) {
  const worker = hgWorker(value);
  if (!worker) throw new Error("请在红果短剧的全局参数填写 HTTPS Worker 根地址");
  try { Widget.storage?.set(HG_WORKER_KEY, worker); } catch (_) {}
  return worker;
}

function hgSavedWorker() {
  try { return hgWorker(Widget.storage?.get(HG_WORKER_KEY)); } catch (_) { return ""; }
}

function hgRoute(value) {
  if (typeof value !== "string") return null;
  const [identity, encoded, extra] = value.split("@");
  if (extra !== undefined) return null;
  let worker = "";
  if (encoded !== undefined) {
    try { worker = hgWorker(decodeURIComponent(encoded)); } catch (_) { return null; }
    if (!worker) return null;
  }
  const season = /^mlitm-hongguo:series:([1-9]\d{0,20})$/.exec(identity);
  if (season) return { seriesId: season[1], worker };
  const episode = /^mlitm-hongguo:episode:([1-9]\d{0,20}):([1-9]\d{0,5}):([1-9]\d{0,20})$/.exec(identity);
  return episode ? { seriesId: episode[1], episode: Number(episode[2]), episodeId: episode[3], worker } : null;
}

// Rex requires synchronous enumeration metadata. The options below are from
// the official website routes and the account's /v1/rankings selector response.
function hgOfficialMenus() {
  return {
    channels: {
      human: ["真人剧", "real-drama", [["爱情", "romance"], ["年代", "period"], ["逆袭", "comeback"], ["传奇", "legend"], ["成长", "growth"], ["家庭", "family"], ["家族", "clan"], ["萌宝", "cute-kids"], ["悬疑", "suspense"], ["惊悚", "thriller"], ["恐怖", "horror"], ["志怪", "supernatural"], ["古装", "costume"], ["玄幻", "fantasy"], ["奇幻", "wonder"], ["都市", "urban"], ["青春", "youth"], ["喜剧", "comedy"], ["科幻", "sci-fi"], ["灾难", "disaster"], ["动作冒险", "action-adventure"], ["战争", "war"], ["综艺", "variety"], ["剧情", "drama"]]],
      comic: ["漫剧", "comic-drama", [["脑洞", "creative"], ["玄幻", "fantasy"], ["剧情", "drama"], ["末世", "apocalypse"], ["豪门", "wealthy-family"], ["奇幻", "wonder"], ["科幻", "sci-fi"], ["冒险", "adventure"]]],
      ai: ["AI剧", "ai-drama", [["脑洞", "creative"], ["玄幻", "fantasy"], ["剧情", "drama"], ["末世", "apocalypse"], ["豪门", "wealthy-family"], ["奇幻", "wonder"], ["科幻", "sci-fi"], ["冒险", "adventure"]]],
    },
    webRanks: {
      "hot-drama": "综合热播",
      "hot-real-drama": "真人热播",
      "hot-comic-drama": "漫剧热播",
      "hot-ai-drama": "AI 热播"
    },
    appRanks: {
      "comic_series_hot_rank": ["漫剧推荐榜", "comic_series_rank"],
      "comic_series_hot_play": ["漫剧热播榜", "comic_series_rank"],
      "comic_series_new_rank": ["漫剧新剧榜", "comic_series_rank"],
      "ai_playlet_hot_sc": ["AI剧推荐榜", "ai_playlet"],
      "ai_playlet_hot_play": ["AI剧热播榜", "ai_playlet"],
      "ai_playlet_new_rank": ["AI剧新剧榜", "ai_playlet"],
      "ai_playlet_hot_search": ["AI剧热搜榜", "ai_playlet"],
      "ai_playlet_must_watch": ["AI剧必看榜", "ai_playlet"],
      "ai_playlet_followed": ["AI剧收藏榜", "ai_playlet"],
      "human_hot_sc": ["真人剧推荐榜", "human"],
      "human_hot_play": ["真人剧热播榜", "human"],
      "human_new_rank": ["真人剧新剧榜", "human"],
      "human_hot_search": ["真人剧热搜榜", "human"],
      "human_must_watch": ["真人剧必看榜", "human"],
      "human_followed": ["真人剧收藏榜", "human"],
    },
    filters: [
      ["comic_general", "漫剧筛选 · 综合", ["comic_series_hot_rank", "comic_series_hot_play", "comic_series_new_rank"], [["总榜", "all"], ["女频", "gender_female"], ["男频", "gender_male"]]],
      ["comic_period", "漫剧筛选 · 时代背景", ["comic_series_hot_rank", "comic_series_hot_play"], [["不限", "all"], ["都市", "cate_1"], ["古代", "cate_758"], ["异界", "cate_599"], ["乡村", "cate_11"], ["年代", "cate_79"], ["架空", "cate_452"], ["职场", "cate_127"], ["校园", "cate_4"], ["民国", "cate_390"], ["多朝代", "cate_1402"]]],
      ["comic_plot", "漫剧筛选 · 主题情节", ["comic_series_hot_rank", "comic_series_hot_play"], [["不限", "all"], ["剧情", "cate_316"], ["脑洞", "cate_755"], ["玄幻", "cate_7"], ["种田", "cate_23"], ["豪门", "cate_936"], ["奇幻", "cate_6"], ["搞笑", "cate_425"], ["末世", "cate_68"], ["日常", "cate_768"], ["科幻", "cate_1092"], ["悬疑", "cate_10"], ["诡秘", "cate_1334"], ["冒险", "cate_1182"], ["合家欢", "cate_1333"], ["灾难", "cate_1183"], ["恐怖", "cate_314"]]],
      ["comic_character", "漫剧筛选 · 角色设定", ["comic_series_hot_rank", "comic_series_hot_play"], [["不限", "all"], ["逆袭", "cate_739"], ["穿越", "cate_37"], ["系统", "cate_19"], ["重生", "cate_36"], ["异能", "cate_598"], ["求生", "cate_379"], ["热血", "cate_530"], ["总裁", "cate_29"], ["反转", "cate_756"], ["囤物资", "cate_494"], ["娱乐圈", "cate_43"], ["升级流", "cate_830"], ["无厘头", "cate_1173"], ["无限流", "cate_70"], ["玩梗", "cate_1336"]]],
      ["comic_style", "漫剧筛选 · 画风", ["comic_series_hot_rank", "comic_series_hot_play"], [["不限", "all"], ["3d", "style_1685"], ["2d", "style_1683"], ["表情包", "style_1684"], ["编辑器", "style_1687"]]],
      ["comic_period_new", "漫剧筛选 · 时代背景", ["comic_series_new_rank"], [["不限", "all"], ["都市", "cate_1"], ["古代", "cate_758"], ["异界", "cate_599"], ["乡村", "cate_11"], ["年代", "cate_79"], ["校园", "cate_4"], ["职场", "cate_127"], ["架空", "cate_452"]]],
      ["comic_plot_new", "漫剧筛选 · 主题情节", ["comic_series_new_rank"], [["不限", "all"], ["剧情", "cate_316"], ["脑洞", "cate_755"], ["玄幻", "cate_7"], ["豪门", "cate_936"], ["种田", "cate_23"], ["搞笑", "cate_425"], ["奇幻", "cate_6"], ["日常", "cate_768"], ["末世", "cate_68"], ["诡秘", "cate_1334"]]],
      ["comic_character_new", "漫剧筛选 · 角色设定", ["comic_series_new_rank"], [["不限", "all"], ["逆袭", "cate_739"], ["穿越", "cate_37"], ["系统", "cate_19"], ["重生", "cate_36"], ["异能", "cate_598"], ["求生", "cate_379"], ["反转", "cate_756"], ["囤物资", "cate_494"], ["热血", "cate_530"]]],
      ["comic_style_new", "漫剧筛选 · 画风", ["comic_series_new_rank"], [["不限", "all"], ["3d", "style_1685"], ["2d", "style_1683"]]],
      ["humanGeneral", "真人筛选 · 综合", ["human_hot_sc", "human_hot_play", "human_new_rank"], [["总榜", "all"], ["女频", "gender_female"], ["男频", "gender_male"]]],
    ]
  };
}

function hgEnum(name, title, options, belongsTo) {
  const param = {
    name, title, type: "enumeration", value: options[0][1],
    enumOptions: options.map(([title, value]) => ({ title, value }))
  };
  if (belongsTo) param.belongTo = { paramName: "category", value: belongsTo };
  return param;
}

function hgBrowseParams() {
  const { channels, webRanks, appRanks, filters } = hgOfficialMenus();
  const category = [
    ...Object.entries(channels).map(([id, [title]]) => ["频道 · " + title, id]),
    ...channels.human[2].map(([title, slug]) => ["题材 · " + title, "topic:" + slug]),
    ...Object.entries(webRanks).map(([slug, title]) => ["榜单 · " + title, "web:" + slug]),
    ...Object.entries(appRanks).map(([rank, [title]]) => ["榜单 · " + title, "app:" + rank])
  ];
  const regularComicCategories = category.map(([, value]) => value)
    .filter(value => value !== "app:comic_series_new_rank");
  return [
    hgEnum("category", "分类", category),
    ...filters.map(([id, title, ranks, options]) => {
      const comic = id.startsWith("comic_");
      const visibleIn = id === "comic_general" ? undefined
        : comic && ranks.includes("comic_series_hot_rank") ? regularComicCategories
        : ranks.map(rank => "app:" + rank);
      const choices = comic ? [["总榜", "all"], ...options.slice(1)] : options;
      return hgEnum(id, title, choices, visibleIn);
    }),
    ...Object.entries(channels).map(([id, [title, , genres]]) =>
      hgEnum(id + "Topic", title + " · 题材", [["全部", "all"], ...genres], [id])
    ),
    { name: "page", title: "页码", type: "page" }
  ];
}

async function hgGet(path, base) {
  const response = await Widget.http.get(base + path, {
    headers: { Accept: "application/json" }
  });
  const status = response.status ?? response.statusCode ?? 200;
  if (status < 200 || status >= 300) throw new Error("红果接口 HTTP " + status);
  const data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
  if (!data || typeof data !== "object" || Array.isArray(data) || data.error) {
    throw new Error("红果接口未返回有效数据");
  }
  return data;
}

function hgSeriesItem(series, worker) {
  const id = "mlitm-hongguo:series:" + series.id;
  const link = id + "@" + encodeURIComponent(worker);
  const cover = /^https:\/\//i.test(series.cover || "") ? series.cover : undefined;
  const season = hgPositive(series.season) || 1;
  return {
    id, link, type: "url", mediaType: "tv", title: series.title,
    coverUrl: cover, posterPath: cover, description: series.description || "",
    season, seasonNumber: season
  };
}

async function hgList(path, base) {
  const data = await hgGet(path, base);
  if (!Array.isArray(data.items)) throw new Error("红果接口未返回列表");
  return data.items
    .filter(item => item && hgId(item.id) && typeof item.title === "string" && item.title.trim())
    .map(item => hgSeriesItem(item, base));
}

async function loadRankings(params = {}) {
  const worker = hgConfiguredWorker(params.workerUrl);
  const category = typeof params.category === "string" ? params.category : "human";
  const page = hgPositive(params.page) || 1;
  const suffix = "?page=" + page;
  const { channels, webRanks, appRanks, filters } = HG_MENUS;
  const selectedRank = category.startsWith("app:") ? category.slice(4) : "";
  if (selectedRank && !Object.hasOwn(appRanks, selectedRank)) return [];

  const comicRank = selectedRank && appRanks[selectedRank][1] === "comic_series_rank"
    ? selectedRank
    : category === "web:hot-comic-drama" ? HG_COMIC_POPULAR : HG_COMIC_RECOMMENDED;
  const comicFilters = hgSelectedFilters(filters, params, comicRank, true);
  if (comicFilters.length) return hgRankList(worker, comicRank, comicFilters, page);

  if (selectedRank) {
    return hgRankList(worker, selectedRank, hgSelectedFilters(filters, params, selectedRank, false), page);
  }

  if (category.startsWith("topic:")) {
    const slug = category.slice(6);
    if (!channels.human[2].some(([, value]) => value === slug)) return [];
    return hgList("/v1/official/category/real-drama/" + slug + suffix, worker);
  }
  if (category.startsWith("web:")) {
    const slug = category.slice(4);
    if (!Object.hasOwn(webRanks, slug)) return [];
    return hgList("/v1/official/rank/" + slug + suffix, worker);
  }
  const id = Object.hasOwn(channels, category) ? category : "human";
  const [, channel, genres] = channels[id];
  const topic = params[id + "Topic"];
  const path = "/v1/official/category/" + channel + (genres.some(([, slug]) => slug === topic) ? "/" + topic : "");
  return hgList(path + suffix, worker);
}

function hgSelectedFilters(filters, params, rank, comic) {
  return [...new Set(filters.flatMap(([id, , ranks, options]) => {
    if (id.startsWith("comic_") !== comic || !ranks.includes(rank)) return [];
    const value = params[id];
    return value && value !== "all" && options.some(([, option]) => option === value) ? [value] : [];
  }))];
}

function hgRankList(worker, rank, filters, page) {
  if (filters.length > 1) throw new Error("红果榜单一次支持一个筛选，请将其余筛选设为总榜");
  const [, group] = HG_MENUS.appRanks[rank];
  return hgList("/v1/rankings?group=" + group + "&rank=" + rank +
    (filters.length ? "&filter=" + encodeURIComponent(filters[0]) : "") + "&page=" + page, worker);
}

async function search(params = {}) {
  const keyword = typeof params.keyword === "string" ? params.keyword.trim() : "";
  if (!keyword) return [];
  const worker = hgConfiguredWorker(params.workerUrl);
  const results = await hgList("/v1/search?q=" + encodeURIComponent(keyword) + "&page=" + (hgPositive(params.page) || 1), worker);
  for (const item of results) {
    if (!item.posterPath) {
      const cover = worker + "/v1/cover/" + hgRoute(item.link).seriesId;
      item.coverUrl = cover;
      item.posterPath = cover;
    }
  }
  return results;
}

function hgReadRecent(worker, seriesId) {
  if (!hgRecent) {
    try {
      const stored = Widget.storage?.get(HG_CACHE_KEY);
      hgRecent = typeof stored === "string" ? JSON.parse(stored) : stored;
    } catch (_) {
      return null;
    }
  }
  const age = Date.now() - hgRecent?.savedAt;
  return hgRecent?.worker === worker && hgRecent?.data?.id === seriesId && age >= 0 && age < HG_CACHE_MS ? hgRecent.data : null;
}

async function hgSeason(worker, seriesId) {
  const key = worker + "/" + seriesId;
  if (hgPending.has(key)) return hgPending.get(key);
  const recent = hgReadRecent(worker, seriesId);
  if (recent) return recent;
  const request = (async () => {
    const data = await hgGet("/v1/series/" + seriesId + "?episodesOnly=1", worker);
    if (data.id !== seriesId || typeof data.title !== "string" || !Array.isArray(data.episodes)) {
      throw new Error("红果接口未返回对应分集");
    }
    const episodes = data.episodes
      .filter(ep => ep && hgId(ep.id) && hgPositive(ep.episode) && !ep.disabled)
      .map(ep => ({ id: ep.id, number: hgPositive(ep.episode), duration: hgPositive(ep.duration) }))
      .sort((a, b) => a.number - b.number);
    const season = {
      id: data.id, title: data.title, cover: data.cover, description: data.description,
      season: hgPositive(data.season) || 1, episodes
    };
    if (episodes.length) {
      hgRecent = { savedAt: Date.now(), worker, data: season };
      try { Widget.storage?.set(HG_CACHE_KEY, JSON.stringify(hgRecent)); } catch (_) {}
    }
    return season;
  })();
  hgPending.set(key, request);
  try {
    return await request;
  } finally {
    hgPending.delete(key);
  }
}

async function loadDetail(link) {
  const route = hgRoute(link);
  if (!route || route.episodeId) return null;
  const worker = hgSavedWorker() || route.worker;
  if (!worker) throw new Error("请填写 Worker 地址并重新打开列表");
  const data = await hgSeason(worker, route.seriesId);
  const series = hgSeriesItem(data, worker);
  series.selectedSeasonNumber = data.season;
  series.episodeItems = data.episodes.map(episode => {
    const id = "mlitm-hongguo:episode:" + data.id + ":" + episode.number + ":" + episode.id;
    const link = id + "@" + encodeURIComponent(worker);
    return {
      id, link, type: "url", mediaType: "tv", title: "第" + episode.number + "集",
      seriesName: data.title, coverUrl: series.coverUrl, season: data.season, seasonNumber: data.season,
      episode: episode.number, episodeNumber: episode.number, duration: episode.duration || undefined
    };
  });
  return series;
}

async function loadResource(params = {}) {
  const route = hgRoute(params.link ?? params.id);
  if (!route) return [];
  const worker = params.workerUrl ? hgConfiguredWorker(params.workerUrl) : hgSavedWorker() || route.worker;
  if (!worker) throw new Error("请先在全局参数填写 Worker 地址");
  const requestedEpisode = hgPositive(params.episode ?? params.episodeNumber);
  let episodeId = route.episodeId;
  if (episodeId && requestedEpisode && requestedEpisode !== route.episode) return [];
  if (!episodeId) {
    const data = await hgSeason(worker, route.seriesId);
    const requestedSeason = hgPositive(params.season ?? params.seasonNumber);
    if (requestedSeason && requestedSeason !== data.season) return [];
    const matches = data.episodes.filter(ep => ep.number === (requestedEpisode || 1));
    if (matches.length !== 1) return [];
    episodeId = matches[0].id;
  }
  return [{
    name: "红果", url: worker + "/v1/episodes/" + episodeId + "/stream", playerType: "app"
  }];
}
