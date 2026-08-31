# The backend — what it is and how to turn it on

## What "backend" means here

There is no server and no database, and there is no CMS company in the middle.

- The site's content lives as three plain files in the repo: `content/hours.json`,
  `content/specials.json`, `content/menu.json`. **Those files are the database.**
- `/admin/` is the editing interface — [Decap CMS](https://decapcms.org), open-source
  (MIT), served from this same site.
- Saving in the editor commits to the owner's own GitHub repo. Vercel sees the commit
  and rebuilds. **Live in about a minute.**

```
Cornie edits at /admin/  →  commit to HIS GitHub repo  →  Vercel rebuild  →  live
```

### Why this shape, and not a normal CMS

Every account is his: the domain, the Vercel project, the GitHub repo, the content.
There's no platform subscription, no vendor who can lock the site, and no "restore
fee" to get the menu back. If Liberty Forge disappears tomorrow, he keeps editing.
If the *editor* disappears tomorrow, the website keeps serving — `/admin/` is not
load-bearing for the public site.

That is the whole sovereignty argument, made concrete.

### Design constraint: no more than two logins, ever

This is a deliberate limit, not an accident of scope. Cornie's whole login surface
for this site is:

1. **Facebook** — his own, pre-existing, unchanged.
2. **The site editor** (`/admin/`, GitHub-backed) — the one new thing he learns.

**Explicitly ruled out: a Facebook-to-website automation service (Zapier, n8n,
Make, etc.) as a third login.** It would technically work — poll his Facebook posts,
push them into `content/specials.json` automatically — but it means a third
password, a third dashboard, and a service that can silently stop syncing with no
one noticing until a customer calls asking about a special that isn't there. That
trade isn't worth it for a single restaurant owner who already has a two-minute
Facebook-posting habit.

**What replaced it:** the `featured` block in `content/specials.json` (Saturday's
"usually more than one cut" specials). Cornie types or pastes the same words he
already posts to Facebook into that field, in the same editor session where he'd
change an hour or a price. Zero new accounts, zero automation to monitor, zero
silent-failure surface. If a future client's volume genuinely justifies a real
Facebook API integration, that's a deliberate upgrade decision to make with them —
not a default to build in quietly.

### The safety net

`script.js` ships with the current hours, specials, and menu hard-coded as fallback
values. It loads `content/*.json` and uses those when available. If the JSON is ever
missing, malformed, or unreachable, the site silently renders the built-in values
instead. **The site cannot be taken down by a bad edit or a failed fetch.**

The menu is also present in `index.html` as real markup, so search engines and
anyone with JavaScript off still get real food and real prices; the JSON render
replaces it in place when it loads.

---

## Turning it on (launch checklist)

1. **Create the repo in the client's GitHub account** and push this site to it.
2. **Import the repo into Vercel under the client's account**, point his domain at it.
3. **Edit `admin/config.yml`:** set `repo:` to `his-username/his-repo` and confirm
   `branch:`.
4. **Set up authentication** so he can log in with GitHub. Two options:
   - *Simplest:* keep the Netlify OAuth broker (the default `base_url`) — free, no
     server to run, but it is a third party in the login path only (not in the content
     path).
   - *Fully sovereign (recommended, matches the Sovereign Rebuild promise):* deploy a
     small OAuth handler as a Vercel serverless function in his own project and point
     `base_url` at his own domain. Then no outside party touches even the login.
5. **Remove `local_backend: true`** from `admin/config.yml` before going live.
6. **Delete the red preview banner** at the top of `index.html`.
7. Sit down with Cornie, log in together, and change one price so he sees the loop
   end to end.

### Security checks at launch (do not skip #8 — it is the silent one)

8. **VERIFY `robots.txt` FLIPPED.** While this site sits inside the shared demo
   project, the parent `external-demos/robots.txt` says `Disallow: /` — correct for an
   unsold demo, catastrophic if it ships. After go-live, actually fetch
   `https://<the-domain>/robots.txt` in a browser and confirm you see the allow-all
   version from `double-barrel/robots.txt`. **If the demo block ships, the site is
   invisible to Google and the entire local-search play fails silently — no error, no
   warning, just no traffic.**
9. **Confirm the security headers are live.** `vercel.json` only takes effect once
   `double-barrel/` is the *root* of its own Vercel project. Verify with
   `curl -I https://<the-domain>` (or securityheaders.com) and check for
   `content-security-policy`, `strict-transport-security`, and `x-content-type-options`.
10. **Smoke-test the CSP against the real editor.** The `/admin/` policy allows what
    Decap needs today (unpkg, `api.github.com`). Log in and save one change after
    launch; if anything silently fails, check the browser console for CSP violations
    and widen only the specific directive that's blocking.
11. **Add an SRI hash** to the Decap script tag in `admin/index.html`. The version is
    already pinned exactly (not a `^` range), so the file is stable — generate the
    `integrity="sha384-…"` hash for it so a compromised CDN can't swap the editor.
12. **Confirm no stray `Disallow` or `noindex`** on the public pages — `/admin/` should
    be the only thing excluded.

## Editing locally during the build

```
npx decap-server          # in one terminal
python3 -m http.server    # in another, from this folder
```
Then open `http://localhost:8000/admin/`. With `local_backend: true`, saves write
straight to the files on disk — no GitHub, no auth — which is the fastest way to
work while building.

## Note for the demo

Opening `index.html` directly off the filesystem (`file://`) can't fetch the JSON —
browsers block it. The site falls back to its built-in content and looks correct, so
the demo is safe to hand over on a USB stick or open offline. To see the JSON
pipeline actually working, serve it over HTTP (`python3 -m http.server`) or use the
deployed URL.
