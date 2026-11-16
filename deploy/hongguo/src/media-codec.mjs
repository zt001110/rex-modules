const decode64 = (value) =>
  Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
function deriveContentKey(spade) {
  const raw = decode64(spade.trim());
  if (raw.length < 3) throw new Error("Invalid spade");
  let n = raw.length - (raw[0] ^ raw[1] ^ raw[2]) + 47;
  if (n <= 0 || n > raw.length * 2) throw new Error("Invalid spade length");
  n = Math.min(n, raw.length - 1);
  if (n < 33) throw new Error("Short spade");
  const data = raw.slice(1, n + 1);
  let a = 85,
    b = 246;
  for (let i = 0; i < n; i++) {
    let count = 0;
    for (let x = i; x; x >>>= 1) count += x & 1;
    const old = data[i],
      prev = i & 1 ? a : b;
    if (i & 1) a = old;
    else b = old;
    data[i] = (-21 - count + (prev ^ old)) & 255;
  }
  const hex = new TextDecoder().decode(data.slice(1, 33));
  if (!/^[0-9a-f]{32}$/i.test(hex)) throw new Error("Invalid content key");
  return Uint8Array.from(hex.match(/../g), byte => Number.parseInt(byte, 16));
}

const MEDIA_HOSTS = ["qznovelvod.com", "fqnovelvod.com", "bytevod.com", "douyinvod.com"];

function mediaUrl(value) {
  if (typeof value !== "string" || !value) return null;
  try {
    const decoded = value.startsWith("https://") ? value : new TextDecoder().decode(decode64(value));
    const url = new URL(decoded);
    const allowed = MEDIA_HOSTS.some(host => url.hostname === host || url.hostname.endsWith("." + host));
    if (url.protocol === "https:" && allowed && !url.username && !url.password && !url.port) return url.href;
  } catch {}
  return null;
}

export function mediaOptions(model) {
  return Object.values(model.video_list || {})
    .map(variant => ({ ...variant, ...variant.video_meta, ...variant.encrypt_info }))
    .filter(variant => (!variant.vtype || variant.vtype === "mp4") &&
      (!variant.encryption_method || variant.encryption_method === "cenc-aes-ctr"))
    .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0))
    .flatMap(variant => {
      try {
        const urls = [variant.main_url, variant.backup_url_1, ...[variant.backup_url].flat()]
          .map(mediaUrl).filter(Boolean);
        const spade = variant.spade_a || model.spade_a;
        const key = spade ? deriveContentKey(spade) : null;
        if (!urls.length || (variant.encrypt && !key)) return [];
        return [{ urls: [...new Set(urls)], key, expiresAt: Number(variant.url_expire || model.url_expire) }];
      } catch {
        return [];
      }
    });
}
