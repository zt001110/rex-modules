import { officialBrowse, officialCover } from "./official.mjs";
import { openMedia, mediaResponse } from "./cenc.mjs";
import { mediaOptions } from "./media-codec.mjs";

const STREAM_ROUTE = /^\/v1\/episodes\/([1-9]\d{9,20})\/stream$/;
const CATALOG_ROUTE = /^\/v1\/(?:search|rankings|series\/[1-9]\d{9,20})$/;
const MAX_PREPARED = 16;
const MAX_PENDING = 8;
const prepared = new Map();
const pending = new Map();

async function prepare(id, env) {
  const cached = prepared.get(id);
  if (cached?.expiresAt > Date.now()) return cached.media;
  if (cached) prepared.delete(id);
  if (pending.has(id)) return pending.get(id);
  if (pending.size >= MAX_PENDING) throw new Error("busy");

  const job = (async () => {
    const response = await env.PLAY_RELAY.fetch("https://relay.internal/" + encodeURIComponent(env.RELAY_KEY) + "/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vids: [id] })
    });
    if (!response.ok) throw new Error("relay HTTP " + response.status);
    const result = await response.json();
    const raw = result.ok && result.models?.[id];
    const model = typeof raw === "string" ? JSON.parse(raw) : raw;
    // The relay indexes results by episode ID; video_id is a separate CDN identifier.
    if (!model || typeof model !== "object") throw new Error("episode model unavailable");
    const candidates = mediaOptions(model);
    if (!candidates.length) throw new Error("no supported media");
    // Try backups for the preferred variant and retain a lower-quality fallback.
    let failure = "media unavailable";
    for (const candidate of candidates.slice(0, 2)) {
      for (const url of candidate.urls.slice(0, 2)) {
        try {
          const media = await openMedia(url, candidate.key);
          const now = Date.now();
          const expiry = candidate.expiresAt > 1e9 ? candidate.expiresAt * 1000 - 5000 : Infinity;
          const expiresAt = Math.min(now + 5 * 60 * 1000, expiry);
          if (expiresAt > now) {
            while (prepared.size >= MAX_PREPARED) prepared.delete(prepared.keys().next().value);
            prepared.set(id, { media, expiresAt });
          }
          return media;
        } catch (error) {
          const status = /^Media range HTTP (\d{3})$/.exec(error.message);
          if (status) failure = "cdn HTTP " + status[1];
          else if (error.name === "TimeoutError") failure = "cdn timeout";
          else if (error instanceof TypeError) failure = "cdn connection";
          else failure = "media format";
        }
      }
    }
    throw new Error(failure);
  })();
  pending.set(id, job);
  try {
    return await job;
  } finally {
    pending.delete(id);
  }
}

async function catalogResponse(request, env) {
  try {
    const upstream = new URL(env.CATALOG_API);
    if (upstream.protocol !== "https:" || upstream.pathname !== "/" ||
        upstream.username || upstream.password || upstream.search || upstream.hash) {
      return Response.json({ error: "Invalid catalog endpoint" }, { status: 503 });
    }
    const url = new URL(request.url);
    if (url.origin === upstream.origin) return Response.json({ error: "Invalid catalog endpoint" }, { status: 503 });
    upstream.pathname = url.pathname;
    upstream.search = url.search;
    const options = {
      method: request.method, headers: { Accept: "application/json" },
      redirect: "manual", signal: AbortSignal.timeout(20000)
    };
    const response = await fetch(upstream, options);
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      return Response.json({ error: "Catalog endpoint redirected" }, { status: 502 });
    }
    if (response.ok && request.method === "GET" && url.pathname.startsWith("/v1/series/") &&
        url.searchParams.get("episodesOnly") === "1") {
      const data = await response.json();
      if (Array.isArray(data?.episodes)) {
        return Response.json({
          ...data,
          episodes: data.episodes.map(episode => episode && ({
            id: episode.id, episode: episode.episode, duration: episode.duration, disabled: episode.disabled
          }))
        });
      }
      return Response.json(data);
    }
    const headers = { "Content-Type": response.headers.get("Content-Type") || "application/json" };
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json({ error: "Catalog endpoint unavailable" }, { status: 502 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    if (path === "/health") return Response.json({ ok: true, service: "rex-hongguo" });
    if (path.startsWith("/v1/cover/")) return officialCover(request, ctx);
    if (path.startsWith("/v1/official/")) return officialBrowse(request, ctx);
    if (CATALOG_ROUTE.test(path)) return catalogResponse(request, env);
    const stream = STREAM_ROUTE.exec(path);
    if (!stream) return new Response("Not found", { status: 404 });
    try {
      return mediaResponse(request, await prepare(stream[1], env));
    } catch (error) {
      const busy = error.message === "busy";
      return Response.json({ error: busy ? "Stream preparation busy" : "Stream unavailable" }, {
        status: busy ? 503 : 502,
        headers: { "Cache-Control": "no-store", "X-Playback-Stage":
          /^(relay|cdn) HTTP [0-9]{3}$/.test(error.message) ? error.message :
          ["episode model unavailable", "no supported media", "media unavailable", "cdn timeout", "cdn connection", "media format"].includes(error.message) ? error.message : "execution" }
      });
    }
  }
};
