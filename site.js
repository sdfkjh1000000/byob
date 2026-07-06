(function () {
  "use strict";
  var t = document.querySelector(".nav-toggle"), n = document.getElementById("nav");
  if (!t || !n) return;
  t.addEventListener("click", function () {
    var open = n.getAttribute("data-open") === "true";
    n.setAttribute("data-open", String(!open));
    t.setAttribute("aria-expanded", String(!open));
  });
})();
