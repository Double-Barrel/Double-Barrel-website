# Corrected menu page — what was changed and why

## The edits

`images/menu-page-2.jpg` (Seafood, Chicken & Nightly Features) is **not** an
unmodified photo. Two things were changed, both in the Nightly Features block:

> 1. **Prime Rib · 12oz — was `$28`, now `$27`**
> 2. **Sirloin days — was `*Sunday, Monday &Tuesday`, now `*Sunday &Tuesday`**
>    (Monday is closed; the printed insert predates the current hours)

For edit 2, nothing was drawn: the comma and "Monday" were erased with paper
sampled from the same row, and the page's own "&Tuesday" ink was slid left to
sit one word-space after "Sunday" — preserving the print's original no-space
"&Tuesday" quirk exactly.

## Why

The printed menu contradicts itself. The Steak Entrées page (page 1) prices the
12oz prime rib at **$27**; the Nightly Features block on page 2 prints **$28**.
Cornie confirmed **$27 is the real price**.

Since the typed menu on the site says $27, an unedited photo would have put a
second, wrong price on the same page — the exact confusion a website is supposed
to remove. So the photo was corrected to match reality rather than reproduce a
known typo.

## How (so it can be reproduced or reversed)

The `7` was **not** drawn or typeset. It was lifted from the same printed menu —
the `7` in `$17` on page 3 (Jack Daniel Bourbon Burger) — which is the identical
font, print run, and ink, and measured the identical glyph height (18px) as
page 2's digits. Steps:

1. The `8` was removed by copying clean paper from the blank gap to its right on
   the same row, applied with a feathered mask so there is no seam.
2. The `7` was cropped from page 3, its alpha derived from ink darkness with a
   floor so surrounding paper is fully transparent.
3. It was recoloured to the ink tone sampled from page 2's own neighbouring
   digits, then positioned by **ink** bounding box — left edge 3px after the `2`
   (matching the letter-spacing on page 3), baseline matched to page 2's row.

Sources tried and rejected: page 1's `$27` is only 38px wide and too soft —
upscaling it produced visible mush.

## Files

- `page2-corrected-full.jpg` — full-resolution corrected page (source of truth)
- `images/menu-page-2.jpg` — the 1400px web version served in the gallery

The original unmodified photos are in the client's Google Drive folder.

## If the menu gets reprinted

If Cornie reprints with $27 (and/or fixes the Sirloin's Sun/Mon/Tue line, since
Monday is closed), replace these with clean photos of the new print and delete
this note — the correction will no longer be needed.
