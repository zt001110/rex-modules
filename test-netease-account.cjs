const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const target = process.argv[2] || __dirname + '/modules/music-wangyiyun.js';
const calls = [];
const storage = new Map();
let expired = false, trial = false, denied = false, wrongId = false;
let accountUser = 88;
let clock = Date.parse('2026-11-08T15:59:59.999Z');
let emptyHeart = false;
let heartBase = 500;
let downgrade = false;
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
}
const song = id => ({ id: Number(id), name: 'Song ' + id, fee: 1,
  ar: [{ name: 'Artist' }], al: { name: 'Album', picUrl: 'http://p1.music.126.net/test.jpg' }, dt: 180000 });
const playlist = { id: 42, name: 'Private list', trackCount: 205, specialType: 5, creator: { userId: 88 },
  coverImgUrl: 'http://p1.music.126.net/list.jpg', trackIds: Array.from({ length: 205 }, (_, i) => ({ id: i + 1 })) };
let userPlaylists = [playlist];
const context = vm.createContext({ console, Date: TestDate, Widget: {
  storage: { get: k => storage.get(k), set: (k, v) => storage.set(k, v), remove: k => storage.delete(k) },
  http: { get: async (url, options) => {
    calls.push({ url, options });
    const q = options.params;
    let body;
    if (/\/mv\/(toplist|all|first)$/.test(url)) return { data: { code: 200, data: [{ id: 777, name: 'MV Test', cover: 'http://p1.music.126.net/mv.jpg' }] } };
    if (url.endsWith('/v1/mv/detail')) return { data: { code: 200, data: { id: 777, name: 'MV Test' } } };
    if (url.endsWith('/song/enhance/play/mv/url')) return { data: { code: 200, data: { id: wrongId ? 999 : 777, url: denied ? null : 'http://vod.126.net/mv.mp4', r: 1080 } } };
    if (url.endsWith('/nuser/account/get')) body = expired ? { code: 200, profile: null } : { code: 200, profile: { userId: accountUser, nickname: 'Test' } };
    else if (url.endsWith('/user/playlist')) body = { code: 200, playlist: userPlaylists };
    else if (url.endsWith('/song/like/get')) body = { code: 200, ids: Array.from({ length: 105 }, (_, i) => i + 1) };
    else if (url.endsWith('/v3/song/detail')) body = { code: 200, songs: JSON.parse(q.c).map(x => song(x.id)).reverse() };
    else if (url.endsWith('/v6/playlist/detail')) body = { code: 200, playlist };
    else if (url.endsWith('/v1/radio/get')) body = { code: 200, data: [song(333)] };
    else if (url.endsWith('/search/get')) body = { code: 200, result: { songs: [song(444)] } };
    else if (url.endsWith('/v1/discovery/recommend/resource')) body = { code: 200, recommend: [playlist] };
    else if (url.endsWith('/v3/discovery/recommend/songs')) body = { code: 200, data: { dailySongs: [song(10), song(20), song(30), song(10)] } };
    else if (url.endsWith('/playmode/intelligence/list')) body = { code: 200, data: emptyHeart ? [] : Array.from({ length: 145 }, (_, i) => ({ songInfo: song(heartBase + i) })) };
    else if (url.endsWith('/toplist')) body = { code: 200, list: [{ ...playlist, name: '云音乐热歌榜' }, { ...playlist, name: '飙升榜' }] };
    else if (url.endsWith('/song/enhance/player/url/v1')) body = { code: 200, data: JSON.parse(q.ids).map(id => ({
      id: wrongId ? 999 : id, url: denied ? null : 'http://m7.music.126.net/audio-' + id + '.mp3?signature=fixture',
      fee: 1, freeTrialInfo: trial ? { start: 0, end: 30 } : null, level: downgrade ? 'standard' : q.level, br: 320000
    })).reverse() };
    else throw Error('Unmocked request');
    return { statusCode: 200, data: JSON.stringify(body) };
  } }
} });
vm.runInContext(fs.readFileSync(target, 'utf8'), context);

async function main() {
  assert.equal(context.WidgetMetadata.id, 'mlitm.netease.account');
  assert.deepEqual(Array.from(context.WidgetMetadata.modules.filter(m => !m.type), m => m.id),
    ['playlists', 'recommended', 'daily', 'hot', 'mvTop', 'mvLibrary', 'mvLatest', 'account']);
  for (const fn of ['loadMvTop', 'loadMvLibrary', 'loadMvLatest']) {
    assert.equal((await context[fn]({ page: 2 }))[0].link, 'ncm:mv:777');
  }
  assert.equal(calls.find(c => c.url.endsWith('/mv/toplist')).options.params.offset, 30);
  await context.loadMvLibrary({ area: '日本', mvType: '现场版', order: '最新' });
  assert.equal(calls.filter(c => c.url.endsWith('/mv/all')).at(-1).options.params.type, '现场版');
  assert.equal(calls.find(c => c.url.endsWith('/mv/first')).options.params.area, undefined);
  assert.equal((await context.loadDetail('ncm:mv:777')).videoUrl, 'https://vod.126.net/mv.mp4');
  assert.equal((await context.loadResource({ link: 'ncm:mv:777' }))[0].url, 'https://vod.126.net/mv.mp4');
  wrongId = true;
  await assert.rejects(context.loadResource({ link: 'ncm:mv:777' }), /暂无可播放/);
  wrongId = false; denied = true;
  await assert.rejects(context.loadResource({ link: 'ncm:mv:777' }), /暂无可播放/);
  denied = false;
  for (const m of context.WidgetMetadata.modules) assert.equal(typeof context[m.functionName], 'function');
  await assert.rejects(context.loadAccount({}), /Cookie/);
  const cookie = 'MUSIC_U=fixture-only; __csrf=fixture-csrf';
  const account = await context.loadAccount({ cookie, quality: 'lossless' });
  assert.match(account[0].title, /Test/);
  const lists = await context.loadMyPlaylists({ page: 2 });
  assert.equal(lists[0].link, 'ncm:playlist:42');
  let sent = calls.find(c => c.url.endsWith('/user/playlist'));
  assert.equal(sent.options.params.uid, 88);
  assert.equal(sent.options.params.offset, 30);
  assert.equal(sent.options.headers.Cookie, cookie);
  assert.equal(sent.options.params.csrf_token, 'fixture-csrf');
  let detail = await context.loadDetail(lists[0].link);
  assert.equal(detail.id, lists[0].id);
  assert.equal(detail.episodeItems.length, 100);
  assert.equal(detail.episodeItems[0].link, 'ncm:song:1');
  assert.equal(detail.episodeItems[99].link, 'ncm:song:100');
  assert.equal(detail.episodeItems[0].videoUrl, 'https://m7.music.126.net/audio-1.mp3?signature=fixture');
  assert.equal(detail.episodeItems[1].videoUrl, 'https://m7.music.126.net/audio-2.mp3?signature=fixture');
  assert.equal(detail.episodeItems[99].videoUrl, 'https://m7.music.126.net/audio-100.mp3?signature=fixture');
  assert.equal(detail.episodeItems[1].customHeaders.Cookie, undefined);
  sent = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1);
  assert.deepEqual(JSON.parse(sent.options.params.ids), Array.from({ length: 100 }, (_, i) => i + 1));
  assert.equal(detail.relatedItems[0].link, 'ncm:playlist:42:100');
  detail = await context.loadDetail(detail.relatedItems[0].link);
  assert.equal(detail.episodeItems[0].link, 'ncm:song:101');
  assert.equal(detail.episodeItems[0].episode, 101);
  assert.match(detail.episodeItems[0].videoUrl, /audio-101\.mp3/);
  detail = await context.loadDetail(detail.relatedItems[0].link);
  assert.equal(detail.episodeItems.length, 5);
  assert.equal(detail.relatedItems.length, 1);
  assert.equal(detail.relatedItems[0].link, 'ncm:playlist:42:100');
  const liked = await context.loadLiked({ page: 2 });
  assert.equal(liked.length, 5);
  assert.equal(liked[0].link, 'ncm:song:101');
  assert.equal(liked[0].coverUrl, 'https://p1.music.126.net/test.jpg');
  assert.equal(liked[0].poster_path, undefined);
  assert.equal((await context.loadPersonalFM({}))[0].link, 'ncm:song:333');
  assert.equal((await context.search({ keyword: 'Test', page: 2 }))[0].link, 'ncm:song:444');
  sent = calls.find(c => c.url.endsWith('/search/get'));
  assert.equal(sent.options.params.offset, 30);
  const beforeDetail = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length;
  const songDetail = await context.loadDetail('ncm:song:101');
  assert.match(songDetail.videoUrl, /audio-101\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length, beforeDetail + 1);
  let resources = await context.loadResource({ link: liked[0].link });
  assert.match(resources[0].url, /^https:\/\//);
  assert.equal(resources[0].customHeaders.Referer, 'https://music.163.com/');
  assert.equal(resources[0].url, 'https://m7.music.126.net/audio-101.mp3?signature=fixture');
  assert.equal(resources[0].customHeaders['X-Forward-Skip-Redirect-Probe'], undefined);
  assert.equal(resources[0].customHeaders.Cookie, undefined);
  assert.equal(resources[0].playerType, 'app');
  downgrade = true;
  const fallback = await context.loadResource({ link: 'ncm:song:101' });
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0].name, '网易云 · 标准');
  assert.match(fallback[0].description, /^720p/);
  downgrade = false;
  sent = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1);
  assert.equal(sent.options.params.ids, '[101]');
  assert.deepEqual(Array.from(resources, r => r.name), ['网易云 · 无损', '网易云 · 极高', '网易云 · 标准']);
  assert.deepEqual(Array.from(resources, r => r.description.split(' | ')[0]), ['4k', '1080p', '720p']);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1') && c.options.params.level === 'lossless').at(-1).options.params.encodeType, 'flac');
  assert.equal(sent.options.headers.Cookie, cookie + '; os=pc');
  await context.loadResource({ link: 'ncm:song:101', cookie: cookie + '; os=android' });
  sent = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1);
  assert.equal(sent.options.headers.Cookie, cookie + '; os=pc');
  assert.equal(JSON.parse(storage.get('ncm.account.v1')).cookie, cookie + '; os=android');
  assert.equal((await context.loadRecommendedPlaylists({}))[0].link, 'ncm:playlist:42');
  const dailySongs = await context.loadDaily({});
  assert.deepEqual(Array.from(dailySongs, s => s.title), ['Song 10', 'Song 20', 'Song 30']);
  assert.equal(dailySongs[1].link, dailySongs[0].link + ':1');
  assert.equal(dailySongs[2].link, dailySongs[0].link + ':2');
  assert.equal(JSON.parse(storage.get('ncm.queues.v1')).length, 1);
  for (const item of dailySongs) {
    assert.equal(item.id, item.link);
    assert.equal(item.mediaType, 'tv');
    assert.equal(item.type, 'url');
    assert.match(item.coverUrl, /^https:/);
    assert.equal(item.episodeItems, undefined);
  }
  const dailyTail = await context.loadDetail(dailySongs[1].link);
  assert.deepEqual(Array.from(dailyTail.episodeItems, s => s.link), ['ncm:song:20', 'ncm:song:30']);
  assert.equal(dailyTail.episodeItems[0].episode, 2);
  assert.equal(dailyTail.episodeItems[1].episode, 3);
  assert.match(dailyTail.episodeItems[0].videoUrl, /audio-20\.mp3/);
  assert.match(dailyTail.episodeItems[1].videoUrl, /audio-30\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[20,30]');
  // Existing daily queue links remain readable after the card layout changes.
  const daily = context.ncmSaveQueue('每日推荐', [song(10), song(20)], { userId: 88 })[0];
  let queue = await context.loadDetail(daily.link);
  assert.equal(queue.mediaType, 'tv');
  assert.equal(queue.episodeItems.length, 2);
  assert.equal(queue.episodeItems[1].link, 'ncm:song:20');
  assert.match(queue.episodeItems[1].videoUrl, /audio-20\.mp3/);
  const dailyRequests = calls.filter(c => c.url.endsWith('/v3/discovery/recommend/songs')).length;
  await context.loadDetail(daily.link);
  assert.equal(calls.filter(c => c.url.endsWith('/v3/discovery/recommend/songs')).length, dailyRequests);
  const roam = (await context.loadRoam({ mode: 'SCENE_RCMD', scene: 'FOCUS' }))[0];
  sent = calls.filter(c => c.url.endsWith('/v1/radio/get')).at(-1);
  assert.equal(sent.options.params.mode, 'SCENE_RCMD');
  assert.equal(sent.options.params.subMode, 'FOCUS');
  queue = await context.loadDetail(roam.link);
  assert.equal(queue.episodeItems[0].link, 'ncm:song:333');
  await assert.rejects(context.loadRoam({ mode: 'invalid' }), /模式无效/);
  await assert.rejects(context.loadRoam({ mode: 'SCENE_RCMD', scene: 'invalid' }), /场景无效/);
  const legacyHeart = { id: 'legacy-recent', userId: '88', created: clock,
    title: '心动模式', cover: '', ids: ['12'] };
  const legacyCached = { ...legacyHeart, id: 'legacy-cached', ids: ['13'] };
  storage.set('ncm.queues.v1', JSON.stringify([...JSON.parse(storage.get('ncm.queues.v1')), legacyHeart]));
  storage.set('ncm.heart.daily.v1', JSON.stringify({ userId: '88', day: '2026-11-08', queues: { seed: legacyCached } }));
  const heart = (await context.loadHeart({}))[0];
  assert.equal(heart.id, 'ncm:heart');
  assert.equal(heart.link, 'ncm:heart');
  assert.equal(storage.has('ncm.heart.daily.v1'), false);
  assert.equal((await context.loadDetail('ncm:queue:legacy-recent')).id, heart.id);
  const savedHeartEpisode = (await context.loadDetail('ncm:queue:legacy-cached:100')).episodeItems[0];
  assert.equal(savedHeartEpisode.link, 'ncm:heart:1');
  assert.equal(savedHeartEpisode.title, 'Song 500');
  let heartRequests = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length;
  heartBase = 700;
  assert.equal((await context.loadHeart({}))[0].link, heart.link);
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, heartRequests + 1);
  assert.equal((await context.loadDetail(heart.link)).episodeItems[0].link, savedHeartEpisode.link);
  assert.equal((await context.loadDetail('ncm:queue:legacy-recent')).episodeItems[0].title, 'Song 700');
  assert.equal((await context.loadDetail(savedHeartEpisode.link)).title, 'Song 700');
  for (const p of [
    { link: savedHeartEpisode.link, id: savedHeartEpisode.id, season: 1, episode: 1 },
    { link: 'ncm:heart', season: 1, episode: 101 },
    { link: 'ncm:queue:legacy-recent', season: 1, episode: 1 }
  ]) {
    const result = await context.loadResource(p);
    const expected = p.episode === 101 ? 800 : 700;
    assert.match(result[0].url, new RegExp('audio-' + expected + '\\.mp3'));
    assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[' + expected + ']');
  }
  await assert.rejects(context.loadResource({ link: 'ncm:heart:146' }), /没有这一集/);
  const playerCalls = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length;
  assert.match((await context.loadResource({ link: daily.link, episode: 2, season: 1 }))[0].url, /audio-20\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[20]');
  assert.match((await context.loadResource({ link: 'ncm:playlist:42:100', episode: 108, season: 1 }))[0].url, /audio-108\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[108]');
  await assert.rejects(context.loadResource({ link: 'ncm:playlist:42', episode: 206 }), /没有这一集/);
  await assert.rejects(context.loadResource({ link: 'ncm:queue:unknown-heart', episode: 1, seriesName: '心动模式' }), /队列已过期/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length, playerCalls + 6);
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, heartRequests + 1);
  assert.equal(context.ncmBeijingDay, undefined);
  clock += 1;
  const nextDayHeart = (await context.loadHeart({}))[0];
  assert.equal(nextDayHeart.id, heart.id);
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, heartRequests + 2);
  const otherSeedHeart = (await context.loadHeart({ playlistId: '42', songId: '2' }))[0];
  assert.equal(otherSeedHeart.id, heart.id);
  sent = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).at(-1);
  assert.equal(sent.options.params.songId, '2');
  assert.equal(sent.options.params.startMusicId, '2');
  for (let i = 0; i < 13; i++) await context.loadRoam({});
  assert.equal(JSON.parse(storage.get('ncm.queues.v1')).length, 12);
  assert.equal((await context.loadDetail('ncm:queue:legacy-recent')).episodeItems[0].title, 'Song 700');
  expired = true;
  await assert.rejects(context.loadHeart({}), /未识别登录/);
  expired = false;
  clock += 86400000;
  emptyHeart = true;
  await assert.rejects(context.loadHeart({}), /暂未返回歌曲/);
  assert.equal((await context.loadDetail(heart.link)).episodeItems[0].title, 'Song 700');
  emptyHeart = false;
  heartRequests = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length;
  const retryHeart = (await context.loadHeart({}))[0];
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, heartRequests + 1);
  accountUser = 99;
  await assert.rejects(context.loadDetail(retryHeart.link), /未找到我喜欢/);
  await assert.rejects(context.loadDetail('ncm:queue:legacy-recent'), /队列已过期/);
  await assert.rejects(context.loadResource({ link: 'ncm:queue:legacy-recent', episode: 1 }), /队列已过期/);
  accountUser = 88;
  sent = calls.find(c => c.url.endsWith('/playmode/intelligence/list'));
  assert.equal(sent.options.params.playlistId, '42');
  assert.equal(sent.options.params.songId, '1');
  assert.equal(sent.options.params.startMusicId, '1');
  queue = await context.loadDetail((await context.loadHeart({}))[0].link);
  assert.equal(queue.episodeItems.length, 145);
  assert.equal(queue.episodeItems[0].link, 'ncm:heart:1');
  assert.equal(queue.episodeItems[0].title, 'Song 700');
  assert.equal(queue.episodeItems[100].link, 'ncm:heart:101');
  assert.equal(queue.episodeItems[100].title, 'Song 800');
  assert.equal(queue.episodeItems[100].episode, 101);
  assert.equal(queue.relatedItems.length, 0);
  assert.match(queue.episodeItems[144].videoUrl, /audio-844\.mp3/);
  storage.delete('ncm.heart.current.v1');
  heartRequests = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length;
  assert.equal((await context.loadDetail(heart.link)).id, heart.id);
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, heartRequests + 1);
  const heartCalls = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length;
  await assert.rejects(context.loadHeart({ playlistId: '42', songId: '999' }), /不在所选歌单/);
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, heartCalls);
  assert.equal((await context.loadHot({})).length, 1);
  accountUser = 99;
  await assert.rejects(context.loadDetail(daily.link), /队列已过期/);
  accountUser = 88;
  const queues = JSON.parse(storage.get('ncm.queues.v1'));
  queues.forEach(q => { q.created = 0; });
  storage.set('ncm.queues.v1', JSON.stringify(queues));
  await assert.rejects(context.loadDetail(daily.link), /队列已过期/);
  for (const p of [{}, { id: 550 }, { id: 'tt1234' }, { link: 'other:1' },
    { link: 'https://evil.test/ncm:song:1' }, { link: 'https://music.163.com.evil.test/song?id=1' },
    { link: 'ncm:song:1:2' }, { link: 'ncm:song:0' }, { link: 'ncm:playlist:42' },
    { link: daily.link }, { link: heart.link }, { link: 'ncm:queue:bad' },
    { link: 'ncm:heart:0' }, { link: 'ncm:heart:01' }, { link: 'ncm:heart:1:2' },
    { link: 'ncm:heart', episode: 0 }, { link: 'ncm:heart', episode: 1.5 },
    { link: 'ncm:heart:1', season: 2 }, { link: 'ncm:heart', episode: 'bad' },
    { link: '', id: 'ncm:song:1' }, { videoUrl: 'https://evil.test/a.mp3' },
    { link: 'invalid', id: 'ncm:song:1' }]) {
    const before = calls.length;
    assert.equal((await context.loadResource(p)).length, 0);
    assert.equal(calls.length, before);
  }
  const before = calls.length;
  assert.equal(await context.loadDetail('ncm:song:1?x=2'), null);
  assert.equal(calls.length, before);
  trial = true;
  detail = await context.loadDetail('ncm:playlist:42');
  assert.ok(detail.episodeItems.every(item => item.videoUrl === undefined));
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /试听/);
  await assert.rejects(context.loadDetail('ncm:song:1'), /试听/);
  trial = false; denied = true;
  detail = await context.loadDetail('ncm:playlist:42');
  assert.ok(detail.episodeItems.every(item => item.videoUrl === undefined));
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /无法播放/);
  denied = false; wrongId = true;
  detail = await context.loadDetail('ncm:playlist:42');
  assert.ok(detail.episodeItems.every(item => item.videoUrl === undefined));
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /无法播放/);
  wrongId = false; expired = true;
  await assert.rejects(context.loadPersonalFM({}), /未识别登录/);
  expired = false;
  userPlaylists = [{ ...playlist, id: 43, name: 'DJ', specialType: 0 }, playlist,
    { ...playlist, id: 44, creator: { userId: 99 } }];
  const beforeHeartRefresh = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length;
  const arranged = await context.loadMyPlaylists({ page: 1 });
  assert.deepEqual(Array.from(arranged, item => item.link),
    ['ncm:playlist:42', 'ncm:heart', 'ncm:playlist:43', 'ncm:playlist:44']);
  assert.equal(arranged[1].title, '心动模式');
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, beforeHeartRefresh + 1);
  assert.equal((await context.loadDetail(arranged[1].link)).id, heart.id);
  assert.equal((await context.loadMyPlaylists({ page: 2 })).some(item => item.link === 'ncm:heart'), false);
  emptyHeart = true;
  assert.equal((await context.loadMyPlaylists({}))[1].link, 'ncm:heart');
  storage.delete('ncm.heart.current.v1');
  assert.equal((await context.loadMyPlaylists({}))[1].description, '根据我喜欢的音乐推荐');
  emptyHeart = false;
  userPlaylists = [{ ...playlist, creator: { userId: 99 } }];
  const beforeForeign = calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length;
  assert.equal((await context.loadMyPlaylists({})).some(item => item.link === 'ncm:heart'), false);
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, beforeForeign);
  userPlaylists = [playlist];
  await context.loadAccount({ action: 'clear' });
  assert.equal(storage.size, 0);
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /Cookie/);
  const bareMusicU = 'A'.repeat(256);
  await context.loadAccount({ cookie: bareMusicU });
  sent = calls.filter(c => c.url.endsWith('/nuser/account/get')).at(-1);
  assert.equal(sent.options.headers.Cookie, 'MUSIC_U=' + bareMusicU);
  await context.loadResource({ link: 'ncm:song:101' });
  sent = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1);
  assert.equal(sent.options.headers.Cookie, 'MUSIC_U=' + bareMusicU + '; os=pc');
  assert.equal((await context.loadLiked({ page: 1 })).length, 100);
  assert.ok(calls.every(c => c.url.startsWith('https://music.163.com/api/')));
  console.log('PASS: account, queue playback, recommendations, stable heart episode resume after refresh, latest-list history aliases, full heart list, failed refresh retention, source/account isolation and playback rights');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
