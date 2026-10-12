# T1b: `WBSTextBlock`, `ITF`, `ITFLeaf`

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Port three files, upstream names, against the `WElement` contract (`overview.md`; a minimal
test double is fine until T1a merges):
1. `ITF.ts` (`wbs/ITF.java`): `interface ITF extends TextBlock { getT1/getT2/getF1/getF2
   (stringBounder): XPoint2D; getMainBoxWidth(stringBounder) /* default: dimension width */;
   setForcedMinWidth(width) /* default no-op */ }`.
2. `WBSTextBlock.ts` (`wbs/WBSTextBlock.java`, abstract, extends `TextBlockMemoized`,
   `src/core/klimt/shape/TextBlockMemoized.ts`): `isAutoWidth()` (style `Width` value equals
   `auto`, case-insensitive, java:14-17); `getStyleUsed()` = signature
   `root.element.wbsDiagram.arrow` `.addLevel(level).withTOBECHANGED(stereotype)` merged
   (java:21-26); `drawLine(ug, x1, y1, x2, y2)` (java:27-34): `applyStrokeAndLineColor`, p1 =
   (min x, y1), p2 = (max x, y2), `ULine.create(p1, p2)` drawn at `UTranslate.point(p1)`;
   `buildMain(idea)` (java:35-45, D3): PSEUDO → `EMPTY_TEXT_BLOCK`; BOX →
   `FtileBoxOld.createWbs(style, idea.withBackColor(skinParam), label, atomOps)` (read the port's
   signature, `src/diagrams/activity/ftile/vertical/FtileBoxOld.ts:90`, and how the mindmap
   port obtains `atomOps`); else `withMargin(label.create0(fontConfiguration, horizontalAlignment,
   skinParam, wrapWidth, CreoleMode.FULL), 0, 3, 1, 1)`. The ASCII arm is out (D12).
3. `ITFLeaf.ts` (`wbs/ITFLeaf.java`): the box per shape (java:6-23: PSEUDO empty; BOX
   `createWbs`; else creole text with the same margin), `setForcedMinWidth` (java:32-36, also
   `fbox.setMinimumWidth`), `calculateDimension` widening a boxless leaf to `forcedMinWidth`
   (java:39-44), `drawU` recording geometry via `AbstractCommonUGraphic.getTranslate()` and
   centring a widened boxless box by `(forcedMinWidth - width) / 2` (java:45-58), the four
   anchors T1 (w/2, 0), T2 (w/2, h), F1 (0, h/2), F2 (w, h/2) (java:60-75).
4. Tests with jar values: pick two cached rows with a boxed leaf and a boxless (`_`) leaf;
   assert the leaf dimensions equal the jar's `<rect>`/text extents under
   `DeterministicMeasurer`; pin `drawLine`'s min/max ordering and the arrow-style lookup.

## Write-set
`src/diagrams/wbs/{ITF,WBSTextBlock,ITFLeaf}.ts`, `tests/unit/wbs/{WBSTextBlock,ITFLeaf}.test.ts`,
`docs/catalog.md`, `.agent-notes/wep-T1b.md`. Any OTHER file is a stop (`createWbs` or
`setMinimumWidth` missing/different = stop 10 against the activity file).

## Interface contract (→ T2a)
`ITF` as above; `abstract class WBSTextBlock extends TextBlockMemoized { protected skinParam;
buildMain(idea): TextBlock; drawLine(ug, x1, y1, x2, y2): void; isAutoWidth(): boolean;
getIdea(): WElement; abstract calculateDimensionSlow(bounder); abstract drawU(ug) }`;
`new ITFLeaf(idea: WElement, skinParam: ISkinParam)`.

## Acceptance
- Given BOX / NONE / PSEUDO, then `buildMain` returns the ftile box / margined creole / EMPTY.
- Given a boxless leaf and `forcedMinWidth` > its width, then the dimension widens and `drawU`
  offsets the text by half the difference; given a BOX leaf, then `setMinimumWidth` is called instead.
- Given `drawLine(ug, 30, 5, 10, 5)`, then the line starts at x=10 under the arrow style.
- Given the two cached rows, then leaf sizes match the jar to the measurer's precision.

**Observability:** N/A. **Rollback:** Reversible.
