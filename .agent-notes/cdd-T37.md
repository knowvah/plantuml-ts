# cdd-T37 — marker offset + the eight singletons

Status: **executed**, branch `cdd/t37`, based on `cc9edf43` (T35+T36
merged). Full diagnosis artifacts + fix summaries: `plans/
class-divergence-drive/decision-journal.md` rows 225-230.

## M8 marker offset — 4 of 6 named fixtures fixed, 2 named as a
## separate (unported) mechanism

Instrumented `attachMagicArrow`/`guideLinesAnchor` with a temporary
`CDD_T37_TRACE` env-gated trace (added, used, reverted — nothing left
in the committed diff) to capture `center.x`, the resolved font size,
`textWidth` and `blockLeft` for `bitove-03-sanu160`.

**Mechanism (single-line, `class-edge-label-attach.ts#attachMagicArrow`):**
jar's `getXY` (`SvekEdge.java:806-813`, `SvekUtils#getMinXY`) reads the
MINIMUM x/y of a colour-keyed marker polygon a REAL graphviz render
drew at the DOT-declared width — `Math.floor(arrowFontSize + textWidth
+ 2*labelMarginOf(rel))`, the SAME total `withLayoutBox`
(`graph-layout-build-edges.ts:186`) floors for the DOT box. The
pre-existing `blockLeft` (used correctly for TEXT, via
`portLabelAnchor`'s own `Math.trunc(width)/2` hybrid, which
algebraically absorbs the margin term regardless of its value) was
reused UN-FLOORED for the GLYPH's own origin, which has no such
absorbing term — off by `1 - frac(textWidth)/2` for a non-self edge.
Verified algebraically and numerically against `bitove-03-sanu160`
(Δ0.58), `class-inheritance-interface-assoc` (Δ0.804),
`lojepe-37-liri985` (Δ0.636) — all now conformant.

**Mechanism (multi-line guide-lines, `class-edge-label-anchor.ts
#guideLinesAnchor`):** same `getXY`/floor corner, but here the margin
wraps the WHOLE per-line block (`addVisibilityModifier` runs
UNCONDITIONALLY, `hasSeveralGuideLines` only gates the separate
`addMagicArrow` call for the single-line arm) — the `2*margin` term
cancels ALGEBRAICALLY for ANY integer margin (`floor(x+2m)/2 - m ===
floor(x)/2`), so the fix is a bare `Math.floor(maxWidth)/2`, no margin
term at all. `gobuco-16-ruke239`/`lapoma-04-vaga142`'s uniform Δ0.23
(BOTH triangle vertices and adjacent `text/@x` moving together, since
neither has `portLabelAnchor`'s absorbing trunc) confirmed and fixed.

**The SAME bug, found while classifying the ninth item:**
`multiLineLabelAnchor` (plain multi-line, no arrow token) had the
IDENTICAL un-floored `blockLeft` — fixed `sacacu-34-dobo091` (Δ0.369)
and is the SAME mechanism the T35 residual table already named for
`dofima`/`jireze`/`sicile`/`lapoma` ("a separate text-measurement
gap") without diagnosing it. Confirmed via `Math.floor` predicting the
Δ0.369 to 5 decimal places from `WidthTableMeasurer`'s own width for
"Brunette Coleman was a pseudonym".

**Named as a SEPARATE, unfixed mechanism:** `dorelu-66-lixu637`
(self-loop `foo --> foo : foo >`) improved (max Δ6.545 -> Δ0.564) once
the margin/floor fix applied (self-loops use `labelMarginOf`'s
`SELF_LINK_LABEL_MARGIN=6` too) but did NOT close — the residual
matches the module's OWN pre-existing scoping comment
(`class-magic-arrow.ts`'s header): the self-loop `getStartAngle()`
bezier-tangent formula is a geometry primitive this port has never
built; `magicArrowAngle`'s straight-line formula is used instead.
Genuinely out of this task's scope (a new geometry primitive, not a
one-line fix).

**Corpus sweep** (`render-all.mts`/`pin-diff.mts`, 723 fixtures,
stash/pop against `cc9edf43`): 5 transitions, ALL `structural-match ->
conformant` (`bitove-03-sanu160`, `class-inheritance-interface-assoc`,
`gobuco-16-ruke239`, `lojepe-37-liri985`, `sacacu-34-dobo091`), ZERO
regressions anywhere in the corpus at any stage.

## The eight singletons

| Fixture | Verdict | Mechanism |
|---|---|---|
| `dorafa-63-soba922` | FILED | `sameClassWidth` floor is correct+wired; the header BADGE's `badgeIndent` is computed pre-floor and never recentred — `class-stereotype-layout.ts`, outside write-set |
| `pixexi-81-sete111` | PARTIALLY FIXED | `getTitleBaselineOffset` used `theme.fontSize` not `titleFont(theme).size` — fixed (Δ31.389 -> 0 locally); a separate +5.389 canvas/box Y-shift remains, undiagnosed, `class-ink-box.ts` territory |
| `medosa-71-ligu412` | FILED | crow's-foot `side` wiring gap, already self-documented in `ExtremityCrowfoot.ts` — needs `SvekEdge.ts` adapter geometry, multi-file |
| `kupetu-36-kive480` | RULED OUT | same dot-engine spline-precision class as the retired `bipudo-23`; `dot-sync-report` confirms DOT parity; no fix |
| `konomi-00-gico141` | RULED OUT (MEDIUM) | isolated 0.315px cardinality-label residual in a 20-node diagram, most consistent with the already-named gvts-genuine N25/N62 placement residual; not independently re-derived from the Java |
| `sacacu-34-dobo091` | FIXED | same M8 mechanism, `multiLineLabelAnchor` |
| `boseba-99-zopo693` / `majuva-44-luta965` | FILED (stop 8) | dot-engine mirrors a same-rank node order both the jar AND a fresh real-graphviz-16.1.0 run agree on — `docs/graphviz-issues/21-same-rank-node-order-mirrored.md` |

Plus the two re-homed T36 items:

- `pijiju-95-xexi872` — FILED (blocked on T34): `renderer-group.ts
  #innerBox` already exists and is correct, but only the neighborhood
  decoration uses it; the classifier's own box render needs the same
  inset and that requires `class-geo-types.ts`/`renderer.ts`, both
  T34's excluded files this batch.
- the DOT hex-case `.toUpperCase()` in `svek-dot-emit-labels.ts:17` —
  FIXED, one line, `dot-sync-report class` unchanged 711/712, all
  non-class conformance suites (description/state/object/sequence)
  green.

## boseba/majuva verdict (explicit)

Both are **UPSTREAM of the DOT-engine's own layout**, not a
plantuml-ts edge-drawing defect and not downstream of an EARLIER
batch's mechanism. `dot-sync-report.ts --slug <slug> class` confirms
`structurallyEqual: true` for both (our DOT emission is byte-identical
to the jar's cached `svek-N.dot`). Feeding that SAME cached DOT to a
real `dot` binary (graphviz 16.1.0, via Homebrew) reproduces the jar's
own node order and canvas width almost exactly for both fixtures;
dot-engine's `getLayout()` returns a MIRRORED same-rank node order
(direct rect-position comparison, `boseba`'s three `User` children:
jar/real-graphviz agree `UserPerso < UserPro < UserSpace`, dot-engine
gives the exact reverse). Filed as `docs/graphviz-issues/
21-same-rank-node-order-mirrored.md` + `TRACKER.md`; not chased
further (stop 8, one diagnosis pass).

## Gates (final)

`npm test` 22448 passed / 2 skipped / 6 todo, 807 files (JSON-reporter
count matches on-disk `find` count); `npm run typecheck` clean (both
tsconfigs); `npm run lint` clean; `npm run build` clean; `npm run
catalog` no drift; `dot-sync-report.ts class` 711/712 unchanged;
`dot-sync-report.ts state`/`object` unchanged from their own
pre-existing baselines; `tests/oracle/svg-conformance/` (27 files,
every non-class engine's baseline) all green.

Two pre-existing PINNED tests updated to reflect the fix (not
tightened, not loosened — the formula changed, the pins now match the
new, jar-verified output): `class-geo-builders.test.ts`'s `"ok >"` and
two-line-no-token cases; `svek-dot-emit.test.ts`'s two uppercase-hex
literals.
