/* =========================================================================
   HOLIDAY BANNER. Shows itself a set number of days before a holiday and
   hides itself the day after. Nothing to remember to turn off.

   Edited at /admin/ under "Holiday Specials" (content/holidays.json).
   Used by the home page and the story page. Display-only: if the file is
   missing or anything goes wrong, the section simply stays hidden.
   Text goes in with textContent, so nothing typed in the editor can run
   as code on the page.
   ========================================================================= */
(function () {
  "use strict";
  var el = document.getElementById("holidayBand");
  if (!el || !window.fetch) return;
  var src = el.getAttribute("data-src") || "content/holidays.json";

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Accepts "2026-11-11" or a full timestamp; only the calendar date is used.
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ""));
    return m ? [Number(m[1]), Number(m[2]) - 1, Number(m[3])] : null;
  }

  // The soonest holiday whose window (N days before, through the day itself)
  // contains "now". Local time, so it flips at the restaurant's midnight.
  function pick(items, now) {
    var best = null;
    (items || []).forEach(function (h) {
      if (!h || h.active === false || !h.title) return;
      var p = parseDate(h.date);
      if (!p) return;
      var lead = parseInt(h.days_before, 10);
      if (!(lead >= 0)) lead = 10;
      lead = Math.min(lead, 60);
      var years = h.repeats_yearly === false ? [p[0]] : [now.getFullYear(), now.getFullYear() + 1];
      years.forEach(function (y) {
        var day = new Date(y, p[1], p[2]);
        var start = new Date(y, p[1], p[2] - lead);
        var end = new Date(y, p[1], p[2] + 1);
        if (now >= start && now < end && (!best || day < best.day)) best = { h: h, day: day };
      });
    });
    return best;
  }

  function add(parent, tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    parent.appendChild(n);
    return n;
  }

  fetch(src, { cache: "no-cache" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      var now = new Date();
      var b = j && pick(j.items, now);
      if (!b) return;
      var isToday = b.day.toDateString() === now.toDateString();
      var when = isToday ? "Today"
        : DAYS[b.day.getDay()] + ", " + MONTHS[b.day.getMonth()] + " " + b.day.getDate();
      if (b.h.occasion) when += " · " + b.h.occasion;
      var inner = add(el, "div", "holiday-inner");
      add(inner, "span", "holiday-when", when);
      add(inner, "h2", "holiday-title", String(b.h.title));
      if (b.h.message) add(inner, "p", "holiday-line", String(b.h.message));
      if (b.h.fine_print) add(inner, "p", "holiday-fine", String(b.h.fine_print));
      el.hidden = false;
    })
    .catch(function () { /* stay hidden */ });
})();
