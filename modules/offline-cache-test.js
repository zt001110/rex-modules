WidgetMetadata = {
  id: "zt001110.offline-cache-test",
  title: "离线缓存测试",
  version: "1.0.2",
  requiredVersion: "0.0.1",
  author: "zt001110",
  description: "公开测试短片：直接地址与播放资源模块",
  site: "https://github.com/zt001110/rex-modules",
  detailCacheDuration: 0,
  modules: [
    {
      id: "samples",
      title: "离线缓存测试",
      functionName: "loadSamples",
      cacheDuration: 0,
      params: [],
    },
    {
      id: "loadResource",
      title: "测试短片资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
    {
      id: "diagnostics",
      title: "调用诊断",
      functionName: "loadDiagnostics",
      cacheDuration: 0,
      params: [],
    },
  ],
};

const TEST_VIDEO = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";
const TEST_COVER = "https://test-videos.co.uk/user/pages/images/big_buck_bunny.jpg";
const SAMPLE_IDS = ["rex-offline-test:direct", "rex-offline-test:stream"];
const DIAGNOSTICS_KEY = "offline-cache-test.1.0.2.diagnostics";

function readDiagnostics() {
  try {
    if (typeof Widget !== "undefined" && Widget.storage) {
      return Widget.storage.get(DIAGNOSTICS_KEY) || {};
    }
  } catch (error) {
    console.log("[offline-cache-test] diagnostics unavailable");
  }
  return {};
}

function recordCall(stage, summary) {
  try {
    const data = readDiagnostics();
    data[stage] = { count: ((data[stage] || {}).count || 0) + 1, last: summary };
    if (typeof Widget !== "undefined" && Widget.storage) {
      Widget.storage.set(DIAGNOSTICS_KEY, data);
    }
    console.log("[offline-cache-test] " + stage + ": " + JSON.stringify(summary));
  } catch (error) {
    console.log("[offline-cache-test] diagnostics unavailable");
  }
}

function sampleId(raw) {
  return typeof raw === "string" && SAMPLE_IDS.indexOf(raw) !== -1 ? raw : null;
}

function sampleItem(id) {
  const direct = id === SAMPLE_IDS[0];
  const item = {
    id: id,
    link: id,
    type: "url",
    mediaType: "movie",
    title: direct ? "测试 A · 直接视频地址" : "测试 B · 资源模块与初始地址",
    coverUrl: TEST_COVER,
    posterPath: TEST_COVER,
    backdropPath: TEST_COVER,
    description: "Big Buck Bunny · Blender Foundation · test-videos.co.uk · 720p H.264 · 10 秒 · 约 1 MB",
    duration: 10,
    durationText: "00:10",
    playerType: "app",
    // Keep a playable entry before the client invokes a stream resolver.
    videoUrl: TEST_VIDEO,
  };
  return item;
}

async function loadSamples(params) {
  try {
    if (Number((params || {}).page || 1) > 1) return [];
    return SAMPLE_IDS.map(sampleItem);
  } catch (error) {
    console.error("[offline-cache-test] loadSamples:", error.message || error);
    throw error;
  }
}

async function loadDetail(link) {
  try {
    const id = sampleId(link);
    recordCall("detail", { inputType: typeof link, sample: id || "unmatched" });
    return id ? sampleItem(id) : null;
  } catch (error) {
    console.error("[offline-cache-test] loadDetail:", error.message || error);
    throw error;
  }
}

async function loadResource(params) {
  try {
    params = params || {};
    const id = sampleId(params.link != null ? params.link : params.id);
    recordCall("resource", {
      hasLink: params.link != null,
      hasId: params.id != null,
      sample: id || "unmatched",
      videoMatches: params.videoUrl === TEST_VIDEO,
    });
    if (id !== SAMPLE_IDS[1]) return [];
    return [{
      name: "公开短片 B · 模块解析",
      description: "720p | H.264 | MP4 | 10 秒 | 约 1 MB",
      url: TEST_VIDEO,
      playerType: "app",
    }];
  } catch (error) {
    console.error("[offline-cache-test] loadResource:", error.message || error);
    throw error;
  }
}

async function loadDiagnostics() {
  try {
    const data = readDiagnostics();
    const detail = data.detail || { count: 0 };
    const resource = data.resource || { count: 0 };
    const summary = {
      version: WidgetMetadata.version,
      detailCalls: detail.count,
      resourceCalls: resource.count,
      lastDetail: detail.last || null,
      lastResource: resource.last || null,
    };
    console.log("[offline-cache-test] diagnostics: " + JSON.stringify(summary));
    return [{
      id: "rex-offline-test:diagnostics",
      type: "url",
      title: "详情调用 " + detail.count + " 次 · 资源调用 " + resource.count + " 次",
      description: JSON.stringify(summary),
      coverUrl: TEST_COVER,
      mediaType: "movie",
    }];
  } catch (error) {
    console.error("[offline-cache-test] loadDiagnostics:", error.message || error);
    throw error;
  }
}
