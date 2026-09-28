// Story page: tonight's special.
// Reads the same specials Cornie edits at /admin/ (content/specials.json),
// so a price change there shows up here too. The list below is only a
// fallback for when that file can't be reached.
// Lives in its own file because the site's security policy blocks
// scripts written inside the page.
(function () {
  var ROTATION = [
    { day: 0, name: "8 oz Sirloin", line: "$24 — 8 oz Angus sirloin, charbroiled, house seasoning & homemade au jus." },
    { day: 2, name: "8 oz Sirloin", line: "$24 — 8 oz Angus sirloin, charbroiled, house seasoning & homemade au jus." },
    { day: 3, name: "14 oz HamBurger Steak", line: "$23 — 14 oz Angus beef, house seasoning & homemade au jus." },
    { day: 4, name: "14 oz HamBurger Steak", line: "$23 — 14 oz Angus beef, house seasoning & homemade au jus." },
    { day: 5, name: "Prime Rib", line: "Slow-roasted, house seasoning & homemade au jus — 12 oz or 16 oz, $27/$39. Fridays only, while it lasts." },
    { day: 6, name: "Steak Specials", line: "Saturday night — usually more than one cut on the board." }
  ];
  var FALLBACK_TITLE = "The salad bar never takes a day off.";
  var FALLBACK_LINE = "Homemade soups and salads daily — and check the full site for tonight's cut.";
  var CLOSED_MSG = "We're closed Mondays — but the rest of the week, there's always a cut on the board.";

  var card = document.getElementById("special-card");
  if (!card) return;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function render(specials) {
    var rotation = ROTATION, override = null, featured = null;
    if (specials) {
      var ft = specials.featured;
      if (ft && ft.active && ft.items && ft.items.length) featured = ft.items;
      if (specials.rotation && specials.rotation.length) {
        rotation = specials.rotation.map(function (r) {
          return { day: Number(r.day), name: r.name, line: r.line };
        });
      }
      var ov = specials.todayOverride;
      if (ov && ov.active && ov.title) override = ov;
    }

    var today = new Date().getDay(); // 0=Sun
    var hit = null;
    for (var i = 0; i < rotation.length; i++) {
      if (rotation[i].day === today) { hit = rotation[i]; break; }
    }

    var html = "";
    if (today === 1 && !override) {
      html = '<div class="special-label">Monday</div>';
      html += '<div class="special-closed">' + CLOSED_MSG + '</div>';
      document.getElementById("special-section").querySelector("h2").textContent = "We’re off tonight";
    } else if (override) {
      html = '<div class="special-label">Today’s Special</div>';
      html += '<div class="special-name">' + esc(override.title) + '</div>';
      if (override.line) html += '<div class="special-line">' + esc(override.line) + '</div>';
    } else if (today === 6) {
      // Saturday: the home page's rotation line points to a list "below";
      // this page shows the list itself when Cornie has filled it in.
      html = '<div class="special-label">Tonight’s Specials</div>';
      if (featured) {
        featured.forEach(function (it) {
          html += '<div class="special-name">' + esc(it.name || "") + '</div>';
          if (it.line) html += '<div class="special-line">' + esc(it.line) + '</div>';
        });
      } else {
        html += '<div class="special-name">Steak Specials</div>';
        html += '<div class="special-line">Saturday night — usually more than one cut on the board.</div>';
      }
    } else if (hit) {
      html = '<div class="special-label">Tonight’s Special</div>';
      html += '<div class="special-name">' + esc(hit.name) + '</div>';
      html += '<div class="special-line">' + esc(hit.line) + '</div>';
    } else {
      html = '<div class="special-label">On the menu</div>';
      html += '<div class="special-name">' + FALLBACK_TITLE + '</div>';
      html += '<div class="special-line">' + FALLBACK_LINE + '</div>';
    }
    card.innerHTML = html;
  }

  if (window.fetch) {
    fetch("../content/specials.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { render(j); })
      .catch(function () { render(null); });
  } else {
    render(null);
  }
})();
