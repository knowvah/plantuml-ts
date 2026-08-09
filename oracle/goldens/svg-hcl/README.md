# `svg-hcl` — SVG-conformance goldens for `@starthcl`

Mission **A5** (json family). Sibling of `svg-description`, `svg-class`,
`svg-object`, `svg-state`, `svg-dot`.

## Current state

**Still empty after A5 Batch 4 — 0 of 3 fixtures byte-conformant, and that is
the accurate picture, not a stalled harness.** The ratchet suite skips
gracefully; the graceful-skip branch is genuinely exercised here.

Two independent reasons, and only the second is a defect:

1. **Byte-exact geometry is not the target for this family** (ADR-2b, and
   CLAUDE.md "One layout engine"). Upstream lays these types out with Smetana;
   this port uses one engine for everything, so document dimensions differ by
   design. Priority here is readability first, SVG fidelity second.
2. **The document structure does not match yet.** Every fixture carries a root
   `childCount` diff — the jar emits `<defs/>` plus one content `<g>`, this
   port emits node groups and per-node `<defs>` as top-level siblings. Because
   `compare.ts` stops recursing on a structural mismatch, **no fixture's
   interior has been compared**, so no fixture can honestly be pinned.

See `plans/a5-json-family-conformance/ledger.md` — mechanism M2 is the gate.
What IS measured and good: node sizing (mean |Δw| 3.08, |Δh| 0.96 against the
jar) and per-node placement (mean |Δy| 6.65, 21 of 557 nodes exact), via
`scripts/json-node-oracle.ts`.

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
