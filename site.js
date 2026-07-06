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

  function copyValue(text, btn, field) {
    var ok = false, temp = null, el = field, active = document.activeElement;
    try {
      if (!el || (el.tagName !== "TEXTAREA" && el.tagName !== "INPUT")) {
        temp = el = document.createElement("textarea");
        el.value = text; el.setAttribute("readonly", "");
        el.style.position = "fixed"; el.style.top = "0"; el.style.left = "-9999px";
        document.body.appendChild(el);
      }
      el.focus(); el.select();
      try { el.setSelectionRange(0, el.value.length); } catch (e) {}
      ok = document.execCommand && document.execCommand("copy");
    } catch (e) { ok = false; }
    if (temp && temp.parentNode) { temp.parentNode.removeChild(temp); if (active && active.focus) active.focus(); }
    if (ok) { flash(btn, "Copied ✓"); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(btn, "Copied ✓"); }, function () { flash(btn, "Select all, then copy"); });
    } else { flash(btn, "Select all, then copy"); }
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("[data-print],[data-copy],[data-share-copy]");
    if (!el) return;
    if (el.hasAttribute("data-print")) { window.print(); return; }
    if (el.hasAttribute("data-share-copy")) { e.preventDefault(); copyValue(el.getAttribute("data-url") || location.href, el, null); return; }
    var tgt = document.getElementById(el.getAttribute("data-copy"));
    if (!tgt) return;
    var isField = tgt.tagName === "TEXTAREA" || tgt.tagName === "INPUT";
    var text = isField ? tgt.value : (tgt.innerText || tgt.textContent).replace(/\n{3,}/g, "\n\n").trim();
    copyValue(text, el, isField ? tgt : null);
  });

  var decoder = document.querySelector("[data-decoder]");
  if (decoder) {
    var search = decoder.querySelector("[data-decoder-search]");
    var chips = decoder.querySelectorAll("[data-filter]");
    var terms = decoder.querySelectorAll(".term");
    var empty = decoder.querySelector(".decoder__empty");
    var activeCat = "all";
    var applyFilter = function () {
      var q = (search && search.value || "").trim().toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(terms, function (t) {
        var cat = t.getAttribute("data-cat") || "";
        var match = (activeCat === "all" || cat === activeCat) &&
          (!q || t.textContent.toLowerCase().indexOf(q) !== -1);
        t.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.style.display = shown ? "none" : "block";
    };
    if (search) search.addEventListener("input", applyFilter);
    Array.prototype.forEach.call(chips, function (c) {
      c.addEventListener("click", function () {
        activeCat = c.getAttribute("data-filter");
        Array.prototype.forEach.call(chips, function (x) { x.setAttribute("aria-pressed", String(x === c)); });
        applyFilter();
      });
    });
  }

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
        var lbl = box.querySelector("[data-share-label]");
        if (lbl) lbl.hidden = true;
        nat.addEventListener("click", function () {
          navigator.share({ title: document.title, text: text, url: shareUrl }).catch(function () {});
        });
      } else { nat.hidden = true; }
    }
  });
})();
