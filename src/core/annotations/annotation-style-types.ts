/**
 * Shared types for annotation chrome style resolution — see `style.ts`'s
 * module doc comment for the full layering/design rationale these types
 * support.
 */

import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';

export interface BoxSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AnnotationBoxStyle {
  fontSize: number;
  fontStyle: 'plain' | 'bold' | 'italic';
  fontColor: string;
  fontFamily: string;
  backgroundColor: string | null;
  lineColor: string | null;
  roundCorner: number;
  /** G2 N50: `PName.LineThickness` -- upstream's `root{}` default is `1.0`
   *  (`plantuml.skin:15`); `mainframe{}` is the ONE annotation element with
   *  its own override (`1.5`, `plantuml.skin:85`, a `root{}` SIBLING block,
   *  not inherited through `document{}`). Only `title`/`legend` expose a
   *  skinparam key for it (`titleBorderThickness`/`legendBorderThickness`,
   *  `annotation-skinparam.ts`'s `applyBoxSuffix`'s `borderthickness` case)
   *  -- see `style.ts`'s module doc comment for the full title/legend-only
   *  `Box*` key list this mirrors. */
  lineThickness: number;
  /** G2 N51: the document canvas's own resolved background hex
   *  (`resolveColorToSvgHex(theme.colors.background)`, computed ONCE in
   *  `resolveAnnotationStyles` and copied verbatim onto every element) --
   *  `blocks.ts#borderBoxStyle` compares its OWN resolved `backgroundColor`
   *  against this to reproduce `TextBlockBordered#drawU`'s redundant-fill
   *  suppression (`klimt/shape/TextBlockBordered.java:122-127`:
   *  `backgroundColor.equals(ug.getDefaultBackground()) -> back =
   *  HColors.none()`) -- jar-verified via direct `TextBlockBordered`
   *  instrumentation (`plans/g2-class-svg/ledger.md` N51,
   *  `mumefa-23-xoxe715`: legend's cascaded `BackGroundColor` resolves to
   *  the SAME yellow as the document's own canvas background, so jar draws
   *  `fill="none"` instead of the redundant literal color; `majoge-68-
   *  zuji574`'s document/legend colors DIFFER, so the legend keeps its own
   *  explicit fill). */
  documentBackground: string;
  padding: BoxSides;
  margin: BoxSides;
  /** D8: for `title`/`caption`, `DiagramChromeFactory.addTitle`/`addCaption`
   *  hard-code CENTER at draw time regardless of this stored value — that
   *  quirk belongs to T9's draw-time geometry, not to resolution here. This
   *  field always carries the faithfully-resolved skin/skinparam/style value. */
  horizontalAlignment: HorizontalAlignment;
}

export type AnnotationElement = 'title' | 'caption' | 'header' | 'footer' | 'legend' | 'mainframe';

export const ANNOTATION_ELEMENTS: readonly AnnotationElement[] = [
  'title',
  'caption',
  'header',
  'footer',
  'legend',
  'mainframe',
];
