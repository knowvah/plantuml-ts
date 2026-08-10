# `svg-json` — SVG-conformance goldens for `@startjson`

Mission **A5** (json family). Sibling of `svg-description`, `svg-class`,
`svg-object`, `svg-state`, `svg-dot`.

## Current state

**7 of 50 `@startjson` fixtures byte-conformant and pinned** (plus 5 yaml and
1 hcl in the sibling folders — 13 across the family).

This section previously said byte-conformance was unreachable here and the
ratchet could never admit anything. **That was wrong, and the way it was wrong
is worth keeping.** The claim rested on M1 — "document dimensions differ
because upstream is Smetana-laid-out" — being one indivisible accepted
divergence. Measuring the delta per axis showed it was two mechanisms sharing
a label: the width spread is the real engine divergence, but the height was a
constant +2 on 70 of 92 fixtures, which no layout difference explains. That +2
was ours: `json/layout.ts` summed node extents where the jar ink-walks, adds
margins and truncates. See `plans/a5-json-family-conformance/ledger.md`, M1b.

An accepted divergence is a comfortable place for a defect to hide. This one
sat there for a whole mission.

## This folder is no longer the family's primary gate

Byte-exactness is now the SECONDARY measure here. The family's gate is
`tests/oracle/svg-conformance/json-family-structural.test.ts`, which compares
everything except positional geometry — see
`plans/a5-json-family-conformance/ledger.md`, "The bar, redefined".

The reason is measured, not stylistic: ~19,760 of ~20,028 corpus diffs are the
accepted ADR-2b layout divergence restated per coordinate, and M1a was
verified genuine (node sizes exact, envelope exact, only within-rank placement
differs — Smetana transpiles graphviz 2.38, dot-engine ports modern graphviz).

This ratchet stays, and stays shrink-only: 17 fixtures reach byte-exactness
and must keep it. It simply no longer defines the family's bar.

## What blocks the other 37

- **M1a — horizontal layout geometry.** The genuine ADR-2b divergence, and
  still accepted: this port uses one layout engine and takes the delta.
- **M6 — element tally.** 17 fixtures still emit a different count of some
  element than the jar; each is named with its delta signature in the ledger.

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
