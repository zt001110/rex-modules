const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const target = process.argv[2] || __dirname + '/modules/music-wangyiyun.js';
const calls = [];
const storage = new Map();
let expired = false, trial = false, denied = false, wrongId = false;
const song = id => ({ id: Number(id), name: 'Song ' + id, fee: 1,
  ar: [{ name: 'Artist' }], al: { name: 'Album', picUrl: 'http://p1.music.126.net/test.jpg' }, dt: 180000 });
const playlist = { id: 42, name: 'Private list', trackCount: 205,
  coverImgUrl: 'http://p1.music.126.net/list.jpg', trackIds: Array.from({ length: 205 }, (_, i) => ({ id: i + 1 })) };
const context = vm.createContext({ console, Widget: {
  storage: { get: k => storage.get(k), set: (k, v) => storage.set(k, v), remove: k => storage.delete(k) },
  http: { get: async (url, options) => {
    calls.push({ url, options });
    const q = options.params;
    let body;
    if (url.endsWith('/nuser/account/get')) body = expired ? { code: 200, profile: null } : { code: 200, profile: { userId: 88, nickname: 'Test' } };
    else if (url.endsWith('/user/playlist')) body = { code: 200, playlist: [playlist] };
    else if (url.endsWith('/song/like/get')) body = { code: 200, ids: Array.from({ length: 105 }, (_, i) => i + 1) };
    else if (url.endsWith('/v3/song/detail')) body = { code: 200, songs: JSON.parse(q.c).map(x => song(x.id)).reverse() };
    else if (url.endsWith('/v6/playlist/detail')) body = { code: 200, playlist };
    else if (url.endsWith('/v1/radio/get')) body = { code: 200, data: [song(333)] };
    else if (url.endsWith('/search/get')) body = { code: 200, result: { songs: [song(444)] } };
    else if (url.endsWith('/song/enhance/player/url/v1')) body = { code: 200, data: [{
      id: wrongId ? 999 : JSON.parse(q.ids)[0], url: denied ? null : 'http://m7.music.126.net/audio.mp3?signature=fixture',
      fee: 1, freeTrialInfo: trial ? { start: 0, end: 30 } : null, level: q.level, br: 320000
    }] };
    else throw Error('Unmocked request');
    return { statusCode: 200, data: JSON.stringify(body) };
  } }
} });
vm.runInContext(fs.readFileSync(target, 'utf8'), context);

async function main() {
  assert.equal(context.WidgetMetadata.id, 'mlitm.netease.account');
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
  assert.equal(detail.relatedItems[0].link, 'ncm:playlist:42:100');
  detail = await context.loadDetail(detail.relatedItems[0].link);
  assert.equal(detail.episodeItems[0].link, 'ncm:song:101');
  assert.equal(detail.episodeItems[0].episode, 101);
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
  const songDetail = await context.loadDetail('ncm:song:101');
  assert.equal(songDetail.videoUrl, undefined);
  assert.equal(calls.filter(c => c.url.endsWith('/song/enhance/player/url/v1')).length, 0);
  let resources = await context.loadResource({ link: liked[0].link });
  assert.match(resources[0].url, /^https:\/\//);
  assert.equal(resources[0].customHeaders.Referer, 'https://music.163.com/');
  assert.equal(resources[0].url, 'https://m7.music.126.net/audio.mp3?signature=fixture');
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
  for (const p of [{}, { id: 550 }, { id: 'tt1234' }, { link: 'other:1' },
    { link: 'https://evil.test/ncm:song:1' }, { link: 'https://music.163.com.evil.test/song?id=1' },
    { link: 'ncm:song:1:2' }, { link: 'ncm:song:0' }, { link: 'ncm:playlist:42' },
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
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /试听/);
  trial = false; denied = true;
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /无法播放/);
  denied = false; wrongId = true;
  await assert.rejects(context.loadResource({ link: 'ncm:song:1' }), /无法播放/);
  wrongId = false; expired = true;
  await assert.rejects(context.loadPersonalFM({}), /未识别登录/);
  expired = false;
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
  console.log('PASS: account, cookie scope, playlist paging, liked ordering, FM, search, playback rights and source isolation');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
