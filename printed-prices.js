/* =========================================================================
   PRINTED-MENU PRICES. Keeps the photos of the paper menu in step with the
   prices Cornie sets in the editor.

   The flipbook shows photos of the printed menu. When a price in the editor
   (content/menu.json) differs from what's printed, this repaints that one
   price on the photo: it covers the old number with the paper colour around
   it and writes the new one in the page's own ink colour.

   Where each price sits is recorded in data/printed-menu-prices.json. If a
   page photo is ever replaced, its pixel size won't match the record and
   that page is simply shown as photographed. If an item is renamed in the
   editor, its printed price is left alone. Nothing here can break the page:
   any failure leaves the original photos in place.
   ========================================================================= */
(function () {
  "use strict";

  function norm(s) {
    return String(s || "").replace(/<[^>]*>/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  // The editor's current price for one mapped spot, or null if it can't be
  // matched with confidence.
  function currentPrice(menu, e) {
    var sec = (menu.sections || []).filter(function (s) { return norm(s.title) === norm(e.section); })[0];
    if (!sec) return null;
    var want = norm(e.item);
    var hits = (sec.items || []).filter(function (it) { return norm(it.name).indexOf(want) === 0; });
    if (hits.length !== 1) return null;
    var parts = String(hits[0].price || "").split("/").map(function (p) { return p.trim(); });
    var p = parts[e.part];
    return /^\$\d{1,3}(\.\d\d)?$/.test(p || "") ? p : null;
  }

  function median(arr) {
    arr.sort(function (a, b) { return a - b; });
    return arr.length ? arr[Math.floor(arr.length / 2)] : 0;
  }

  function paint(src, jobs, done) {
    var img = new Image();
    img.onload = function () {
      try {
        var W = img.naturalWidth, H = img.naturalHeight;
        var c = document.createElement("canvas");
        c.width = W; c.height = H;
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        jobs.forEach(function (j) {
          var b = j.e.box, pad = 3;
          var x = b[0], y = b[1], w = b[2], h = b[3];
          // Paper: the light pixels in a ring just outside the old price.
          var rx = Math.max(0, x - 8), ry = Math.max(0, y - 6);
          var rw = Math.min(W - rx, w + 16), rh = Math.min(H - ry, h + 12);
          var d = ctx.getImageData(rx, ry, rw, rh).data;
          var pr = [], pg = [], pb = [], ir = [], ig = [], ib = [];
          for (var yy = 0; yy < rh; yy++) {
            for (var xx = 0; xx < rw; xx++) {
              var i = (yy * rw + xx) * 4, r = d[i], g = d[i + 1], bl = d[i + 2];
              var lum = (r + g + bl) / 3;
              var inside = xx + rx >= x && xx + rx < x + w && yy + ry >= y && yy + ry < y + h;
              if (!inside && lum > 150) { pr.push(r); pg.push(g); pb.push(bl); }
              if (inside && lum < 110) { ir.push(r); ig.push(g); ib.push(bl); }
            }
          }
          var paper = "rgb(" + median(pr) + "," + median(pg) + "," + median(pb) + ")";
          // Ink: the darkest third of the old digits, so the new ones match the print.
          var ink = "#2a2622";
          if (ir.length) {
            var idx = ir.map(function (v, k) { return k; })
              .sort(function (p1, p2) { return (ir[p1] + ig[p1] + ib[p1]) - (ir[p2] + ig[p2] + ib[p2]); })
              .slice(0, Math.max(1, Math.floor(ir.length / 3)));
            ink = "rgb(" + median(idx.map(function (k) { return ir[k]; })) + "," +
              median(idx.map(function (k) { return ig[k]; })) + "," +
              median(idx.map(function (k) { return ib[k]; })) + ")";
          }
          ctx.fillStyle = paper;
          ctx.fillRect(x - pad, y - pad, w + pad * 2, h + pad * 2);
          // New price, right-aligned where the old one ended, same height.
          var size = Math.round(h * 1.36);
          ctx.font = (j.e.weight || "700") + " " + size + "px Arial, Helvetica, sans-serif";
          ctx.fillStyle = ink;
          ctx.textAlign = "right";
          ctx.textBaseline = "alphabetic";
          // Never wider than the old price, so it can't crowd the words beside it.
          var tw = ctx.measureText(j.price).width, maxw = w * 1.04;
          ctx.save();
          ctx.translate(x + w, y + h - Math.round(h * 0.04));
          if (tw > maxw) ctx.scale(maxw / tw, 1);
          ctx.fillText(j.price, 0, 0);
          if (j.e.weight !== "500") {
            ctx.strokeStyle = ink;
            ctx.lineWidth = Math.max(0.6, h * 0.05);
            ctx.strokeText(j.price, 0, 0);
          }
          ctx.restore();
        });
        done(c.toDataURL("image/jpeg", 0.9));
      } catch (err) { /* leave the photo as it is */ }
    };
    img.src = src;
  }

  window.DBPrintedPrices = {
    apply: function (pages, menu) {
      if (!pages || !pages.length || !menu || !menu.sections || !window.fetch) return;
      fetch("data/printed-menu-prices.json", { cache: "no-cache" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (map) {
          if (!map || !map.entries) return;
          pages.forEach(function (p) {
            var orig = p.image;
            var jobs = [];
            map.entries.forEach(function (e) {
              if (e.image !== orig) return;
              var now = currentPrice(menu, e);
              if (now && now !== e.printed) jobs.push({ e: e, price: now });
            });
            if (!jobs.length) return;
            // Only repaint the exact photo this map was measured on.
            var probe = new Image();
            probe.onload = function () {
              var s = jobs[0].e.size;
              if (probe.naturalWidth !== s[0] || probe.naturalHeight !== s[1]) return;
              paint(orig, jobs, function (url) {
                p.image = url;
                var imgs = document.querySelectorAll("img");
                for (var k = 0; k < imgs.length; k++) {
                  if (imgs[k].getAttribute("src") === orig) imgs[k].src = url;
                }
              });
            };
            probe.src = orig;
          });
        })
        .catch(function () { /* leave the photos as they are */ });
    }
  };
})();
