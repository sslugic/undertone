// Download buttons for visitors who aren't on a Mac. Undertone is a Mac app, so on a phone, Windows, Linux or a
// Chromebook the .dmg links open a small panel instead: email me the link for my Mac, and/or tell me when Windows is
// ready. Addresses go to ai.getundertone.app/waitlist and are used only for those emails. Macs see no change.
(function () {
  var ua = navigator.userAgent || "";
  var touch = (navigator.maxTouchPoints || 0) > 1;
  var platform =
    /Android/i.test(ua) ? "Android" :
    /iPhone|iPod/i.test(ua) ? "iPhone" :
    /iPad/i.test(ua) || (/Macintosh/i.test(ua) && touch) ? "iPad" :
    /CrOS/i.test(ua) ? "ChromeOS" :
    /Windows/i.test(ua) ? "Windows" :
    /Macintosh|Mac OS X/i.test(ua) ? "Mac" :
    /Linux/i.test(ua) ? "Linux" : "Mac"; // unknown: leave the download as it is
  if (platform === "Mac") return;

  var API = "https://ai.getundertone.app/waitlist";
  var desktop = platform === "Windows" || platform === "Linux" || platform === "ChromeOS";
  var english = (document.documentElement.lang || "en").slice(0, 2) === "en";
  var device = { Android: "an Android phone", iPhone: "an iPhone", iPad: "an iPad", Windows: "Windows",
    Linux: "Linux", ChromeOS: "a Chromebook" }[platform];
  var label = platform === "Windows" ? "Windows: coming soon" : desktop ? "Get it for Mac" : "Email me the link";
  var links = [];

  function track(name, props) {
    try { if (window.posthog && posthog.capture) posthog.capture(name, props); } catch (e) {}
  }

  function relabel(a) {
    if (!english) return;
    // Keep the icon, swap the words. Buttons are "<svg/>Download…" or "<svg/><span>Download…</span>".
    var span = a.querySelector(":scope > span:not(.ver)");
    var ver = a.querySelector(".ver");
    if (ver) ver.remove();
    if (span) { span.textContent = label; }
    else {
      for (var n = a.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.textContent.trim()) n.textContent = "";
      a.appendChild(document.createTextNode(label));
    }
  }

  function setup() {
    var found = document.querySelectorAll('a[href*="Undertone.dmg"]');
    for (var i = 0; i < found.length; i++) {
      var a = found[i];
      a.dataset.dmg = a.getAttribute("href");
      a.setAttribute("href", "#get-undertone");
      a.setAttribute("aria-haspopup", "dialog");
      relabel(a);
      links.push(a);
    }
    if (!links.length) return;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href="#get-undertone"]');
      if (!a) return;
      e.preventDefault();
      open(a);
    });
  }

  var css =
    ".gu-back{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s}" +
    ".gu-back.on{opacity:1}" +
    ".gu{position:relative;width:100%;max-width:420px;background:var(--surface-2,#13151D);color:var(--text,#F4F4F5);border:1px solid var(--border-2,rgba(255,255,255,.14));border-radius:var(--r-lg,16px);padding:24px;font-family:var(--sans,-apple-system,sans-serif);box-shadow:0 24px 80px rgba(0,0,0,.5);transform:translateY(8px);transition:transform .25s var(--out,ease)}" +
    ".gu-back.on .gu{transform:none}" +
    ".gu h2{margin:0 0 8px;font-size:20px;font-weight:600;letter-spacing:-.02em;line-height:1.25}" +
    ".gu p{margin:0 0 16px;color:var(--text-2,#A1A1AA);font-size:14.5px;line-height:1.55}" +
    ".gu label.gu-opt{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--border,rgba(255,255,255,.08));border-radius:var(--r,12px);margin-bottom:8px;cursor:pointer;font-size:14.5px;line-height:1.4}" +
    ".gu label.gu-opt:has(input:checked){border-color:var(--accent,#818CF8);background:var(--accent-soft,rgba(129,140,248,.14))}" +
    ".gu label.gu-opt input{margin:2px 0 0;accent-color:var(--accent-strong,#6366F1);width:16px;height:16px;flex:none}" +
    ".gu label.gu-opt small{display:block;color:var(--text-3,#8B8B94);font-size:13px;margin-top:2px}" +
    ".gu .gu-soon{display:inline-block;font-size:11.5px;font-weight:600;letter-spacing:.02em;color:var(--accent,#818CF8);background:var(--accent-soft,rgba(129,140,248,.14));border-radius:999px;padding:1px 8px;margin-left:6px;vertical-align:1px}" +
    ".gu input[type=email]{width:100%;box-sizing:border-box;height:44px;margin:8px 0 12px;padding:0 14px;border-radius:var(--r,12px);border:1px solid var(--border-2,rgba(255,255,255,.14));background:var(--bg,#09090B);color:inherit;font:inherit;font-size:16px}" +
    ".gu input[type=email]:focus{outline:2px solid var(--accent,#818CF8);outline-offset:1px}" +
    ".gu .gu-send{width:100%;height:44px;border:0;border-radius:999px;background:#F4F4F5;color:#09090B;font:inherit;font-size:15px;font-weight:600;cursor:pointer}" +
    ".gu .gu-send:disabled{opacity:.6;cursor:default}" +
    ".gu .gu-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;color:var(--text-2,#A1A1AA)}" +
    ".gu .gu-msg.err{color:#F87171}" +
    ".gu .gu-foot{display:flex;justify-content:space-between;gap:12px;margin-top:14px;font-size:12.5px;color:var(--text-3,#8B8B94)}" +
    ".gu .gu-foot a{color:var(--text-2,#A1A1AA);text-decoration:underline;text-underline-offset:2px}" +
    ".gu .gu-x{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:999px;background:transparent;color:var(--text-2,#A1A1AA);font-size:20px;line-height:1;cursor:pointer}" +
    ".gu .gu-x:hover{background:var(--surface,rgba(255,255,255,.06))}" +
    ".gu .gu-done{text-align:center;padding:8px 0}" +
    ".gu .gu-done b{display:block;font-size:18px;margin-bottom:6px}" +
    "@media (prefers-reduced-motion:reduce){.gu-back,.gu{transition:none}}";

  var lastFocus = null;

  function open(from) {
    lastFocus = from;
    track("nonmac_download_opened", { platform: platform });
    if (!document.getElementById("gu-css")) {
      var st = document.createElement("style"); st.id = "gu-css"; st.textContent = css; document.head.appendChild(st);
    }
    var back = document.createElement("div");
    back.className = "gu-back";
    back.innerHTML =
      '<div class="gu" role="dialog" aria-modal="true" aria-labelledby="gu-t">' +
        '<button class="gu-x" type="button" aria-label="Close">&times;</button>' +
        '<form novalidate>' +
          '<h2 id="gu-t">Undertone is a Mac app</h2>' +
          "<p>You're on " + device + ". Undertone runs on a Mac with Apple silicon (M1 or newer) and macOS 26. " +
            "We can send you the link for later.</p>" +
          '<label class="gu-opt"><input type="checkbox" name="mac"' + (platform === "Windows" ? "" : " checked") + '>' +
            '<span>Email me the download link<small>Open it on your Mac when you\'re there.</small></span></label>' +
          '<label class="gu-opt"><input type="checkbox" name="windows"' + (desktop ? " checked" : "") + '>' +
            '<span>Tell me when Windows is ready <span class="gu-soon">Coming soon</span>' +
            '<small>One email when it launches, nothing else.</small></span></label>' +
          '<input type="email" name="email" placeholder="you@company.com" autocomplete="email" required aria-label="Your email">' +
          '<button class="gu-send" type="submit">Send</button>' +
          '<div class="gu-msg" role="status" aria-live="polite"></div>' +
          '<div class="gu-foot"><span>Only used for this. No newsletter.</span>' +
            '<a href="' + (from.dataset.dmg || "#") + '" data-anyway>Download .dmg anyway</a></div>' +
        "</form>" +
      "</div>";
    document.body.appendChild(back);
    var box = back.querySelector(".gu"), form = back.querySelector("form"), msg = back.querySelector(".gu-msg");
    var send = back.querySelector(".gu-send"), email = form.elements.email;
    requestAnimationFrame(function () { back.classList.add("on"); });
    setTimeout(function () { email.focus({ preventScroll: true }); }, 50);

    function close() {
      back.classList.remove("on");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { back.remove(); }, 200);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
    function onKey(e) {
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      var f = box.querySelectorAll("button, input, a[href]");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    back.querySelector(".gu-x").addEventListener("click", close);
    back.querySelector("[data-anyway]").addEventListener("click", function () {
      track("download_clicked", { placement: "nonmac-anyway", platform: platform });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var mac = form.elements.mac.checked, windows = form.elements.windows.checked, value = email.value.trim();
      msg.className = "gu-msg";
      if (!mac && !windows) { msg.className = "gu-msg err"; msg.textContent = "Pick at least one option."; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { msg.className = "gu-msg err"; msg.textContent = "Enter a valid email address."; email.focus(); return; }
      send.disabled = true; send.textContent = "Sending…"; msg.textContent = "";
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, mac: mac, windows: windows, page: location.pathname, platform: platform }),
      }).then(function (r) {
        if (r.ok) return null;
        return r.json().then(function (j) { return (j && j.error && j.error.message) || "Something went wrong."; },
          function () { return "Something went wrong."; });
      }).then(function (err) {
        if (err) throw new Error(err);
        track("nonmac_signup", { platform: platform, mac: mac, windows: windows });
        form.innerHTML = '<div class="gu-done" role="status"><b>' + (mac ? "Check your inbox" : "You're on the list") + "</b>" +
          "<p>" + (mac ? "We sent the download link to " : "We'll email ") + "<span></span>" +
          (mac ? (windows ? ". We'll also tell you when Windows is ready." : ".") : " once when Windows is ready.") + "</p>" +
          '<button class="gu-send" type="button">Done</button></div>';
        form.querySelector("span").textContent = value;
        var done = form.querySelector(".gu-send");
        done.addEventListener("click", close);
        done.focus();
      }).catch(function (err) {
        send.disabled = false; send.textContent = "Send";
        msg.className = "gu-msg err";
        msg.textContent = err && err.message && err.message !== "Failed to fetch" ? err.message : "Couldn't send. Check your connection and try again.";
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
