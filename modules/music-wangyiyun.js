var WidgetMetadata = {
  id: "mlitm.netease.account",
  title: "网易云音乐 · 我的音乐",
  iconurl: "https://raw.githubusercontent.com/zt001110/rex-icons/main/logos/official-ios/%E7%BD%91%E6%98%93%E4%BA%91%E9%9F%B3%E4%B9%90.png",
  version: "1.2.28",
  requiredVersion: "0.0.7",
  contentType: "music",
  description: "账号歌单、收藏专辑、每日推荐、推荐歌单、心动模式与热歌榜，按账号权限在线播放，支持同步歌词。",
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
    { id: "playlists", title: "我的歌单", functionName: "loadMyPlaylists", cacheDuration: 0, params: [
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "likedSongs", title: "我喜欢的音乐 · 歌曲", functionName: "loadLikedSongs", cacheDuration: 0, params: [
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "musicGenres", title: "我的歌单 · 浏览", type: "video", functionName: "loadMusicGenres", cacheDuration: 0, params: [
      { name: "genreId", title: "音乐目录 ID", type: "input" },
      { name: "section", title: "分区", type: "enumeration", enumOptions: [
        { title: "歌曲", value: "songs" }, { title: "专辑", value: "albums" }, { title: "歌手", value: "artists" }
      ] },
      { name: "page", title: "页码", type: "page" },
      { name: "offset", title: "偏移量", type: "offset" }
    ] },
    { id: "musicArtists", title: "网易云歌手", type: "person", functionName: "loadMusicArtists", cacheDuration: 300, params: [
      { name: "peopleId", title: "歌手 ID", type: "input" },
      { name: "section", title: "分区", type: "enumeration", enumOptions: [
        { title: "资料", value: "profile" }, { title: "歌曲", value: "songs" }, { title: "专辑", value: "albums" }
      ] },
      { name: "page", title: "页码", type: "page" },
      { name: "offset", title: "偏移量", type: "offset" }
    ] },
    { id: "albums", title: "我的专辑", functionName: "loadMyAlbums", cacheDuration: 0, params: [
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "recommended", title: "推荐歌单", functionName: "loadRecommendedPlaylists", cacheDuration: 0, params: [] },
    { id: "daily", title: "每日推荐", functionName: "loadDaily", cacheDuration: 0, params: [
      { name: "dailyMode", title: "播放方式", type: "enumeration", value: "song", enumOptions: [
        { title: "原生歌曲", value: "song" }, { title: "从所选歌曲连播", value: "playlist" }
      ] }
    ] },
    { id: "hot", title: "热歌榜", functionName: "loadHot", cacheDuration: 300, params: [] },
    { id: "mvTop", title: "MV榜单", functionName: "loadMvTop", cacheDuration: 300, params: [
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "mvLibrary", title: "MV片库", functionName: "loadMvLibrary", cacheDuration: 300, params: [
      { name: "area", title: "地区", type: "enumeration", value: "全部", enumOptions: [
        { title: "全部", value: "全部" }, { title: "内地", value: "内地" }, { title: "港台", value: "港台" },
        { title: "欧美", value: "欧美" }, { title: "日本", value: "日本" }, { title: "韩国", value: "韩国" }
      ] },
      { name: "mvType", title: "类型", type: "enumeration", value: "全部", enumOptions: [
        { title: "全部", value: "全部" }, { title: "官方版", value: "官方版" }, { title: "原生", value: "原生" },
        { title: "现场版", value: "现场版" }, { title: "网易出品", value: "网易出品" }
      ] },
      { name: "order", title: "排序", type: "enumeration", value: "上升最快", enumOptions: [
        { title: "上升最快", value: "上升最快" }, { title: "最热", value: "最热" }, { title: "最新", value: "最新" }
      ] },
      { name: "page", title: "页码", type: "page" }
    ] },
    { id: "mvLatest", title: "最新MV", functionName: "loadMvLatest", cacheDuration: 300, params: [] },
    { id: "loadResource", title: "网易云账号播放", functionName: "loadResource", type: "stream", cacheDuration: 0, params: [] },
    { id: "loadSubtitle", title: "网易云歌词", functionName: "loadSubtitle", type: "subtitle", cacheDuration: 0, params: [] },
    { id: "account", title: "账号状态", functionName: "loadAccount", cacheDuration: 0, params: [
      { name: "action", title: "账号操作", type: "enumeration", value: "status", enumOptions: [
        { title: "检查登录", value: "status" }, { title: "清除本模块登录缓存", value: "clear" }
      ] }
    ] }
  ],
  search: { title: "搜索网易云歌曲", functionName: "search", params: [
    { name: "keyword", title: "关键词", type: "input" },
    { name: "page", title: "页码", type: "page" }
  ] }
};

var NCM_SITE = "https://music.163.com";
var NCM_LYRICS = "https://rex-netease-lyrics.mlitm.workers.dev/netease/";
var NCM_LYRIC_CACHE = "ncm.lyrics.v1.";
var NCM_STORAGE = "ncm.account.v1";
var NCM_QUEUES = "ncm.queues.v1";
var NCM_HEART_CACHE = "ncm.heart.daily.v1";
var NCM_HEART_CURRENT = "ncm.heart.current.v1";
var NCM_HEART_ALIASES = "ncm.heart.aliases.v1";
var NCM_PAGE = 100;
var NCM_BROWSE_PAGE = 20;

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

async function ncmApi(path, query, config, timeout) {
  config = config || ncmRead();
  var headers = { Referer: NCM_SITE + "/", "User-Agent": "Mozilla/5.0" };
  if (config.cookie) headers.Cookie = config.cookie;
  var params = Object.assign({}, query || {}, { _t: Date.now() });
  var csrf = /(?:^|;\s*)__csrf=([^;]*)/.exec(config.cookie || "");
  if (csrf) params.csrf_token = csrf[1];
  var url = NCM_SITE + "/api" + path;
  var response = timeout
    ? await Widget.http.request({ url: url, method: "GET", headers: headers, params: params, timeout: timeout })
    : await Widget.http.get(url, { headers: headers, params: params });
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
  var mv = /^ncm:mv:([1-9]\d*)$/.exec(String(raw || ""));
  if (mv) return { kind: "mv", id: mv[1] };
  if (raw === "ncm:heart") return { kind: "heart" };
  var heart = /^ncm:heart:([1-9]\d*)$/.exec(String(raw || ""));
  if (heart) {
    var episode = Number(heart[1]);
    return Number.isSafeInteger(episode) && episode <= 10000000 ? { kind: "heart", episode: episode } : null;
  }
  var queue = /^ncm:queue:([a-z0-9]+-[a-z0-9]+)(?::(0|[1-9]\d*))?$/.exec(String(raw || ""));
  if (queue) {
    var queueOffset = Number(queue[2] || 0);
    return Number.isSafeInteger(queueOffset) && queueOffset <= 10000000 ?
      { kind: "queue", id: queue[1], offset: queueOffset } : null;
  }
  var match = /^ncm:(song|playlist|album):([1-9]\d*)(?::(0|[1-9]\d*))?$/.exec(String(raw || ""));
  if (!match || (match[1] === "song" && match[3] != null)) return null;
  var offset = Number(match[3] || 0);
  if (!Number.isSafeInteger(offset) || offset > 10000000) return null;
  return { kind: match[1], id: match[2], offset: offset };
}
function ncmSong(song) {
  var artists = song.ar || song.artists || [], album = song.al || song.album || {};
  var cover = ncmCover(album.picUrl), key = "ncm:song:" + song.id;
  var artistNames = artists.map(function (a) { return a.name; }).filter(Boolean).join("、");
  return {
    id: key, link: key, type: "url", mediaType: "song", title: song.name || "歌曲 " + song.id,
    coverUrl: cover, posterPath: cover, backdropPath: cover,
    subtitle: artistNames, peoples: artists.filter(function (a) { return ncmId(a.id); }).map(ncmArtistCredit),
    description: [artists.map(function (a) { return a.name; }).join(" / "), album.name].filter(Boolean).join(" · "),
    duration: Math.round(Number(song.dt || song.duration || 0) / 1000), playerType: "app"
  };
}
function ncmArtistCredit(artist) {
  return { id: String(artist.id), title: artist.name, avatar: ncmCover(artist.picUrl || artist.img1v1Url), role: "歌手" };
}

function ncmArtist(artist) {
  var credit = ncmArtistCredit(artist);
  return { id: credit.id, type: "person", mediaType: "person", title: credit.title,
    avatar: credit.avatar, coverUrl: credit.avatar, posterPath: credit.avatar, description: artist.briefDesc };
}
function ncmPlaylist(list, offset) {
  var key = "ncm:playlist:" + list.id + (offset ? ":" + offset : "");
  var cover = ncmCover(list.coverImgUrl || list.picUrl);
  return {
    // Rex opens the native track browser for album items.
    id: key, link: key, type: "url", mediaType: "album", title: list.name || "歌单 " + list.id,
    coverUrl: cover, posterPath: cover, backdropPath: cover,
    description: list.description || [list.creator && list.creator.nickname, Number(list.trackCount || 0) + " 首"].filter(Boolean).join(" · ")
  };
}

function ncmIsAccountLikedPlaylist(list, userId) {
  return list && ncmId(list.id) && Number(list.specialType) === 5 &&
    String((list.creator || {}).userId) === String(userId);
}

async function ncmSongData(ids, config) {
  if (!ids.length) return [];
  var data = await ncmApi("/v3/song/detail", {
    c: JSON.stringify(ids.map(function (id) { return { id: String(id) }; }))
  }, config);
  var byId = {};
  (data.songs || []).forEach(function (song) { if (ncmId(song.id)) byId[String(song.id)] = song; });
  return ids.map(function (id) { return byId[String(id)]; }).filter(Boolean);
}

async function ncmSongs(ids, config) {
  return (await ncmSongData(ids, config)).map(ncmSong);
}

async function loadAccount(params) {
  return ncmGuard(async function () {
    if ((params || {}).action === "clear") {
      Widget.storage.remove(NCM_STORAGE);
      Widget.storage.remove(NCM_QUEUES);
      Widget.storage.remove(NCM_HEART_CACHE);
      Widget.storage.remove(NCM_HEART_CURRENT);
      Widget.storage.remove(NCM_HEART_ALIASES);
      Widget.storage.keys().filter(function (key) { return key.indexOf(NCM_LYRIC_CACHE) === 0; })
        .forEach(function (key) { Widget.storage.remove(key); });
      return [{ id: "ncm:status", type: "url", title: "本模块登录缓存已清除", description: "请同时清空模块全局参数中的 Cookie。" }];
    }
    var profile = await ncmProfile(ncmConfig(params));
    return [{ id: "ncm:status", type: "url", title: "已登录 · " + profile.nickname,
      coverUrl: ncmCover(profile.avatarUrl), description: "网易云 UID：" + profile.userId }];
  });
}

function ncmReadQueues() {
  var raw = Widget.storage.get(NCM_QUEUES);
  try {
    var queues = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(queues) ? queues : [];
  } catch (_) { return []; }
}

function ncmQueueItem(queue, offset) {
  var isHeart = queue.kind === "heart";
  var link = isHeart ? "ncm:heart" : "ncm:queue:" + queue.id + (offset ? ":" + offset : "");
  return { id: link, link: link, type: "url", mediaType: isHeart ? "album" : "playlist", title: queue.title,
    coverUrl: queue.cover, posterPath: queue.cover, backdropPath: queue.cover,
    description: queue.ids.length + " 首" };
}

function ncmMakeQueue(title, songs, profile, id) {
  var seen = {}, unique = songs.filter(function (song) {
    if (!song || !ncmId(song.id) || seen[String(song.id)]) return false;
    seen[String(song.id)] = true;
    return true;
  });
  if (!unique.length) ncmFail(title + "暂未返回歌曲，请稍后刷新");
  var now = Date.now(), queue = {
    id: id || now.toString(36) + "-" + Math.random().toString(36).slice(2, 10),
    userId: String(profile.userId), created: now, title: title,
    cover: ncmSong(unique[0]).coverUrl, ids: unique.map(function (s) { return String(s.id); })
  };
  return queue;
}

function ncmSaveQueue(title, songs, profile) {
  var queue = ncmMakeQueue(title, songs, profile);
  ncmStoreQueue(queue);
  return [ncmQueueItem(queue)];
}

function ncmStoreQueue(queue) {
  var now = Date.now();
  var queues = ncmReadQueues().filter(function (q) {
    return q.userId === queue.userId && now - q.created < 86400000;
  }).slice(-11);
  queues.push(queue);
  Widget.storage.set(NCM_QUEUES, JSON.stringify(queues));
}

function ncmAlbum(album, offset) {
  var key = "ncm:album:" + album.id + (offset ? ":" + offset : "");
  var cover = ncmCover(album.picUrl), artists = album.artists || (album.artist ? [album.artist] : []);
  return { id: key, link: key, type: "url", mediaType: "album", title: album.name || "专辑 " + album.id,
    coverUrl: cover, posterPath: cover, backdropPath: cover,
    peoples: artists.filter(function (a) { return ncmId(a.id); }).map(ncmArtistCredit),
    description: [artists.map(function (a) { return a.name; }).filter(Boolean).join(" / "),
      Number(album.size) > 0 ? album.size + " 首" : "", album.description].filter(Boolean).join(" · ") };
}

async function loadMyAlbums(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), offset = (ncmPage(params) - 1) * 30;
    await ncmProfile(config);
    var data = await ncmApi("/album/sublist", { limit: 30, offset: offset, total: true }, config);
    if (!Array.isArray(data.data)) ncmFail("网易云未返回收藏专辑列表，请检查登录状态");
    return data.data.filter(function (album) { return album && ncmId(album.id); }).map(function (album) {
      return ncmAlbum(album);
    });
  });
}

async function ncmAlbumData(id, config) {
  var data = await ncmApi("/v1/album/" + id, {}, config);
  if (!data.album || String(data.album.id) !== id) ncmFail("专辑不存在或账号没有访问权限");
  if (!Array.isArray(data.songs)) ncmFail("网易云未返回专辑歌曲，请稍后重试");
  if (Number(data.album.size) > data.songs.length) ncmFail("网易云未返回完整专辑歌曲，请稍后重试");
  return data;
}

async function ncmAlbumDetail(route, config) {
  var data = await ncmAlbumData(route.id, config);
  var songs = data.songs.filter(function (song) { return song && ncmId(song.id); });
  var item = ncmAlbum(data.album, route.offset);
  item.episodeItems = songs.slice(route.offset, route.offset + NCM_PAGE).map(function (song, i) {
    var entry = ncmSong(Object.assign({}, song, { al: Object.assign({
      name: data.album.name, picUrl: data.album.picUrl
    }, song.al || song.album || {}) }));
    entry.episode = route.offset + i + 1;
    return entry;
  });
  item.tracks = await ncmNativeTracks(item.episodeItems, config, true);
  item.relatedItems = [];
  ncmPageNeighbors(item, songs.length, route.offset, function (offset) { return ncmAlbum(data.album, offset); });
  return item;
}

async function loadRecommendedPlaylists(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params);
    await ncmProfile(config);
    var data = await ncmApi("/v1/discovery/recommend/resource", {}, config);
    var lists = (data.recommend || []).filter(function (p) { return ncmId(p.id); });
    if (!lists.length) ncmFail("推荐歌单暂时为空，请稍后刷新");
    return lists.map(function (p) { return ncmPlaylist(p); });
  });
}

async function loadDaily(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params);
    var profile = await ncmProfile(config);
    var data = await ncmApi("/v3/discovery/recommend/songs", {}, config);
    var seen = {}, songs = ((data.data || {}).dailySongs || []).filter(function (song) {
      if (!song || !ncmId(song.id) || seen[String(song.id)]) return false;
      seen[String(song.id)] = true;
      return true;
    });
    if (!songs.length) ncmFail("每日推荐暂未返回歌曲，请稍后刷新");
    if ((params || {}).dailyMode !== "playlist") {
      return ncmNativeTracks(songs.map(ncmSong), config, true);
    }
    var queue = ncmMakeQueue("每日推荐", songs, profile);
    ncmStoreQueue(queue);
    return songs.map(function (song, index) {
      var card = ncmQueueItem(queue, index), item = ncmSong(song);
      card.title = item.title;
      card.description = item.description;
      card.coverUrl = item.coverUrl;
      card.posterPath = item.posterPath;
      card.backdropPath = item.backdropPath;
      return card;
    });
  });
}

async function loadRoam(params) {
  return ncmGuard(async function () {
    var p = params || {}, config = ncmConfig(p), profile = await ncmProfile(config);
    var mode = String(p.mode || "DEFAULT");
    if (["DEFAULT", "FAMILIAR", "EXPLORE", "SCENE_RCMD"].indexOf(mode) < 0) ncmFail("漫游模式无效");
    var query = { mode: mode, limit: 3 };
    var title = { DEFAULT: "漫游", FAMILIAR: "熟悉漫游", EXPLORE: "探索漫游", SCENE_RCMD: "场景漫游" }[mode];
    if (mode === "SCENE_RCMD") {
      var scene = String(p.scene || "RELAX");
      if (["RELAX", "FOCUS", "EXERCISE", "SLEEP_HELP", "CURE", "CHEERFUL", "COMMUTE", "LIGHT", "GUOFENG", "JINGDIAN"].indexOf(scene) < 0) ncmFail("漫游场景无效");
      query.subMode = scene;
    }
    var data = await ncmApi("/v1/radio/get", query, config);
    return ncmSaveQueue(title, data.data || [], profile);
  });
}

async function loadHeart(params) {
  return ncmGuard(async function () {
    var p = params || {}, config = ncmConfig(p), profile = await ncmProfile(config);
    return ncmGenerateHeart(p, config, profile);
  });
}

async function ncmGenerateHeart(p, config, profile) {
    var playlistId = String(p.playlistId || "").trim(), songId = String(p.songId || "").trim();
    if (playlistId && !ncmId(playlistId)) ncmFail("种子歌单 ID 无效");
    if (songId && !ncmId(songId)) ncmFail("种子歌曲 ID 无效");
    if (!playlistId) {
      var lists = await ncmApi("/user/playlist", { uid: profile.userId, limit: 100, offset: 0 }, config);
      var liked = (lists.playlist || []).find(function (list) {
        return ncmIsAccountLikedPlaylist(list, profile.userId);
      });
      if (!liked) ncmFail("未找到我喜欢的音乐，请填写种子歌单 ID");
      playlistId = String(liked.id);
    }
    var detail = await ncmApi("/v6/playlist/detail", { id: playlistId, n: 1 }, config);
    if (!detail.playlist || String(detail.playlist.id) !== playlistId) ncmFail("种子歌单不存在或无法访问");
    var ids = (detail.playlist.trackIds || detail.playlist.tracks || []).map(function (s) { return String(s.id); }).filter(ncmId);
    if (!ids.length) ncmFail("种子歌单没有歌曲");
    if (!songId) songId = ids[0];
    if (ids.indexOf(songId) < 0) ncmFail("种子歌曲不在所选歌单中");
    var data = await ncmApi("/playmode/intelligence/list", {
      songId: songId, startMusicId: songId, playlistId: playlistId, type: "fromPlayOne", count: 30
    }, config);
    var queue = ncmMakeQueue("心动模式", (data.data || []).map(function (entry) { return entry.songInfo; }), profile, "heart");
    queue.kind = "heart";
    ncmMigrateHeartAliases(profile);
    Widget.storage.set(NCM_HEART_CURRENT, JSON.stringify(queue));
    Widget.storage.remove(NCM_HEART_CACHE);
    return [ncmQueueItem(queue)];
}

function ncmStoredObject(key) {
  var raw = Widget.storage.get(key);
  try {
    var object = typeof raw === "string" ? JSON.parse(raw) : raw;
    return object && typeof object === "object" && !Array.isArray(object) ? object : {};
  } catch (_) { return {}; }
}

function ncmMigrateHeartAliases(profile) {
  var userId = String(profile.userId), aliases = ncmStoredObject(NCM_HEART_ALIASES);
  if (!aliases.users || typeof aliases.users !== "object" || Array.isArray(aliases.users)) aliases.users = {};
  var ids = Array.isArray(aliases.users[userId]) ? aliases.users[userId] : [];
  var cache = ncmStoredObject(NCM_HEART_CACHE), queues = ncmReadQueues();
  if (cache.userId === userId && cache.queues) {
    queues = queues.concat(Object.keys(cache.queues).map(function (key) { return cache.queues[key]; }));
  }
  queues.forEach(function (queue) {
    if (queue && queue.userId === userId && queue.title === "心动模式" && ids.indexOf(queue.id) < 0) ids.push(queue.id);
  });
  aliases.users[userId] = ids;
  Widget.storage.set(NCM_HEART_ALIASES, JSON.stringify(aliases));
}

async function ncmCurrentHeart(config, profile) {
  var queue = ncmStoredObject(NCM_HEART_CURRENT);
  if (queue.userId !== String(profile.userId) || !Array.isArray(queue.ids) || !queue.ids.length) {
    await loadHeart({});
    queue = ncmStoredObject(NCM_HEART_CURRENT);
  }
  return queue;
}

function ncmHeartEpisode(song, episode) {
  // Rex resumes by child identity; song IDs change when recommendations refresh.
  song.id = song.link = "ncm:heart:" + episode;
  song.episode = episode;
  return song;
}

async function ncmHeartDetail(config, profile) {
  var queue = await ncmCurrentHeart(config, profile);
  var item = ncmQueueItem(queue);
  item.episodeItems = [];
  item.tracks = [];
  // A single heart identity includes every song, so page changes do not create extra history cards.
  for (var offset = 0; offset < queue.ids.length; offset += NCM_PAGE) {
    var songs = await ncmSongs(queue.ids.slice(offset, offset + NCM_PAGE), config);
    item.tracks = item.tracks.concat(await ncmNativeTracks(songs, config, offset === 0));
    songs.forEach(function (song) { ncmHeartEpisode(song, queue.ids.indexOf(ncmLink(song.link).id) + 1); });
    item.episodeItems = item.episodeItems.concat(songs);
  }
  item.relatedItems = [];
  return item;
}

async function loadHot(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params);
    var data = await ncmApi("/toplist", {}, config);
    return (data.list || []).filter(function (p) {
      return ncmId(p.id) && /热歌榜/.test(String(p.name || ""));
    }).map(function (p) { return ncmPlaylist(p); });
  });
}

async function loadMyPlaylists(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), profile = await ncmProfile(config), page = ncmPage(params);
    var data = await ncmApi("/user/playlist", { uid: profile.userId, limit: 30, offset: (page - 1) * 30, includeVideo: false }, config);
    var lists = (data.playlist || []).filter(function (p) { return ncmId(p.id); });
    var items = lists.map(function (p) { return Object.assign(ncmPlaylist(p), { mediaType: "genre" }); });
    if (page !== 1) return items;
    var likedIndex = lists.findIndex(function (p) {
      return ncmIsAccountLikedPlaylist(p, profile.userId);
    });
    if (likedIndex < 0) return items;
    var liked = items.splice(likedIndex, 1)[0], heart;
    try { heart = (await ncmGenerateHeart({ playlistId: String(lists[likedIndex].id) }, config, profile))[0]; } catch (_) {
      // A recommendation failure must not hide the user's playlists.
      var current = ncmStoredObject(NCM_HEART_CURRENT);
      heart = current.userId === String(profile.userId) && Array.isArray(current.ids) && current.ids.length ?
        ncmQueueItem(current) : { id: "ncm:heart", link: "ncm:heart", type: "url",
          title: "心动模式", coverUrl: liked.coverUrl, posterPath: liked.posterPath, backdropPath: liked.backdropPath,
          description: "根据我喜欢的音乐推荐" };
    }
    items.unshift(liked, Object.assign(heart, { mediaType: "genre" }));
    return items;
  });
}

async function ncmLikedPlaylist(config, profile) {
  var data = await ncmApi("/user/playlist", { uid: profile.userId, limit: 100, offset: 0, includeVideo: false }, config);
  return (data.playlist || []).find(function (list) {
    return ncmIsAccountLikedPlaylist(list, profile.userId);
  });
}

function ncmBrowseOffset(params) {
  var offset = Number(params.offset || 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000000) ncmFail("偏移量无效");
  return offset || (ncmPage(params) - 1) * NCM_BROWSE_PAGE;
}

async function ncmBrowseCredits(ids, section, offset, config) {
  var seen = new Set(), entries = [], end = offset + NCM_BROWSE_PAGE;
  for (var start = 0; start < ids.length && entries.length < end; start += NCM_PAGE) {
    var songs = await ncmSongData(ids.slice(start, start + NCM_PAGE), config);
    songs.forEach(function (song) {
      var credits = section === "albums" ? [song.al || song.album] : (song.ar || song.artists || []);
      credits.forEach(function (credit) {
        if (!credit || !ncmId(credit.id) || !credit.name || seen.has(String(credit.id))) return;
        seen.add(String(credit.id));
        entries.push(credit);
      });
    });
  }
  return entries.slice(offset, end);
}

async function loadMusicGenres(params) {
  params = params || {};
  if (!params.genreId) return loadMyPlaylists(params);
  var route = ncmLink(params.genreId);
  if (!route || (route.kind !== "playlist" && route.kind !== "heart") || route.offset || route.episode ||
      ["songs", "albums", "artists"].indexOf(params.section) < 0) return [];
  return ncmGuard(async function () {
    var config = ncmConfig(params), profile = await ncmProfile(config);
    var offset = ncmBrowseOffset(params), ids;
    if (route.kind === "heart") {
      ids = (await ncmCurrentHeart(config, profile)).ids;
    } else {
      var list = await ncmPlaylistData(route.id, config);
      if (Number(list.specialType) === 5 && !ncmIsAccountLikedPlaylist(list, profile.userId)) return [];
      ids = ncmPlaylistSongIds(list);
    }
    if (params.section === "songs") {
      var songs = await ncmSongs(ids.slice(offset, offset + NCM_BROWSE_PAGE), config);
      // A direct videoUrl skips loadResource when Rex advances the music queue.
      return Promise.all(songs.map(async function (song) {
        var songId = ncmLink(song.link).id;
        var text = await ncmLyricText(songId, 1);
        song.externalSubtitles = [ncmInlineLyricTrack(songId, text)];
        return song;
      }));
    }
    var credits = await ncmBrowseCredits(ids, params.section, offset, config);
    if (params.section === "albums") return credits.map(function (album) { return ncmAlbum(album); });
    return Promise.all(credits.map(async function (artist) {
      if (artist.picUrl || artist.img1v1Url) return ncmArtist(artist);
      try {
        var data = await ncmApi("/v1/artist/" + artist.id, {}, config, 3);
        if (data.artist && String(data.artist.id) === String(artist.id)) return ncmArtist(data.artist);
      } catch (_) { /* An unavailable portrait must not hide the artist. */ }
      return ncmArtist(artist);
    }));
  });
}

async function loadMusicArtists(params) {
  params = params || {};
  var id = String(params.peopleId || "");
  if (!ncmId(id) || ["profile", "songs", "albums"].indexOf(params.section) < 0) return [];
  return ncmGuard(async function () {
    var config = ncmConfig(params), offset = ncmBrowseOffset(params);
    if (params.section === "albums") {
      var albums = await ncmApi("/artist/albums/" + id, { limit: NCM_BROWSE_PAGE, offset: offset }, config);
      return (albums.hotAlbums || []).filter(function (album) { return album && ncmId(album.id); })
        .map(function (album) { return ncmAlbum(album); });
    }
    if (params.section === "profile" && offset) return [];
    var data = await ncmApi("/v1/artist/" + id, {}, config);
    if (!data.artist || String(data.artist.id) !== id) return [];
    if (params.section === "profile") return [ncmArtist(data.artist)];
    var songs = (data.hotSongs || []).filter(function (song) { return song && ncmId(song.id); })
      .slice(offset, offset + NCM_BROWSE_PAGE).map(ncmSong);
    return ncmNativeTracks(songs, config, offset === 0);
  });
}

async function loadLikedSongs(params) {
  return ncmGuard(async function () {
    var config = ncmConfig(params), profile = await ncmProfile(config);
    var liked = await ncmLikedPlaylist(config, profile);
    if (!liked) ncmFail("未找到此账号的我喜欢的音乐歌单");
    var list = await ncmPlaylistData(String(liked.id), config);
    var offset = (ncmPage(params) - 1) * NCM_PAGE;
    var ids = ncmPlaylistSongIds(list).slice(offset, offset + NCM_PAGE);
    var songs = await ncmSongs(ids, config);
    return ncmNativeTracks(songs, config, true);
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
  var list = await ncmPlaylistData(route.id, config);
  var ids = ncmPlaylistSongIds(list);
  var item = ncmPlaylist(Object.assign({}, list, { trackCount: ids.length }), route.offset);
  item.tracks = [];
  for (var offset = route.offset; offset < ids.length; offset += NCM_PAGE) {
    var songs = await ncmNumberedSongs(ids, offset, config);
    var tracks = await ncmNativeTracks(songs, config, offset === route.offset);
    if (offset === route.offset) item.episodeItems = songs;
    item.tracks = item.tracks.concat(tracks);
  }
  if (!item.episodeItems) item.episodeItems = [];
  item.relatedItems = [];
  ncmPageNeighbors(item, ids.length, route.offset, function (offset) { return ncmPlaylist(list, offset); });
  return item;
}

async function ncmPlaylistData(id, config) {
  var data = await ncmApi("/v6/playlist/detail", { id: id, n: NCM_PAGE }, config);
  var list = data.playlist;
  if (!list || String(list.id) !== id) ncmFail("歌单不存在或账号没有访问权限");
  return list;
}

function ncmPlaylistSongIds(list) {
  function songIds(entries) {
    return (entries || []).map(function (entry) { return entry && entry.id; }).filter(ncmId).map(String);
  }
  var ids = songIds(list.trackIds);
  if (ids.length) return ids;
  ids = songIds(list.tracks);
  if (Number(list.trackCount) > ids.length) ncmFail("网易云未返回完整歌单索引，请稍后重试");
  return ids;
}

async function ncmNumberedSongs(ids, offset, config) {
  var pageIds = ids.slice(offset, offset + NCM_PAGE);
  var songs = await ncmSongs(pageIds, config);
  var index = -1;
  songs.forEach(function (song) {
    index = pageIds.indexOf(ncmLink(song.link).id, index + 1);
    song.episode = offset + index + 1;
  });
  return songs;
}

async function ncmNativeTracks(items, config, warmLyrics) {
  var ids = items.map(function (song) {
    return ncmLink(song.link).id;
  });
  // Run the two opening lyric requests alongside the audio lookup.
  var firstIds = warmLyrics ? ids.slice(0, 2) : [];
  var requests = [ncmPlaybackTracks(ids, config)];
  firstIds.forEach(function (id) { requests.push(ncmLyricText(id, 1)); });
  var byId = (await Promise.all(requests))[0];
  return items.map(function (song) {
    var track = byId[ncmLink(song.link).id];
    if (!track || !/^https?:\/\//i.test(track.url) || track.freeTrialInfo || track.freeTimeTrialInfo) {
      return Object.assign({}, song);
    }
    var resource = ncmTrackResource(track, config.quality || "standard");
    ncmAttachPlayback(song, resource);
    var lyric = resource.subtitles[0];
    // Native queue items carry the audio and its own documented external subtitle.
    return Object.assign({}, song, {
      videoUrl: resource.url,
      externalSubtitles: [{ url: lyric.url, title: lyric.title, language: lyric.language, isDefault: true }]
    });
  });
}

function ncmPageNeighbors(item, total, offset, makeItem) {
  if (offset + NCM_PAGE < total) {
    var next = makeItem(offset + NCM_PAGE);
    next.title = "下一页 · " + (offset + NCM_PAGE + 1) + "–" + Math.min(offset + 2 * NCM_PAGE, total);
    item.relatedItems.push(next);
  }
  if (offset > 0) {
    var previous = makeItem(Math.max(0, offset - NCM_PAGE));
    previous.title = "上一页";
    item.relatedItems.push(previous);
  }
}

async function ncmQueueDetail(route, config, profile) {
  ncmMigrateHeartAliases(profile);
  var aliases = ncmStoredObject(NCM_HEART_ALIASES);
  if (((aliases.users || {})[String(profile.userId)] || []).indexOf(route.id) >= 0) {
    return ncmHeartDetail(config, profile);
  }
  var queues = ncmReadQueues();
  var queue = queues.filter(function (q) {
    return q.id === route.id && q.userId === String(profile.userId) && Date.now() - q.created < 86400000;
  })[0];
  if (!queue) ncmFail("推荐队列已过期，请返回模块重新获取");
  var item = ncmQueueItem(queue, route.offset);
  item.episodeItems = await ncmNumberedSongs(queue.ids, route.offset, config);
  item.tracks = await ncmNativeTracks(item.episodeItems, config, true);
  item.relatedItems = [];
  ncmPageNeighbors(item, queue.ids.length, route.offset, function (offset) { return ncmQueueItem(queue, offset); });
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
  if (!route) return [];
  return ncmGuard(async function () {
    var config = ncmRead();
    if (route.kind === "mv") {
      var data = await ncmApi("/v1/mv/detail", { id: route.id }, config);
      if (!data.data || String(data.data.id) !== route.id) ncmFail("MV 不存在或无法访问");
      var mv = ncmMv(data.data);
      ncmAttachPlayback(mv, await ncmMvPlayback(route.id, config));
      return mv;
    }
    var profile = await ncmProfile(config);
    if (route.kind === "heart") {
      if (!route.episode) return ncmHeartDetail(config, profile);
      var queue = await ncmCurrentHeart(config, profile), id = queue.ids[route.episode - 1];
      if (!id) ncmFail("当前心动列表没有这一集，请返回心动模式重新选择");
      var songs = await ncmSongs([id], config);
      if (!songs.length) ncmFail("网易云未返回这首歌曲的信息");
      ncmAttachPlayback(songs[0], await ncmPlayback(id, config));
      return ncmHeartEpisode(songs[0], route.episode);
    }
    if (route.kind === "album") return ncmAlbumDetail(route, config);
    if (route.kind === "playlist") return ncmPlaylistDetail(route, config);
    if (route.kind === "queue") return ncmQueueDetail(route, config, profile);
    var items = await ncmSongs([route.id], config);
    if (!items.length) ncmFail("网易云未返回这首歌曲的信息");
    var playback = await Promise.all([ncmPlayback(route.id, config), ncmLyricText(route.id, 1)]);
    playback[0].subtitles = [ncmInlineLyricTrack(route.id, playback[1])];
    ncmAttachPlayback(items[0], playback[0]);
    return items[0];
  });
}

function ncmAttachPlayback(item, resource) {
  // Rex uses videoUrl as a direct resource and skips the stream's lyrics on that path.
  if (!resource.subtitles) item.videoUrl = resource.url;
  item.customHeaders = resource.customHeaders;
  item.playerType = resource.playerType;
  if (resource.subtitles) item.externalSubtitles = resource.subtitles;
}

async function ncmPlaybackTracks(ids, config) {
  if (!ids.length) return {};
  var quality = config.quality || "standard";
  // MUSIC_U alone can produce a signed CDN URL that returns 403 without a client OS.
  var playbackCookie = String(config.cookie || "").split(";").map(function (part) {
    return part.trim();
  }).filter(function (part) { return part && !/^os\s*=/i.test(part); }).join("; ");
  var playbackConfig = Object.assign({}, config, { cookie: playbackCookie + "; os=pc" });
  var data = await ncmApi("/song/enhance/player/url/v1", { ids: "[" + ids.join(",") + "]", level: quality, encodeType: quality === "lossless" ? "flac" : "mp3" }, playbackConfig);
  var tracks = {};
  (data.data || []).forEach(function (track) {
    if (ids.indexOf(String(track.id)) >= 0) tracks[String(track.id)] = track;
  });
  return tracks;
}

function ncmTrackResource(track, quality) {
  if (!track || !track.url) ncmFail("此账号暂时无法播放这首歌，请检查会员、购买权限或地区版权");
  if (track.freeTrialInfo || track.freeTimeTrialInfo) ncmFail("网易云只返回了试听片段，当前账号没有完整播放权限");
  if (!/^https?:\/\//i.test(track.url)) ncmFail("网易云返回了无效播放地址");
  return { name: "网易云 · " + (track.level || quality), description: track.br ? Math.round(track.br / 1000) + " kbps" : "",
    url: track.url.replace(/^http:/i, "https:"),
    customHeaders: {
      "User-Agent": "Mozilla/5.0",
      Referer: NCM_SITE + "/"
    },
    playerType: "app",
    subtitles: [ncmLyricTrack(String(track.id))] };
}

async function ncmPlayback(id, config) {
  var tracks = await ncmPlaybackTracks([id], config);
  return ncmTrackResource(tracks[id], config.quality || "standard");
}

function ncmLyricTrack(id) {
  return {
    id: "ncm:lyrics:" + id,
    url: NCM_LYRICS + id + ".lrc",
    name: "歌词", title: "歌词",
    lang: "zh-Hans", language: "zh-Hans",
    format: "lrc", type: "lrc",
    fileName: "netease-" + id + ".lrc",
    headers: {}, isDefault: true
  };
}

function ncmInlineLyricTrack(id, text) {
  var track = ncmLyricTrack(id);
  if (!text) return track;
  // JavaScriptCore widget runtimes do not require browser globals such as btoa.
  var bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, function (_, hex) {
    return String.fromCharCode(parseInt(hex, 16));
  });
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var base64 = "";
  for (var i = 0; i < bytes.length; i += 3) {
    var a = bytes.charCodeAt(i), b = bytes.charCodeAt(i + 1) || 0, c = bytes.charCodeAt(i + 2) || 0;
    base64 += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : "=") +
      (i + 2 < bytes.length ? alphabet[c & 63] : "=");
  }
  track.url = "data:text/plain;charset=utf-8;base64," + base64;
  return track;
}

function ncmPlaybackRoute(params) {
  var p = params || {}, route = ncmLink(p.link != null ? p.link : p.id);
  if (!route) return null;
  if (route.kind === "song" || route.kind === "mv") return route;
  // Rex can retain the original link while advancing the episode in the player.
  var episode = route.episode || (route.offset || 0) + 1;
  if (p.episode != null && p.episode !== "") {
    if (!/^[1-9]\d*$/.test(String(p.episode))) return null;
    episode = Number(p.episode);
  }
  if (!Number.isSafeInteger(episode) || episode < 1 ||
      (p.season != null && String(p.season) !== "1")) return null;
  route.episode = episode;
  return route;
}

async function ncmResolveSongId(route, config, profile) {
  if (route.kind === "song") return route.id;
  var episode = route.episode, id;
  if (route.kind === "album") {
    var albumData = await ncmAlbumData(route.id, config);
    var songs = albumData.songs.filter(function (song) { return song && ncmId(song.id); });
    id = songs[episode - 1] && String(songs[episode - 1].id);
    if (!ncmId(id)) ncmFail("当前专辑没有这一集，请返回专辑重新选择");
    return id;
  }
  if (route.kind === "playlist") {
    var list = await ncmPlaylistData(route.id, config);
    id = ncmPlaylistSongIds(list)[episode - 1];
    if (!ncmId(id)) ncmFail("当前歌单没有这一集，请返回歌单重新选择");
    return id;
  }
  var queue;
  if (route.kind === "queue") {
    ncmMigrateHeartAliases(profile);
    var aliases = ncmStoredObject(NCM_HEART_ALIASES);
    if (((aliases.users || {})[String(profile.userId)] || []).indexOf(route.id) < 0) {
      queue = ncmReadQueues().filter(function (q) {
        return q.id === route.id && q.userId === String(profile.userId) && Date.now() - q.created < 86400000;
      })[0];
      if (!queue) ncmFail("推荐队列已过期，请返回模块重新获取");
    }
  }
  queue = queue || await ncmCurrentHeart(config, profile);
  id = queue.ids[episode - 1];
  if (!id) ncmFail("当前心动列表没有这一集，请返回心动模式重新选择");
  return id;
}

async function loadResource(params) {
  var route = ncmPlaybackRoute(params);
  if (!route) return [];
  return ncmGuard(async function () {
    var config = ncmConfig(params);
    if (route.kind === "mv") return [await ncmMvPlayback(route.id, config)];
    var profile = await ncmProfile(config);
    var songId = await ncmResolveSongId(route, config, profile);
    var results = await Promise.all([ncmPlayback(songId, config), ncmResolvedLyricTrack(songId)]);
    var resource = results[0], tracks = [results[1]];
    resource.subtitles = resource.externalSubtitles = resource.subtitleTracks = tracks;
    return [resource];
  });
}

async function loadSubtitle(params) {
  var route = ncmPlaybackRoute(params);
  if (!route || route.kind === "mv") return [];
  try {
    var config = ncmRead();
    var profile = route.kind === "heart" || route.kind === "queue" ? await ncmProfile(config) : null;
    var songId = await ncmResolveSongId(route, config, profile);
    return [await ncmResolvedLyricTrack(songId)];
  } catch (_) {
    return [];
  }
}

async function ncmResolvedLyricTrack(songId) {
  var track = ncmLyricTrack(songId);
  // Give each reload its own identity, including repeats of the same song.
  var refresh = Date.now();
  track.id += ":" + refresh;
  // Keep the extension at the end of the URL when refreshing a track.
  track.url = NCM_LYRICS + songId + "/" + refresh + ".lrc";
  track.file = track.url;
  track.sourceUrl = track.url;
  track.label = track.name;
  track.mimeType = "text/plain; charset=utf-8";
  track.default = true;
  track.selected = true;

  var text = await ncmLyricText(songId, 4);
  if (text) {
    track.data = text;
    track.content = text;
  }
  track.languageIdentifier = track.language;
  return track;
}

async function ncmLyricText(songId, timeout) {
  songId = String(songId);
  // Fixed slots bound storage. A collision only causes a miss for the older song.
  var key = NCM_LYRIC_CACHE + Number(songId.slice(-6)) % 128;
  var cached = ncmStoredObject(key);
  if (cached.id === songId && cached.expires > Date.now()) return cached.text;
  try {
    var data = await ncmApi("/song/lyric", { id: songId, lv: 1 }, {}, timeout);
    var text = data.lrc && data.lrc.lyric;
    if (typeof text === "string" && /^\[\d{1,4}:[0-5]?\d(?:[.:]\d{1,3})?\]/m.test(text)) {
      if (text.length <= 20000) {
        Widget.storage.set(key, JSON.stringify({ id: songId, text: text, expires: Date.now() + 3600000 }));
      }
      return text;
    }
  } catch (_) {}
  return "";
}

function ncmMv(mv) {
  var link = "ncm:mv:" + mv.id, cover = ncmCover(mv.cover || mv.imgurl);
  return { id: link, link: link, type: "url", mediaType: "movie", title: mv.name || "MV " + mv.id,
    coverUrl: cover, posterPath: cover, backdropPath: cover, playerType: "app",
    description: [mv.artistName, mv.desc || mv.briefDesc].filter(Boolean).join(" · "),
    duration: Math.round(Number(mv.duration || 0) / 1000), releaseDate: mv.publishTime || "" };
}

async function ncmMvList(path, query, params) {
  return ncmGuard(async function () {
    var data = await ncmApi(path, query, ncmConfig(params));
    return (data.data || []).filter(function (mv) { return ncmId(mv.id); }).map(ncmMv);
  });
}

async function loadMvTop(params) {
  return ncmMvList("/mv/toplist", { limit: 30, offset: (ncmPage(params) - 1) * 30, total: true }, params);
}

async function loadMvLibrary(params) {
  var p = params || {};
  return ncmMvList("/mv/all", { limit: 30, offset: (ncmPage(p) - 1) * 30,
    area: p.area || "全部", type: p.mvType || "全部", order: p.order || "上升最快" }, p);
}

async function loadMvLatest(params) {
  return ncmMvList("/mv/first", { limit: 30 }, params);
}

async function ncmMvPlayback(id, config) {
  var data = await ncmApi("/song/enhance/play/mv/url", { id: id, r: 1080 }, config);
  var mv = data.data;
  if (!mv || String(mv.id) !== id || !/^https?:\/\//i.test(mv.url || "")) ncmFail("当前 MV 暂无可播放资源，请检查账号权限或地区版权");
  return { name: "MV · " + (mv.r || "默认"), url: ncmCover(mv.url),
    customHeaders: { Referer: NCM_SITE + "/", "User-Agent": "Mozilla/5.0" }, playerType: "app" };
}
