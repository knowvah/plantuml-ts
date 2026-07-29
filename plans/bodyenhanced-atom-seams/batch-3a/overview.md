# Batch 3a — Port the creole `Display`/`Sheet` layer (GATING, ADR-8)

T2b stopped at the wall: both `BodyEnhanced1` and `BodyEnhanced2` bottom
out in unported code. The maintainer ruled a faithful port over the scoped
substitute — **a faithful port overrides a short-term patch** — so this
batch lands the real layer before T2b resumes.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T7 | Foundations + `Sheet` | typescript-pro | `src/core/klimt/creole/{Sheet,CreoleMode,CreoleContext}.ts`, `src/core/klimt/LineBreakStrategy.ts` | T2a | [x] |
| T7b | `XLine2D` + reinstate `XRectangle2D#intersect` | typescript-pro | `src/core/klimt/geom/{XLine2D,XRectangle2D}.ts` | T7 | [x] |
| T8 | `SheetBlock1`/`2`, `Ports`/`WithPorts`, `Sea`, `Position` | typescript-pro | `src/core/klimt/creole/{SheetBlock1,SheetBlock2,Sea,Position}.ts`, `src/core/svek/{Ports,WithPorts,PortGeometry}.ts`, `src/core/klimt/shape/TextBlockLineBefore.ts` | T7b | [x] |
| T8b | Relocate MD5 into `SignatureUtils` | typescript-pro | `src/core/utils/SignatureUtils.ts`, `src/core/svek/Ports.ts` | T8 | [x] |
| T9a | `SheetBuilder` + `CreoleParser` (+ the `ISkinSimple.sheet` seam) | typescript-pro | `src/core/klimt/creole/SheetBuilder.ts`, `src/core/klimt/creole/legacy/CreoleParser.ts`, `src/core/style/ISkinSimple.ts` | T8b | [ ] |
| T9b | `Stereotype` + `MessageNumber` | typescript-pro | `src/core/stereo/Stereotype.ts`, `src/core/sequencediagram/MessageNumber.ts` | T8b | [ ] |
| T9c | `Display` | typescript-pro | `src/core/klimt/creole/Display.ts` (+ splits) | T9a, T9b | [ ] |

T9a and T9b have disjoint write-sets and no dependency on each other — run
them in parallel. T9c needs both.

## T9 was one task and is now three — the call graph again

Tracing `Display.getCreole` rather than trusting the task title:

```java
final Sheet sheet = spriteContainer
    .sheet(fontConfiguration, horizontalAlignment, creoleMode, stereotypeConfiguration)
    .createSheet(this);                                   // SheetBuilder
final SheetBlock1 sheetBlock1 = new SheetBlock1(sheet, maxMessageSize, padding, marginX1, marginX2);
return new SheetBlock2(sheetBlock1, sheetBlock1, UStroke.withThickness(1.5));
```

and `create0`'s dispatch on `Stereotype` (first or last element) and
`MessageNumber` (first element). Real prerequisite set, none of it ported:

| Class | Java | Where |
|---|---|---|
| `Display` | 796 | `klimt/creole/` |
| `Stereotype` | 239 | **`stereo/`**, not `cucadiagram/` |
| `CreoleParser` | 196 | `klimt/creole/legacy/` — the ONLY `SheetBuilder` implementor |
| `ISkinSimple` | 80 | **`style/`** |
| `MessageNumber` | 67 | `sequencediagram/` |
| `SheetBuilder` | 42 | `klimt/creole/` |

≈1,420 lines. Note our `legacy/CreoleStripeSimpleParser.ts` ports a
DIFFERENT upstream class (single-line classification); it is not
`CreoleParser` and does not substitute for it.

Serial: each task's output is the next one's base. No parallelism to be had.

**Nothing is wired in.** This batch is a pure addition — no existing caller
routes through it. Every ratchet must be EXACTLY unchanged after each task,
exactly as ADR-6 requires of the port batches.

## Why this is smaller than 1,251 lines of Java

The lower creole layer is already ported: `Fission` (275), `Stripe`,
`Stencil`, `StripeStyleType`, `atom/Atom`, the whole `command/` chain,
`StripeSimple` (289), `CreoleStripeSimpleParser`. Dependency audit:

| Needed by | Status |
|---|---|
| `TextBlockMemoized`, `MinMax`, `ClockwiseTopRightBottomLeft`, `UGraphicStencil`, `TextBlock`, `Atom`, `StripeSimple` | PRESENT |
| `LineBreakStrategy`, `CreoleMode`, `CreoleContext`, `XRectangle2D`, `Ports`/`WithPorts` | MISSING — in scope |

**This audit was wrong, and the error is instructive.** It asked "does a
file of that name exist here?" instead of tracing the method bodies
`SheetBlock1` actually calls. It therefore missed `Sea`, `Position`,
`PortGeometry`, `XLine2D`, and `SignatureUtils` — five real prerequisites,
found only when T7/T8 hit them mid-task. **Trace the call graph, not the
filenames.**

## Decide once, explicitly

`SheetBlock2` implements `Ports`/`WithPorts`. T2a already dropped those from
`TextBlockLineBefore` as unreachable. **T8 must make a deliberate, recorded
decision** rather than dropping them a second time by reflex — two reflexive
drops become an invisible divergence.
