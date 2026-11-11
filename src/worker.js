// Runs for the home page and /download/* (run_worker_first in wrangler.toml); everything else is served as static assets.
//  - Someone typing getundertone.app gets https, then HSTS keeps their browser on https for every other page.
//  - /download/Undertone.dmg serves the latest release from getundertone.app itself, streamed from the GitHub release,
//    so the app downloads directly from its official site (Google Ads' free desktop software policy requires that).
//    Each real download is counted here, server side, as an anonymous PostHog event ("dmg_download": no ID, no IP,
//    no cookie; just the page it came from, a coarse platform and the country), because ad blockers hide most clicks
//    on the page itself. Bots, link previews and HEAD requests aren't counted.
const RELEASE = "https://github.com/sslugic/undertone/releases/latest/download/";
const FILES = { "Undertone.dmg": "application/x-apple-diskimage" };
const POSTHOG = { key: "phc_CXAg4tHVGP7PUUpEacmPrqxbAALnYoa78zhfVUnBgqoH", host: "https://us.i.posthog.com" };
const BOTS = /bot|crawl|spider|slurp|preview|fetch|curl|wget|python|go-http|httpclient|headless|monitor|facebookexternalhit|scanner/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith("/download/")) return download(request, url, ctx);
    return env.ASSETS.fetch(request);
  },
};

async function download(request, url, ctx) {
  const name = url.pathname.slice("/download/".length);
  if (!FILES[name]) return new Response("Not found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  // "latest" moves with each release, so cache only briefly at the edge.
  const upstream = await fetch(RELEASE + name, { method: request.method, redirect: "follow", cf: { cacheTtl: 300, cacheEverything: true } });
  if (request.method === "GET") ctx?.waitUntil(count(request, name).catch(() => {}));
  if (!upstream.ok) return Response.redirect(RELEASE + name, 302); // GitHub hiccup: fall back to the release itself
  const headers = new Headers({
    "Content-Type": FILES[name],
    "Content-Disposition": `attachment; filename="${name}"`,
    "Cache-Control": "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  });
  const length = upstream.headers.get("Content-Length");
  if (length) headers.set("Content-Length", length);
  return new Response(request.method === "HEAD" ? null : upstream.body, { status: 200, headers });
}

function platform(ua) {
  return /iPhone|iPad|Android/i.test(ua) ? "Mobile" : /CrOS/.test(ua) ? "ChromeOS" : /Windows/.test(ua) ? "Windows"
    : /Macintosh|Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Other";
}

async function count(request, file) {
  const ua = request.headers.get("User-Agent") || "";
  if (!ua || BOTS.test(ua)) return;
  const range = request.headers.get("Range"); // a resumed download is the same download
  if (range && !/^bytes=0-/.test(range)) return;
  let from = "", page = "";
  try {
    const ref = new URL(request.headers.get("Referer") || "");
    from = ref.hostname.replace(/^www\./, "");
    if (from === "getundertone.app") page = ref.pathname.slice(0, 80);
  } catch {}
  await fetch(POSTHOG.host + "/i/v0/e/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: POSTHOG.key,
      event: "dmg_download",
      distinct_id: crypto.randomUUID(),
      properties: {
        $lib: "undertone-site-worker", $process_person_profile: false, $geoip_disable: true,
        file, platform: platform(ua), referrer_host: from || "direct", page, country: request.cf?.country || "",
      },
    }),
  });
}
