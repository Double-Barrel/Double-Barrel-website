#!/usr/bin/env python3
"""
Regenerate the menu markup inside index.html from content/menu.json.

WHY THIS EXISTS
The menu lives in two places on purpose: content/menu.json (what the editor
writes, what the site renders) and the markup inside index.html (what search
engines and no-JS visitors see before the JSON loads). Two copies of the same
data will drift the moment someone edits one by hand — and a drifted menu means
Google is quoting prices the kitchen doesn't charge.

So the HTML copy is GENERATED, never hand-edited. After changing menu.json:

    python3 tools/sync-menu-html.py

Run it with --check in CI or before a commit to fail loudly on drift:

    python3 tools/sync-menu-html.py --check
"""
import json, re, sys, html as H, pathlib, difflib

ROOT = pathlib.Path(__file__).resolve().parent.parent
MENU = ROOT / "content" / "menu.json"
PAGE = ROOT / "index.html"

START = '<div class="menu-cols">'
END = '<!-- Printed-menu gallery'


def esc(s):
    return H.escape(str(s), quote=False)


def slug(t):
    t = re.sub(r"<[^>]+>", "", str(t)).lower().replace("&amp;", "")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def build(menu):
    cols = {1: [], 2: []}
    for s in menu["sections"]:
        cols.get(int(s.get("column", 1)), cols[1]).append(s)

    out = [START]
    for c in (1, 2):
        out.append('    <div class="menu-col">')
        for i, s in enumerate(cols[c]):
            style = ' style="margin-top:24px"' if i else ""
            out.append(f'      <div class="menu-section" data-cat="{slug(s["title"])}">')
            out.append(f'        <h3{style}>{esc(s["title"])}</h3>')
            out.append('        <ul class="mlist">')
            for it in s.get("items", []):
                nm = it.get("name", "")          # may carry <em>; kept as authored
                pr = esc(it["price"]) if it.get("price") else "&nbsp;"
                ds = f'<span class="ds">{esc(it["desc"])}</span>' if it.get("desc") else ""
                out.append(
                    f'          <li><span class="nm">{nm}</span>'
                    f'<span class="pr">{pr}</span>{ds}</li>'
                )
            out.append("        </ul>")
            if s.get("note"):
                out.append(f'        <p class="mnote">{esc(s["note"])}</p>')
            out.append("      </div>")
        out.append("    </div>")
    out.append("  </div>")
    out.append("  ")
    return "\n".join(out)


def main():
    menu = json.loads(MENU.read_text())
    page = PAGE.read_text()

    i = page.index(START)
    j = page.index(END, i)
    generated = build(menu)
    updated = page[:i] + generated + page[j:]

    n_items = sum(len(s.get("items", [])) for s in menu["sections"])
    n_sec = len(menu["sections"])

    if "--check" in sys.argv:
        if updated != page:
            print("DRIFT: index.html does not match content/menu.json")
            for line in list(difflib.unified_diff(
                page[i:j].splitlines(), generated.splitlines(),
                "index.html", "generated", lineterm="", n=1))[:40]:
                print(" ", line)
            sys.exit(1)
        print(f"in sync — {n_items} items across {n_sec} sections")
        return

    PAGE.write_text(updated)
    print(f"index.html regenerated — {n_items} items across {n_sec} sections")
    for s in menu["sections"]:
        print(f"   col{s.get('column',1)}  {s['title']:<28} {len(s.get('items',[]))}")


if __name__ == "__main__":
    main()
