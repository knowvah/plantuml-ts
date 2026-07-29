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

- Given a folder/package leaf, then its title margin comes from
  `BodyEnhanced1.getMarginX()`, not `FOLDER_SHOWN_TITLE_EXTRA_WIDTH`
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

N/A. Reversible — and cleanly so ONLY because routing is not in this
commit. Keep it that way.

## Quality bar

All four gates + all three ratchets + T1's golden ratchet.
