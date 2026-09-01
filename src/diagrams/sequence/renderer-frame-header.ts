/**
 * A grouping frame's type tab -- background pass (the plain outline) and
 * foreground pass (the clipped-corner tab + its text). Both halves draw the
 * SAME full-area `URectangle`; that duplication is not a bug here, it is
 * `AbstractComponent#drawU`'s per-component two-half dispatch
 * (`drawBackgroundInternalU` vs `drawInternalU`, never both in one call) --
 * see this component's own two methods below.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractComponent.java:137-149
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseGroupingHeader.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/AbstractTextualComponent.java:100-127
 */

import type { FrameGeo } from './ast.js';
import type { ScaledTheme } from './scale-geo.js';
import { rect, path } from '../../core/svg-shapes.js';
import { sequenceText } from './sequence-text.js';
import { moveTo, lineTo, arcTo } from '../../core/svg-path-builder.js';
import {
  GROUP_LINE_COLOR,
  GROUP_LINE_THICKNESS,
  GROUP_FONT_SIZE,
  GROUP_FONT_BOLD,
  HEADER_LINE_COLOR,
  HEADER_LINE_THICKNESS,
  HEADER_FONT_SIZE,
  HEADER_FONT_BOLD,
  CORNER_SIZE,
} from './frame-style.js';

/**
 * `#e` expanded: PlantUML's single-hex-digit greyscale shorthand doubles
 * each RGB channel digit (`d -> (d<<4)|d` per channel), so `#e` (nibble 14)
 * becomes `#EEEEEE`. `core/svg.ts`'s `resolvePaint` shortens it back down
 * to `#EEE` on the way out, matching the jar's own emitted fill.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorSet.java:127-133
 * @see ./frame-style.js#HEADER_BACKGROUND ('#e', plantuml.skin:125)
 */
const HEADER_BACKGROUND_HEX = '#EEEEEE';

/**
 * `ComponentRoseGroupingHeader.java:79`: `style.value(PName.RoundCorner)`,
 * read from the "group" style block (`plantuml.skin:116-121`). That block
 * declares no `RoundCorner`, so it cascades from `root`'s default of `0`
 * (`plantuml.skin:12`) -- this engine has no SName style cascade for the
 * sequence family yet (decisions.md D3), so there is no override path that
 * could ever make this non-zero today. {@link frameHeaderCornerPath}'s
 * `roundCorner > 0` branch stays ported and unit-tested directly for when
 * that cascade lands.
 */
const ROUND_CORNER = 0;

/**
 * `plantuml.skin:8`: root `FontColor black`. Neither `group` nor
 * `groupHeader` (`plantuml.skin:116-129`) declare their own `FontColor`, so
 * both the tab title and the comment text inherit this.
 */
const HEADER_FONT_COLOR = 'black';

/*
 * D2: the local `textAscent(fontSize)` that used to sit here — `size -
 * size/4.5`, jar-verified against `bepipo-37-fego336`'s 13px tab title at
 * 10.111 below its block top and its 11px comment at 8.556 — is GONE. The
 * value was exact for the three production measurers and wrong for
 * `FixedMeasurer`, whose descent is `lineHeight/4.5`, so a renderer computing
 * it could disagree with the layout that sized the box. The same numbers now
 * come from `TextRun.textAscent`, measured in `sequence-layout-events.ts
 * #buildTabRuns` where a real measurer is in scope.
 *
 * The state and class copies (`state-render-colors.ts`,
 * `class-visibility-icon.ts`) are deliberately LEFT ALONE — D2 again.
 */


/**
 * `FontStyle bold` -> SVG's numeric `font-weight="700"` (this project's own
 * emission convention -- confirmed for the sequence engine's own group/
 * groupHeader text against the cached oracle `test-results/dot-cache/
 * sequence/bepipo-37-fego336/in.svg`, whose tab title AND `[comment]` both
 * carry `font-weight="700"`, never the CSS keyword `"bold"`; see
 * `core/svg.ts`'s `TextStyle.fontWeight` doc comment for the class-engine
 * precedent this generalizes to sequence).
 *
 * `GROUP_FONT_BOLD`/`HEADER_FONT_BOLD` are always `true` under this engine's
 * current style surface (no cascade can flip a sequence `FontStyle` yet --
 * decisions.md D3), so the `false` arm is unreachable today; kept, not
 * inlined, so a future cascade only has to flip the constant.
 */
function boldFontWeight(bold: boolean): 'normal' | '700' {
  // GROUP_FONT_BOLD/HEADER_FONT_BOLD are always true today, see doc above.
  return bold ? '700' : /* v8 ignore next */ 'normal';
}

/**
 * `ComponentRoseGroupingHeader#getCorner` (`:161-186`) -- the type tab's
 * clipped top-right corner, as a `<path>` `d` string. `origin` is the
 * frame's own drawn top-left (`frame.x`/`frame.y`); upstream draws this in
 * the component's LOCAL coordinate system and this port bakes the offset
 * into the `d` string directly, matching the jar's own absolute-coordinate
 * `d` output (no `transform`).
 *
 * Exported for direct coverage of the `roundCorner > 0` branch: no corpus
 * fixture reaches it (see {@link ROUND_CORNER}'s doc comment), so a caller
 * with `origin = {x: 0, y: 0}` is the only way to exercise it against the
 * literal upstream shape.
 */
export function frameHeaderCornerPath(
  origin: { readonly x: number; readonly y: number },
  size: { readonly width: number; readonly height: number },
  cornerSize: number,
  roundCorner: number,
): string {
  const { x, y } = origin;
  const { width: w, height: h } = size;
  if (roundCorner === 0) {
    return [
      moveTo(x, y),
      lineTo(x + w, y),
      lineTo(x + w, y + h - cornerSize),
      lineTo(x + w - cornerSize, y + h),
      lineTo(x, y + h),
      lineTo(x, y),
    ].join(' ');
  }
  const half = roundCorner / 2;
  return [
    moveTo(x + half, y),
    lineTo(x + w, y),
    lineTo(x + w, y + h - cornerSize),
    lineTo(x + w - cornerSize, y + h),
    lineTo(x, y + h),
    lineTo(x, y + half),
    arcTo(x + half, y, half, 0, 1),
  ].join(' ');
}

/**
 * `ComponentRoseGroupingHeader#drawBackgroundInternalU` (`:126-133`) --
 * the background pass, reached only via `Context2D#isBackground()`
 * (`AbstractComponent.java:144-145`). Under teoz `background` is always
 * `HColors.transparent()` (`:80`), so this is `fill="none"` with a stroked
 * outline -- `symbolContext` is `style.getSymbolContext()`, i.e. the
 * "group" style block (`plantuml.skin:116-121`), not `styleHeader`.
 * `rect.setDeltaShadow(...)` (`:131`) is deliberately NOT ported -- see
 * decisions.md and `DIVERGENCES.md` (T8).
 *
 * A `ref` frame draws NOTHING here. Upstream builds it as a `ReferenceTile`
 * (`TileBuilder.java:174-176`), not a `GroupingTile`, and its component
 * `ComponentRoseReference` declares only `drawInternalU`
 * (`ComponentRoseReference.java:83`), so `AbstractComponent#drawU:143-147`
 * dispatches the EMPTY inherited `drawBackgroundInternalU` (`:139-140`) for
 * it. See {@link renderGroupingHeaderForeground} for why the two components
 * share this module today.
 */
export function renderGroupingHeaderBackground(frame: FrameGeo, theme: ScaledTheme): string {
  if (frame.frameType === 'ref') return '';
  const k = theme.scaleK;
  return rect(frame.x, frame.y, frame.width, frame.height, {
    fill: 'none',
    stroke: GROUP_LINE_COLOR,
    strokeWidth: GROUP_LINE_THICKNESS * k,
    rx: ROUND_CORNER * k,
    ry: ROUND_CORNER * k,
  });
}

/** The corner-tab `<path>`, filled with the groupHeader background and
 *  stroked with `styleHeader`'s own symbol context -- the first element
 *  `drawInternalU` emits (`:142`). Split out of
 *  {@link renderGroupingHeaderForeground} to stay under the function-length
 *  budget. */
function renderHeaderCorner(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const cornerD = frameHeaderCornerPath(
    { x: frame.x, y: frame.y },
    { width: frame.tabWidth, height: frame.tabHeight },
    CORNER_SIZE * k,
    ROUND_CORNER * k,
  );
  return path(cornerD, {
    fill: HEADER_BACKGROUND_HEX,
    stroke: HEADER_LINE_COLOR,
    strokeWidth: HEADER_LINE_THICKNESS * k,
  });
}

/** The tab title and its optional `[comment]`, at `getOldPaddingX1()`/
 *  `getOldPaddingY()` (`:151`, `:153-158`) -- the comment uses `style`'s OWN
 *  `smallFont2` (`GROUP_FONT_SIZE` 11), not `styleHeader`'s 13, and is
 *  wrapped in literal brackets by upstream itself
 *  (`ComponentRoseGroupingHeader.java:89`: `"[" + strings.get(1) + "]"`). */
function renderHeaderText(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  // Position, width and baseline all come off the run (D1). What stays here is
  // the run's STYLE — its font size and weight are skin values, not
  // measurements, and the two runs use different ones: index 0 is the title at
  // `HEADER_FONT_SIZE`, index 1 the `[comment]` at the group style's own
  // `smallFont2`.
  const styleOf = (i: number): { size: number; bold: boolean } =>
    i === 0
      ? { size: HEADER_FONT_SIZE * k, bold: HEADER_FONT_BOLD }
      : { size: GROUP_FONT_SIZE * k, bold: GROUP_FONT_BOLD };
  return frame.tabRuns
    .map((run, i) => {
      const style = styleOf(i);
      return sequenceText({
        leftX: run.x,
        baselineY: run.y,
        text: run.text,
        width: run.textWidth,
        fontFamily: theme.fontFamily,
        fontSize: style.size,
        fontWeight: boldFontWeight(style.bold),
        fill: HEADER_FONT_COLOR,
      });
    })
    .join('');
}

/**
 * `ComponentRoseGroupingHeader#drawInternalU` (`:135-159`) -- the
 * foreground pass, in upstream's exact order: corner path, then the SAME
 * full-area rect the background pass drew (`:144-147`, using `symbolContext`
 * = `style`'s own group symbol context, not `styleHeader`'s), then the tab
 * text and its optional comment.
 *
 * A `ref` frame is a DIFFERENT component -- `ComponentRoseReference`
 * (`ReferenceTile.java:117-124`) -- whose `drawInternalU` (`:83-136`) emits
 * the body rect FIRST (`:99`) and the corner path SECOND (`:118`), the
 * reverse of this one, and no `[comment]` at all (its display is split into
 * a header at index 0 and body lines from index 1, `:67-78`). Only that
 * ordering differs at this level, so the two share a module rather than
 * duplicating the corner and rect; a faithful `ComponentRoseReference` port
 * with its own `xMargin`/`heightFooter` geometry is filed for T8.
 */
export function renderGroupingHeaderForeground(frame: FrameGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const cornerEl = renderHeaderCorner(frame, theme);
  const bodyRectEl = rect(frame.x, frame.y, frame.width, frame.height, {
    fill: 'none',
    stroke: GROUP_LINE_COLOR,
    strokeWidth: GROUP_LINE_THICKNESS * k,
    rx: ROUND_CORNER * k,
    ry: ROUND_CORNER * k,
  });
  // The page clip took the tab: its `UPath` failed `DriverPathSvg`'s
  // min/max-corner test and its label `UText` failed `DriverTextSvg`'s
  // anchor test, so the body outline is all that is left of the header.
  // See `FrameGeo.headerClipped`.
  if (frame.headerClipped === true) return bodyRectEl;
  const textEl = renderHeaderText(frame, theme);
  if (frame.frameType === 'ref') return bodyRectEl + cornerEl + textEl;
  return cornerEl + bodyRectEl + textEl;
}
