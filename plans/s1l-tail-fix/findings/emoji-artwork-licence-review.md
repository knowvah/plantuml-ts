# Twemoji artwork licence review (wave 3, `murava-69-tago286`)

**status:** BLOCKED — needs a maintainer ruling (ADR-9(a), stop condition 9).
Not self-approved. **No bytes vendored.**
**reviewed:** 2026-08-07, opening the wave-3 Twemoji task

## Verdict

| Asset set | Files | Provenance | Licence | Verdict |
|---|---|---|---|---|
| `net/sourceforge/plantuml/emoji/data/*.svg` | 1,189 in the pinned jar (`1f680.svg` = 611 B) | Twemoji, via upstream `Emoji.java:63` ("Emojji from https://twemoji.twitter.com/") and `License.java:235` ("Twemoji (c) by Twitter") | **CC BY 4.0** for the graphics (MIT covers only Twemoji's *code*) | **NOT MIT — maintainer ruling required** |

**This is a different answer from the archimate review, and the difference is
real, not procedural.** F3-lic cleared `archimate/` because it found MIT on
*both* provenance paths (Archi is MIT; the SVGs came through upstream's own
MIT subproject). Twemoji's artwork is CC-BY 4.0 on its face.

## Evidence (Tier 1 — retrieved this run)

- `twitter/twemoji` `LICENSE-GRAPHICS` **is** the Creative Commons Attribution
  4.0 International licence text.
- `jdecked/twemoji` (the maintained fork) `README.md`, verbatim: *"Code
  licensed under the MIT License"* … *"Graphics licensed under CC-BY 4.0"*.
  It adds that attribution "through mentions in project documentation, website
  footers, or app settings sections" is accepted as compliance.
- `jdecked/twemoji` `LICENSE` is MIT-only and does **not** carve out graphics —
  so the README is the operative statement for artwork, and the Twitter-era
  `LICENSE-GRAPHICS` governs the assets the pinned jar actually ships.
- Upstream PlantUML ships **no** LICENSE/NOTICE beside `emoji/data/` (only
  `emoji.txt`), and `LICENSES.md` does not mention emoji or Twemoji at all.
  Its own attribution lives in the `license` PSystem (`License.java:235`),
  exactly as it does for Archi at `:227`.

## Why this is a ruling and not a judgment call

`CLAUDE.md` sets the bar as "Keep dependencies MIT-compatible", and ADR-9(a)
makes the per-set verdict blocking: *"A set ruled non-MIT-compatible or
provenance-unknown is a documented gap — its assets do not land, its fixtures
stay open. That is correct, not a shortfall."*

CC-BY 4.0 is *combinable* with MIT — the code stays MIT, the assets stay CC-BY
— but it is not MIT, and it adds obligations MIT does not: attribution,
a licence link, and an indication of modifications. Those obligations flow to
anyone redistributing our package. Accepting them changes the licence shape of
the distributed artifact, which is the maintainer's call, not mine.

## Options

1. **Vendor under CC-BY 4.0, attribution satisfied.** Lazy asset channel
   (ADR-9(b) — default bundle must not grow), an `assets/emoji/LICENSES.md`
   carrying the CC-BY 4.0 notice, upstream's own Twemoji attribution line, a
   licence link, and a statement of modifications (we re-serialize the SVGs).
   Twemoji's licensors explicitly accept documentation-level attribution.
   Closes `murava-69`; ceiling reaches **352/356**.
2. **Do not vendor — documented gap.** ADR-9(a)'s own prescribed outcome for a
   non-MIT set. `murava-69` stays pinned at 0.181655. Mission ends at 351.
3. ~~Vendor only derived geometry~~ (precomputed ink boxes per codepoint, no
   artwork). **Not recommended, and flagged rather than offered neutrally:**
   it would size the use-case ellipse to fit a glyph we do not draw, producing
   a numerically-conformant fixture with a visibly wrong diagram. That is
   metric-gaming, which ADR-8 exists to prevent.

**Recommendation: (1), if the maintainer accepts a mixed MIT-code /
CC-BY-assets distribution.** Otherwise (2) — and (2) is a legitimate outcome,
not a failure. What should *not* happen is (3).

## What is NOT blocked by this

The geometry is already proven and needs no assets to re-derive: F4-b
extracted `1f680.svg` from the pinned jar, ran it through the already-ported
`SvgNanoParser` at factor 14/24, and fitted our own `ContainingEllipse` at
alpha 0.2 against our unchanged text-run points — landing on
**186.7579 × 37.3516px, +6px use-case margin = 2.677193 × 0.602105in**, the
jar exact. The same probe with today's glyph points reproduces our current
wrong output exactly. `murava-69`'s golden still carries that target after the
pin bump (it was not among the 12 regenerated goldens), so the number stands.

The remaining work is asset vendoring plus threading `assetStore` into
`descAtomOps` — the artwork must be present at SIZING time, because the
ellipse fit runs the draw path through `Footprint`. The threading half is
licence-independent and could proceed first, but it would be dead code until
the assets land, which is the same trap F4-b correctly refused to walk into.
