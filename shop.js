(function () {
  "use strict";

  var fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var v = String(el.value).replace(/[^0-9.\-]/g, "");
    if (v === "" || v === "-" || v === ".") return NaN;
    return parseFloat(v);
  }

  function otdValue() {
    var price = num("foc-price"), fees = num("foc-fees"), tax = num("foc-tax");
    return (isNaN(price) ? 0 : price) + (isNaN(fees) ? 0 : fees) + (isNaN(tax) ? 0 : tax);
  }

  var COACH = {
    1: "Send this to several dealers and ask for the out-the-door price in writing — blind, so nobody just barely undercuts to win. Email, not a phone call: it makes a paper trail and takes the pressure games off the table.",
    2: "Take your lowest written offer and make the next dealer beat it. Your financing stays off the table, so they can only fight on the price.",
    3: "Got a yes? Lock the out-the-door number in writing before you drive over — so nothing quietly changes at the desk."
  };

  function build(vehicle, otd) {
    var v = vehicle || "[year make model trim]";
    var vSubj = vehicle || "[Year Make Model Trim]";
    var otdText = otd > 0 ? fmtUSD.format(otd) : "[your best out-the-door price]";
    return {
      1: {
        subject: "Out-the-door quote — " + vSubj,
        body: [
          "Hi [Name],",
          "",
          "I'm ready to buy a " + v + " in the next week or two, and I'm getting out-the-door quotes from a few dealers. Could you send me your best out-the-door price in writing — vehicle price plus tax, title, registration, and any dealer fees itemized? I'm pre-approved for financing, so this is just about your total price on the car.",
          "",
          "Whoever gives me the cleanest number gets my business this week. Thanks for making it easy.",
          "",
          "[Your name]"
        ].join("\n")
      },
      2: {
        subject: "Can you beat this out-the-door price? — " + vSubj,
        body: [
          "Hi [Name],",
          "",
          "I'm buying a " + v + " this week and I'm comparing out-the-door prices. The best written offer I have so far is " + otdText + " out-the-door — vehicle, tax, title, registration, and every fee included.",
          "",
          "If you can beat that total on the same vehicle, I'll bring you my business. I'm pre-approved for financing, so I just need your best out-the-door number in writing.",
          "",
          "Whoever gives me the cleanest number this week gets the sale. Thanks.",
          "",
          "[Your name]"
        ].join("\n")
      },
      3: {
        subject: "Confirming our out-the-door price — " + vSubj,
        body: [
          "Hi [Name],",
          "",
          "Thanks — glad we landed on a number. Confirming the deal: " + v + " at " + otdText + " out-the-door, with tax, title, registration, and every fee included, and nothing added on.",
          "",
          "Before I come in, please email me the buyer's order (the purchase agreement) showing that exact out-the-door figure, so we're on the same page when I sign. I'm bringing my own financing.",
          "",
          "Let me know what time works best. Thanks.",
          "",
          "[Your name]"
        ].join("\n")
      }
    };
  }

  var phase = 1;

  function render() {
    var box = document.getElementById("shop-email");
    if (!box) return;
    var vEl = document.getElementById("shop-vehicle");
    var vehicle = vEl && vEl.value ? vEl.value.trim() : "";
    var set = build(vehicle, otdValue())[phase];

    box.value = "Subject: " + set.subject + "\n\n" + set.body;

    var coach = document.getElementById("shop-coach");
    if (coach) coach.textContent = COACH[phase];

    var mailto = document.getElementById("shop-mailto");
    if (mailto) mailto.setAttribute("href", "mailto:?subject=" + encodeURIComponent(set.subject) + "&body=" + encodeURIComponent(set.body));
  }

  function setPhase(p) {
    phase = p;
    Array.prototype.forEach.call(document.querySelectorAll(".shop__phase"), function (b) {
      var on = b.getAttribute("data-phase") === String(p);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    render();
  }

  function init() {
    var shop = document.getElementById("foc-shop");
    var form = document.getElementById("foc-form");
    if (!shop || !form) return;

    form.addEventListener("input", render);
    var reset = document.getElementById("foc-reset");
    if (reset) reset.addEventListener("click", function () { setTimeout(render, 0); });

    var vEl = document.getElementById("shop-vehicle");
    if (vEl) vEl.addEventListener("input", render);

    Array.prototype.forEach.call(document.querySelectorAll(".shop__phase"), function (b) {
      b.addEventListener("click", function () { setPhase(parseInt(b.getAttribute("data-phase"), 10)); });
    });

    setPhase(1);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
