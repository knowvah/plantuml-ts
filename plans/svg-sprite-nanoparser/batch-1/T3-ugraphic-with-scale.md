# T3 — Port `emoji/UGraphicWithScale.java`

## Context

See [`../README.md`](../README.md) for the mission mechanism (jar-verified).

`SvgNanoParser.drawU` threads a `UGraphicWithScale` through its element walk,
pushing/popping it on a stack as `<g>` elements open and close, and applying
each group's `transform` and fill/stroke to it. It does not exist in this
port.

**This is the hot path, not a nicety.** Census across all of
`assets/stdlib`: `<g ` appears **19,416** times and `transform=` **18,241**
times. Getting the stack order and transform composition wrong corrupts every
stdlib sprite.

**Note the package:** `emoji/UGraphicWithScale.java`, NOT `svg/parser/` or
`klimt/`.

## Task

Port `~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/UGraphicWithScale.java`
(128 lines) to `src/core/klimt/UGraphicWithScale.ts`.

## Write-set

- `src/core/klimt/UGraphicWithScale.ts` (create)
- `src/core/klimt/UGraphicWithScale.test.ts` (create)

## Read-set

- `~/git/plantuml/.../emoji/UGraphicWithScale.java` — the spec
- `~/git/plantuml/.../svg/parser/SvgNanoParser.java:135-166` — the drawU
  stack discipline (`stack`, `stackG`, push on `<g `/`<g>`, pop on `</g>`)
- `~/git/plantuml/.../svg/parser/SvgNanoParser.java` — `applyTransform` and
  `applyFillAndStroke`, the two mutators
- `src/core/klimt/UTranslate.ts` — this port's existing affine-transform
  support. **Verify what is already there before adding anything.**
- `src/core/klimt/drawing/UGraphicDelegator.ts` — the port's existing
  delegation pattern; follow it rather than inventing one.

## Architecture decisions (locked)

- [ADR-4](../decisions.md#adr-4) — full-class port.

## Interface contract

Consumed by T6 and T8. The `apply`-returns-new-instance discipline in the
Java is load-bearing for the stack (`stack.add(0, ugs)` stores the OLD
instance) — preserve it; do not convert to in-place mutation.

## Acceptance criteria

1. Given nested `<g transform=…>` elements, when pushed and popped, then the
   composed transform at each depth matches upstream's stack order.
2. Given `</g>`, when popped, then the restored instance is the one pushed at
   that depth — not a recomputed equivalent.
3. Given a `stroke-width`, when applied, then it is multiplied by
   `getInitialScale()` exactly as `applyFillAndStroke` does.
4. Given an `apply(...)`, then the receiver is unchanged and a new instance
   is returned (immutability is what makes the stack correct).

## Quality bar

All four gates exit 0. TDD. Coverage 90/90/90.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible** — new files only, no consumers until T6.

## Boundaries

**Always:** preserve the immutable-`apply` contract and upstream naming.
**Never:** collapse the two-stack design (`stack` of graphics + `stackG` of
raw group strings) into one. `getFillString` reads `stackG` to inherit fill
from an ancestor group — the raw strings are needed, not just the graphics.

## Method rules

1. **Trace two dependency levels** before ruling on scope. In particular,
   check what `UGraphicWithScale` needs from the port's `UGraphic` seam
   BEFORE declaring the shape of this class.
2. **Verify any "already wired" claim against the CURRENT call graph.**

## Commit

One commit: `feat(T3): port UGraphicWithScale for sprite group transforms`
