# Batch 1: model and leaf text blocks

All three run in parallel worktrees; T1b and T1c code against T1a's `WElement` contract
(below) and ship a minimal test double until the merge.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-welement.md) | `WElement`: tree model, style signature + `STEP_BY_PARENT` merge, geometry | typescript-pro (opus) | `src/diagrams/wbs/WElement.ts`, `tests/unit/wbs/WElement.test.ts` | T0 | [ ] |
| [T1b](T1b-wbs-text-block-itf-leaf.md) | `WBSTextBlock`, `ITF`, `ITFLeaf`: main box via `FtileBoxOld.createWbs`, line drawing, leaf anchors | typescript-pro (opus) | `src/diagrams/wbs/{WBSTextBlock,ITF,ITFLeaf}.ts` + tests | T0 (T1a contract) | [ ] |
| [T1c](T1c-wbs-link.md) | `WBSLink`: clipped centre line + arrow | typescript-pro (sonnet) | `src/diagrams/wbs/WBSLink.ts` + test | T0 (T1a contract) | [ ] |

## Interface contract: `WElement` (T1a → T1b, T1c, T2a, T2b)
```ts
export const STEP_BY_PARENT = 1000_1000;                       // WElement.java:41
export class WElement {
  constructor(backColor: HColor | undefined, label: Display, stereotype: Stereotype | undefined,
              styleBuilder: StyleBuilder, shape: IdeaShape);     // root form, java:53-56
  getLevel(): number; getLabel(): Display; getShape(): IdeaShape; getStereotype(): Stereotype | undefined;
  getStyle(): Style; getStyleBuilder(): StyleBuilder; withBackColor(skinParam: ISkinParam): ISkinParam;
  isLeaf(): boolean; getChildren(direction: Direction): readonly WElement[]; getParent(): WElement | undefined;
  createElement(backColor, newLevel, newLabel, stereotype, direction, shape, styleBuilder): WElement;
  setGeometry(position: UTranslate, dimension: XDimension2D): void;
  getPosition(): UTranslate | undefined; getDimension(): XDimension2D | undefined;
}
```
**As landed (T1a, journal row 8):** `createElement(decoration: WElementDecoration, newLevel, direction)` with `WElementDecoration = { backColor, label, stereotype, shape, styleBuilder }`; `withBackColor(skinParam: ISkinParamWithSimple): ISkinParamWithSimple`.

Close with the standard procedure (`close-procedure.md`).
