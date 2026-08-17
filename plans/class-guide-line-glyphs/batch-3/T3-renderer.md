# T3 — Renderer: one `<polygon>` per guide line

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; pure SVG; tests are
vitest. T2 put `glyph?: { points }` on each `EdgeGeo.labelLines` entry. The
renderer (`src/diagrams/class/renderer-edge.ts`) draws the whole-label glyph
at `:289-296` (`geo.arrowGlyph`, `<polygon>` with the edge's fill/stroke) and
the multi-line `<text>`s at `:330-340` (`geo.labelLines`, one `<text>` per
line at `arrowLabelTextAttrs(theme)`, SI24 T5). Jar's `gobuco` SVG
(`test-results/dot-cache/class/gobuco-16-ruke239/in.svg`) emits each line's
`<polygon>` with `fill="#000"` + `stroke:#000;stroke-width:1;stroke-linejoin:
miter;stroke-miterlimit:10` — the same attributes the whole-label glyph
already emits (jar-verified on `lojepe-37-liri985`).

## Task

1. In the `labelLines` loop, when `line.glyph` is set, emit the `<polygon>`
   with exactly the whole-label glyph's attribute set (factor the polygon
   emission so both paths share one helper — no second copy of the attribute
   string). Emission ORDER: match jar's element order for `gobuco` (read the
   oracle SVG — polygon before or after its `<text>`?) and pin it.
2. Tests: `gobuco` SVG has four `<polygon>`s whose points equal T2's geo
   points; `lojepe-37-liri985` byte-identical; a two-line no-token label
   byte-identical.

## Write-set

- `src/diagrams/class/renderer-edge.ts` (363)
- `tests/unit/class/renderer.test.ts` and/or `tests/unit/class/class-edge-labels.test.ts`

## Read-set

- `src/diagrams/class/renderer-edge.ts:140-175,280-345`, `src/core/svg.ts` (polygon/text helpers)
- `src/diagrams/class/class-geo-types.ts` (`labelLines`, `arrowGlyph`)
- `test-results/dot-cache/class/{gobuco-16-ruke239,lapoma-04-vaga142,lojepe-37-liri985}/in.svg`
- `decisions.md#d1`, `#d6`

## Architecture decisions

D1, D6.

## Acceptance criteria

- **Given** `gobuco`'s rendered SVG, **then** four glyph `<polygon>`s appear,
  one per line, points = geo `glyph.points`, attributes identical to the
  whole-label glyph's.
- **Given** `lojepe-37-liri985`, **then** the SVG is byte-identical.
- **Given** the class SVG ratchet (315 pins), **then** all hold, or move
  toward jar with the measurement journalled; `shape-match-report` (clean
  worktree) shows `gobuco`/`lapoma` matched-shapes rise and no fixture falls.

## Quality bar

Four gates; ratchet + `class-dot-parity`; census in a detached worktree at
this commit (recipe: `.agent-notes/si24-census-worktree-needs-ignored-assets.md`).

## Observability

N/A.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** compute geometry here — draw what T2 placed.
- **Stop** on stop 5.

## Commit

`fix(T3): class renderer draws one magic-arrow glyph per guide line`
