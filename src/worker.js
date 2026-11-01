// Runs only for the home page (run_worker_first in wrangler.toml): someone typing getundertone.app gets https, then
// HSTS keeps their browser on https for every other page. Everything else is served as static assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
