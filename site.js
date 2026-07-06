(function () {
  "use strict";

  var toggle = document.querySelector(".nav-toggle"), nav = document.getElementById("nav");
  if (toggle && nav) toggle.addEventListener("click", function () {
    var open = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!open));
    toggle.setAttribute("aria-expanded", String(!open));
  });

  function flash(btn, msg) {
    if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", btn.textContent);
    btn.textContent = msg;
    setTimeout(function () { btn.textContent = btn.getAttribute("data-label"); }, 1800);
  }

  function copyText(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn, "Copied ✓"); }, function () { flash(btn, "Press Ctrl+C"); });
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); flash(btn, "Copied ✓"); } catch (e) { flash(btn, "Press Ctrl+C"); }
    document.body.removeChild(ta);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-print],[data-copy],[data-share-copy]");
    if (!el) return;
    if (el.hasAttribute("data-print")) { window.print(); return; }
    if (el.hasAttribute("data-share-copy")) { e.preventDefault(); copyText(el.getAttribute("data-url") || location.href, el); return; }
    var tgt = document.getElementById(el.getAttribute("data-copy"));
    if (tgt) copyText((tgt.innerText || tgt.textContent).replace(/\n{3,}/g, "\n\n").trim(), el);
  });

  var canonical = document.querySelector('link[rel="canonical"]');
  var shareUrl = canonical ? canonical.href : location.href;
  Array.prototype.forEach.call(document.querySelectorAll("[data-share]"), function (box) {
    var text = box.getAttribute("data-share-text") || document.title;
    var u = encodeURIComponent(shareUrl), tx = encodeURIComponent(text);
    var x = box.querySelector("[data-share-x]"); if (x) x.href = "https://twitter.com/intent/tweet?text=" + tx + "&url=" + u;
    var r = box.querySelector("[data-share-reddit]"); if (r) r.href = "https://www.reddit.com/submit?url=" + u + "&title=" + tx;
    var copy = box.querySelector("[data-share-copy]"); if (copy) copy.setAttribute("data-url", shareUrl);
    var nat = box.querySelector("[data-share-native]");
    if (nat) {
      if (navigator.share) {
        nat.hidden = false;
        nat.addEventListener("click", function () {
          navigator.share({ title: document.title, text: text, url: shareUrl }).catch(function () {});
        });
      } else { nat.hidden = true; }
    }
  });
})();
