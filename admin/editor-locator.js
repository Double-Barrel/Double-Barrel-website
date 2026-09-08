/* =========================================================================
   "YOU ARE HERE" — editor orientation aid
   =========================================================================
   Client request (Cornie, 2026-09-07): when you're deep in the Menu editing
   one item, it's easy to lose track of which item you're actually changing.
   This adds two cues:

     1. A badge, bottom-right, reading  SECTION  ›  Item name
     2. A gold outline around the card you're currently editing

   HOW IT FINDS YOUR PLACE
   Decap's own class names are generated and change between versions, so we
   never rely on them. Instead we walk up from the focused input and identify
   each level by the *field labels we wrote ourselves in config.yml*
   ("Section title", "Item", "Day", ...).

   The rule that makes this accurate: a container counts as your record only
   if it holds EXACTLY ONE field with that label. The list of all sections
   holds many "Section title" fields, so it's rejected; one section card holds
   exactly one, so it wins. That also means a top-level field (like the menu
   intro) correctly matches nothing and the badge hides.

   HOW IT STAYS SAFE
   Everything is wrapped in try/catch and this file can fail completely
   without affecting the editor. It never reads or writes content — it only
   reads field labels already on screen. Display-only.
   ========================================================================= */
(function () {
  "use strict";

  // Field labels that mark a record level. Add to this list when a new
  // collection introduces a differently-labelled record.
  var LEVELS = [
    { label: "Section title", kind: "section" },
    { label: "Item", kind: "item" },
    { label: "Day", kind: "item" },
    { label: "Guest quote", kind: "item" },
    { label: "Question", kind: "item" },
    { label: "Company", kind: "item" }
  ];

  var BADGE_ID = "lf-locator";
  var HL_CLASS = "lf-active-card";
  var MAX_HOPS = 40;
  var badge, current;

  function css() {
    var s = document.createElement("style");
    s.textContent =
      "#" + BADGE_ID + "{position:fixed;right:16px;bottom:16px;z-index:9999;" +
      "max-width:min(420px,60vw);background:#3B2314;color:#F5EFE6;" +
      "border-left:5px solid #C9A84C;border-radius:4px;padding:9px 14px;" +
      "font:500 13px/1.35 system-ui,-apple-system,'Segoe UI',sans-serif;" +
      "box-shadow:0 6px 22px rgba(0,0,0,.28);pointer-events:none;opacity:0;" +
      "transform:translateY(6px);transition:opacity .14s,transform .14s}" +
      "#" + BADGE_ID + ".on{opacity:1;transform:none}" +
      "#" + BADGE_ID + " .lf-l{display:block;font-size:9.5px;letter-spacing:.18em;" +
      "text-transform:uppercase;color:#C9A84C;margin-bottom:3px}" +
      "#" + BADGE_ID + " .lf-s{color:#E8B54A;font-weight:600}" +
      "#" + BADGE_ID + " .lf-n{opacity:.66;font-weight:400}" +
            "." + HL_CLASS + "{box-shadow:0 0 0 2px #B4530F,0 0 0 6px rgba(180,83,15,.16)!important;" +
      "border-radius:5px;background:rgba(201,168,76,.07)!important;transition:box-shadow .14s,background .14s}" +
      "@media print{#" + BADGE_ID + "{display:none}}";
    document.head.appendChild(s);
  }

  function ensureBadge() {
    if (!badge) {
      badge = document.createElement("div");
      badge.id = BADGE_ID;
      document.body.appendChild(badge);
    }
    return badge;
  }

  /* Labels inside `container` matching `wanted`. Stops at 2 — all we ever
     need to know is "exactly one" versus "more than one", and bailing early
     keeps this cheap on a 59-item menu. */
  function matchingLabels(container, wanted) {
    var out = [];
    var labels = container.querySelectorAll("label");
    for (var i = 0; i < labels.length; i++) {
      if ((labels[i].textContent || "").trim() === wanted) {
        out.push(labels[i]);
        if (out.length > 1) break;
      }
    }
    return out;
  }

  /* The value belonging to a label: look in its own wrapper first, then the
     element immediately after it. Deliberately shallow so we can't pick up a
     neighbouring field's value. */
  function valueFor(labelNode) {
    var sel = "input[type='text'], input:not([type]), textarea";
    var p = labelNode.parentNode;
    if (p && p.querySelector) {
      var a = p.querySelector(sel);
      if (a && a.value) return a.value.trim();
    }
    var n = labelNode.nextElementSibling;
    if (n) {
      if (n.matches && n.matches(sel) && n.value) return n.value.trim();
      var b = n.querySelector && n.querySelector(sel);
      if (b && b.value) return b.value.trim();
    }
    return "";
  }

  /* Walk up from the focused element. A container is your record only if it
     holds exactly one field with that label. */
  function locate(start) {
    var found = { section: "", item: "", node: null };
    var node = start;
    var hops = 0;

    while (node && node !== document.body && hops < MAX_HOPS) {
      hops++;
      if (node.nodeType === 1 && node.querySelectorAll) {
        for (var i = 0; i < LEVELS.length; i++) {
          var lvl = LEVELS[i];
          if (found[lvl.kind]) continue;
          var hits = matchingLabels(node, lvl.label);
          if (hits.length !== 1) continue;      // 0 = not here, 2+ = a list of them
          var val = valueFor(hits[0]);
          if (!val) continue;
          found[lvl.kind] = val;
                    if (!found.node) found.node = node;
        }
      }
      if (found.section && found.item) break;
      node = node.parentNode;
    }
    return found;
  }

  function clearHighlight() {
    if (current) {
      current.classList.remove(HL_CLASS);
      current = null;
    }
  }

  function hide() {
    if (badge) badge.classList.remove("on");
    clearHighlight();
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function update(target) {
    try {
      if (!target || !target.closest) return hide();
      if (!target.closest("input, textarea, select, [contenteditable='true']")) return;

      var f = locate(target);
      if (!f.section && !f.item) return hide();

      var b = ensureBadge();
      var html = "<span class='lf-l'>You are editing</span>";
      if (f.section && f.item) {
        html += "<span class='lf-s'>" + esc(f.section) + "</span>" +
                "<span class='lf-n'> &rsaquo; </span>" + esc(f.item);
      } else {
        html += esc(f.section || f.item);
      }
      b.innerHTML = html;
      b.classList.add("on");

      if (f.node !== current) {
        clearHighlight();
        if (f.node) {
          f.node.classList.add(HL_CLASS);
          current = f.node;
        }
      }
    } catch (e) {
      hide(); // never let this break the editor
    }
  }

  function start() {
    try {
      css();
      document.addEventListener("focusin", function (e) { update(e.target); }, true);
      document.addEventListener("click", function (e) { update(e.target); }, true);
      // Names change as you type — keep the badge in step.
      document.addEventListener("input", function (e) {
        if (badge && badge.classList.contains("on")) update(e.target);
      }, true);
      document.addEventListener("focusout", function () {
        setTimeout(function () {
          var a = document.activeElement;
          if (!a || a === document.body) hide();
        }, 120);
      }, true);
    } catch (e) { /* silent */ }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
