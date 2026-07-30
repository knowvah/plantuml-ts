# T8 — `SvgNanoParser` part 2: shapes, text, fill/stroke/transform

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

T6 ported `SvgNanoParser`'s skeleton — element extraction, the `drawU`
dispatch loop, the `<g>` push/pop stack, and `drawPath` — leaving the
remaining branches as wired stubs. This task fills them.

**Note the package:** `svg/parser/SvgNanoParser.java`, and its collaborators
`UGraphicWithScale` / `ColorResolver` live under `emoji/`. Not
`klimt/sprite/`.

## Task

Port the remaining members of
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svg/parser/SvgNanoParser.java`
into `src/core/klimt/sprite/SvgNanoParser.ts`:

- `drawCircle`, `drawEllipse`, `drawText`
- `applyFillAndStroke` (including `getFillString`'s ancestor-group lookup
  through `stackG`)
- `applyTransform`
- the `DATA_*` / `STYLE_*` attribute patterns these need

## Write-set

- `src/core/klimt/sprite/SvgNanoParser.ts` (modify)
- `src/core/klimt/sprite/SvgNanoParser.test.ts` (modify)

## Read-set

- `~/git/plantuml/.../svg/parser/SvgNanoParser.java` — all 522 lines
- `src/core/klimt/UGraphicWithScale.ts` — T3; `apply` returns a NEW instance,
  which is what makes the stack correct
- `src/core/klimt/sprite/ColorResolver.ts` — T2
- `src/core/klimt/sprite/SvgNanoParser.ts` — T6's structure
- The port's existing ellipse/text drawing:
  `src/core/klimt/drawing/svg/driver-ellipse-svg.ts`,
  `driver-text-svg.ts`. **Reuse these; do not add parallel emitters.**

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4), option A — **full class**. `drawEllipse` IS
  ported despite **0** occurrences across all of `assets/stdlib`, and
  `drawText` despite only **6** (awslib20, edgy, ibm). CLAUDE.md: the corpus
  is a starting point, not a ceiling; the long tail is the deliverable. Do
  NOT propose skipping either — that is the reflex CLAUDE.md names as wrong
  by default here.

stdlib census for calibration, not for scoping:

| Feature | Occurrences |
|---|---|
| `<g ` | 19,416 |
| `transform=` | 18,241 |
| `<circle>` | 12 |
| `<text>` | 6 |
| `style=` | 2 |
| `<ellipse>` | 0 |
| `font-family` | 0 |

## Interface contract

No new public surface — fills T6's stubs. `drawU`'s signature is unchanged.

## Acceptance criteria

1. Given a `<circle>` with `r`/`cx`/`cy`, when drawn, then the emitted
   primitive's minmax matches upstream's own circle bounds.
2. Given `<g fill="…">` wrapping a `<path>` with no own fill, when drawn,
   then the path inherits the ancestor's fill via `getFillString`'s `stackG`
   lookup — not a default.
3. Given `stroke-width` on a group, when applied, then it is multiplied by
   `getInitialScale()` exactly as upstream does.
4. Given `transform="translate(…)"` / `scale(…)` / `matrix(…)`, when applied,
   then composition order matches upstream's — verify against a nested case,
   since 18,241 stdlib occurrences ride on this.
5. Given an `<ellipse>`, when drawn, then it produces a correct primitive even
   though no bundled sprite exercises it (unit test only — by design).
6. Given a `<text>`, when drawn, then it emits through the existing text
   driver with the resolved font/colour.

## Quality bar

All four gates exit 0. SVG goldens 310/22/57 byte-identical.
`npx tsx scripts/measure-description-size-deltas.ts` exits 0. TDD, 90/90/90.

If the file approaches 500 lines, split per CLAUDE.md/complexity-hook
guidance rather than suppressing the check wholesale.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — no production consumer until T9.

## Boundaries

**Always:** port faithfully including odd-looking branches. `@see` origins.
**Never:** skip `drawEllipse` or `drawText` on corpus-reach grounds (ADR-4).
Never edit `complexity-ignore`; use `#lizard forgives` placed near the
function END.

## Method rules

1. **Trace two dependency levels** before ruling on scope. If a branch seems
   to need something the port lacks, check the analogous existing path first
   — "no support for X anywhere" has been wrong in this codebase before, and
   the real answer was "a render path that already exists was never wired in".
2. **Verify any "already fixed / already wired" claim against the CURRENT
   call graph**, not the commit that introduced it.

## Commit

One commit: `feat(T8): port SvgNanoParser shapes, text, and fill/stroke`
