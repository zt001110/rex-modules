import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../modules/offline-cache-test.js", import.meta.url), "utf8");
const store = new Map();
const sandbox = vm.createContext({
  console: { log() {}, error: console.error },
  Widget: { storage: { get: key => store.get(key), set: (key, value) => store.set(key, value) } },
});
vm.runInContext(source, sandbox);
const list = await sandbox.loadSamples({});
assert.equal(list.length, 2);
assert.equal((await sandbox.loadSamples({ page: 2 })).length, 0);
assert.ok(list[0].videoUrl);
assert.equal(list[1].videoUrl, list[0].videoUrl);

for (const item of list) {
  const detail = await sandbox.loadDetail(item.link);
  assert.equal(detail.id, item.id);
  assert.equal(detail.type, "url");
  assert.equal(detail.link, item.link);
  assert.ok(detail.coverUrl);
  const resources = await sandbox.loadResource({ link: detail.link });
  if (item.id === list[0].id) {
    assert.equal(resources.length, 0);
    continue;
  }
  assert.equal(resources.length, 1);
  assert.match(resources[0].url, /^https:\/\/test-videos\.co\.uk\/vids\/.+\.mp4$/);
  assert.equal(resources[0].playerType, "app");
  assert.equal((await sandbox.loadResource({ id: item.id }))[0].url, resources[0].url);
}

for (const params of [
  {}, { id: 550 }, { id: "tt0137523" }, { link: "other:1" },
  { link: "https://example.com/rex-offline-test:direct" },
  { link: "rex-offline-test:direct-extra" },
  { link: "", id: list[0].id },
  { link: "invalid", id: list[1].id },
]) {
  assert.equal((await sandbox.loadResource(params)).length, 0);
}
assert.equal(await sandbox.loadDetail("other:1"), null);
assert.equal(await sandbox.loadDetail(null), null);

const before = JSON.parse((await sandbox.loadDiagnostics())[0].description);
assert.ok(before.detailCalls >= 2);
assert.ok(before.resourceCalls >= 2);
await sandbox.loadResource({ link: list[1].link, api_key: "private-test-secret", videoUrl: "https://private.invalid/token" });
const diagnosticItem = (await sandbox.loadDiagnostics())[0];
const diagnostic = JSON.parse(diagnosticItem.description);
assert.equal(diagnostic.resourceCalls, before.resourceCalls + 1);
assert.equal(diagnostic.lastResource.sample, list[1].id);
assert.equal(diagnostic.lastResource.videoMatches, false);
assert.doesNotMatch(JSON.stringify([...store.values()]), /private-test-secret|private\.invalid/);
assert.doesNotMatch(diagnosticItem.description, /private-test-secret|private\.invalid/);

const noStorage = vm.createContext({ console: { log() {}, error() {} } });
vm.runInContext(source, noStorage);
assert.equal((await noStorage.loadResource({ link: list[1].link })).length, 1);

const subscription = JSON.parse(readFileSync(new URL("../offline-cache-test.fwd", import.meta.url), "utf8"));
assert.equal(subscription.widgets.length, 1);
for (const key of ["id", "version", "requiredVersion", "title"]) {
  assert.equal(subscription.widgets[0][key], sandbox.WidgetMetadata[key]);
}
assert.match(subscription.widgets[0].url, /\/encrypted\/modules\/offline-cache-test\.js$/);
console.log("PASS: playable bootstrap, direct/stream isolation, routing, private diagnostics, storage fallback, subscription metadata");
