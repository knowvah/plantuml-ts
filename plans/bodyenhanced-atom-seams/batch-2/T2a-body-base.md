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

`TextBlockLineBefore` does NOT exist in this port and must be ported with
it. `TextBlockUtils.withMargin` DOES exist (quad overload is
`withMarginQuad` — a distinct name because TS has no overloading).

Per ADR-4 the separator path is ported faithfully; it is what closes S1L-i.

## Write-set

- `src/core/cucadiagram/BodyEnhancedAbstract.ts` (new)
- `src/core/klimt/shape/TextBlockLineBefore.ts` (new)
- co-located tests

## Read-set

- `~/git/plantuml/.../cucadiagram/BodyEnhancedAbstract.java`
- `~/git/plantuml/.../klimt/shape/TextBlockLineBefore.java`
- `src/core/klimt/shape/TextBlockUtils.ts` — `withMargin`/`withMarginQuad`
- `src/core/klimt/shape/TextBlock.ts` — the interface to implement

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
- Given the full suite, then **nothing moves** — nothing calls this yet
- Given every constant, then it is traceable to the Java, never fitted

## Observability / Rollback

N/A. Reversible — pure addition, no caller.

## Quality bar

All four gates; all three ratchets EXACTLY unchanged (317/351, 262/90/708,
219/708). Any movement means something got wired in prematurely.
