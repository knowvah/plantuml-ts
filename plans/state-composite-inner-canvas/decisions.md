# Architecture decisions (pre-made, locked)

Treat every decision here as settled. If execution surfaces a conflicting
constraint, STOP and log it in `decision-journal.md` — do not silently
override.

## D1 — Port `SvekResult#calculateDimension` in full; do not patch constants

**Context.** The composite's inner dimension diverges from jar in two ways
at once: we measure a bounding box over child RECTS where jar walks DRAWN
INK, and our pad is `BOX_PAD * 2 = 24` where upstream's is `delta(15, 15)`
plus a separate 20/25 outer layer.

**Decision.** Replace `state-composite-geo.ts#boundingBox`'s derivation with
a faithful port: a `LimitFinder` ink walk over the inner drawn content, then
`delta(15, 15)`, then `InnerStateAutonom#calculateDimensionSlow`'s
`MARGIN * 2 + 2 * MARGIN_LINE + marginForFields` merged with the title and
attribute blocks. Every constant carries its upstream `file:line`.

**Rejected:** keeping the bbox and swapping 24 for 15. The residual is
ink-vs-box as much as it is the constant, so that lands a new invented
number in place of the old one — which this mission exists to stop.

**Consequences.** Larger blast radius (141 fixtures) and the ink walk has to
run over content that is DRAWN, which means the inner render must be
reachable at sizing time. That reachability is T2's whole job, and if it
turns out not to exist the mission stops there rather than approximating.

## D2 — `moveDelta(6 - minX, 6 - minY)` is in scope, in the same mission

**Context.** Jar shifts inner content so its ink starts at 6 BEFORE taking
the dimension. Dimension and shift are two halves of one method.

**Decision.** Port both. Batch 3 lands the shift.

**Rejected:** dimension-only, shift deferred. That yields a correctly-sized
box whose children sit at the wrong interior offset — the fixtures would
still not be exact, and the next reader would have to re-derive the same
method to finish it.

**Consequences.** Child positions inside every composite move. The svg-state
ratchet is the guard: 59 pins must hold, and any that would break is a
signal the shift is being applied in the wrong frame, not a reason to
re-baseline. **Do not re-baseline a pin to make the shift fit.**

## D3 — The oracle is jar's cached `svek-N.dot`, not the SVG

**Context.** Every standing gate under-reports here (see the README's
measurement section — the census stops at `childCount`, the size harness is
backlog-gated and already exits 2 on an unrelated pre-existing wobble).

**Decision.** T1 builds a harness that compares our DECLARED composite
`width`/`height` against jar's cached `svek-N.dot` declaration, per
composite, across all 141 fixtures. Exact equality, no tolerance.

**Consequences.** The mission gets an exhaustive, exact, SVG-free signal.
It also means a fixture can pass this gate and still not be SVG-conformant
— that is expected and is NOT this mission's bar (see D4).

## D4 — SVG conformance is not this mission's exit bar

**Context.** Most composite fixtures carry the corpus-wide entity-wrapping
`childCount` divergence (`.agent-notes/g7-followup-pin-eligibility.md`),
which no amount of correct sizing will close.

**Decision.** Exit on the declared-size oracle plus "no standing gate
regresses". Do not chase byte-conformance, and do not treat an unmoved
census as failure.

**Consequences.** The mission can succeed completely while the census is
flat. Say so plainly in the close-out rather than presenting a flat census
as a disappointment.

## D6 — Import the SvekResult constants; never re-declare them

**Context.** `INK_DELTA` (15) and `JAR_INK_MARGIN` (6) are one upstream
method's constants. They were declared four times across three engines and
the drift had already begun (state's comment pointed at a class file that
does not exist). Consolidated in `522873ef` to `core/svek/SvekResult.ts`.

**Decision.** Import from that module. A local `const INK_DELTA = 15` or
`const JAR_INK_MARGIN = 6` anywhere in this mission is a **stop condition**,
not a style preference.

**Consequences.** The state composite path joins the same owner the class,
description and state-document paths already use. `HACK_X_FOR_POLYGON`
remains duplicated for its own stated and still-valid reason —
`LimitFinder.ts` keeps it private — and is out of scope.

## D5 — State only; a shared seam is a stop, not a scope expansion

**Context.** `LimitFinder` and the sizing helpers are shared infrastructure.
Class, object and description all render through neighbouring code.

**Decision.** The write-set is `src/diagrams/state/`. Reading shared code is
free; WRITING to it requires a stop and a ruling. Any movement in a
non-state diagram type is a stop condition.

**Consequences.** If the faithful port genuinely requires a shared-seam
change, that is a real finding worth a ruling — not something to absorb
quietly mid-batch.
