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
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [clock])); }
  static now() { return clock; }
}
const song = id => ({ id: Number(id), name: 'Song ' + id, fee: 1,
  ar: [{ id: 91, name: 'Artist' }], al: { id: 73, name: 'Album', picUrl: 'http://p1.music.126.net/test.jpg' }, dt: 180000 });
const playlist = { id: 42, name: 'Private list', trackCount: 205, specialType: 5, creator: { userId: 88 },
  coverImgUrl: 'http://p1.music.126.net/list.jpg', trackIds: Array.from({ length: 205 }, (_, i) => ({ id: i + 1 })) };
let userPlaylists = [playlist];
let playlistDetail = playlist, missingSong;
const album = { id: 73, name: 'Collected album', size: 105,
  artists: [{ name: 'Album artist' }], picUrl: 'http://p1.music.126.net/album.jpg' };
let albumList = [album], albumWrongId = false, albumIncomplete = false;
const albumSongs = Array.from({ length: 105 }, (_, i) => song(1001 + i));
async function request({ url, ...options }) {
    calls.push({ url, options });
    const q = options.params;
    let body;
    if (/\/mv\/(toplist|all|first)$/.test(url)) return { data: { code: 200, data: [{ id: 777, name: 'MV Test', cover: 'http://p1.music.126.net/mv.jpg' }] } };
    if (url.endsWith('/v1/mv/detail')) return { data: { code: 200, data: { id: 777, name: 'MV Test' } } };
    if (url.endsWith('/song/enhance/play/mv/url')) return { data: { code: 200, data: { id: wrongId ? 999 : 777, url: denied ? null : 'http://vod.126.net/mv.mp4', r: 1080 } } };
    if (url.endsWith('/nuser/account/get')) body = expired ? { code: 200, profile: null } : { code: 200, profile: { userId: accountUser, nickname: 'Test' } };
    else if (url.endsWith('/user/playlist')) body = { code: 200, playlist: userPlaylists };
    else if (url.endsWith('/album/sublist')) body = { code: 200, data: albumList };
    else if (url.endsWith('/v1/artist/91')) body = { code: 200,
      artist: { id: 91, name: 'Artist', picUrl: 'http://p1.music.126.net/artist.jpg' }, hotSongs: [song(1)] };
    else if (url.endsWith('/artist/albums/91')) body = { code: 200, hotAlbums: q.offset ? [] : [album] };
    else if (url.endsWith('/v1/album/73')) body = { code: 200,
      album: { ...album, id: albumWrongId ? 74 : 73 }, songs: albumIncomplete ? albumSongs.slice(0, 1) : albumSongs };
    else if (url.endsWith('/song/like/get')) body = { code: 200, ids: Array.from({ length: 105 }, (_, i) => i + 1) };
    else if (url.endsWith('/v3/song/detail')) body = { code: 200, songs: JSON.parse(q.c).filter(x => x.id !== missingSong).map(x => song(x.id)).reverse() };
    else if (url.endsWith('/v6/playlist/detail')) body = { code: 200,
      playlist: q.id === '43' ? { ...playlist, id: 43, specialType: 0, trackIds: [{ id: 33 }, { id: 22 }] } : playlistDetail };
    else if (url.endsWith('/v1/radio/get')) body = { code: 200, data: [song(333)] };
    else if (url.endsWith('/search/get')) body = { code: 200, result: { songs: [song(444)] } };
    else if (url.endsWith('/v1/discovery/recommend/resource')) body = { code: 200, recommend: [playlist] };
    else if (url.endsWith('/v3/discovery/recommend/songs')) body = { code: 200, data: { dailySongs: [song(10), song(20), song(30), song(10)] } };
    else if (url.endsWith('/playmode/intelligence/list')) body = { code: 200, data: emptyHeart ? [] : Array.from({ length: 145 }, (_, i) => ({ songInfo: song(heartBase + i) })) };
    else if (url.endsWith('/song/lyric')) body = { code: 200, lrc: {
      lyric: q.id === '21' ? '[00:01.00]中文歌词' : q.id === '22' ? '' : '[00:01.00]first line\n[00:04.50]second line'
    } };
    else if (url.endsWith('/toplist')) body = { code: 200, list: [{ ...playlist, name: '云音乐热歌榜' }, { ...playlist, name: '飙升榜' }] };
    else if (url.endsWith('/song/enhance/player/url/v1')) body = { code: 200, data: JSON.parse(q.ids).map(id => ({
      id: wrongId ? 999 : id, url: denied ? null : 'http://m7.music.126.net/audio-' + id + '.mp3?signature=fixture',
      fee: 1, freeTrialInfo: trial ? { start: 0, end: 30 } : null, level: q.level, br: 320000
    })).reverse() };
    else throw Error('Unmocked request');
    return { statusCode: 200, data: JSON.stringify(body) };
}
const context = vm.createContext({ console, Date: TestDate, Widget: {
  storage: { get: k => storage.get(k), set: (k, v) => storage.set(k, v), remove: k => storage.delete(k), keys: () => [...storage.keys()] },
  http: { request, get: (url, options) => request({ url, ...options }) }
} });
vm.runInContext(fs.readFileSync(target, 'utf8'), context);

async function main() {
  assert.equal(context.WidgetMetadata.id, 'mlitm.netease.account');
  assert.equal(context.WidgetMetadata.contentType, 'music');
  assert.deepEqual(Array.from(context.WidgetMetadata.modules.filter(m => !m.type), m => m.id),
    ['playlists', 'likedSongs', 'albums', 'recommended', 'daily', 'hot', 'mvTop', 'mvLibrary', 'mvLatest', 'account']);
  for (const fn of ['loadMvTop', 'loadMvLibrary', 'loadMvLatest']) {
    assert.equal((await context[fn]({ page: 2 }))[0].link, 'ncm:mv:777');
  }
  assert.equal(calls.find(c => c.url.endsWith('/mv/toplist')).options.params.offset, 30);
  await context.loadMvLibrary({ area: '日本', mvType: '现场版', order: '最新' });
  assert.equal(calls.filter(c => c.url.endsWith('/mv/all')).at(-1).options.params.type, '现场版');
  assert.equal(calls.find(c => c.url.endsWith('/mv/first')).options.params.area, undefined);
  assert.equal((await context.loadDetail('ncm:mv:777')).videoUrl, 'https://vod.126.net/mv.mp4');
  const [mvResource] = await context.loadResource({ link: 'ncm:mv:777' });
  assert.equal(mvResource.url, 'https://vod.126.net/mv.mp4');
  assert.equal(mvResource.subtitles, undefined);
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
  const albums = await context.loadMyAlbums({ page: 2 });
  assert.equal(albums[0].link, 'ncm:album:73');
  assert.equal(albums[0].title, 'Collected album');
  assert.match(albums[0].description, /Album artist.*105/);
  assert.equal(albums[0].coverUrl, 'https://p1.music.126.net/album.jpg');
  let albumRequest = calls.find(c => c.url.endsWith('/album/sublist'));
  assert.equal(albumRequest.options.params.offset, 30);
  assert.equal(albumRequest.options.params.limit, 30);
  assert.equal(albumRequest.options.headers.Cookie, cookie);
  assert.equal(albumRequest.options.params.csrf_token, 'fixture-csrf');
  let albumDetail = await context.loadDetail(albums[0].link);
  assert.equal(albumDetail.id, albums[0].id);
  assert.equal(albumDetail.episodeItems.length, 100);
  assert.equal(albumDetail.episodeItems[0].link, 'ncm:song:1001');
  assert.ok(albumDetail.episodeItems[99].externalSubtitles[0].url.endsWith('/netease/1100.lrc'));
  assert.equal(albumDetail.episodeItems[0].customHeaders.Cookie, undefined);
  assert.equal(albumDetail.relatedItems[0].link, 'ncm:album:73:100');
  albumDetail = await context.loadDetail(albumDetail.relatedItems[0].link);
  assert.equal(albumDetail.episodeItems.length, 5);
  assert.equal(albumDetail.episodeItems[0].episode, 101);
  assert.equal(albumDetail.episodeItems[0].link, 'ncm:song:1101');
  assert.equal(albumDetail.relatedItems[0].link, 'ncm:album:73');
  assert.match((await context.loadResource({ link: 'ncm:album:73:100', episode: 103 }))[0].url, /audio-1103\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[1103]');
  await assert.rejects(context.loadResource({ link: 'ncm:album:73', episode: 106 }), /没有这一集/);
  albumWrongId = true;
  await assert.rejects(context.loadDetail('ncm:album:73'), /专辑不存在/);
  await assert.rejects(context.loadResource({ link: 'ncm:album:73', episode: 1 }), /专辑不存在/);
  albumWrongId = false; albumIncomplete = true;
  await assert.rejects(context.loadDetail('ncm:album:73'), /完整专辑/);
  albumIncomplete = false; albumList = [];
  assert.equal((await context.loadMyAlbums({})).length, 0);
  albumList = [album]; expired = true;
  await assert.rejects(context.loadMyAlbums({}), /未识别登录/);
  expired = false;
  const lists = await context.loadMyPlaylists({ page: 2 });
  assert.equal(lists[0].link, 'ncm:playlist:42');
  assert.equal(lists[0].mediaType, 'genre');
  let sent = calls.find(c => c.url.endsWith('/user/playlist'));
  assert.equal(sent.options.params.uid, 88);
  assert.equal(sent.options.params.offset, 30);
  assert.equal(sent.options.headers.Cookie, cookie);
  assert.equal(sent.options.params.csrf_token, 'fixture-csrf');
  const beforePlaylistDetail = calls.length;
  let detail = await context.loadDetail(lists[0].link);
  const warmedLyrics = calls.slice(beforePlaylistDetail).filter(c => c.url.endsWith('/song/lyric'));
  assert.deepEqual(warmedLyrics.map(c => c.options.params.id), ['1', '2']);
  assert.ok(warmedLyrics.every(c => c.options.timeout === 1 && c.options.headers.Cookie === undefined));
  const beforeNextSubtitle = calls.length;
  assert.match((await context.loadSubtitle({ link: 'ncm:song:2' }))[0].content, /^\[00:01\.00\]/);
  assert.equal(calls.length, beforeNextSubtitle);
  assert.equal(detail.id, lists[0].id);
  assert.equal(detail.episodeItems.length, 100);
  assert.equal(detail.episodeItems[0].link, 'ncm:song:1');
  assert.equal(detail.episodeItems[99].link, 'ncm:song:100');
  assert.ok(detail.episodeItems[0].externalSubtitles[0].url.endsWith('/netease/1.lrc'));
  assert.ok(detail.episodeItems[1].externalSubtitles[0].url.endsWith('/netease/2.lrc'));
  assert.ok(detail.episodeItems[99].externalSubtitles[0].url.endsWith('/netease/100.lrc'));
  assert.equal(detail.mediaType, 'album');
  assert.equal(detail.tracks.length, 205);
  assert.match(detail.tracks[204].videoUrl, /audio-205\.mp3/);
  assert.match(detail.tracks[204].externalSubtitles[0].url, /\/205\.lrc$/);
  assert.equal(detail.episodeItems[1].customHeaders.Cookie, undefined);
  const playlistBatches = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).slice(-3);
  assert.deepEqual(playlistBatches.flatMap(c => JSON.parse(c.options.params.ids)), Array.from({ length: 205 }, (_, i) => i + 1));
  assert.equal(detail.relatedItems[0].link, 'ncm:playlist:42:100');
  detail = await context.loadDetail(detail.relatedItems[0].link);
  assert.equal(detail.episodeItems[0].link, 'ncm:song:101');
  assert.equal(detail.episodeItems[0].episode, 101);
  assert.ok(detail.episodeItems[0].externalSubtitles[0].url.endsWith('/netease/101.lrc'));
  detail = await context.loadDetail(detail.relatedItems[0].link);
  assert.equal(detail.episodeItems.length, 5);
  assert.equal(detail.relatedItems.length, 1);
  assert.equal(detail.relatedItems[0].link, 'ncm:playlist:42:100');
  const liked = await context.loadLiked({ page: 2 });
  assert.equal(liked.length, 5);
  assert.equal(liked[0].link, 'ncm:song:101');
  assert.equal(liked[0].coverUrl, 'https://p1.music.126.net/test.jpg');
  assert.equal(liked[0].poster_path, undefined);
  const likedNative = await context.loadLikedSongs({ page: 3 });
  assert.deepEqual(Array.from(likedNative, item => [item.link, item.mediaType, item.episode]),
    [201, 202, 203, 204, 205].map(id => ['ncm:song:' + id, 'song', undefined]));
  assert.match(likedNative[0].videoUrl, /audio-201\.mp3/);
  assert.match(likedNative[0].externalSubtitles[0].url, /\/201\.lrc$/);
  assert.equal((await context.loadLikedSongs({ page: 4 })).length, 0);
  const [likedDirectory] = await context.loadMusicGenres({});
  assert.equal(likedDirectory.mediaType, 'genre');
  assert.equal(likedDirectory.link, 'ncm:playlist:42');
  const browse = { genreId: likedDirectory.link };
  const browseSongs = await context.loadMusicGenres({ ...browse, section: 'songs', page: 2 });
  assert.deepEqual(Array.from(browseSongs, song => song.link),
    Array.from({ length: 20 }, (_, i) => 'ncm:song:' + (21 + i)));
  assert.equal(browseSongs[0].subtitle, 'Artist');
  assert.equal(browseSongs[0].videoUrl, undefined);
  const inlineUrl = browseSongs[0].externalSubtitles[0].url;
  assert.match(inlineUrl, /^data:text\/plain;charset=utf-8;base64,/);
  assert.equal(Buffer.from(inlineUrl.split(',')[1], 'base64').toString('utf8'), '[00:01.00]中文歌词');
  assert.match(browseSongs[1].externalSubtitles[0].url, /\/22\.lrc$/);
  const [nextBrowseResource] = await context.loadResource({ link: browseSongs[2].link });
  assert.match(nextBrowseResource.url, /audio-23\.mp3/);
  assert.match(nextBrowseResource.subtitles[0].url, /\/23\/\d+\.lrc$/);
  assert.match(nextBrowseResource.subtitles[0].content, /^\[00:01\.00\]/);
  assert.equal((await context.loadMusicGenres({ ...browse, section: 'songs', offset: 205 })).length, 0);
  assert.deepEqual(Array.from(await context.loadMusicGenres({ ...browse, section: 'albums' }), item => item.link), ['ncm:album:73']);
  assert.equal((await context.loadMusicGenres({ ...browse, section: 'albums', page: 2 })).length, 0);
  const [browseArtist] = await context.loadMusicGenres({ ...browse, section: 'artists' });
  assert.equal(browseArtist.id, browseSongs[0].peoples[0].id);
  assert.equal(browseArtist.avatar, 'https://p1.music.126.net/artist.jpg');
  assert.equal((await context.loadMusicArtists({ peopleId: browseArtist.id, section: 'profile' }))[0].id, browseArtist.id);
  assert.equal((await context.loadMusicArtists({ peopleId: browseArtist.id, section: 'songs' }))[0].link, 'ncm:song:1');
  assert.equal((await context.loadMusicArtists({ peopleId: browseArtist.id, section: 'albums' }))[0].link, 'ncm:album:73');
  assert.equal((await context.loadMusicGenres({ ...browse, section: 'unknown' })).length, 0);
  accountUser = 99;
  assert.equal((await context.loadMusicGenres({ ...browse, section: 'songs' })).length, 0);
  accountUser = 88;
  assert.equal((await context.loadPersonalFM({}))[0].link, 'ncm:song:333');
  assert.equal((await context.search({ keyword: 'Test', page: 2 }))[0].link, 'ncm:song:444');
  sent = calls.find(c => c.url.endsWith('/search/get'));
  assert.equal(sent.options.params.offset, 30);
  const beforeDetail = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length;
  const songDetail = await context.loadDetail('ncm:song:101');
  assert.match(songDetail.externalSubtitles[0].url, /^data:text\/plain;charset=utf-8;base64,/);
  assert.equal(songDetail.videoUrl, undefined);
  assert.equal(songDetail.externalSubtitles[0].isDefault, true);
  assert.equal(Object.keys(songDetail.externalSubtitles[0].headers).length, 0);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length, beforeDetail + 1);
  let resources = await context.loadResource({ link: liked[0].link });
  assert.match(resources[0].url, /^https:\/\//);
  assert.equal(resources[0].customHeaders.Referer, 'https://music.163.com/');
  assert.equal(resources[0].url, 'https://m7.music.126.net/audio-101.mp3?signature=fixture');
  assert.equal(resources[0].customHeaders['X-Forward-Skip-Redirect-Probe'], undefined);
  assert.equal(resources[0].customHeaders.Cookie, undefined);
  assert.equal(resources[0].playerType, 'app');
  sent = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1);
  assert.equal(sent.options.params.ids, '[101]');
  assert.equal(sent.options.params.level, 'lossless');
  assert.equal(sent.options.params.encodeType, 'flac');
  assert.equal(sent.options.headers.Cookie, cookie + '; os=pc');
  await context.loadResource({ link: 'ncm:song:101', cookie: cookie + '; os=android' });
  sent = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1);
  assert.equal(sent.options.headers.Cookie, cookie + '; os=pc');
  assert.equal(JSON.parse(storage.get('ncm.account.v1')).cookie, cookie + '; os=android');
  assert.equal((await context.loadRecommendedPlaylists({}))[0].link, 'ncm:playlist:42');
  const nativeDaily = await context.loadDaily({});
  assert.deepEqual(Array.from(nativeDaily, s => [s.id, s.link, s.mediaType]),
    ['10', '20', '30'].map(id => ['ncm:song:' + id, 'ncm:song:' + id, 'song']));
  assert.match(nativeDaily[1].videoUrl, /audio-20\.mp3/);
  assert.match(nativeDaily[1].externalSubtitles[0].url, /\/20\.lrc$/);
  assert.equal(storage.has('ncm.queues.v1'), false);
  const dailySongs = await context.loadDaily({ dailyMode: 'playlist' });
  assert.deepEqual(Array.from(dailySongs, s => s.title), ['Song 10', 'Song 20', 'Song 30']);
  assert.equal(dailySongs[1].link, dailySongs[0].link + ':1');
  assert.equal(dailySongs[2].link, dailySongs[0].link + ':2');
  assert.equal(JSON.parse(storage.get('ncm.queues.v1')).length, 1);
  for (const item of dailySongs) {
    assert.equal(item.id, item.link);
    assert.equal(item.mediaType, 'playlist');
    assert.equal(item.type, 'url');
    assert.match(item.coverUrl, /^https:/);
    assert.equal(item.episodeItems, undefined);
  }
  const dailyTail = await context.loadDetail(dailySongs[1].link);
  assert.deepEqual(Array.from(dailyTail.episodeItems, s => s.link), ['ncm:song:20', 'ncm:song:30']);
  assert.equal(dailyTail.episodeItems[0].episode, 2);
  assert.equal(dailyTail.episodeItems[1].episode, 3);
  assert.ok(dailyTail.episodeItems[0].externalSubtitles[0].url.endsWith('/netease/20.lrc'));
  assert.ok(dailyTail.episodeItems[1].externalSubtitles[0].url.endsWith('/netease/30.lrc'));
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[20,30]');
  // Existing daily queue links remain readable after the card layout changes.
  const daily = context.ncmSaveQueue('每日推荐', [song(10), song(20)], { userId: 88 })[0];
  let queue = await context.loadDetail(daily.link);
  assert.equal(queue.mediaType, 'playlist');
  assert.equal(queue.episodeItems.length, 2);
  assert.equal(queue.episodeItems[1].link, 'ncm:song:20');
  assert.ok(queue.episodeItems[1].externalSubtitles[0].url.endsWith('/netease/20.lrc'));
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
  assert.equal(heart.mediaType, 'album');
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
    assert.match(result[0].subtitles[0].url, new RegExp('/netease/' + expected + '/[0-9]+\\.lrc$'));
    assert.equal(result[0].subtitles[0].content, '[00:01.00]first line\n[00:04.50]second line');
    assert.equal(result[0].subtitles, result[0].externalSubtitles);
    assert.equal(result[0].subtitles, result[0].subtitleTracks);
  }
  await assert.rejects(context.loadResource({ link: 'ncm:heart:146' }), /没有这一集/);
  const lookupsBeforeLyrics = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length;
  const firstLyric = (await context.loadSubtitle({ link: 'ncm:heart:1', episode: 1 }))[0];
  const nextLyric = (await context.loadSubtitle({ link: 'ncm:heart:1', episode: 2 }))[0];
  assert.match(firstLyric.url, /700\/\d+\.lrc$/);
  assert.match(nextLyric.url, /701\/\d+\.lrc$/);
  assert.notEqual(firstLyric.id, nextLyric.id);
  assert.equal(nextLyric.format, 'lrc');
  assert.match(nextLyric.content, /^\[00:01\.00\]/);
  assert.equal(nextLyric.data, nextLyric.content);
  const lyricLookup = calls.find(c => c.url.endsWith('/song/lyric') && c.options.params.id === '701').options;
  assert.equal(lyricLookup.headers.Cookie, undefined);
  assert.equal(lyricLookup.timeout, 1);
  await context.loadSubtitle({ link: 'ncm:song:98765' });
  assert.equal(calls.at(-1).options.params.id, '98765');
  assert.equal(calls.at(-1).options.timeout, 4);
  assert.equal((await context.loadSubtitle({ link: 'ncm:mv:777' })).length, 0);
  assert.equal((await context.loadSubtitle({ link: 'https://example.com/movie', id: 'ncm:song:700' })).length, 0);
  assert.equal((await context.loadSubtitle({ link: 'ncm:heart:146' })).length, 0);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length, lookupsBeforeLyrics);
  const playerCalls = calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length;
  assert.match((await context.loadResource({ link: daily.link, episode: 2, season: 1 }))[0].url, /audio-20\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[20]');
  assert.match((await context.loadResource({ link: 'ncm:playlist:42:100', episode: 108, season: 1 }))[0].url, /audio-108\.mp3/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).at(-1).options.params.ids, '[108]');
  await assert.rejects(context.loadResource({ link: 'ncm:playlist:42', episode: 206 }), /没有这一集/);
  await assert.rejects(context.loadResource({ link: 'ncm:queue:unknown-heart', episode: 1, seriesName: '心动模式' }), /队列已过期/);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length, playerCalls + 2);
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
  assert.ok(queue.episodeItems[144].externalSubtitles[0].url.endsWith('/netease/844.lrc'));
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
    { link: 'ncm:song:1:2' }, { link: 'ncm:song:0' },
    { link: 'ncm:album:0' }, { link: 'ncm:album:73:-1' },
    { link: 'ncm:album:73', episode: 0 }, { link: 'ncm:album:73', episode: 1, season: 2 },
    { link: 'bad', id: 'ncm:album:73', episode: 1 },
    { link: 'ncm:queue:bad' },
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
  assert.equal((await context.loadDetail('ncm:song:1?x=2')).length, 0);
  assert.equal(calls.length, before);
  playlistDetail = { ...playlist, trackIds: [null, { id: 11 }, { id: 22 }, { id: 33 }], trackCount: 3 };
  missingSong = '22';
  const sparseDetail = await context.loadDetail('ncm:playlist:42');
  assert.equal(sparseDetail.mediaType, 'album');
  assert.deepEqual(Array.from(sparseDetail.tracks, track => [track.mediaType, track.link, track.episode, track.externalSubtitles[0].url]),
    [['11', 1], ['33', 3]].map(([id, episode]) =>
      ['song', 'ncm:song:' + id, episode, 'https://rex-netease-lyrics.mlitm.workers.dev/netease/' + id + '.lrc']));
  const nextParams = { link: sparseDetail.link, episode: String(sparseDetail.tracks[1].episode) };
  assert.match((await context.loadResource(nextParams))[0].url, /audio-33\.mp3/);
  assert.match((await context.loadSubtitle(nextParams))[0].url, /\/netease\/33\//);
  assert.match(sparseDetail.tracks[1].videoUrl, /audio-33\.mp3/);
  assert.match((await context.loadResource({ link: sparseDetail.link }))[0].url, /audio-11\.mp3/);
  assert.match((await context.loadResource({ link: 'ncm:playlist:42:2' }))[0].url, /audio-33\.mp3/);
  playlistDetail = { ...playlist, trackIds: [], tracks: [{ id: 33 }], trackCount: 1 };
  assert.equal((await context.loadDetail('ncm:playlist:42')).tracks[0].link, 'ncm:song:33');
  assert.match((await context.loadResource({ link: 'ncm:playlist:42', episode: '1' }))[0].url, /audio-33\.mp3/);
  playlistDetail = playlist;
  missingSong = undefined;
  trial = true;
  albumDetail = await context.loadDetail('ncm:album:73');
  assert.ok(albumDetail.episodeItems.every(item => item.externalSubtitles === undefined && item.videoUrl === undefined));
  await assert.rejects(context.loadResource({ link: 'ncm:album:73', episode: 1 }), /试听/);
  detail = await context.loadDetail('ncm:playlist:42');
  assert.ok(detail.episodeItems.every(item => item.externalSubtitles === undefined && item.videoUrl === undefined));
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /试听/);
  await assert.rejects(context.loadDetail('ncm:song:1'), /试听/);
  trial = false; denied = true;
  detail = await context.loadDetail('ncm:playlist:42');
  assert.ok(detail.episodeItems.every(item => item.externalSubtitles === undefined && item.videoUrl === undefined));
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /无法播放/);
  denied = false; wrongId = true;
  detail = await context.loadDetail('ncm:playlist:42');
  assert.ok(detail.episodeItems.every(item => item.externalSubtitles === undefined && item.videoUrl === undefined));
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
  assert.ok(arranged.every(item => item.mediaType === 'genre'));
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, beforeHeartRefresh + 1);
  const heartDetail = await context.loadDetail(arranged[1].link);
  assert.equal(heartDetail.id, heart.id);
  assert.equal(heartDetail.mediaType, 'album');
  assert.equal(heartDetail.tracks[0].mediaType, 'song');
  assert.match(heartDetail.tracks[0].externalSubtitles[0].url, /\.lrc$/);
  for (const [card, expectedIds] of [[arranged[1], [heartBase, heartBase + 1]], [arranged[2], [33, 22]]]) {
    const genreId = card.link;
    const songs = await context.loadMusicGenres({ genreId, section: 'songs' });
    assert.deepEqual(Array.from(songs.slice(0, 2), song => song.link), expectedIds.map(id => 'ncm:song:' + id));
    assert.equal(songs[1].externalSubtitles[0].id, 'ncm:lyrics:' + expectedIds[1]);
    assert.equal((await context.loadMusicGenres({ genreId, section: 'albums' }))[0].link, 'ncm:album:73');
    assert.equal((await context.loadMusicGenres({ genreId, section: 'artists' }))[0].id, '91');
  }
  assert.equal(calls.filter(c => c.url.endsWith('/playmode/intelligence/list')).length, beforeHeartRefresh + 1);
  assert.equal((await context.loadMyPlaylists({ page: 2 })).some(item => item.link === 'ncm:heart'), false);
  emptyHeart = true;
  assert.equal((await context.loadMyPlaylists({}))[1].link, 'ncm:heart');
  storage.delete('ncm.heart.current.v1');
  const heartPlaceholder = (await context.loadMyPlaylists({}))[1];
  assert.equal(heartPlaceholder.description, '根据我喜欢的音乐推荐');
  assert.equal(heartPlaceholder.mediaType, 'genre');
  emptyHeart = false;
  userPlaylists = [{ ...playlist, creator: { userId: 99 } }];
  await assert.rejects(context.loadLikedSongs({}), /未找到此账号/);
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
