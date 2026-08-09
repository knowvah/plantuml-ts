# `svg-json` — SVG-conformance goldens for `@startjson`

Mission **A5** (json family). Sibling of `svg-description`, `svg-class`,
`svg-object`, `svg-state`, `svg-dot`.

## Current state

**Still empty, 0 of 50 fixtures byte-conformant — and under the current exit
bar it can never be otherwise.** That is a statement about the bar, not a
stalled harness. The ratchet suite skips gracefully; the graceful-skip branch
is genuinely exercised here.

Two divergences, both DELIBERATE, touch essentially every fixture:

1. **Document dimensions and all geometry** (ADR-2b, and CLAUDE.md "One layout
   engine"). Upstream lays these types out with Smetana; this port uses one
   engine for everything and accepts the delta. It moves the root
   `@width`/`@height`/`@viewBox` on all 92 family fixtures.
2. **Per-type value-text colour** (DIVERGENCES.md, "Value text — per-type
   colors (aesthetic)"), on every fixture with a scalar value.

A zero-diff rule cannot admit a fixture past either. **So do not read this
folder's emptiness as a conformance signal, and do not "fix" a divergence to
populate it.**

### What DID move, and what to gate on instead

The structural port (A5 ledger M2/M3/M4, 2026-08-09) took the **element
tally** — does this port emit the same elements, of the same kinds, in the
same order as the jar — from **0 to 75 of 92**. Before it, every fixture
mismatched at the root, `compare.ts` stopped recursing, and no fixture's
interior had ever been compared.

That metric is not contaminated by either divergence, it is mechanically
checkable, and it is the one worth wiring as this family's gate. It is
**proposed, not yet implemented**. The 17 fixtures that still differ are each
named with their delta signature in
`plans/a5-json-family-conformance/ledger.md`.

## Where this type's layout lives

This type owns the engine: `src/diagrams/json/{parser,layout,renderer}.ts`.

## Why there is no `parity-json.json`, and no AC3

The sibling suites gate ratchet eligibility on a fixture already being
DOT-equal, so a residual SVG diff is attributable to SVG assembly rather than
layout. **That gate cannot exist here.** Upstream lays this family out through
`jsondiagram/SmetanaForJson.java` — in-process Smetana, never an external dot
process — so the jar writes no `svek-N.dot` to compare against. Verified by
experiment: running the pinned jar with `-DPLANTUML_DUMP_DOT=<dir>` over a
`@startjson` diagram produces the SVG and no `.dot` file at all.

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
