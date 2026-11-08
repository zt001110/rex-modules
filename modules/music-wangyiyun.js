WidgetMetadata = {
  id: "mlitm.netease.account",
  title: "网易云音乐 · 我的音乐",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  description: "Cookie 登录账号，读取个人歌单、喜欢的音乐与私人 FM，按账号权限在线播放。",
  author: "mlitm",
  site: "https://music.163.com",
  detailCacheDuration: 0,
  globalParams: [
    { name: "cookie", title: "网易云 Cookie（可只填 MUSIC_U 值）", type: "input" },
    { name: "quality", title: "播放音质", type: "enumeration", value: "standard", enumOptions: [
      { title: "标准", value: "standard" },
      { title: "极高", value: "exhigh" },
      { title: "无损（账号需有权限）", value: "lossless" }
    ] }
  ],
  modules: [
    { id: "account", title: "账号状态", functionName: "loadAccount", cacheDuration: 0, params: [
      { name: "action", title: "账号操作", type: "enumeration", value: "status", enumOptions: [
        { title: "检查登录", value: "status" }, { title: "清除本模块登录缓存", value: "clear" }
      ] }
    ] },
    { id: "playlists", title: "我的歌单", functionName: "loadMyPlaylists", cacheDuration: 0, params: [
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "liked", title: "我喜欢的音乐", functionName: "loadLiked", cacheDuration: 0, params: [
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "fm", title: "私人 FM", functionName: "loadPersonalFM", cacheDuration: 0, params: [] },
    { id: "playlist", title: "打开歌单", functionName: "loadPlaylist", cacheDuration: 0, params: [
      { name: "playlistId", title: "网易云歌单 ID", type: "input" },
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "loadResource", title: "网易云账号播放", functionName: "loadResource", type: "stream", cacheDuration: 0, params: [] }
  ],
  search: { title: "搜索网易云歌曲", functionName: "search", params: [
    { name: "keyword", title: "关键词", type: "input" },
    { name: "page", title: "页码", type: "page" }
  ] }
};

var NCM_SITE = "https://music.163.com";
var NCM_STORAGE = "ncm.account.v1";
var NCM_PAGE = 100;

function ncmRead() {
  var raw = Widget.storage.get(NCM_STORAGE);
  if (!raw) return {};
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch (_) { return {}; }
}

function ncmConfig(params) {
  var p = params || {}, config = ncmRead();
  if (Object.prototype.hasOwnProperty.call(p, "cookie")) {
    var cookie = String(p.cookie || "").trim().replace(/^Cookie:\s*/i, "");
    if (/[\r\n]/.test(cookie)) ncmFail("Cookie 需为单行请求头内容");
    if (/^[0-9a-f]{64,}$/i.test(cookie)) cookie = "MUSIC_U=" + cookie;
    if (cookie && !/(?:^|;\s*)MUSIC_U=[^;\s]+/.test(cookie)) {
      ncmFail("Cookie 中没有 MUSIC_U，请复制登录后的完整 Cookie 请求头");
    }
    config = { cookie: cookie, quality: config.quality || "standard" };
  }
  if (["standard", "exhigh", "lossless"].indexOf(p.quality) >= 0) config.quality = p.quality;
  Widget.storage.set(NCM_STORAGE, JSON.stringify(config));
  return config;
}

async function ncmGuard(work) {
  try { return await work(); }
  catch (error) {
    // Native HTTP errors can include request headers, so never log their raw text.
    if (error && error.ncmSafe) throw error;
    throw new Error("网易云请求失败，请检查网络、Cookie 或稍后重试");
  }
}

function ncmFail(message) {
  var error = new Error(message);
  error.ncmSafe = true;
  throw error;
}

async function ncmApi(path, query, config) {
  config = config || ncmRead();
  var headers = { Referer: NCM_SITE + "/", "User-Agent": "Mozilla/5.0" };
  if (config.cookie) headers.Cookie = config.cookie;
  var params = Object.assign({}, query || {}, { _t: Date.now() });
  var csrf = /(?:^|;\s*)__csrf=([^;]*)/.exec(config.cookie || "");
  if (csrf) params.csrf_token = csrf[1];
  var response = await Widget.http.get(NCM_SITE + "/api" + path, {
    headers: headers, params: params, timeout: 15
  });
  var status = Number(response.statusCode || response.status || 200);
  if (status >= 400) ncmFail("网易云 HTTP " + status + "，请检查网络或稍后重试");
  var data = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
  if (!data || typeof data !== "object") ncmFail("网易云返回了无效数据");
  if (Number(data.code) === 301 || Number(data.code) === 302) ncmFail("网易云登录已失效，请更新 Cookie");
  if (data.code != null && Number(data.code) !== 200) ncmFail("网易云接口返回 " + Number(data.code) + "，请检查登录状态或稍后重试");
  return data;
}

async function ncmProfile(config) {
  if (!config.cookie) ncmFail("请先在模块全局参数填写网易云 Cookie");
  var data = await ncmApi("/nuser/account/get", {}, config);
  if (!data.profile || !ncmId(data.profile.userId)) ncmFail("网易云未识别登录账号，请更新 Cookie");
  return data.profile;
}

function ncmId(value) { return /^[1-9]\d*$/.test(String(value || "")); }
function ncmPage(p) {
  var page = Number((p || {}).page || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) ncmFail("页码无效");
  return page;
}
function ncmCover(url) { return String(url || "").replace(/^http:/, "https:"); }
function ncmLink(raw) {
  var match = /^ncm:(song|playlist):([1-9]\d*)(?::(0|[1-9]\d*))?$/.exec(String(raw || ""));
  if (!match || (match[1] === "song" && match[3] != null)) return null;
  var offset = Number(match[3] || 0);
  if (!Number.isSafeInteger(offset) || offset > 10000000) return null;
  return { kind: match[1], id: match[2], offset: offset };
}
function ncmSong(song) {
  var artists = song.ar || song.artists || [], album = song.al || song.album || {};
  var cover = ncmCover(album.picUrl), key = "ncm:song:" + song.id;
  return {
    id: key, link: key, type: "url", mediaType: "movie", title: song.name || "歌曲 " + song.id,
    coverUrl: cover, posterPath: cover, backdropPath: cover,
    description: [artists.map(function (a) { return a.name; }).join(" / "), album.name].filter(Boolean).join(" · "),
    duration: Math.round(Number(song.dt || song.duration || 0) / 1000), playerType: "app"
  };
}
function ncmPlaylist(list, offset) {
  var key = "ncm:playlist:" + list.id + (offset ? ":" + offset : "");
  var cover = ncmCover(list.coverImgUrl || list.picUrl);
  return {
    id: key, link: key, type: "url", mediaType: "tv", title: list.name || "歌单 " + list.id,
    coverUrl: cover, posterPath: cover, backdropPath: cover,
    description: list.description || [list.creator && list.creator.nickname, Number(list.trackCount || 0) + " 首"].filter(Boolean).join(" · ")
  };
}
async function ncmSongs(ids, config) {
  if (!ids.length) return [];
  var data = await ncmApi("/v3/song/detail", {
    c: JSON.stringify(ids.map(function (id) { return { id: String(id) }; }))
  }, config);
  var byId = {};
  (data.songs || []).forEach(function (song) { if (ncmId(song.id)) byId[String(song.id)] = song; });
  return ids.map(function (id) { return byId[String(id)]; }).filter(Boolean).map(ncmSong);
}

async function loadAccount(params) {
  return ncmGuard(async function () {
    if ((params || {}).action === "clear") {
      Widget.storage.remove(NCM_STORAGE);
      return [{ id: "ncm:status", type: "url", title: "本模块登录缓存已清除", description: "请同时清空模块全局参数中的 Cookie。" }];
    }
    var profile = await ncmProfile(ncmConfig(params));
    return [{ id: "ncm:status", type: "url", title: "已登录 · " + profile.nickname,
      coverUrl: ncmCover(profile.avatarUrl), description: "网易云 UID：" + profile.userId }];
  });
}

async function loadMyPlaylists(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), profile = await ncmProfile(config);
    var data = await ncmApi("/user/playlist", { uid: profile.userId, limit: 30, offset: (ncmPage(params) - 1) * 30, includeVideo: false }, config);
    return (data.playlist || []).filter(function (p) { return ncmId(p.id); }).map(function (p) { return ncmPlaylist(p); });
  });
}

async function loadLiked(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), profile = await ncmProfile(config);
    var data = await ncmApi("/song/like/get", { uid: profile.userId }, config);
    if (!Array.isArray(data.ids)) ncmFail("网易云未返回喜欢的歌曲列表，请检查登录状态");
    var offset = (ncmPage(params) - 1) * NCM_PAGE;
    return ncmSongs(data.ids.filter(ncmId).slice(offset, offset + NCM_PAGE), config);
  });
}

async function loadPersonalFM(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params);
    await ncmProfile(config);
    var data = await ncmApi("/v1/radio/get", { limit: 3 }, config);
    var songs = (data.data || []).filter(function (s) { return ncmId(s.id); });
    if (!songs.length) ncmFail("私人 FM 暂未返回推荐歌曲，请稍后刷新");
    return songs.map(ncmSong);
  });
}

async function ncmPlaylistDetail(route, config) {
  var data = await ncmApi("/v6/playlist/detail", { id: route.id, n: NCM_PAGE }, config);
  var list = data.playlist;
  if (!list || String(list.id) !== route.id) ncmFail("歌单不存在或账号没有访问权限");
  var ids = (list.trackIds || []).map(function (t) { return t.id; }).filter(ncmId);
  // Some playlist responses only include tracks; never silently truncate a known larger list.
  if (!ids.length && list.tracks && list.tracks.length) {
    if (Number(list.trackCount) > list.tracks.length) ncmFail("网易云未返回完整歌单索引，请稍后重试");
    ids = list.tracks.map(function (s) { return s.id; }).filter(ncmId);
  }
  var item = ncmPlaylist(list, route.offset);
  item.episodeItems = await ncmSongs(ids.slice(route.offset, route.offset + NCM_PAGE), config);
  item.episodeItems.forEach(function (song, i) { song.episode = route.offset + i + 1; });
  item.relatedItems = [];
  if (route.offset + NCM_PAGE < ids.length) {
    var next = ncmPlaylist(list, route.offset + NCM_PAGE);
    next.title = "下一页 · " + (route.offset + NCM_PAGE + 1) + "–" + Math.min(route.offset + 2 * NCM_PAGE, ids.length);
    item.relatedItems.push(next);
  }
  if (route.offset > 0) {
    var previous = ncmPlaylist(list, Math.max(0, route.offset - NCM_PAGE));
    previous.title = "上一页";
    item.relatedItems.push(previous);
  }
  return item;
}

async function loadPlaylist(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), id = String((params || {}).playlistId || "").trim();
    if (!ncmId(id)) ncmFail("请填写网易云数字歌单 ID");
    await ncmProfile(config);
    return (await ncmPlaylistDetail({ id: id, offset: (ncmPage(params) - 1) * NCM_PAGE }, config)).episodeItems;
  });
}

async function search(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), keyword = String((params || {}).keyword || "").trim();
    if (!keyword) return [];
    var data = await ncmApi("/search/get", { s: keyword, type: 1, limit: 30, offset: (ncmPage(params) - 1) * 30 }, config);
    return ((data.result || {}).songs || []).filter(function (s) { return ncmId(s.id); }).map(ncmSong);
  });
}

async function loadDetail(link) {
  var route = ncmLink(link);
  if (!route) return null;
  return ncmGuard(async function () {
    var config = ncmRead();
    await ncmProfile(config);
    if (route.kind === "playlist") return ncmPlaylistDetail(route, config);
    var items = await ncmSongs([route.id], config);
    if (!items.length) ncmFail("网易云未返回这首歌曲的信息");
    return items[0];
  });
}

async function ncmPlayback(id, config) {
  var quality = config.quality || "standard";
  // MUSIC_U alone can produce a signed CDN URL that returns 403 without a client OS.
  var playbackCookie = String(config.cookie || "").split(";").map(function (part) {
    return part.trim();
  }).filter(function (part) { return part && !/^os\s*=/i.test(part); }).join("; ");
  var playbackConfig = Object.assign({}, config, { cookie: playbackCookie + "; os=pc" });
  var data = await ncmApi("/song/enhance/player/url/v1", { ids: "[" + id + "]", level: quality, encodeType: quality === "lossless" ? "flac" : "mp3" }, playbackConfig);
  var track = (data.data || []).filter(function (t) { return String(t.id) === id; })[0];
  if (!track || !track.url) ncmFail("此账号暂时无法播放这首歌，请检查会员、购买权限或地区版权");
  if (track.freeTrialInfo || track.freeTimeTrialInfo) ncmFail("网易云只返回了试听片段，当前账号没有完整播放权限");
  if (!/^https?:\/\//i.test(track.url)) ncmFail("网易云返回了无效播放地址");
  return { name: "网易云 · " + (track.level || quality), description: track.br ? Math.round(track.br / 1000) + " kbps" : "",
    url: track.url.replace(/^http:/i, "https:"),
    customHeaders: {
      "User-Agent": "Mozilla/5.0",
      Referer: NCM_SITE + "/"
    },
    playerType: "app" };
}

async function loadResource(params) {
  var p = params || {}, route = ncmLink(p.link != null ? p.link : p.id);
  if (!route || route.kind !== "song") return [];
  return ncmGuard(async function () {
    var config = ncmConfig(p);
    await ncmProfile(config);
    return [await ncmPlayback(route.id, config)];
  });
}
