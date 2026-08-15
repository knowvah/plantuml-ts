# T2 — one ink walk over a symbol's own drawn shapes

## Context

Same project context as T1 (read its Context and Prior-observations).

The port already has exactly this mechanism, used for edge decorations:

```ts
const finder = LimitFinder.create(INK_STRING_BOUNDER, false);
if (headName !== undefined) {
  const headAngle = segmentAngle(secondToLast, last);
  place(headName, last, headAngle, 'none').drawable.drawU(finder);
}
return { minX: finder.getMinX(), minY: finder.getMinY(), maxX: finder.getMaxX(), maxY: finder.getMaxY() };
```
`src/diagrams/class/renderer-arrowhead.ts#edgeExtremityInk:345-366`

A `USymbol` exposes `asSmall`/`asBig`, which return a drawable
(`src/core/decoration/symbol/USymbol.ts:62-73`). So the same three steps —
create a finder, draw into it, read the extent — apply to a classifier
whose leaf is drawn as a symbol.

This is why the fix is one mechanism and not a fourth `if`: upstream has a
single ink concept (walk what was drawn), and this port reconstructs it
analytically per shape. Each analytic rule is a place the reconstruction can
diverge, and `addRectInk`'s `(x - 1, y - 1)` is one that has.

## Task

Add `symbolInkExtent` in a new module: given a classifier that is drawn as
a `USymbol`, return the ink extent of the symbol as DRAWN, using
`LimitFinder`. Nothing consumes it in this task.

Reuse `edgeExtremityInk`'s ingredients rather than reinventing them —
`LimitFinder.create`, the same `INK_STRING_BOUNDER`, the same
`.drawU(finder)` shape. If `INK_STRING_BOUNDER` is module-private to
`renderer-arrowhead.ts`, exporting it is preferable to declaring a second
one; note which you did and why.

Do NOT modify `addClassifierInk` here. Dispatch is T3's.

## Read-set

- `src/diagrams/class/renderer-arrowhead.ts:340-366` — the model.
- `src/core/klimt/drawing/LimitFinder.ts` — the finder and its shape rules.
- `src/core/decoration/symbol/USymbol.ts:62-93` — `asSmall`/`asBig`/`Margin`.
- `src/core/decoration/symbol/USymbolActor.ts` — the concrete symbol the
  measured evidence is about.
- `src/diagrams/class/class-ink-box.ts:147-180` — the dispatch T3 will edit.
- `.claude/catalog.md` — check what exists before writing. Agents in this
  repo routinely rebuild what is already there.

## Write-set

- `src/diagrams/class/class-ink-symbol.ts` (create)
- its co-located test

`class-ink-box.ts` and `class-ink-shapes.ts` are **T3's** — do not touch.

## Interface contract (consumed by T3)

```ts
/** Ink extent of a classifier drawn as a USymbol, from a LimitFinder walk
 *  over the symbol's own drawn shapes. `undefined` when the classifier is
 *  not symbol-drawn (T3 then keeps the existing box rule). */
export function symbolInkExtent(c: ClassifierGeo): { minX: number; minY: number; maxX: number; maxY: number } | undefined;
```

Returning `undefined` rather than throwing is what lets T3 make the
dispatch additive: unknown shapes keep today's behaviour exactly.

## Acceptance criteria

1. Given `cacoma-43-poxu615`'s actor classifier, when `symbolInkExtent` is
   called, then its `minY` is the drawn head ellipse's top — **0.5 above the
   geo box top, not 1 below it**, i.e. the measured 1.5 difference from
   `addRectInk`. Assert the number, and cite note (b) in the test.
2. Given a classifier that is not symbol-drawn, when called, then
   `undefined` — no throw, no zero box.
3. Given the label `UText` and body `UPath`, when the extent is taken, then
   both are included — jar's ink is the UNION of head, body and label, so a
   walk that only sees the ellipse is incomplete. Assert on a case where the
   label is wider than the head.
4. Given the whole suite, when this task lands, then no rendered output
   changes — nothing consumes it yet.

## Quality bar

All four gates exit 0. class DOT-parity 712/712. class/object pins hold.
Coverage 90/90/90 on the new module. File under the 500-line cap; functions
under 30 NLOC / CCN 10 / 5 params (the complexity hook BLOCKS on these).

## Boundaries

- **Always:** reuse `edgeExtremityInk`'s ingredients; cite `file:line` for
  any constant.
- **Ask first:** exporting something currently private in another module;
  any write outside the write-set.
- **Never:** run a git command. Never approximate the walk with a box — that
  is the defect being removed.
