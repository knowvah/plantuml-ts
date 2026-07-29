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
for every description diagram. T1's goldens are the gate.

## Write-set

- `src/core/svek/image/EntityImageDescription.ts`
- `oracle/goldens/svg-description/*` — ONLY to update a golden whose drift
  you have jar-verified, and only with the jar's bytes
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
- Given T1's SVG goldens, then they pass — OR a drift is jar-verified and
  the golden updated to the JAR's bytes, with the probe recorded
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
