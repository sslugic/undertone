// Runs for the home page and /download/* (run_worker_first in wrangler.toml); everything else is served as static assets.
//  - Someone typing getundertone.app gets https, then HSTS keeps their browser on https for every other page.
//  - /download/Undertone.dmg serves the latest release from getundertone.app itself, streamed from the GitHub release,
//    so the app downloads directly from its official site (Google Ads' free desktop software policy requires that).
const RELEASE = "https://github.com/sslugic/undertone/releases/latest/download/";
const FILES = { "Undertone.dmg": "application/x-apple-diskimage" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname.startsWith("/download/")) return download(request, url);
    return env.ASSETS.fetch(request);
  },
};

async function download(request, url) {
  const name = url.pathname.slice("/download/".length);
  if (!FILES[name]) return new Response("Not found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  // "latest" moves with each release, so cache only briefly at the edge.
  const upstream = await fetch(RELEASE + name, { method: request.method, redirect: "follow", cf: { cacheTtl: 300, cacheEverything: true } });
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
