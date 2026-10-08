/**
 * Shared types for annotation chrome style resolution — see `style.ts`'s
 * module doc comment for the full layering/design rationale these types
 * support.
 */

import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { LineStyleDash } from '../style-line-style.js';

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
  /** lgm-T1a: `PName.LineStyle` (`Style#getStroke`, `Style.java:299-320`) --
   *  the dash half of the element's stroke, set only by a `<style>` block
   *  (`gunecu-53-jebu067`: `mainframe { LineStyle 2 }`). `undefined` is
   *  solid; only the mainframe's `BigFrame` draw reads it today. */
  lineStyle?: LineStyleDash;
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
  /** cdd5-T4e (legend-style-maximumwidth-ignored): `PName.MaximumWidth`
   *  (`Style#wrapWidth`, `style/Style.java:330-333`), a `<style> <element>
   *  { MaximumWidth N } }` selector's raw pixel value — no upstream skin
   *  selector or skinparam key ever sets it (`blocks-creole.ts
   *  #buildChromeCreoleBlock`'s own doc comment), so `<style>` is its ONLY
   *  source. Resolved uniformly for every element (style merging does not
   *  care which one), but only `legend`'s draw call site actually consumes
   *  it (`blocks-creole.ts#buildChromeTextBlock`) — title/caption/header/
   *  footer hard-code `LineBreakStrategy.NONE` at their OWN upstream draw
   *  sites regardless of this value, the same D8-shaped quirk as
   *  `horizontalAlignment` above. */
  maximumWidth?: number;
  /** D3 (cdd6 T1b/T2f): style-cascade-resolved `PName.HyperLinkColor`
   *  (`Style.java:265`, `FontConfiguration.java:213-219`) for a `[[url]]`
   *  atom inside this chrome element's own text — the SAME value
   *  `blocks-creole.ts#ChromeTextPaint.hyperlinkColor` already threads down
   *  to `CommandCreoleUrl.ts`. No upstream skinparam key sets it (absent
   *  from the `FromSkinparamToStyle.java:87-176` Font{Size,Style,Color,Name}
   *  key list `style.ts`'s module doc cites), so `<style> <element> {
   *  HyperlinkColor } }` is its ONLY source — `annotation-style-overrides.ts`
   *  would need a `hyperlinkcolor` setter to populate it (T2f residual: that
   *  file is outside this task's write-set, so this field stays `undefined`
   *  from every real `resolveAnnotationStyles` call; `blocks.ts
   *  #buildAnnotationBlock`/`chrome.ts#buildMainframeTitleBlock` forward it
   *  when present, matching `undefined`/`null`'s documented `#0000FF`
   *  fallback). */
  hyperlinkColor?: string | null;
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
