# G8 Architecture Decisions (locked 2026-07-23, maintainer-approved)

## D1 — Placement source: graphviz-returned coords, guarded fallback

`attachTransitionLabel` consumes `labelX/labelY` from the layout
result when present (the jar mechanism — dot places, jar reads back;
`SvekEdge.java:741-745,808-813`). The existing perpendicular formula
(`LABEL_PERP=12`) stays as an explicit fallback for edges whose
result carries no label position (orphan-swept edges, paths that
never handed the label to graphviz). Gate the branch on
`labelX !== undefined`, never truthiness. Rationale: dot always
places what it's given, but the port has paths where the label never
reaches graphviz; a silent undefined would drop labels.

## D2 — One conversion site; box stored on the geo

graphviz returns the label CENTRE (`textlabel_t.pos`); the renderer
draws an SVG `<text>` baseline. `attachTransitionLabel` is the single
conversion site (centre + measured box → draw anchor), and
`TransitionGeo.label` gains `width`/`height` (additive) so renderer
and ink walk share the real box. The ink walk folds
`[x, x+w] × [y−h, y]` at the true position — T20b's verified
mechanism, correct inputs.

## D3 — Atomic landing of the coupled set

One implementation task (T2) lands placement + T18 FIXEDSIZE/heights
+ G5/C1 13pt width + T20b ink walk + tests as ONE commit, gated by
the full 92-fixture delta harness before committing. Deliberately
overrides 5-15-min task granularity: G7 proved twice (T20, T20b)
that partial landings of this stack regress the backlog transiently.

## D4 — Backlog/pins are close-out, tighten-only

T2 never edits `size-backlog.json` or `ratchet.json`. T3 re-measures,
tightens improved entries (never loosens), pins newly byte-exact
fixtures, and flips G7's PAUSED status. Keeps the ratchet honest and
blame clean.

## D5 — No special-casing, ever

Self-loops (fomusu-59), the 0.244904-family (bemena-23 et al.), and
beguxu-19 must all fall out of the one mechanism. A fixture-
conditional branch needed to pass any gate is a stop condition.

## D6 — Autonom `Math.max` floor: remove only on proof

If the completed ink walk makes `buildPlainAutonomSpec`'s
`Math.max(geometry.*, result.*)` floor redundant, remove it only if
the full sweep shows zero widenings without it; otherwise keep it
with an updated doc comment. Evidence decides, not preference.

## Operational readiness (confirmed 2026-07-23)

SLIs = the gate suite (10225-test baseline, parity 268/268, 57 pins,
92-entry delta harness, census floors). Rollback: everything
Reversible (full-revert protocol proven 3× in G7). Scalability: N/A
(pure function swap). Failure modes: (1) backlog widening → harness
catches pre-commit → revert+stop; (2) wrong anchor conversion →
unit tests assert exact arithmetic vs jar oracles; (3) fallback
swallowing labels → test asserts every labeled corpus transition
renders. Backwards compat: none; `label.width/height` additive,
internal.
