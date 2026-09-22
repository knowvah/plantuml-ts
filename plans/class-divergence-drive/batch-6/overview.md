# Batch 6 — B6 classifier box & style

`Paint` at the class colour seam (D8), then five render-side fixes that
consume it: row/font/icon colours and stereotype-scoped skinparam blocks,
box chrome (header split, border/dash, icon centring, generic-corner),
stereotype-spot badge glyphs, USymbol leaves inside a class diagram, and
per-member `[[[url]]]` anchor nesting. T18 widens
`ThemeGraphColors.classBackground|classBorder|icon*Color` to `Paint` and
routes the dedicated-key skinparam path through `parseColor` — every other
task in this batch either renders through that seam or sits beside it, so
T18 lands first and its stop-12 audit gates the whole batch. T19 and T20
consume T18's `Paint` types directly; T21, T22, T23 do not need them but
start after T18 merges anyway, to keep the batch's worktrees rebasing off
one tree. T19/T20/T21/T22/T23 write disjoint files except
`renderer-classifier-colors.ts`, which T18 owns for the fill/gradient half
and T20 owns (after T18 merges) for the border-stroke/dasharray half added
by A3 M1 — sequential, not simultaneous, so this does not violate the
parallel-worktree disjointness rule. Mostly no layout move: T22's `circle`
interface eye (E8) and `cacoma`'s `allow_mixing` leaves do move node sizes
for the handful of fixtures that use them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T18 | `Paint` at the class colour seam, audit-first (D8, A2b E2, A3 M4); also the `extractDecorations` `line/text/lineStyle` fields | typescript-pro (opus) | `class-declaration-extractors.ts`, `paint.ts`, `color-override.ts`, `theme*.ts`, `skinparam-key-handlers*.ts` (dedicated-key path), `renderer-classifier-colors.ts`, tests | — | [x] |
| T19 | Rows, fonts, icon colours + stereotype-scoped skinparam (A3 M1 text/M2/M5/M8, icon selectors) | typescript-pro (sonnet) | `renderer-classifier-rows.ts`, `class-visibility-icon.ts`, `skinparam-key-handlers-table-a/b.ts` (new keys), tests | T18 | [x] |
| T20 | Box chrome: header split, border/dash, icon centring, generic-corner (E1, A3 M1 border half, A5 M6, unclassified) | typescript-pro (sonnet) | `renderer-classifier-box.ts`, `class-member-rows.ts`, `renderer-classifier-colors.ts` (border/dasharray only), tests | T18 | [x] |
| T21 | Stereotype-spot badge glyphs + kind mapping (A5 M3a/M3b) | typescript-pro (sonnet) | `class-badge.ts`, tests | T18 | [x] |
| T22 | USymbol leaves in class: `circle`/`()` interface eye + `allow_mixing` (A2b E8, cacoma) | typescript-pro (sonnet) | `class-layout-leaf-shapes.ts`, `renderer-usymbol-entity.ts`, `layout.ts`, tests | T18 | [x] |
| T23 | Per-member `[[[url]]]` anchors, one `<a>` per row (A2b E10) | typescript-pro (sonnet) | `renderer-url.ts`, tests | T18 | [x] |

Specs: [`T18-paint-seam.md`](T18-paint-seam.md),
[`T19-rows-fonts-icons.md`](T19-rows-fonts-icons.md),
[`T20-box-chrome.md`](T20-box-chrome.md), [`T21-badges.md`](T21-badges.md),
[`T22-usymbol-leaves.md`](T22-usymbol-leaves.md),
[`T23-member-url-anchors.md`](T23-member-url-anchors.md).
Batch close: [`close.md`](close.md) — first re-pin since batch 4/5 land.
