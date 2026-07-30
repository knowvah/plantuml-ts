# T11 — Two-channel independence test (ADR-5)

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

The maintainer ruled that **DOT parity is the gate** — no new SVG goldens are
authored in this mission. But no SVG golden contains a sprite (verified: every
`in.puml` across svg-class/svg-object/svg-state checked for `<$`), so the
`<image>` → `<path>` change would otherwise ship with zero output coverage.

This task closes that hole at the unit level, without adding a golden gate.

## Task

Write a test asserting that the two dimension channels are genuinely
independent — that ink and declared box can differ for sprites with an
IDENTICAL declaration.

## Write-set

- `src/core/klimt/sprite/SvgNanoParser.two-channel.test.ts` (create)

## Read-set

- `src/core/klimt/sprite/SvgNanoParser.ts` — T6/T8
- `src/core/klimt/sprite/SpriteSvg.ts:56-93` — `svgInkBox`'s doc comment
  carries the jar figures and the arc-endpoint reasoning
- `plans/s1l-leaf-sizing/ledger.md` § "The SVG-sprite ink gap" — the jar
  evidence table (third version only)
- `assets/stdlib/bootstrap1.13.1/bootstrap.puml` — source of `bi-globe` and
  `bi-bootstrap-fill`

## Architecture decisions (locked)

- [ADR-5](../decisions.md#adr-5) — unit test, not a golden suite. **Two**
  inputs, not one: a single input cannot distinguish "correct" from
  "channels still collapsed".

## Jar evidence being pinned

`bootstrap-0`, both sprites declared **16 × 16**, scale 2.5:

| entity | sprite | ellipse |
|---|---|---|
| `b` | `bi-globe` | `rx=34.729  ry=28.3832` |
| `e` | `bi-bootstrap-fill` | `rx=37.4784 ry=30.5827` |

`bi-globe`'s outer circle is an ARC, and an arc contributes only its
endpoint (`UPath.addInternal`'s `SEG_ARCTO` branch) — so it inks
16 × 13.846 despite declaring 16 × 16. `bi-bootstrap-fill` inks the full
16 × 16. That is why identical declarations give different ellipses, and it is
exactly the independence being asserted.

## Acceptance criteria

1. Given `bi-globe`, when decomposed by `SvgNanoParser`, then the union of
   its primitives' minmax reproduces the ink box `svgInkBox` computes —
   consistent with the jar's `rx=34.729`.
2. Given `bi-bootstrap-fill`, when decomposed, then its ink box differs from
   `bi-globe`'s — consistent with the jar's `rx=37.4784`.
3. Given both sprites, then their **declared** boxes are identical (16 × 16)
   while their **ink** boxes differ. This is the assertion that proves the
   channels are independent rather than merely correct on one input.
4. Given the arc case specifically, then only the arc's endpoint contributes
   to the box — assert it, since it is the mechanism behind criterion 3.

## Quality bar

All four gates exit 0. Coverage 90/90/90.

The test must fail if the channels recollapse — i.e. if someone later routes
ink back through the declared dimension, criterion 3 must break. Write it so
that failure mode is what the test detects, not incidental geometry.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — test-only file.

## Boundaries

**Always:** cite the jar figures and the ledger section in the test's doc
comment, so a future reader knows these are measured, not derived.
**Never:** tune expected values to match code output. If the code disagrees
with `rx=34.729` / `rx=37.4784`, that is stop condition 9 — measure, report,
STOP. Never adjust code toward a number the jar does not produce.
**Never:** convert this into an SVG golden — the maintainer ruled DOT parity
is the gate.

## Method rules

1. **Trace two dependency levels** before ruling on scope.
2. **Verify any "already fixed" claim against the CURRENT call graph.**

## Commit

One commit: `test(T11): pin SVG sprite declared-vs-ink channel independence`
