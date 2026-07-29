# T2b — Port `BodyEnhanced1`/`2` and `BodyFactory`

## Context

The two concrete bodies, on T2a's base.

- `BodyEnhanced1` (245 lines) — `getMarginX()` returns **6**. This is the
  mechanism behind our flat `FOLDER_SHOWN_TITLE_EXTRA_WIDTH = 12`
  (`6` applied left and right by `decorate`'s `withMargin(block, 6, 0)`).
- `BodyEnhanced2` (142 lines) — `getMarginX()` returns **0**.
- `BodyFactory` — port `create2` (→ `BodyEnhanced1`) and `create3`
  (→ `BodyEnhanced2`) ONLY.

**That margin difference is the whole reason `package` titles take an
allowance and `folder` labels do not**: `name` routes `create2`, `desc`
routes `create3`. Do not "simplify" the two classes into one.

`createLeaf`/`createGroup` return `Bodier` — the class/object MEMBER model
(`BodierSimple`, `BodierLikeClassOrObject`). **Out of scope: mission SI1.**
Port `create1`/`Body3` only if `create2`/`create3` genuinely require them;
verify by reading rather than assuming.

## Write-set

- `src/core/cucadiagram/BodyEnhanced1.ts`, `BodyEnhanced2.ts`,
  `BodyFactory.ts` (all new)
- co-located tests

## Read-set

- `~/git/plantuml/.../cucadiagram/BodyEnhanced1.java`, `BodyEnhanced2.java`,
  `BodyFactory.java`
- `src/core/cucadiagram/BodyEnhancedAbstract.ts` (T2a's output)
- `src/core/svek/image/EntityImageDescriptionSupport.ts` — `buildTextBlock`
  and `buildWrappedLines`, which these will replace in T4; read them to see
  what the call sites will need

## Interface contract (consumed by T4)

```ts
BodyFactory.create2(align, display, skinParam, stereotype, entity, style): TextBlock
BodyFactory.create3(rawBody, skinParam, align, fc, lineBreakStrategy, style): TextBlock
```
Adapt parameter types to this port's equivalents, but keep the upstream
names and argument ORDER.

## Acceptance criteria

- Given `BodyEnhanced1`, then `getMarginX()` is 6; given `BodyEnhanced2`,
  then 0 — each cited to its Java line
- Given a body with `--`/`==` separators, then `getArea`'s separator loop
  reproduces upstream's block sequence
- Given the full suite, then **nothing moves** — no caller yet
- Given `createLeaf`/`createGroup`, then they are NOT ported, and the
  decision is noted in the file
- Given every constant, then it is traceable to the Java, never fitted

## Observability / Rollback

N/A. Reversible — pure addition, no caller.

## Quality bar

All four gates; all three ratchets EXACTLY unchanged. Expect file splits
(500-line cap, CCN 10).
