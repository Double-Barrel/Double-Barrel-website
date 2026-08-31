# Double Barrel Steakhouse — How to Update Your Website

## The short version

Go to **[your site]/admin/**, log in, click what you want to change, click Publish.
Live in about a minute. That's it — you never touch code.

Only **two logins, ever**, for the whole site:
1. **Facebook** — yours already, nothing changes there.
2. **The site editor** (`/admin/`) — logs in with a GitHub account made for you at
   launch. This is the only new login you'll ever need. No Zapier, no n8n, no third
   dashboard to remember — on purpose (see "Why only two logins" below).

---

## What you can change in the editor

- **Hours** — flip a day to Closed, or edit the times. The green "Open now" badge,
  the hours grid, and the footer all update themselves from this one place.
- **Menu** — any item's name, price, or description. Add or remove items.
  **You cannot accidentally wipe the menu.** The editor refuses to publish a menu
  with fewer than 4 sections, and even if a broken menu ever slipped through, the
  website itself refuses to display a near-empty one — it keeps showing the last
  full menu instead. Worst case, nothing changes and you call Zach.
- **Specials** — the standing weekly rotation (which cut runs which night), plus
  two things for the moment-to-moment stuff:
  - **Today's special** — a one-day override for your noon Facebook post. Flip it
    on, type the headline, flip it off again tomorrow.
  - **This Week's Steak Specials** — for Saturdays, since it's usually more than
    one cut. Same idea: paste in the same words you already post to Facebook, flip
    it on. It shows as its own list on the homepage until you turn it off.
- **Featured Mount** — pick a mount, write the story behind it (whose it is, when,
  where), upload a photo, flip it on. Shows in "The Room" section until you swap it
  for the next one. Cycle it weekly, monthly, whenever you've got a good story —
  it's yours to run.
- **Reviews** — the rotating guest quotes. Copy a good one word-for-word off
  Facebook, add the name, Publish.
- **FAQ** — the questions-and-answers section. Keep the answers short and true;
  this is what Google and the AI assistants quote.
- **Printed Menu** — the photographed menu pages in the flip-book. Swap in new
  photos when the menu gets reprinted.

## Why only two logins

The easy way to connect a website to Facebook is some automation service in the
middle — Zapier, n8n, Make — which means a third login, a third password, and a
third thing that can silently break and stop updating your site. That's not what
you're getting. The specials editor is *right next to* the hours and menu editor —
same login, same two-minute habit, no middleman service watching your Facebook
account.

## Adding or swapping a photo

Bring the file to me (or, once we set it up, upload it straight in the editor) and
it replaces the one on the site — no code involved.

## Adding or swapping a review

In the editor under **Reviews** — copy the quote word-for-word from Facebook, add the
name, Publish. Keep them real: never paraphrase a review or invent one.

## Changing the phone number

This one still needs a code change (it's baked into several "tap to call" links) —
just ask and it's a five-minute fix.

---

## For the record: how it actually works under the hood

*(You don't need this section to run the site day to day — it's here for Zach, or
for whoever inherits this someday.)*

The `content/` folder holds the site's content as plain data files —
hours, specials, menu, printed menu, FAQ, reviews, and the featured mount.

`/admin/` is the editor for those files — [Decap CMS](https://decapcms.org),
open-source, no monthly bill, no vendor lock. Saving there commits straight to
**your own** GitHub repo; Vercel sees the commit and rebuilds the site. That commit
history is also your undo button — every change is logged with your name on it and
can be rolled back.

`script.js` still carries a hard-coded copy of the current hours/specials/menu as a
safety net — if the JSON files are ever missing or unreachable, the site quietly
falls back to those built-in values instead of breaking. You should never need to
touch that file directly; it's the safety net, not the light switch.

Full technical documentation: `admin/README.md`.

---

*Built by Zach — Liberty Forge Web Works, Watertown. Everything here is yours: the
design, the domain, the editor, and the Google listing all go in your name.*
