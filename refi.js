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

  function render() {
    var out = document.getElementById("refi-output");
    if (!out) return;

    var balance = num("refi-balance");
    var payment = num("refi-payment");
    var months = num("refi-months");
    var newRate = num("refi-rate");
    var newTerm = num("refi-term");

    if (isNaN(balance) || balance <= 0) {
      out.innerHTML = '<p class="foc__note">Start with what you still owe (your payoff balance) — it’s on your latest loan statement.</p>';
      out.setAttribute("data-state", "empty");
      return;
    }

    if (isNaN(newRate) || newRate < 0) {
      out.innerHTML = '<p class="foc__note">Add the new rate you could get and we’ll work out the new payment and what you’d save. Not sure? A credit union will pre-qualify you in minutes.</p>';
      out.setAttribute("data-state", "empty");
      return;
    }

    var term = (!isNaN(newTerm) && newTerm > 0) ? newTerm : ((!isNaN(months) && months > 0) ? months : NaN);
    if (isNaN(term) || term <= 0) {
      out.innerHTML = '<p class="foc__note">Add the months left on your loan (or a new term below) so we can work out the payment.</p>';
      out.setAttribute("data-state", "empty");
      return;
    }

    var haveCur = !isNaN(payment) && payment > 0 && !isNaN(months) && months > 0;
    var newPay = pmtAt(newRate / 1200, balance, term);
    var newInterest = newPay * term - balance;

    var html = '';
    html += '<div class="foc__summary foc__summary--solo" role="group" aria-label="Refinance result">';
    html += '<div><div class="k">New monthly payment</div><div class="v">' + fmtUSD2.format(newPay) + '</div></div>';
    html += '</div>';

    if (!haveCur) {
      html += '<div class="foc__verdict">';
      html += '<h4>Add your current loan to see the savings</h4>';
      html += '<p>At <b>' + newRate.toFixed(2) + '%</b> over ' + term + ' months, ' + fmtUSD.format(balance) + ' works out to <b>' + fmtUSD2.format(newPay) + '/mo</b>. Enter your current payment and the months you have left, and we’ll show what you’d save each month and overall.</p>';
      html += '</div>';
      out.innerHTML = html;
      out.setAttribute("data-state", "filled");
      return;
    }

    var curInterest = Math.max(0, payment * months - balance);
    var monthlySaved = payment - newPay;
    var interestSaved = curInterest - newInterest;
    var extended = term > months;

    html += '<div class="foc__summary" role="group" aria-label="Savings">';
    html += '<div><div class="k">Change in monthly payment</div><div class="v">' + (monthlySaved >= 0 ? "−" : "+") + fmtUSD2.format(Math.abs(monthlySaved)) + '</div></div>';
    html += '<div><div class="k">Interest saved overall</div><div class="v">' + (interestSaved >= 0 ? "" : "−") + fmtUSD.format(Math.abs(interestSaved)) + '</div></div>';
    html += '</div>';

    if (interestSaved > 0 && monthlySaved > 0) {
      html += '<div class="foc__verdict foc__verdict--ok">';
      html += '<h4>✓ Refinancing looks worth a real look</h4>';
      html += '<p>A ' + newRate.toFixed(2) + '% loan over ' + term + ' months drops your payment about <b>' + fmtUSD2.format(monthlySaved) + '/mo</b> and saves roughly <b>' + fmtUSD.format(interestSaved) + '</b> in interest over the life of the loan.</p>';
      html += '</div>';
    } else if (monthlySaved > 0 && interestSaved <= 0) {
      html += '<div class="foc__verdict foc__verdict--warn">';
      html += '<h4>⚠ Lower payment, but you’d pay more in the end</h4>';
      html += '<p>The payment drops <b>' + fmtUSD2.format(monthlySaved) + '/mo</b>, but stretching the loan to ' + term + ' months means about <b>' + fmtUSD.format(Math.abs(interestSaved)) + '</b> <em>more</em> in total interest. If you can keep the term at or below the ' + months + ' months you have left, the savings turn real.</p>';
      html += '</div>';
    } else {
      html += '<div class="foc__verdict foc__verdict--warn">';
      html += '<h4>This rate doesn’t beat what you already have</h4>';
      html += '<p>At ' + newRate.toFixed(2) + '% over ' + term + ' months, refinancing wouldn’t save you money' + (extended ? ' — partly because it stretches the loan past the ' + months + ' months you have left' : '') + '. Shop a lower rate, or a shorter term, and check again.</p>';
      html += '</div>';
    }

    html += '<p class="foc__note">An estimate to point you in the right direction, not financial advice. It doesn’t include any refinance fees, and a longer term lowers the payment while adding interest. Credit unions are usually the cheapest place to refinance — get a pre-qualification and bring these numbers.</p>';

    out.innerHTML = html;
    out.setAttribute("data-state", "filled");
  }

  function init() {
    var form = document.getElementById("refi-form");
    if (!form) return;
    form.addEventListener("input", render);
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
    var reset = document.getElementById("refi-reset");
    if (reset) reset.addEventListener("click", function () { setTimeout(render, 0); });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
