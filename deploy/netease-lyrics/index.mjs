const NCM = "https://music.163.com";

function srtTime(ms) {
  const pad = (n, width = 2) => String(n).padStart(width, "0");
  return [
    pad(Math.floor(ms / 3600000)),
    pad(Math.floor(ms / 60000) % 60),
    pad(Math.floor(ms / 1000) % 60),
  ].join(":") + "," + pad(ms % 1000, 3);
}

export function lrcToSrt(lrc) {
  const offset = Number(/\[offset:\s*([+-]?\d{1,7})\s*\]/i.exec(lrc)?.[1] || 0);
  const cues = new Map();
  const stamp = /\[(\d{1,4}):([0-5]?\d)(?:[.:](\d{1,3}))?\]/g;
  for (const line of lrc.split(/\r\n?|\n/)) {
    const body = line.replace(stamp, "").trim().replace(/</g, "＜").replace(/>/g, "＞");
    for (const [, minutes, seconds, fraction = ""] of line.matchAll(stamp)) {
      const time = Math.max(0, (Number(minutes) * 60 + Number(seconds)) * 1000 +
        Number(fraction.padEnd(3, "0")) - offset);
      if (!cues.has(time)) cues.set(time, new Set());
      if (body) cues.get(time).add(body);
    }
  }
  const times = [...cues.keys()].sort((a, b) => a - b);
  const blocks = [];
  for (let i = 0; i < times.length; i++) {
    const start = times[i], lines = cues.get(start);
    if (!lines.size) continue;
    const end = times[i + 1] ?? start + 5000;
    blocks.push(`${blocks.length + 1}\r\n${srtTime(start)} --> ${srtTime(end)}\r\n${[...lines].join("\r\n")}\r\n\r\n`);
  }
  return blocks.join("");
}

export default {
  async fetch(request) {
    const head = request.method === "HEAD";
    const reply = (body, status = 200, type = "text/plain", cache = "no-store") =>
      new Response(head ? null : body, { status, headers: {
        "content-type": type + "; charset=utf-8",
        "cache-control": cache,
        "access-control-allow-origin": "*",
        "x-content-type-options": "nosniff",
      } });
    if (!head && request.method !== "GET") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    }
    const path = new URL(request.url).pathname;
    if (path === "/health") return reply('{"ok":true}', 200, "application/json");
    const match = /^\/netease\/([1-9]\d{0,18})\.(srt|lrc)$/.exec(path);
    if (!match) return reply("Not found", 404);
    try {
      const signal = AbortSignal.timeout(4500);
      const data = await Promise.any(["interface.music.163.com", "interface3.music.163.com", "music.163.com"].map(async host => {
        const upstream = await fetch(`https://${host}/api/song/lyric?id=${match[1]}&lv=1`, {
          headers: { Referer: NCM + "/", "User-Agent": "Mozilla/5.0" },
          redirect: "follow",
          signal,
        });
        if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`);
        const json = await upstream.json();
        if (json?.code !== 200) throw new Error(`NCM code ${Number(json?.code)}`);
        return json;
      }));
      const lrc = data.lrc?.lyric;
      const srt = !data.nolyric && !data.uncollected && typeof lrc === "string" && lrc.length <= 200000
        ? lrcToSrt(lrc) : "";
      if (!srt) return reply("No timed lyrics", 404, "text/plain", "public, max-age=300");
      if (match[2] === "lrc") return reply(lrc, 200, "text/plain", "public, max-age=3600");
      return reply(srt, 200, "application/x-subrip", "public, max-age=3600");
    } catch (error) {
      console.warn("NetEase lyric upstream:", (error.errors || [error]).map(e => e.message).join("; "));
      return reply("Lyrics source unavailable (" + (error.errors || [error]).map(e => /^(HTTP|NCM code) \d+$/.test(e.message) ? e.message : e.name).join(", ") + ")", 502);
    }
  },
};
