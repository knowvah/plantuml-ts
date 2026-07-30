# T4 — Route `EntityImageDescription` through `BodyFactory`

## Context

Upstream (`EntityImageDescription.java:188-204`):

```java
desc = BodyFactory.create3(entity.getDisplay(), getSkinParam(), defaultAlign, fc, style.wrapWidth(), style);
name = BodyFactory.create2(getSkinParam().getDefaultTextAlignment(CENTER), codeDisplay, ...);
```

Ours builds `name`/`desc` with local helpers instead
(`EntityImageDescriptionSupport.ts#buildTextBlock`, `buildDesc`). Per ADR-1
this is where the two converge — and because the SIZER routes through
`calculateDimensionSlow` since T6, one change serves both paths.

**This is the mission's risk concentration.** It changes rendered output
for every description diagram.

## SCOPE NARROWED — only `desc`/`create3` is wireable (ADR-10)

`create2` and `BodyEnhanced1` moved to mission SI1: `BodyEnhanced1
.buildTextBlock` constructs `MethodsOrFieldsArea`, whose cascade measures
≈12,100 Java lines through `net/atmp/CucaDiagram`, `abel/Entity`,
`cucadiagram/Bodier` and the 40-file `skin/` package. `BodyFactory.ts`
therefore exposes **`create3` only**.

**So this task wires `desc` through `create3` and LEAVES `name` alone.**
`name` keeps its current local construction and its flat
`FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12`, which is exactly right: that
constant traces to `BodyEnhanced1.getMarginX()`=6 applied left and right by
`decorate`, and until `create2` exists the flat table is the faithful
encoding of that fact. Do not delete it, do not reroute `name`, and do not
substitute `create3` for `create2` — `getMarginX` is 6 vs 0, so that swap
would silently change every folder/package title width.

If wiring `desc` turns out to require `create2`, **STOP and report** — that
is the ADR-10 boundary, not a gap to close.

## Wiring prerequisite T2b-1 flagged

`ISkinSimple.sheet(...)` must be backed by a real `SheetBuilder` /
`CreoleParser` at the wiring point — **today only test doubles exist.**
`create3` needs `{defaultThickness, minimumWidth}` resolved from
`resolveSkinparam`'s `LineThickness` / `MinClassWidth` equivalents, because
no `Style`/`PName` cascade exists here to do it automatically
(`FromSkinparamToStyle.java:241` is the trace). And `atomOps` must be a real
`AtomOps` bundle — `Sea.ts` holds the contract — never a stub.

## The gate is the diff-count ratchet, NOT "T1's goldens" (ADR-5 AMENDMENT)

This file used to say "T1's goldens are the gate." **T1 pinned zero
goldens** — none of the 22 blast-radius fixtures is conformant, so there
was nothing to freeze (see the ADR-5 AMENDMENT and T1's commit `af9406b`).

The real gate is T1b's `oracle/goldens/svg-description/diff-baseline.json`
plus `tests/oracle/svg-conformance/description.diff-baseline.ratchet.test.ts`:
each of the 22 has a pinned diff count that **must not rise**. A count that
FALLS is this task working. A count reaching 0 logs `[PROMOTION READY]` —
promote it into `ratchet.json` per the goldens README's Add rule (which
also requires `dotEqual=true`), and that promotion is a deliberate act, not
automatic.

The 48 pre-existing `svg-description` goldens ARE a byte-freeze and must
stay green — they cover the general description-rendering path this task
also touches.

## Blocker to plan for FIRST — the 500-line cap

`src/core/svek/image/EntityImageDescriptionSupport.ts` is **exactly at the
500-line cap** after T3. This task's read-set includes it and the seam it
must call lives there. Plan the split before writing code; do not discover
it mid-task. (T3 also found `buildTextBlock`/`buildWrappedLines` at the
param-count ceiling — any further seam threads through `AtomResolutionCtx`,
not a new positional param.)

## Write-set

- `src/core/svek/image/EntityImageDescription.ts`
- `src/core/svek/image/EntityImageDescriptionSupport.ts` — and whatever
  module the 500-line split creates
- `oracle/goldens/svg-description/*` — ONLY to update a golden whose drift
  you have jar-verified, and only with the jar's bytes
- `oracle/goldens/svg-description/diff-baseline.json` — ONLY to record a
  count that FELL, with `measuredAt`/`measuredAgainstCommit` updated
  together; never to raise a baseline
- co-located tests

Deliberately NOT in scope: `leaf-sizing.ts`, `leaf-sizing-legacy-fallback
.ts`, `size-backlog.json`. Those are batch 5.

## Read-set

- `~/git/plantuml/.../svek/image/EntityImageDescription.java:180-210`
- `src/core/svek/image/EntityImageDescription.ts:244-292`
- `src/core/svek/image/EntityImageDescriptionSupport.ts`
- T2b's `BodyFactory`

## Acceptance criteria

- Given a `desc` block, then it is built by `BodyFactory.create3`, and the
  local helper it replaces is gone or documented as still serving `name`
- Given `name`, then it is UNCHANGED and `FOLDER_SHOWN_TITLE_EXTRA_WIDTH`
  survives — `create2` is SI1's (ADR-10). The original criterion here
  ("title margin comes from `BodyEnhanced1.getMarginX()`") is **void for
  this mission** and is SI1's acceptance test instead
- Given the 48 pre-existing `svg-description` goldens, then they pass — OR
  a drift is jar-verified and the golden updated to the JAR's bytes, with
  the probe recorded
- Given the 22 diff-count baselines, then **no count rises**; a fall is the
  expected outcome of this task, and a fixture reaching 0 is reported
- Given the size ratchet, then `widened` is 0 and conformant is >= 317/351
- Given DOT parity, then 262 / 90 / 708 EQUAL is unchanged
- Given the flat tables, then they are NOT deleted here — they are still
  live for the paths batch 5 has not widened yet

## If an SVG golden drifts

Drift matching the jar is the port working. Unverified drift is a
regression. Probe the fixture, compare against the jar's own SVG, and only
then update the golden — to the JAR's bytes, never to ours. Record the
probe. If you cannot explain a drift: STOP.

## If a size pin widens

STOP. Do not re-baseline. Diagnose to a mechanism at a `file:line` per
`diagnosis.md`. T6's four narrowings are the model — it found what the
tables encoded and kept it.

## Observability / Rollback

Reversible ONLY because the routing widening is not in this commit (ADR-6)
— keep it that way. Land as exactly ONE commit so `git revert` is a real
rollback.

## Quality bar

All four gates, all three ratchets, the 22-fixture diff-count baseline, and
all four SVG golden sets (svg-description 48, svg-class 310, svg-object 22,
svg-state 57).

**Note on gate runtime:** `npm run lint` alone now takes several minutes on
this codebase. Run it separately rather than chained with test and build, or
it will look like a hang.
