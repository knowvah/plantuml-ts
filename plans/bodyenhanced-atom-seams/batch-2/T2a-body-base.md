# T2a — Port `BodyEnhancedAbstract` + `TextBlockLineBefore`

## Context

The base of the body layer. `BodyEnhancedAbstract` (129 lines) defines the
`getArea`/`getMarginX` contract and, in `decorate` (lines 106-118), the
separator geometry:

```java
if (separator == 0)  return withMargin(block, marginX, 0);
if (title == null)   return new TextBlockLineBefore(thickness, withMargin(block, marginX, 4), separator);
                     return new TextBlockLineBefore(thickness, withMargin(block, marginX, 6, dimTitle.getHeight()/2, 4), separator, title);
```

`TextBlockUtils.withMargin` DOES exist (quad overload is `withMarginQuad` —
a distinct name because TS has no overloading).

Per ADR-4 the separator path is ported faithfully; it is what closes S1L-i.

## CORRECTION — this task's original premise was false (ADR-7)

This file used to claim "`TextBlockLineBefore` does NOT exist in this port."
**It does, in substance.** `src/diagrams/class/class-body-enhanced-layout.ts`
(347 lines) carries `@see BodyEnhancedAbstract.java#decorate`,
`TextBlockLineBefore.java`, and `UHorizontalLine.java`, and records its
offsets as jar-verified byte-exact against `fecolo-08-gepu579`,
`jajebo-21-dada557`, `pacagu-24-nune023` (G2 N42; derivation in
`plans/g2-class-svg/ledger.md`). `renderer-body-enhanced.ts` (139 lines)
reproduces `TextBlockLineBefore#drawU`'s title!=null draw order.

Per ADR-7 the maintainer chose **one owner, now**: port into `src/core/`
from the Java, then rewire the class path onto it in this same task. Use
the class-side constants as a **correctness cross-check** — where your port
from the Java and that jar-verified code disagree, STOP and report; one of
the two is wrong and which one matters.

## Write-set

- `src/core/cucadiagram/BodyEnhancedAbstract.ts` (new)
- `src/core/klimt/shape/TextBlockLineBefore.ts` (new)
- `src/diagrams/class/class-body-enhanced-layout.ts` (rewire onto the new owner)
- `src/diagrams/class/renderer-body-enhanced.ts` (same)
- co-located tests

## Read-set

- `~/git/plantuml/.../cucadiagram/BodyEnhancedAbstract.java`
- `~/git/plantuml/.../klimt/shape/TextBlockLineBefore.java`
- `~/git/plantuml/.../klimt/shape/UHorizontalLine.java`
- `src/core/klimt/shape/TextBlockUtils.ts` — `withMargin`/`withMarginQuad`
- `src/core/klimt/shape/TextBlock.ts` — the interface to implement
- `src/diagrams/class/class-body-enhanced-layout.ts` and
  `renderer-body-enhanced.ts` — the existing jar-verified encoding
- `plans/g2-class-svg/ledger.md` § N42 — its byte-level derivation
- Consumers that must keep working: `class-layout-generic-classifier.ts:119`,
  `class-object-map-sizing.ts:417` (**object diagrams too**),
  `renderer-classifier-box.ts:344`

## Interface contract (consumed by T2b)

```ts
abstract class BodyEnhancedAbstract implements TextBlock {
  protected abstract getArea(stringBounder: StringBounder): TextBlock;
  protected abstract getMarginX(): number;
  protected decorate(block: TextBlock, separator: string | 0, title: TextBlock | undefined, sb: StringBounder): TextBlock;
}
```

## Acceptance criteria

- Given `decorate` with no separator, then it returns
  `withMargin(block, marginX, 0)`
- Given a separator without a title, then `TextBlockLineBefore(thickness,
  withMargin(block, marginX, 4), separator)`
- Given a separator WITH a title, then the `dimTitle.getHeight()/2` offsets
  of upstream line 117 are reproduced exactly
- Given the full suite, then **nothing moves** — the description side does
  not call this yet, and the class rewire relocates an owner without
  changing geometry
- Given every constant, then it is traceable to the Java, never fitted
- Given the class-side jar-verified constants, then the new core port
  agrees with them; any disagreement is reported, not reconciled silently

## Observability / Rollback

**No longer a pure addition** (ADR-7). The class rewire is behavioural-risk
work: revert is `git revert` of this task's single commit, which is why the
task must land as exactly one commit.

## Quality bar

All four gates. Ratchets EXACTLY unchanged — description 317/351 w0, DOT
262/90/708 EQUAL, class sizing 219/708 w0 — **plus the pinned SVG goldens
svg-class 310, svg-object 22, svg-description 48, svg-state 57 all green.**
Any movement means the rewire changed geometry, which it must not.
