const ORIGIN = "https://hongguoduanju.com";
const OFFICIAL_PATH = /^\/(?:category\/(?:real-drama|comic-drama|ai-drama)(?:\/[a-z][a-z-]{0,32})?|rank\/(?:hot-drama|hot-real-drama|hot-comic-drama|hot-ai-drama))$/;
const ID = /^[1-9]\d{9,20}$/;

function readOfficialData(html) {
  const start = /\b_ROUTER_DATA\s*=\s*/.exec(html);
  const end = start && html.indexOf(";\nfunction runWindowFn", start.index + start[0].length);
  if (!start || end < 0) throw new Error("official page format");
  return JSON.parse(html.slice(start.index + start[0].length, end)).loaderData || {};
}

function parsePage(html, category, page) {
  const loaderData = readOfficialData(html);
  const data = Object.values(loaderData || {}).find(entry =>
    category ? Array.isArray(entry?.recommendList) : Array.isArray(entry?.content?.rankList));
  const result = category ? data : data?.content;
  if (result?.isSuccess !== true) throw new Error("official page unavailable");
  const rows = category ? result.recommendList : result.rankList;
  const seen = new Set();
  const items = [];
  for (const row of rows) {
    const id = category ? row.series_id : row.seriesId;
    const title = category ? row.series_name : row.title;
    if (typeof id !== "string" || !ID.test(id) || typeof title !== "string" || !title || seen.has(id)) continue;
    seen.add(id);
    items.push({
      id, title,
      cover: category ? row.series_cover : row.cover,
      description: category ? row.series_intro : row.description
    });
  }
  const pagination = result.pagination;
  if (!pagination || Number(pagination.pageNum) !== page) {
    if (Number(pagination?.totalPages) < page) return { items: [], hasMore: false };
    throw new Error("official page number mismatch");
  }
  return { items, hasMore: page < pagination.totalPages };
}

export async function officialBrowse(request, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.slice("/v1/official".length);
  const page = Number(url.searchParams.get("page") || "1");
  if (!OFFICIAL_PATH.test(path) || !Number.isSafeInteger(page) || page < 1) {
    return Response.json({ error: "Invalid official catalog request" }, { status: 400 });
  }
  const cacheKey = new Request(url.origin + "/v1/official" + path + "?page=" + page);
  const cached = await caches.default.match(cacheKey);
  if (cached) return request.method === "HEAD" ? new Response(null, { headers: cached.headers }) : cached;
  try {
    const response = await fetch(ORIGIN + path + (page > 1 ? "?page=" + page : ""), {
      headers: { Accept: "text/html", "Accept-Language": "zh-CN,zh;q=0.9" },
      redirect: "manual",
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) {
      await response.body?.cancel();
      return Response.json({ error: "Official catalog HTTP " + response.status }, { status: 502 });
    }
    const list = parsePage(await response.text(), path.startsWith("/category/"), page);
    const result = Response.json(list, { headers: { "Cache-Control": "public, max-age=120" } });
    ctx.waitUntil(caches.default.put(cacheKey, result.clone()).catch(() => {}));
    return request.method === "HEAD" ? new Response(null, { headers: result.headers }) : result;
  } catch {
    return Response.json({ error: "Official catalog unavailable" }, { status: 502 });
  }
}

export async function officialCover(request, ctx) {
  const url = new URL(request.url);
  const id = url.pathname.slice("/v1/cover/".length);
  if (!ID.test(id)) return new Response(null, { status: 404 });

  const cacheKey = new Request(url.origin + "/v1/cover/" + id);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  try {
    const page = await fetch(ORIGIN + "/player/" + id, {
      headers: { Accept: "text/html" },
      redirect: "manual",
      signal: AbortSignal.timeout(12000)
    });
    if (!page.ok) {
      await page.body?.cancel();
      return new Response(null, { status: page.status === 404 ? 404 : 502 });
    }
    const data = Object.values(readOfficialData(await page.text())).find(entry =>
      entry?.isSuccess === true && entry.series_id === id && entry.seriesDetail?.series_id === id);
    const coverUrl = data?.seriesDetail.series_cover;
    if (!coverUrl) return new Response(null, { status: 404 });

    const cover = new URL(coverUrl);
    if (cover.protocol !== "https:" || !cover.hostname.endsWith(".byteimg.com") ||
        cover.username || cover.password || cover.port) return new Response(null, { status: 502 });
    const result = new Response(null, {
      status: 302,
      headers: { Location: cover.href, "Cache-Control": "public, max-age=21600" }
    });
    ctx.waitUntil(caches.default.put(cacheKey, result.clone()).catch(() => {}));
    return result;
  } catch {
    return new Response(null, { status: 502 });
  }
}
