(function () {
  "use strict";

  var fmtUSD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var fmtUSD2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var v = String(el.value).replace(/[^0-9.\-]/g, "");
    if (v === "" || v === "-" || v === ".") return NaN;
    return parseFloat(v);
  }

  function pmtAt(rate, principal, n) {
    if (n <= 0) return NaN;
    if (rate <= 0) return principal / n;
    return principal * rate / (1 - Math.pow(1 + rate, -n));
  }

  function impliedMonthlyRate(principal, payment, n) {
    if (principal <= 0 || payment <= 0 || n <= 0) return NaN;
    if (payment * n <= principal) return 0;
    var lo = 0, hi = 1, mid = 0;
    for (var k = 0; k < 200; k++) {
      mid = (lo + hi) / 2;
      var p = pmtAt(mid, principal, n);
      if (p > payment) hi = mid; else lo = mid;
    }
    return mid;
  }

  function render() {
    var out = document.getElementById("foc-output");
    if (!out) return;

    var price = num("foc-price");
    var fees = num("foc-fees");
    var tax = num("foc-tax");
    var down = num("foc-down");
    var tradeValue = num("foc-trade-value");
    var tradeOwe = num("foc-trade-owe");
    var apr = num("foc-apr");
    var term = num("foc-term");
    var payment = num("foc-payment");

    var price0 = isNaN(price) ? 0 : price;
    var fees0 = isNaN(fees) ? 0 : fees;
    var tax0 = isNaN(tax) ? 0 : tax;
    var down0 = isNaN(down) ? 0 : down;
    var tradeValue0 = isNaN(tradeValue) ? 0 : tradeValue;
    var tradeOwe0 = isNaN(tradeOwe) ? 0 : tradeOwe;

    var negativeEquity = Math.max(0, tradeOwe0 - tradeValue0);
    var otd = price0 + fees0 + tax0;
    var financed = Math.max(0, otd - down0 - tradeValue0 + tradeOwe0);

    if (otd <= 0) {
      out.innerHTML = '<p class="foc__note">Enter at least the vehicle price to begin. Everything else you can pull straight off the dealer’s worksheet.</p>';
      out.setAttribute("data-state", "empty");
      return;
    }

    var html = '';
    html += '<div class="foc__summary" role="group" aria-label="Deal summary">';
    html += '<div><div class="k">Out-the-door price</div><div class="v">' + fmtUSD.format(otd) + '</div></div>';
    html += '<div><div class="k">Amount financed</div><div class="v">' + fmtUSD.format(financed) + '</div></div>';
    html += '</div>';

    if (negativeEquity > 0) {
      html += '<div class="foc__verdict foc__verdict--warn">';
      html += '<h4>⚠ You’re rolling in negative equity</h4>';
      html += '<p>You owe <b>' + fmtUSD.format(negativeEquity) + '</b> more on your trade-in than it’s worth, and that gap is being financed into this loan. You’re borrowing more than the car’s out-the-door price and starting out underwater. If you can, pay it down instead of rolling it in.</p>';
      html += '</div>';
    }

    var haveTerm = !isNaN(term) && term > 0;
    var havePay = !isNaN(payment) && payment > 0;
    var haveApr = !isNaN(apr) && apr >= 0;

    if (financed > 0 && haveTerm && havePay) {
      var impliedRate = impliedMonthlyRate(financed, payment, term);
      var impliedApr = impliedRate * 1200;
      var totalPaid = payment * term;
      var totalInterest = totalPaid - financed;

      var block = '';
      block += '<div class="foc__summary" role="group" aria-label="Loan math">';
      block += '<div><div class="k">Real APR your payment implies</div><div class="v">' + impliedApr.toFixed(2) + '%</div></div>';
      block += '<div><div class="k">Total interest over ' + term + ' mo</div><div class="v">' + fmtUSD.format(totalInterest) + '</div></div>';
      block += '</div>';

      if (haveApr) {
        var expectedPay = pmtAt(apr / 1200, financed, term);
        var payGap = payment - expectedPay;
        var totalGap = payGap * term;
        var tol = Math.max(2, expectedPay * 0.01);

        if (payGap > tol) {
          block += '<div class="foc__verdict foc__verdict--warn">';
          block += '<h4>⚠ The numbers don’t reconcile</h4>';
          block += '<p>At the <b>' + apr.toFixed(2) + '%</b> APR they quoted, a ' + fmtUSD.format(financed) + ' loan over ' + term + ' months should cost <b>' + fmtUSD2.format(expectedPay) + '/mo</b>. They wrote <b>' + fmtUSD2.format(payment) + '/mo</b> — which is really <b>' + impliedApr.toFixed(2) + '% APR</b>.</p>';
          block += '<p>That gap adds up to about <b>' + fmtUSD.format(totalGap) + '</b> over the life of the loan. Ask them to re-print the contract at the rate they promised before you sign anything.</p>';
          block += '<div class="foc__say"><b>Say this at the desk</b><span id="foc-say-line">This payment works out to ' + impliedApr.toFixed(2) + '% APR, not the ' + apr.toFixed(2) + '% you quoted — that\'s about ' + fmtUSD.format(totalGap) + ' over the loan. Re-print it at the rate you promised, or I\'ll use my own financing.</span><button class="copy-btn" type="button" data-copy="foc-say-line">Copy this line</button></div>';
          block += '</div>';
        } else if (payGap < -tol) {
          block += '<div class="foc__verdict foc__verdict--ok">';
          block += '<h4>✓ Better than quoted — double-check why</h4>';
          block += '<p>Your payment is <em>lower</em> than the ' + apr.toFixed(2) + '% quote implies (that rate would be ' + fmtUSD2.format(expectedPay) + '/mo). That can be a real rebate or subvented rate — good — but confirm nothing was moved into the price, the term, or a balloon at the end.</p>';
          block += '</div>';
        } else {
          block += '<div class="foc__verdict foc__verdict--ok">';
          block += '<h4>✓ The math checks out</h4>';
          block += '<p>The ' + fmtUSD2.format(payment) + '/mo payment matches the ' + apr.toFixed(2) + '% APR over ' + term + ' months. The rate they quoted is the rate you’re actually paying. Now make sure no add-ons crept into that ' + fmtUSD.format(financed) + '.</p>';
          block += '</div>';
        }
      } else {
        block += '<div class="foc__verdict">';
        block += '<h4>Your payment implies ' + impliedApr.toFixed(2) + '% APR</h4>';
        block += '<p>Add the APR they quoted you above and we’ll tell you whether it matches what you’re actually being charged.</p>';
        block += '</div>';
      }
      html += block;
    } else if (financed > 0 && haveTerm && haveApr) {
      var shouldPay = pmtAt(apr / 1200, financed, term);
      html += '<div class="foc__verdict">';
      html += '<h4>Your payment should be ' + fmtUSD2.format(shouldPay) + '/mo</h4>';
      html += '<p>At <b>' + apr.toFixed(2) + '%</b> over ' + term + ' months on ' + fmtUSD.format(financed) + '. If the dealer’s number is higher, add their monthly payment above to see the real rate hiding inside it.</p>';
      html += '</div>';
    } else {
      html += '<p class="foc__note">Add the loan term, APR, and monthly payment to check whether the financing matches what you were quoted.</p>';
    }

    out.innerHTML = html;
    out.setAttribute("data-state", "filled");
  }

  function init() {
    var form = document.getElementById("foc-form");
    if (!form) return;
    form.addEventListener("input", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
    var reset = document.getElementById("foc-reset");
    if (reset) reset.addEventListener("click", function () {
      setTimeout(render, 0);
    });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
