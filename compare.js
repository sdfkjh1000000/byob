(function () {
  "use strict";

  var LS_KEY = "byob_deals";
  var hasLS = (function () { try { var k = "__byob_t"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch (e) { return false; } })();

  var fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var fmtUSD2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var v = String(el.value).replace(/[^0-9.\-]/g, "");
    if (v === "" || v === "-" || v === ".") return NaN;
    return parseFloat(v);
  }
  function orz(x) { return isNaN(x) ? 0 : x; }
  function pmtAt(rate, principal, n) { if (n <= 0) return NaN; if (rate <= 0) return principal / n; return principal * rate / (1 - Math.pow(1 + rate, -n)); }
  function impliedMonthlyRate(principal, payment, n) {
    if (principal <= 0 || payment <= 0 || n <= 0) return NaN;
    if (payment * n <= principal) return 0;
    var lo = 0, hi = 1, mid = 0;
    for (var k = 0; k < 200; k++) { mid = (lo + hi) / 2; if (pmtAt(mid, principal, n) > payment) hi = mid; else lo = mid; }
    return mid;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function lsGet() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch (e) { return []; } }
  function lsSet(a) { try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch (e) {} }

  function currentDeal() {
    var otd = orz(num("foc-price")) + orz(num("foc-fees")) + orz(num("foc-tax"));
    var financed = Math.max(0, otd - orz(num("foc-down")) - orz(num("foc-trade-value")) + orz(num("foc-trade-owe")));
    var apr = num("foc-apr"), term = num("foc-term"), payment = num("foc-payment");
    var impliedApr = null, status = "incomplete";
    if (financed > 0 && !isNaN(term) && term > 0 && !isNaN(payment) && payment > 0) {
      impliedApr = impliedMonthlyRate(financed, payment, term) * 1200;
      if (!isNaN(apr) && apr >= 0) {
        var exp = pmtAt(apr / 1200, financed, term);
        status = (payment - exp > Math.max(2, exp * 0.01)) ? "mismatch" : "ok";
      } else status = "norate";
    }
    return { otd: otd, financed: financed, apr: (isNaN(apr) ? null : apr), term: (isNaN(term) ? null : term), payment: (isNaN(payment) ? null : payment), impliedApr: impliedApr, status: status };
  }

  function flash(btn, msg) { if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", btn.textContent); btn.textContent = msg; setTimeout(function () { btn.textContent = btn.getAttribute("data-label"); }, 1600); }

  function renderCompare() {
    var wrap = document.getElementById("foc-compare");
    if (!wrap) return;
    var d = lsGet();
    if (!d.length) { wrap.hidden = true; wrap.innerHTML = ""; return; }
    wrap.hidden = false;
    var minOtd = Math.min.apply(null, d.map(function (x) { return x.otd; }));
    var html = '<h3 class="compare__title">Your saved deals</h3>';
    html += '<p class="compare__sub">Side by side, so the lowest out-the-door number has nowhere to hide. Saved on this device only — nothing is sent anywhere.</p>';
    html += '<div class="compare__grid">';
    d.forEach(function (x, i) {
      var lowest = d.length > 1 && x.otd === minOtd;
      html += '<div class="compare__card' + (x.status === "mismatch" ? " compare__card--warn" : "") + '">';
      html += '<div class="compare__cardhead"><input class="compare__name" data-idx="' + i + '" value="' + esc(x.name) + '" aria-label="Deal name" maxlength="24">' + (lowest ? '<span class="compare__badge">Lowest OTD</span>' : '') + '</div>';
      html += '<dl class="compare__dl">';
      html += '<div><dt>Out-the-door</dt><dd>' + fmtUSD.format(x.otd) + '</dd></div>';
      html += '<div><dt>Financed</dt><dd>' + fmtUSD.format(x.financed) + '</dd></div>';
      html += '<div><dt>Real APR</dt><dd>' + (x.impliedApr != null ? x.impliedApr.toFixed(2) + '%' : '—') + '</dd></div>';
      html += '<div><dt>Monthly</dt><dd>' + (x.payment != null ? fmtUSD2.format(x.payment) : '—') + '</dd></div>';
      html += '</dl>';
      if (x.status === "mismatch") html += '<p class="compare__flag">⚠ Rate doesn’t match the quote</p>';
      html += '<button class="compare__remove" type="button" data-remove="' + i + '">Remove</button>';
      html += '</div>';
    });
    html += '</div><button class="btn btn--ghost compare__clear" type="button" data-clear-deals>Clear all</button>';
    wrap.innerHTML = html;
  }

  function init() {
    var save = document.getElementById("foc-save");
    if (!hasLS) { if (save) save.hidden = true; return; }
    if (save) save.addEventListener("click", function () {
      var d = lsGet();
      if (d.length >= 3) { flash(save, "Max 3 — remove one"); return; }
      var deal = currentDeal();
      if (deal.otd <= 0) { flash(save, "Enter a deal first"); return; }
      deal.name = "Deal " + (d.length + 1);
      d.push(deal); lsSet(d); renderCompare(); flash(save, "Saved ✓");
    });
    var wrap = document.getElementById("foc-compare");
    if (wrap) {
      wrap.addEventListener("click", function (e) {
        var rm = e.target.closest("[data-remove]");
        if (rm) { var d = lsGet(); d.splice(parseInt(rm.getAttribute("data-remove"), 10), 1); lsSet(d); renderCompare(); return; }
        if (e.target.closest("[data-clear-deals]")) { lsSet([]); renderCompare(); }
      });
      wrap.addEventListener("change", function (e) {
        var nm = e.target.closest(".compare__name");
        if (nm) { var d = lsGet(); var i = parseInt(nm.getAttribute("data-idx"), 10); if (d[i]) { d[i].name = nm.value.slice(0, 24); lsSet(d); } }
      });
    }
    renderCompare();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
