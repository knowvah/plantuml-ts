# `svg-hcl` — SVG-conformance goldens for `@starthcl`

Mission **A5** (json family). Sibling of `svg-description`, `svg-class`,
`svg-object`, `svg-state`, `svg-dot`.

## Current state

**Seeded empty at Batch 1 / T1.** The harness lands before the baseline, so the
ratchet suite skips gracefully until the first fixture reaches zero diffs. That
graceful-skip branch IS exercised at this point, as it was at G4/S0.

Corpus: **3 `@starthcl` fixtures**, captured from the pinned oracle jar into
`test-results/dot-cache/hcl/`.

## Where this type's layout lives

**No layout of its own.** `src/diagrams/hcl/index.ts` parses with `parseHcl` and then imports `layoutJson`/`renderJson` directly. Every json layout change is transitively this type's.

## Why there is no `parity-hcl.json`, and no AC3

The sibling suites gate ratchet eligibility on a fixture already being
DOT-equal, so a residual SVG diff is attributable to SVG assembly rather than
layout. **That gate cannot exist here.** Upstream lays this family out through
`jsondiagram/SmetanaForJson.java` — in-process Smetana, never an external dot
process — so the jar writes no `svek-N.dot` to compare against. Verified by
experiment: running the pinned jar with `-DPLANTUML_DUMP_DOT=<dir>` over a
`@starthcl` diagram produces the SVG and no `.dot` file at all.

Consequence, worth stating plainly: a diff here could be layout OR assembly,
and nothing in the harness distinguishes them. That attribution has to come
from diagnosis. See mission A5's `decisions.md` ADR-3, and `svg-dot/README.md`
for the precedent of a ratchet with no parity file.

## Oracle note

Goldens are captured under `-DPLANTUML_DETERMINISTIC_TEXT=true` from the
pinned jar (`oracle/pin.json`, currently `1.2026.7beta11`). Captures made
before the pin advanced on 2026-08-07 carry AWT text metrics and the
pre-size-reduction SVG form (`#000000`, per-element font attributes) — if a
golden here shows those, it predates the pin and must be re-captured.

## Add rule

A fixture ratchets in when it renders zero-diff against its `golden.svg` under
`compareSvg(…, 'deterministic')`. Add its directory (`in.puml` +
`golden.svg`) and a `ratchet.json` row. Shrink-only: a pinned fixture never
comes back out.
