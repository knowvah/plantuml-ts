# T4 — G5: south-cap ink, gated on a resolved south opacity

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/state-residual-fix-batch`. Faithful TypeScript port of PlantUML; the Java
at `~/git/plantuml` is the **canonical spec**. vitest, `tests/unit/state/`.

This is the mission's hardest task and the one SI29 explicitly deferred. It is
also the one where a plausible-looking constant would be indistinguishable
from a fitted one — hence the pre-condition below.

## Task, in order

### Step 1 — the pre-condition (no code yet)

`RoundedSouth.drawU` early-returns on `backColor.isTransparent()`
(`RoundedSouth.java:62-64`), and `Cluster.java:459-471` resolves that colour:

```java
HColor northBackcolor = group.getColors().getColor(ColorType.BACK);
HColor southBackcolor = northBackcolor;
if (northBackcolor == null) {
    northBackcolor  = ...SName.name...       .value(PName.BackGroundColor)
    centerBackColor = ...SName.description...value(PName.BackGroundColor)
    southBackcolor  = ...SName.body...       .value(PName.BackGroundColor)
}
```

with `plantuml.skin:269-271` defaulting `body` to `transparent`.

SI29's record attributes `gokife-89-boja382`'s opaque south to its own
`skinparam state { backgroundColor<<statemachine>> LightYellow }`. **But a
stereotype skinparam may resolve through `SName.name`, which would leave
`body` transparent and make the south cap early-return — in which case the
record's stated gate is wrong even though its arithmetic closes.**

Determine, from the Java, which path a stereotype-scoped
`skinparam state { backgroundColor<<s>> X }` actually takes to
`southBackcolor` — `group.getColors().getColor(ColorType.BACK)`, or the
`SName.name` style bucket. Read `FromSkinparamToStyle` and the
`getColors()`/`ColorType.BACK` population path; grep
`src/main/java/net/` (NOT just `net/sourceforge/plantuml/`).

Journal the answer with `file:line` **before writing any gate**.

- If it reaches `southBackcolor` (so the record's premise holds) → continue to
  Step 2.
- If it does not → **STOP (stop 9)**. The +1 px is real but its trigger is
  not what the record says; that is re-diagnosis, and this mission does not
  re-diagnose. Journal the finding, name what would have to be measured next,
  and hand back.

### Step 2 — thread the signal

Per D1, the signal is a **boolean**, derived from the override rule above —
never from `fill !== STATE_DEFAULT_BACKGROUND`, which resolves the wrong style
zone and misses a `<style>` cascade.

Per D2, thread it as a bare scalar exactly as `shadowing?: number` already is:
computed where `theme` is in scope (`state-composite-pass.ts`, building
`GeoSpec`), carried on `GeoSpec` → `StateNodeGeo`, consumed in `addNodeInk`.
**Do not pass `Theme` into `layout-ink-extent.ts`.**

### Step 3 — apply the +1

In `addNodeInk`'s composite branch, when the signal is set, extend the node's
ink to the uninset south-cap extent. The 1 px is the difference between
`LimitFinder#drawUPath` (zero inset) and `#drawRectangle` (−1 both corners) —
cite both.

Per D7: if the complexity hook blocks `addNodeInk` (it already carries a
`#lizard forgives` exemption), **extract a named helper**. Never widen the
exemption.

## Write-set
- `src/diagrams/state/state-geo-types.ts` — one additive optional field on
  `StateNodeGeo`
- `src/diagrams/state/state-composite-pass-types.ts` — the matching `GeoSpec`
  field
- `src/diagrams/state/state-composite-pass.ts` — compute it where `theme` is
  in scope
- `src/diagrams/state/state-composite-geo.ts` — carry it through
  `materializeSpecs`, mirroring the `shadowing` parameter
- `src/diagrams/state/layout-ink-extent.ts` — consume it in `addNodeInk`
- The corresponding unit tests

## Read-set
- `plans/state-declared-size-fix/findings/G18-single-node-autonom.md` — the
  full G5/mechanism-8 record (`gokife-89`), including its back-solved
  arithmetic `(194.000008+1)+15 = 210.000008` vs jar's `210.000024`
- `plans/state-declared-size-fix/findings/CLOSE-OUT.md:140-160` — G5's other
  four fixtures
- `decisions.md#d1`, `#d2`, `#d7`
- `.agent-notes/si31-T0.md` — T0 recorded the nine T9 guard fixtures' current
  rows; they are your regression list
- `src/diagrams/state/layout-ink-extent.ts:75-93` — the module's own doc
  comment, which already names this as "mechanism 8" and states why T9
  deferred it
- **Java, method bodies not summaries:**
  `svek/RoundedContainer.java:78-92` (drawU: north / centre / south / the
  outline rect), `svek/RoundedSouth.java:62-89` (the transparency guard and
  the `rounded != 0` UPath branch),
  `klimt/drawing/LimitFinder.java:160-190` (**both** `drawUPath` and
  `drawRectangle` — the 1 px lives in the difference),
  `svek/Cluster.java:455-475` (the colour resolution above),
  `src/main/resources/skin/plantuml.skin:266-272` (`RoundCorner 25`, `body
  BackGroundColor transparent`),
  `svek/GroupMakerState.java:113-136` (a 1-child group is always
  `InnerStateAutonom`, never the `countChildren()==0` leaf branch)

## Architecture decisions (locked)
D1 (boolean from the override rule, not from a fill comparison), D2 (scalar
threading, no `Theme` in the ink walk), D7 (extract, never widen).

## Acceptance
- Given Step 1, then the decision journal carries — **before any gate code
  exists** — a `file:line` answer for how a stereotype skinparam reaches
  `southBackcolor`.
- Given the five G5 fixtures (`pacami-67-dafe414`, `tofezi-64-koda860`,
  `xojudi-20-keco020`, `decede-10-buvu414`, `gokife-89-boja382`), when the
  harness runs, then each scope3 height row is exact (−1.000 → 0).
- Given the nine T9 guard fixtures, when the harness runs, then none regresses
  from the rows T0 recorded.
- Given a composite with a transparent south (the skin default), then its ink
  is byte-identical to before this change — assert it in a unit test.
- Given `addNodeInk` after the change, then the complexity hook passes and the
  diff adds no `#lizard forgives` and widens none.
- Given the harness, then `0 rows appeared or grew`.

## Interface contracts
`StateNodeGeo` gains ONE optional boolean; `GeoSpec` gains the same. Both are
additive and optional — no existing construction site becomes invalid. Name it
for what it means (the south background is non-transparent), and give it a doc
comment in the shape of `shadowing`'s: what it is, and which node kinds
populate it.

## Observability
N/A — no new observable operations.

## Rollback
Reversible: one commit. The two type fields are additive and optional, so
reverting cannot orphan a construction site.

## Quality bar
All four gates green, coverage >= 90/90/90. TDD throughout. Every constant
carries a `~/git/plantuml` `file:line`. If you cannot cite it, you have not
finished — a value that merely makes the row go exact is a fitted value, and
stop 7 covers it.

## Boundaries
- **Always:** journal Step 1's answer before writing the gate; keep the
  transparent-south path byte-identical.
- **Ask first:** nothing — Step 1's failure branch is a STOP, not a question.
- **Never:** derive the gate from `fill !== STATE_DEFAULT_BACKGROUND`; pass
  `Theme` into `layout-ink-extent.ts`; widen a complexity exemption; run git.

## Report (<=600 tokens)
Step 1's answer with `file:line`; the five rows before/after; the nine guard
fixtures' before/after; the field name and its doc comment; whether a helper
was extracted and why; every constant with its citation.
