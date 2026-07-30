# Architecture Decisions (pre-made — treat as LOCKED)

Approved by the maintainer at planning time, after an investigation that
**overturned the remedy the previous mission filed**. If you find a
conflicting constraint, STOP and log it in `decision-journal.md`.

## ADR-1 — Hardcode the `<img>` fallback font; do NOT thread one

**Context.** `bodyenhanced-atom-seams`' ADR-3 threaded an `imgFallbackFont`
so a cannot-decode `<img>` would draw at "the DIAGRAM-default font". Upstream
does nothing of the kind: `AtomImg.create` hardcodes it.

```java
// AtomImg.java:105-107
public static Atom create(ISkinSimple skinParam, String src, ImgValign valign,
                          int vspace, double scale, Url url) {
    final UFont font = UFontFactory.monospace(14);
    final FontConfiguration fc = FontConfiguration.blackBlueTrue(font);
```

Every `(Cannot decode)` / `(File not found)` / `ERROR` path in that method
uses that `fc`. The jar measuring `<img:x/y.svg>` at 100.362×**14**
regardless of per-element font was this constant — not evidence that the
diagram default happened to be 14.

**Decision.** Reproduce `monospace(14)` + `blackBlueTrue` at the fallback
site. Thread no font. **Delete the `imgFallbackFont` seam.**

**Consequences.** ADR-3 of the previous mission solved a problem upstream
does not have; its seam becomes dead and goes. Rejected: keeping the seam
"in case" — an unused seam that looks deliberate is exactly the lock-step
defect that mission line exists to remove.

## ADR-2 — Route the usecase SIZER through `TextBlockInEllipse`/`Footprint`

**Context.** Upstream obtains ink by DRAWING: `Footprint` is a
point-collecting `UGraphic` (`draw(UShape)` → `all.add(new XPoint2D(x,y))`),
and `TextBlockInEllipse.java:60` constructs one then fits an ellipse to the
collected points.

**This port already does that — on the renderer side only.**
`src/core/klimt/shape/TextBlockInEllipse.ts:7,37-38` imports `Footprint` and
calls `getEllipse(text, alpha)`, reached from `USymbolUsecase.ts`. The SIZER
instead uses a 152-line analytic substitute,
`src/diagrams/description/usecase-footprint.ts`, fed by `footprintBoxes`.
That split is why the sizer needs to be TOLD the ink while the renderer
simply observes it.

**Decision.** Route the sizer through the same `TextBlockInEllipse` /
`Footprint` path the renderer already uses. Retire `usecase-footprint.ts`
and `footprintBoxes`. **Delete ADR-2-of-the-previous-mission's optional ink
fields from `AtomImageResolver`.**

**Consequences.** One owner for footprint geometry, the ADR-7 pattern again.
Ink becomes observed rather than declared, so the multi-line stacking
sub-case T5 found **dissolves** instead of needing its own fix.

**Do NOT delete `SpriteSvg`'s `inkX/inkY/inkWidth/inkHeight`** — those are
pre-existing and legitimate; the previous mission's ADR-2 mirrored them, it
did not introduce them. Only the `AtomImageResolver` additions go.

## ADR-3 — Do NOT add side channels to `Sea`/`SheetBlock1`

**Context.** The previous mission filed exactly that remedy. Checked against
the Java: upstream's `AtomImg` has no ink concept (`calculateDimensionSlow`
is its only dimension method) and `SheetBlock1.initMap` stacks on plain
`sea.getHeight()` with no ink/declared distinction.

**Decision.** Leave `Sea`, `SheetBlock1` and `AtomOps` alone. **One resolved
value per atom is faithful to upstream.**

**Consequences.** The ledger's filed remedy is superseded and T4 corrects it.
Rejected: adding the channels anyway — it would make the pipeline diverge
from upstream to serve a substitute this mission is deleting.

## ADR-4 — Gate on the numbers T5 already measured

**Context.** T5 removed each guard for real, measured the widening, and
reverted.

**Decision.** Success = `jecici-56-bimu826` and
`bootstrap-0`/`ruziru-69-xixo434` route unguarded at **widened 0**, with
conformance ≥ 320/351.

**Consequences.** Pass/fail is objective before a line is written. If a
fixture still widens, ADR-1 or ADR-2 is wrong — diagnose to a `file:line`,
do not re-baseline.
