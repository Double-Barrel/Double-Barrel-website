/* =========================================================================
   DOUBLE BARREL STEAKHOUSE — site script

   WHERE THE CONTENT LIVES
   The hours, specials, and menu are edited in the visual editor at /admin/
   and stored as plain files in the owner's own GitHub repo:
       content/hours.json · content/specials.json · content/menu.json
   This script loads those files and renders them. If they're ever missing
   or unreachable (e.g. opening index.html straight off a USB stick), the
   built-in values below are used instead, so the site always renders.
   That means the site can never be broken by an editor outage — the files
   ARE the database, and the fallback below is the safety net.
   Hours confirmed in-person with Cornie Waldner, 2026-07-31.
   ========================================================================= */
var HOURS = [
  { day: "Sunday",    open: "11:00 AM – 8:00 PM", oh: 11, ch: 20 },
  { day: "Monday",    open: "Closed" },
  { day: "Tuesday",   open: "11 AM – 2 PM · 4 – 8 PM", oh: 11, ch: 20, bs: 14, be: 16 },
  { day: "Wednesday", open: "11 AM – 2 PM · 4 – 8 PM", oh: 11, ch: 20, bs: 14, be: 16 },
  { day: "Thursday",  open: "11:00 AM – 9:00 PM", oh: 11, ch: 21 },
  { day: "Friday",    open: "11:00 AM – 9:00 PM", oh: 11, ch: 21 },
  { day: "Saturday",  open: "11:00 AM – 9:00 PM", oh: 11, ch: 21 }
];

var ROTATION = [
  /* dayIndex 0=Sun … 6=Sat. Confirmed with Cornie Waldner in person, 2026-08. */
  { d: 0, name: "8 oz Sirloin",            line: "$24 — 8 oz Angus sirloin, charbroiled, house seasoning & homemade au jus. Confirmed live." },
  { d: 2, name: "8 oz Sirloin",            line: "$24 — 8 oz Angus sirloin, charbroiled, house seasoning & homemade au jus. Daily specials posted at noon." },
  { d: 3, name: "14 oz HamBurger Steak",   line: "$23 — 14 oz Angus beef, house seasoning & homemade au jus." },
  { d: 4, name: "14 oz HamBurger Steak",   line: "$23 — 14 oz Angus beef, house seasoning & homemade au jus." },
  { d: 5, name: "Prime Rib",        line: "Slow-roasted, house seasoning & homemade au jus — 12 oz or 16 oz, $27/$39. Fridays only, while it lasts." },
  { d: 6, name: "Steak Specials", line: "Usually more than one cut — see this week's list below, straight from Cornie's Saturday Facebook post." }
];

/* FEATURED SPECIALS (Saturdays usually run more than one cut). Cornie types
   the same words he posts to Facebook into this list in the /admin/ editor —
   there is no Facebook API integration and no separate automation login.
   Two logins, full stop: Facebook (his, unchanged) and the site's own
   editor (GitHub). No Zapier/n8n/Make account for him to remember. */
var FEATURED = { active: false, heading: "This Week's Steak Specials", items: [] };
/* ============== (end of built-in fallback content) ====================== */

/* Pull content/*.json when the site is served over http(s). Falls back to the
   values above on any failure — including file:// where fetch is blocked. */
function loadContent(done) {
  if (!window.fetch || location.protocol === "file:") return done();
  var keys = ["hours", "specials", "menu", "featured-mount", "printed-menu", "faq", "reviews"];
  var pending = keys.length, bag = {};
  function settle() { if (--pending === 0) { applyContent(bag); done(); } }
  keys.forEach(function (key) {
    fetch("content/" + key + ".json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j) bag[key] = j; })
      .catch(function () { /* keep fallback */ })
      .then(settle, settle);
  });
}

function applyContent(bag) {
  if (bag.hours && bag.hours.days && bag.hours.days.length === 7) {
    HOURS = bag.hours.days.map(function (d) {
      var row = { day: d.day, open: d.closed ? "Closed" : d.text };
      if (!d.closed) {
        row.oh = d.oh; row.ch = d.ch;
        /* optional afternoon break (bs/be on a 24h clock; 0 or missing = none) */
        if (d.bs && d.be) { row.bs = d.bs; row.be = d.be; }
      }
      return row;
    });
    if (bag.hours.barNote) {
      var bn = document.querySelector(".bar-note");
      if (bn) bn.textContent = bag.hours.barNote;
    }
    if (bag.hours.footerSummary) FOOTER_SUMMARY = bag.hours.footerSummary;
  }
  if (bag.specials) {
    if (bag.specials.rotation) {
      ROTATION = bag.specials.rotation.map(function (r) {
        return { d: Number(r.day), name: r.name, line: r.line };
      });
    }
    SPECIAL_FALLBACK = {
      title: bag.specials.fallbackTitle || SPECIAL_FALLBACK.title,
      line:  bag.specials.fallbackLine  || SPECIAL_FALLBACK.line
    };
    var ov = bag.specials.todayOverride;
    if (ov && ov.active && ov.title) TODAY_OVERRIDE = ov;
    var ft = bag.specials.featured;
    if (ft) {
      FEATURED = {
        active: !!ft.active && !!(ft.items && ft.items.length),
        heading: ft.heading || FEATURED.heading,
        items: ft.items || []
      };
    }
  }
  if (bag.menu && menuLooksComplete(bag.menu)) renderMenu(bag.menu);
  var pm = bag["printed-menu"];
  if (pm) {
    PRINTED_MENU = {
      active: pm.active !== false && !!(pm.pages && pm.pages.length),
      heading: pm.heading || PRINTED_MENU.heading,
      intro: pm.intro || "",
      pages: (pm.pages || []).filter(function (p) { return p && p.image; })
    };
  }
  if (bag.faq) {
    FAQ = {
      active: bag.faq.active !== false && !!(bag.faq.items && bag.faq.items.length),
      heading: bag.faq.heading || FAQ.heading,
      items: (bag.faq.items || []).filter(function (it) { return it && it.q && it.a; })
    };
  }
  if (bag.reviews && bag.reviews.items && bag.reviews.items.length) {
    REVIEWS = {
      heading: bag.reviews.heading || REVIEWS.heading,
      footLine: bag.reviews.footLine || "",
      items: bag.reviews.items.filter(function (r) { return r && r.quote; })
    };
  }
  var fm = bag["featured-mount"];
  if (fm) {
    FEATURED_MOUNT = {
      active: !!fm.active && !!fm.name && !!fm.image,
      heading: fm.heading || FEATURED_MOUNT.heading,
      name: fm.name || "",
      story: fm.story || "",
      image: fm.image || ""
    };
  }
}

/* Replaces the menu markup in index.html with the edited version. The HTML
   ships with the current menu already in it, so search engines and anyone
   with JS off still see real food and real prices. */
/* Refuses a gutted menu. The owner once wiped the main menu on his previous
   website with a bad edit; this floor makes that impossible here. If menu.json
   ever arrives with fewer than 4 sections or 20 items total — a mass deletion,
   not a real menu edit — the site ignores it and keeps showing the full menu
   baked into index.html. The bad JSON is still in git for Zach to roll back. */
function menuLooksComplete(menu) {
  if (!menu.sections || menu.sections.length < 4) return false;
  var total = 0;
  menu.sections.forEach(function (s) { total += (s.items || []).length; });
  return total >= 20;
}

function renderMenu(menu) {
  var cols = document.querySelectorAll(".menu-cols .menu-col");
  if (!cols.length || !menu.sections) return;
  var intro = document.querySelector(".menu-head p");
  if (intro && menu.intro) intro.textContent = menu.intro;

  var buckets = [[], []];
  menu.sections.forEach(function (s) {
    var i = Number(s.column) === 2 ? 1 : 0;
    if (buckets[i]) buckets[i].push(s);
  });

  buckets.forEach(function (sections, i) {
    var col = cols[i];
    if (!col || !sections.length) return;
    var html = "";
    sections.forEach(function (s, si) {
      html += '<div class="menu-section" data-cat="' + escapeHtml(slugify(s.title)) + '">' +
              '<h3' + (si ? ' style="margin-top:24px"' : "") + ">" +
              escapeHtml(s.title) + "</h3><ul class=\"mlist\">";
      (s.items || []).forEach(function (it) {
        html += '<li><span class="nm">' + escapeAllowingBasic(it.name || "") + "</span>" +
                '<span class="pr">' + (it.price ? escapeHtml(it.price) : "&nbsp;") + "</span>" +
                (it.desc ? '<span class="ds">' + escapeHtml(it.desc) + "</span>" : "") + "</li>";
      });
      html += "</ul>";
      if (s.note) html += '<p class="mnote">' + escapeHtml(s.note) + "</p>";
      html += "</div>";
    });
    col.innerHTML = html;
  });
}

/* Turns a section title into a stable filter key: "Seafood & Chicken" →
   "seafood-chicken". Must match the data-cat values in index.html so the
   filter behaves identically whether the menu came from JSON or the fallback. */
function slugify(t) {
  return String(t).toLowerCase().replace(/&amp;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* The printed menu: thumbnails, the leather flip-BOOK, and the flat lightbox.
   Thumbs and the book-teaser open the book (a 3D page-turner); the book's
   magnifier hands the current page to the lightbox for actual reading.
   Keyboard: Esc closes, arrows turn/page. Focus returns where it started. */
function buildPrintedMenu() {
  var wrap = document.getElementById("printedMenu");
  var lb = document.getElementById("lightbox");
  var bk = document.getElementById("menuBook");
  if (!wrap) return;

  var pages = PRINTED_MENU.active ? PRINTED_MENU.pages : [];
  if (!pages.length) { wrap.hidden = true; return; }

  /* ---------- section markup: book teaser + page thumbs ---------- */
  var h = "<h3>" + escapeHtml(PRINTED_MENU.heading) + "</h3>";
  if (PRINTED_MENU.intro) h += '<p class="pm-intro">' + escapeHtml(PRINTED_MENU.intro) + "</p>";
  h += '<button class="pm-book-teaser" type="button" id="pmOpenBook">' +
       '<span class="bk-mini"><img class="bk-mini-photo" src="images/menu-cover.jpg" alt=""></span>' +
       '<span class="bk-cta">Open the menu book</span></button>';
  h += '<div class="pm-grid">';
  pages.forEach(function (p, i) {
    h += '<button class="pm-page" type="button" data-i="' + i + '">' +
         '<img src="' + escapeHtml(p.image) + '" alt="' + escapeHtml(p.label || "Menu page") + '" loading="lazy">' +
         '<span class="pm-label">' + escapeHtml(p.label || "Page " + (i + 1)) + "</span></button>";
  });
  h += "</div>";
  wrap.innerHTML = h;
  wrap.hidden = false;

  /* ---------- the flat lightbox (reading view) ---------- */
  var lbApi = null;
  if (lb) {
    var img = document.getElementById("lbImg"),
        cap = document.getElementById("lbCap"),
        prev = document.getElementById("lbPrev"),
        next = document.getElementById("lbNext"),
        closeBtn = document.getElementById("lbClose"),
        idx = 0, opener = null;

    function lbShow(i) {
      idx = (i + pages.length) % pages.length;
      var p = pages[idx];
      img.src = p.image;
      img.alt = p.label || "Menu page " + (idx + 1);
      cap.textContent = (p.label || "Page " + (idx + 1)) +
                        (pages.length > 1 ? "  ·  " + (idx + 1) + " of " + pages.length : "");
      prev.hidden = next.hidden = pages.length < 2;
    }
    function lbOpen(i, from) {
      opener = from || null;
      lbShow(i);
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      document.addEventListener("keydown", lbKey);
    }
    function lbClose() {
      lb.hidden = true;
      document.body.style.overflow = "";
      document.removeEventListener("keydown", lbKey);
      if (opener) opener.focus();
    }
    function lbKey(e) {
      if (e.key === "Escape") lbClose();
      else if (e.key === "ArrowLeft" && pages.length > 1) lbShow(idx - 1);
      else if (e.key === "ArrowRight" && pages.length > 1) lbShow(idx + 1);
    }
    closeBtn.addEventListener("click", lbClose);
    prev.addEventListener("click", function () { lbShow(idx - 1); });
    next.addEventListener("click", function () { lbShow(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
    var lx0 = null;
    lb.addEventListener("touchstart", function (e) { lx0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (lx0 === null || pages.length < 2) { lx0 = null; return; }
      var dx = e.changedTouches[0].clientX - lx0;
      if (Math.abs(dx) > 40) lbShow(idx + (dx < 0 ? 1 : -1));
      lx0 = null;
    }, { passive: true });
    lbApi = { open: lbOpen };
  }

  /* ---------- the BOOK ---------- */
  if (!bk) return;
  var bookEl = document.getElementById("bookEl"),
      edgesR = document.getElementById("bkEdgesR"),
      edgesL = document.getElementById("bkEdgesL"),
      bPrev = document.getElementById("bkPrev"),
      bNext = document.getElementById("bkNext"),
      bZoom = document.getElementById("bkZoom"),
      bClose = document.getElementById("bkClose"),
      bCap = document.getElementById("bkCaption");

  /* Leaves: [0] = leather cover, [1..N] = the printed pages.
     state = how many leaves lie flipped to the left (0 = closed book). */
  var leaves = [];
  var cover = document.createElement("div");
  cover.className = "leaf cover";
  /* the real thing: Cornie's leather menu binder, photographed */
  cover.innerHTML =
    '<div class="leaf-front"><img src="images/menu-cover.jpg" alt="The Double Barrel menu, leather-bound"></div>' +
    '<div class="leaf-back cover-inside"></div>';
  bookEl.appendChild(cover);
  leaves.push(cover);
  pages.forEach(function (p, i) {
    var leaf = document.createElement("div");
    leaf.className = "leaf";
    leaf.innerHTML =
      '<div class="leaf-front"><img src="' + escapeHtml(p.image) + '" alt="' +
        escapeHtml(p.label || "Menu page " + (i + 1)) + '"></div>' +
      '<div class="leaf-back paper-back"><img src="images/logo.png" alt=""></div>';
    bookEl.appendChild(leaf);
    leaves.push(leaf);
  });

  var state = 0, L = leaves.length, bOpener = null;

  function restack() {
    leaves.forEach(function (leaf, i) {
      /* a leaf mid-turn keeps its ride-on-top z until transitionend */
      if (leaf.classList.contains("turning")) return;
      leaf.style.zIndex = leaf.classList.contains("flipped") ? (i + 1) : (L - i);
    });
  }
  function caption() {
    if (state === 0) return "Front cover \u00b7 tap to open";
    if (state > pages.length) return "The back \u00b7 thanks for looking";
    var p = pages[state - 1];
    return (p.label || "Page " + state) + " \u00b7 " + state + " of " + pages.length;
  }
  function sync(animateLeaf) {
    leaves.forEach(function (leaf, i) {
      var want = i < state;
      if (leaf.classList.contains("flipped") !== want) {
        if (leaf === animateLeaf) {
          leaf.classList.add("turning");
          leaf.style.zIndex = L + 2;                 /* ride above both stacks mid-turn */
          leaf.addEventListener("transitionend", function done() {
            leaf.removeEventListener("transitionend", done);
            leaf.classList.remove("turning");
            restack();
          });
        }
        leaf.classList.toggle("flipped", want);
      }
    });
    restack();
    /* page-block thickness on each side of the spine */
    var flippedPages = Math.max(0, state - 1);
    var restPages = pages.length - flippedPages;
    edgesR.style.width = (state >= 1 ? restPages * 3 : pages.length * 3 + 4) + "px";
    edgesL.style.width = (state >= 1 ? flippedPages * 3 + 4 : 0) + "px";
    bCap.textContent = caption();
    bPrev.disabled = state === 0;
    bNext.disabled = state === L;
    bZoom.hidden = state === 0 || state > pages.length;
  }
  function turnTo(n, animate) {
    n = Math.max(0, Math.min(L, n));
    if (n === state) return;
    var leaf = leaves[n > state ? n - 1 : n];   /* the one leaf that moves */
    state = n;
    sync(animate === false ? null : leaf);
  }
  function bookOpen(pageIdx, from) {
    bOpener = from || null;
    bk.hidden = false;
    document.body.style.overflow = "hidden";
    /* land on the page without animating the whole history */
    state = 0; leaves.forEach(function (l) { l.classList.remove("flipped"); });
    if (pageIdx > 0) { turnTo(pageIdx, false); } else { sync(null); }
    bClose.focus();
    document.addEventListener("keydown", bkKey);
  }
  function bookClose() {
    bk.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", bkKey);
    if (bOpener) bOpener.focus();
  }
  function bkKey(e) {
    if (e.key === "Escape") bookClose();
    else if (e.key === "ArrowRight") turnTo(state + 1);
    else if (e.key === "ArrowLeft") turnTo(state - 1);
  }

  bookEl.addEventListener("click", function (e) {
    var leaf = e.target.closest(".leaf");
    if (!leaf) return;
    turnTo(state + (leaf.classList.contains("flipped") ? -1 : 1));
  });
  bNext.addEventListener("click", function () { turnTo(state + 1); });
  bPrev.addEventListener("click", function () { turnTo(state - 1); });
  bClose.addEventListener("click", bookClose);
  bk.addEventListener("click", function (e) { if (e.target === bk) bookClose(); });
  bZoom.addEventListener("click", function () {
    if (lbApi && state >= 1 && state <= pages.length) {
      bookClose();
      lbApi.open(state - 1, bOpener);
    }
  });
  var bx0 = null;
  bk.addEventListener("touchstart", function (e) { bx0 = e.touches[0].clientX; }, { passive: true });
  bk.addEventListener("touchend", function (e) {
    if (bx0 === null) return;
    var dx = e.changedTouches[0].clientX - bx0;
    if (Math.abs(dx) > 40) turnTo(state + (dx < 0 ? 1 : -1));
    bx0 = null;
  }, { passive: true });

  /* entry points: the teaser opens at the cover; a thumb opens at its page */
  var teaser = document.getElementById("pmOpenBook");
  if (teaser) teaser.addEventListener("click", function () { bookOpen(0, teaser); });
  wrap.querySelectorAll(".pm-page").forEach(function (b) {
    b.addEventListener("click", function () {
      bookOpen(Number(b.getAttribute("data-i")) + 1, b);
    });
  });
}

/* Re-renders the FAQ accordion and the FAQPage structured data from faq.json.
   If the JSON never loaded (FAQ.items === null), the static HTML shipped in
   index.html stands — crawlers and no-JS visitors already have it. */
function renderFaq() {
  var sec = document.getElementById("faq");
  if (!sec) return;
  if (!FAQ.active) { sec.hidden = true; return; }
  if (FAQ.items === null) return;              /* keep the static baseline */

  var h2 = sec.querySelector("h2");
  if (h2) h2.textContent = FAQ.heading;
  var list = document.getElementById("faqList");
  if (list) {
    var h = "";
    FAQ.items.forEach(function (it, i) {
      h += '<details class="qa"' + (i === 0 ? " open" : "") + "><summary>" +
           escapeHtml(it.q) + "</summary><p>" + escapeHtml(it.a) + "</p></details>";
    });
    list.innerHTML = h;
  }
  /* keep the FAQPage schema in lockstep with what's on the page — Google's
     renderer reads the updated script content */
  var ld = document.getElementById("faqSchema");
  if (ld) {
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQ.items.map(function (it) {
        return { "@type": "Question", "name": it.q,
                 "acceptedAnswer": { "@type": "Answer", "text": it.a } };
      })
    });
  }
}

/* Rebuilds the review slides from reviews.json. Must run BEFORE the carousel
   wires itself up, since arrows/dots count the slides that are in the DOM.
   If the JSON never loaded (REVIEWS.items === null) the static baseline stands. */
function renderReviews() {
  if (REVIEWS.items === null) return;
  var sec = document.getElementById("reviews");
  if (!sec) return;
  var h2 = sec.querySelector("h2");
  if (h2) h2.textContent = REVIEWS.heading;
  var track = document.getElementById("revTrack");
  if (track) {
    var h = "";
    REVIEWS.items.forEach(function (r) {
      h += '<figure class="rev"><blockquote>' + escapeHtml(r.quote) + "</blockquote>" +
           "<figcaption>" + escapeHtml(r.name || "A guest") +
           "<span>" + escapeHtml(r.source || "Facebook review") + "</span></figcaption></figure>";
    });
    track.innerHTML = h;
  }
  /* foot line is editable text; the Facebook link itself stays hard-wired */
  var foot = sec.querySelector(".rev-foot");
  if (foot) {
    var link = foot.querySelector("a");
    foot.textContent = REVIEWS.footLine ? REVIEWS.footLine + " · " : "";
    if (link) foot.appendChild(link);
  }
}

/* Builds the category chips and wires filtering. Safe to call more than once. */
function buildMenuFilter() {
  var bar = document.getElementById("menuFilter");
  var count = document.getElementById("menuCount");
  var cols = document.querySelector(".menu-cols");
  if (!bar || !cols) return;

  var sections = Array.prototype.slice.call(cols.querySelectorAll(".menu-section"));
  if (sections.length < 2) return;           // nothing worth filtering

  var cats = sections.map(function (s) {
    return {
      key: s.getAttribute("data-cat"),
      label: (s.querySelector("h3") || {}).textContent || "",
      n: s.querySelectorAll(".mlist li").length,
      el: s
    };
  });
  var total = cats.reduce(function (a, c) { return a + c.n; }, 0);

  bar.innerHTML = "";
  var chips = [];
  function addChip(key, label, n) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.setAttribute("data-key", key);
    b.setAttribute("aria-pressed", key === "all" ? "true" : "false");
    b.innerHTML = escapeHtml(label) + '<span class="n">' + n + "</span>";
    b.addEventListener("click", function () { apply(key); });
    bar.appendChild(b);
    chips.push(b);
  }
  addChip("all", "Everything", total);
  cats.forEach(function (c) { addChip(c.key, c.label, c.n); });

  function apply(key) {
    cats.forEach(function (c) {
      var show = (key === "all" || c.key === key);
      c.el.hidden = !show;
    });
    chips.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-key") === key));
    });
    cols.classList.toggle("is-filtered", key !== "all");
    if (count) {
      var shown = key === "all" ? total : (cats.filter(function (c) { return c.key === key; })[0] || {}).n;
      count.textContent = key === "all"
        ? "Showing all " + total + " items"
        : "Showing " + shown + " of " + total + " items";
      count.hidden = false;
    }
  }

  bar.hidden = false;
  apply("all");
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Some fields legitimately carry light formatting — "Prime Rib <em>(Fridays
   only)</em>", a <br> in the footer hours. Rather than trust those fields
   wholesale, escape everything and then re-permit a tiny whitelist of
   harmless tags. Anything else (script, img/onerror, style, on* handlers)
   stays escaped and renders as visible text instead of executing. */
function escapeAllowingBasic(s) {
  return escapeHtml(s).replace(/&lt;(\/?)(em|i|b|strong|br)\s*\/?&gt;/gi, "<$1$2>");
}

var FOOTER_SUMMARY = "Closed Mon<br>Tue/Wed/Sun 11–8<br>Thu/Fri/Sat 11–9";
var SPECIAL_FALLBACK = {
  title: "The salad bar never takes a day off.",
  line: "Homemade soups and salads daily — and watch this space for holiday feature menus."
};
var TODAY_OVERRIDE = null;
var FEATURED_MOUNT = { active: false, heading: "Featured Mount", name: "", story: "", image: "" };
/* Printed-menu pages. The fallback carries the one page we have on disk so the
   gallery still appears offline / on file://; the editor replaces it wholesale
   once real scans are uploaded. */
/* FAQ fallback: null means "leave the static HTML + schema as shipped".
   Only a successfully-fetched faq.json replaces them. */
var FAQ = { active: true, heading: "Good questions, straight answers.", items: null };

/* Reviews fallback — same rule: null keeps the static carousel in index.html. */
var REVIEWS = { heading: "Regulars for a reason.", footLine: null, items: null };
var PRINTED_MENU = {
  active: true,
  heading: "See the printed menu",
  intro: "The same menu we hand you at the table. Tap any page to read it full-size.",
  pages: [{ label: "Cover", image: "images/menu-page-1.jpg" }]
};

loadContent(function () { startSite(); });

function startSite() {
  var now = new Date();
  var todayIdx = now.getDay();
  var hourNow = now.getHours() + now.getMinutes() / 60;

  function fmt(h) {
    var ap = h >= 12 ? "PM" : "AM", hh = h % 12; if (hh === 0) hh = 12;
    return hh + " " + ap;
  }

  /* ---- hours grid ---- */
  var grid = document.getElementById("hoursGrid");
  if (grid) {
    HOURS.forEach(function (h, i) {
      var row = document.createElement("div");
      row.className = "hrow" + (i === todayIdx ? " today-row" : "");
      row.innerHTML =
        '<span class="d">' + escapeHtml(h.day) + "</span>" +
        '<span class="t">' + escapeHtml(h.open) +
        (i === todayIdx ? '<span class="badge">Today</span>' : "") + "</span>";
      grid.appendChild(row);
    });
  }

  /* ---- hero "Open now" pill ---- */
  var t = HOURS[todayIdx];
  var pill = document.getElementById("statusPill");
  var txt = document.getElementById("statusText");
  if (pill && txt && t) {
    /* the Tue/Wed afternoon break counts as closed, with its own message */
    var onBreak = t.bs !== undefined && hourNow >= t.bs && hourNow < t.be;
    var open = !onBreak && t.oh !== undefined && hourNow >= t.oh && hourNow < t.ch;
    if (open) {
      pill.classList.add("open");
      /* before the break, the honest close time is the break start */
      var closesAt = (t.bs !== undefined && hourNow < t.bs) ? t.bs : t.ch;
      txt.textContent = "Open now · kitchen 'til " + fmt(closesAt) +
                        (closesAt === t.bs ? " · back " + fmt(t.be) + "–" + fmt(t.ch) : "");
    } else if (onBreak) {
      pill.classList.add("closed");
      txt.textContent = "Afternoon break · back at " + fmt(t.be);
    } else {
      pill.classList.add("closed");
      var next = null, k;
      for (k = 0; k < 7; k++) {
        var d = HOURS[(todayIdx + k) % 7];
        if (d.oh === undefined) continue;
        if (k === 0 && hourNow < d.oh) { next = { label: "today", d: d }; break; }
        if (k > 0) { next = { label: (k === 1 ? "tomorrow" : d.day), d: d }; break; }
      }
      txt.textContent = next ? "Closed · opens " + next.label + " at " + fmt(next.d.oh)
                             : "Closed right now";
    }
  }

  /* ---- footer summary ---- */
  var foot = document.getElementById("footHours");
  if (foot) foot.innerHTML = escapeAllowingBasic(FOOTER_SUMMARY);

  /* ---- Today at the Double Barrel ----
     Priority: the owner's noon "today" post → the weekly rotation → default. */
  var todaySpecial = null;
  ROTATION.forEach(function (r) { if (r.d === todayIdx) todaySpecial = r; });
  var tl = document.getElementById("todayLine");
  var tt = document.getElementById("todayTitle");
  if (tl && tt) {
    if (TODAY_OVERRIDE) {
      tt.textContent = TODAY_OVERRIDE.title;
      tl.textContent = TODAY_OVERRIDE.line || "";
    } else if (todaySpecial) {
      tt.textContent = HOURS[todayIdx].day + " means " + todaySpecial.name + ".";
      tl.textContent = todaySpecial.line;
    } else {
      tt.textContent = SPECIAL_FALLBACK.title;
      tl.textContent = SPECIAL_FALLBACK.line;
    }
  }
  var rr = document.getElementById("rotationRow");
  if (rr) {
    ROTATION.forEach(function (r) {
      var el = document.createElement("div");
      el.className = "rot" + (r.d === todayIdx ? " on" : "");
      el.innerHTML = "<b>" + escapeHtml(HOURS[r.d].day) + "</b>" + escapeAllowingBasic(r.name);
      rr.appendChild(el);
    });
  }

  /* ---- Featured Specials (Saturday's usually-more-than-one cuts) ----
     Cornie fills this in the /admin/ editor by hand from his own Facebook
     post — no Facebook integration, no automation account. */
  var feat = document.getElementById("featuredSpecials");
  if (feat) {
    if (FEATURED.active && FEATURED.items.length) {
      var h = '<h3>' + escapeHtml(FEATURED.heading) + '</h3><ul class="feat-list">';
      FEATURED.items.forEach(function (it) {
        h += '<li><b>' + escapeHtml(it.name || "") + '</b>' +
             (it.line ? '<span>' + escapeHtml(it.line) + '</span>' : '') + '</li>';
      });
      h += '</ul>';
      feat.innerHTML = h;
      feat.hidden = false;
    } else {
      feat.hidden = true;
    }
  }

  /* ---- Featured Mount of the Week/Month ----
     Cornie picks a mount, writes the story, uploads a photo — all in the
     same editor as everything else. Hidden unless he's set one. */
  var fm = document.getElementById("featuredMount");
  if (fm) {
    if (FEATURED_MOUNT.active) {
      fm.innerHTML =
        '<figure><img src="' + escapeHtml(FEATURED_MOUNT.image) + '" alt="' +
        escapeHtml(FEATURED_MOUNT.name) + '" loading="lazy">' +
        '<figcaption><b>' + escapeHtml(FEATURED_MOUNT.heading) + '</b> — ' +
        escapeHtml(FEATURED_MOUNT.name) +
        (FEATURED_MOUNT.story ? '<span>' + escapeHtml(FEATURED_MOUNT.story) + '</span>' : '') +
        '</figcaption></figure>';
      fm.hidden = false;
    } else {
      fm.hidden = true;
    }
  }

  /* ---- Menu category filter ----
     Chips are built from whatever sections are actually in the DOM, so if
     Cornie renames or adds a section in the editor the filter follows along
     with no code change. Progressive enhancement: the bar is hidden in the
     HTML and only revealed here, so with JS off the full menu just shows. */
  buildMenuFilter();

  /* ---- printed-menu gallery + lightbox ---- */
  buildPrintedMenu();

  /* ---- FAQ (re-rendered from faq.json when it loads) ---- */
  renderFaq();

  /* ---- gentle hero parallax (hero ONLY — brief §6) ---- */
  var heroBg = document.getElementById("heroBg");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (heroBg && !reduced) {
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) heroBg.style.transform = "translateY(" + y * 0.18 + "px)";
    }, { passive: true });
  }

  /* ---- reveal on scroll (story beats & sections) ---- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".today, .timeline li, .drive-stub, .menu-head, .menu-col, .room-grid figure, .hf-hours, .hf-find")
    .forEach(function (el) { el.classList.add("rv"); io.observe(el); });

  /* ============ REVIEWS — manual only (brief §6: no autoplay) ============
     Arrows, dots, and swipe. Index always wraps; nothing to time out,
     nothing to break on the last slide.
     ===================================================================== */
  renderReviews();   /* swap in reviews.json content before counting slides */
  var track = document.getElementById("revTrack");
  if (track) {
    var slides = Array.prototype.slice.call(track.children);
    var n = slides.length, idx = 0;
    var dotsWrap = document.getElementById("revDots");

    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.setAttribute("aria-label", "Review " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function go(i) {
      idx = (i + n) % n;
      track.style.transform = "translateX(" + (-idx * 100) + "%)";
      dots.forEach(function (d, j) { d.classList.toggle("on", j === idx); });
    }
    document.getElementById("revNext").addEventListener("click", function () { go(idx + 1); });
    document.getElementById("revPrev").addEventListener("click", function () { go(idx - 1); });

    var x0 = null;
    track.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    go(0);
  }
}
