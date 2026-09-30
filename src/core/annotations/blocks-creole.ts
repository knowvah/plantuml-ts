/**
 * blocks-creole.ts — cdd-T28: the creole half of `Style
 * #createTextBlockBordered` (`style/Style.java:353-369`), split out of
 * `blocks.ts` (which stays the BORDER/margin half, `TextBlockBordered`
 * + `TextBlockMarged`) to keep both files under the 500-line cap.
 *
 * Upstream runs FULL creole on every chrome line. `Style
 * #createTextBlockBordered` (java:353-369) is reached by every one of the
 * five elements:
 *   - legend  — `activitydiagram3/ftile/EntityImageLegend.java:47-55`
 *     (`style.createTextBlockBordered(note, …, Style.ID_LEGEND,
 *     style.wrapWidth())`)
 *   - title   — `core/DiagramChromeFactory.java:342-356`
 *   - caption — `core/DiagramChromeFactory.java:362-376`
 *   - header/footer — `core/DiagramChromeFactory.java:382-413` via
 *     `abel/DisplayPositioned.java:118-128#createRibbon`, which delegates
 *     to the SAME `createTextBlockBordered` whenever a `Style` is supplied
 *     (always, from `DiagramChromeFactory`).
 * and its very first act is
 * `note.create0(fc, alignment, spriteContainer, lineBreak, CreoleMode.FULL,
 * null, null)` (java:358-359) — i.e. the chrome text block IS a klimt
 * creole `SheetBlock2`, with the table/tree/`----` rule/bold/`<b>`/`<i>`
 * stripe machinery every OTHER creole surface gets.
 *
 * This port drew chrome from raw strings through a local
 * `parseCreole`/`measureLines`/`drawLines` trio until this task: no table,
 * no tree, no horizontal rule, no per-stripe alignment. The fix is to call
 * the SAME pipeline — `Display#create0` -> `DisplayCreole#getCreole` ->
 * `ISkinSimple#sheet` -> `CreoleParser` -> `Sea`/`SheetBlock1`/
 * `SheetBlock2` — that `core/svek/image/EntityImageDescriptionDelegates
 * .ts#buildDesc` already drives for the description engine, and to emit
 * its `drawU` through `core/klimt/document-shell.ts
 * #renderDrawableToFragment` (ADR-2's sanctioned klimt fragment seam).
 * Nothing here re-implements creole: every primitive is imported.
 *
 * ## Why a local `AtomOps`/`ISkinSimple` rather than an imported one
 *
 * `descAtomOps`/`buildLocalSkinSimple` (`EntityImageDescriptionDelegates
 * .ts`) and `titleAtomOps`/`buildTitleSkinParam` (`leaf-sizing-folder-
 * title.ts`) are both module-private; this is the codebase's established
 * shape — one capability bundle per call path, scoped to exactly the atom
 * kinds that path can reach (`creole-sea-line.ts#seaOpsFor` is a third).
 * Chrome's own bundle is the narrowest of the three: it has no
 * `SpriteRegistry` and no emoji-artwork channel at the seam
 * (`buildAnnotationBlock`'s four-parameter contract), so a `<$sprite>`/
 * `<:emoji:>`/`<img:>` atom in chrome text measures and draws as nothing —
 * recorded in `.agent-notes/cdd-T28.md` and the decision journal as a named
 * remainder, exactly like `.agent-notes/C1-sequence-creole-seam.md`'s
 * identical sequence-side gap, NOT silently "handled".
 *
 * @see ~/git/plantuml/.../style/Style.java:353-369 (createTextBlockBordered)
 * @see ~/git/plantuml/.../klimt/creole/Display.java:637-669 (create0)
 * @see ~/git/plantuml/.../activitydiagram3/ftile/EntityImageLegend.java:47-55
 * @see ~/git/plantuml/.../core/DiagramChromeFactory.java:340-413
 */

import type { AnnotationBoxStyle } from './style.js';
import type { StringMeasurer } from '../measurer.js';
import { MeasurerStringBounder } from '../measurer-bounder.js';
import { Display } from '../klimt/creole/Display.js';
import { create0 } from '../klimt/creole/DisplayCreole.js';
import { SheetBlock2 } from '../klimt/creole/SheetBlock2.js';
import { CreoleMode } from '../klimt/creole/CreoleMode.js';
import { CreoleParser } from '../klimt/creole/legacy/CreoleParser.js';
import { MONOSPACED } from '../klimt/creole/Parser.js';
import { LineBreakStrategy } from '../klimt/LineBreakStrategy.js';
import { ClockwiseTopRightBottomLeft } from '../klimt/geom/ClockwiseTopRightBottomLeft.js';
import { Pragma } from '../skin/Pragma.js';
import { GUILLEMET_DEFAULT } from '../text/Guillemet.js';
import { Fore } from '../klimt/Fore.js';
import type { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { emojiStartingAltitude } from '../klimt/creole/atom/AtomEmoji.js';
import { makeAtomImageResolverFor } from '../creole-atoms-image-resolver.js';
import type { SpriteRegistry } from '../sprite-commands.js';
import { FontStyle, type FontConfiguration } from '../klimt/shape/UText.js';
import { atomTextStartingAltitude } from '../klimt/creole/legacy/AtomText.js';
import { renderDrawableToFragment } from '../klimt/document-shell.js';
import type { AtomOps } from '../klimt/creole/Sea.js';
import type { CreoleAtom } from '../klimt/creole/atom/Atom.js';
import type { Atom } from '../klimt/creole/SheetBlock1.js';
import { asAtomOpenIconic } from '../klimt/creole/atom/AtomOpenIconic.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import type { UDrawable } from '../klimt/shape/UDrawable.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { ISkinSimple } from '../style/ISkinSimple.js';
import type { NestedDiagramRenderer } from '../EmbeddedDiagram.js';
import { getNestedDiagramRenderer } from '../nested-diagram-registry.js';
import { isCreoleAtomData, atomDim, drawAtom, fontOfAtom } from './blocks-creole-atoms.js';

/** What {@link buildChromeTextBlock} hands back to `blocks.ts`: the
 *  creole block's own `calculateDimension` (`TextBlockBordered
 *  #getPureTextWidth`/`getTextHeight`'s input, java:80-91) plus its
 *  already-serialized markup, origin at (0,0). `extraDefs` carries the
 *  `<defs>` payload klimt lifts out of the document (gradients/filters) —
 *  `blocks.ts`/`chrome.ts` thread it to `RenderFragment.extraDefs`. */
/** {@link buildChromeTextBlock}'s non-text inputs, bundled so the function
 *  stays inside this project's parameter budget. `color` is
 *  `TextBlockBordered#drawU`'s own `color` local (java:126-134): the border
 *  colour, or the resolved background when the border is zero-thickness,
 *  or `'none'` when neither resolves -- `blocks.ts` owns that resolution
 *  (it already computes both halves for the rect) and hands the answer in.
 *  `uid` seeds the fragment's own id namespace (`document-shell.ts
 *  #RenderDrawableToFragmentOptions`) -- one per chrome element kind, so a
 *  legend filter and a footer filter never collide. */
export interface ChromeTextPaint {
  readonly uid: string;
  readonly color: string;
  /** The diagram's own `sprite` registry (`ast.sprites`), so a
   *  `<$name>`/`<img:…>` in chrome text resolves exactly as it does in a
   *  member row or an entity label. `undefined` for a diagram that
   *  declared no sprites -- upstream's own empty-registry answer. */
  readonly sprites?: SpriteRegistry | undefined;
  /** D3 (cdd6 T1b): style-cascade-resolved `PName.HyperLinkColor`
   *  (`FontConfiguration.java:213-219`, `Style.java:265` -- see `UText.ts`'s
   *  `FontConfiguration.hyperlinkColor`). `undefined`/`null` falls back to
   *  `CommandCreoleUrl.ts`'s `#0000FF`. UNPOPULATED by either real
   *  constructor (`blocks.ts#buildAnnotationBlock`,
   *  `chrome.ts#buildMainframeTitleBlock` -- both outside this task's
   *  write-set, and `AnnotationBoxStyle` has no such field) -- open residual,
   *  reported in the mission report, not silently dropped. */
  readonly hyperlinkColor?: string | null;
}

export interface ChromeTextBlock {
  readonly body: string;
  readonly extraDefs?: string;
  readonly width: number;
  readonly height: number;
}

/** `Style#getFontConfiguration` (java:356) reduced to this port's
 *  `FontConfiguration` (`klimt/shape/UText.ts`'s own documented
 *  `{family,size,color,styles}` scope): the box style's resolved font IS
 *  the creole base configuration every stripe inherits, so a `title`
 *  (whose skin default is bold, `annotation-defaults.ts`) starts bold and
 *  `**x**` only ever ADDS emphasis on top — the same union `blocks.ts`'s
 *  pre-T28 `spanIsBold` documented from `linazi-45-gevo553`. */
export function chromeFontConfiguration(style: AnnotationBoxStyle, hyperlinkColor?: string | null): FontConfiguration {
  const styles = new Set<FontStyle>();
  if (style.fontStyle === 'bold') styles.add(FontStyle.BOLD);
  if (style.fontStyle === 'italic') styles.add(FontStyle.ITALIC);
  const base = { family: style.fontFamily, size: style.fontSize, color: style.fontColor, styles };
  // D3 (cdd6 T1b): see `ChromeTextPaint.hyperlinkColor`'s own doc comment.
  return hyperlinkColor == null ? base : { ...base, hyperlinkColor };
}

/** Chrome's own `AtomOps` (local: see this module's doc comment). A text
 * atom's `getStartingAltitude` is `AtomText#getStartingAltitude` (java:321-323,
 * `atomTextStartingAltitude`), an emoji's `AtomEmoji`'s `-3 * factor`
 * (`AtomEmoji.java:62-64`), everything else 0 (upstream `AtomImg`/`AtomSprite`/
 * `AtomMath` all `return 0`); a composite `Atom` — and a `<&glyph>` token, as
 * `AtomOpenIconic` — answers all three. */
export function chromeAtomOps(sprites: SpriteRegistry | undefined, baseFont: FontConfiguration): AtomOps {
  const resolverFor = makeAtomImageResolverFor(sprites);
  const polymorphic = (a: CreoleAtom): CreoleAtom | Atom => asAtomOpenIconic(a, baseFont) ?? a;
  return {
    calculateDimension(creoleAtom: CreoleAtom, stringBounder: StringBounder): XDimension2D {
      const atom = polymorphic(creoleAtom);
      if (!isCreoleAtomData(atom)) return atom.calculateDimension(stringBounder);
      return atomDim(atom, stringBounder, resolverFor(fontOfAtom(atom, baseFont)));
    },
    getStartingAltitude(creoleAtom: CreoleAtom, stringBounder: StringBounder): number {
      const atom = polymorphic(creoleAtom);
      if (!isCreoleAtomData(atom)) return atom.getStartingAltitude(stringBounder);
      if (atom.kind === 'emoji') return emojiStartingAltitude(atom.factor);
      return atom.kind === 'text' ? atomTextStartingAltitude(atom.font) : 0;
    },
    drawU(creoleAtom: CreoleAtom, ug: UGraphic): void {
      const atom = polymorphic(creoleAtom);
      if (!isCreoleAtomData(atom)) {
        atom.drawU(ug);
        return;
      }
      drawAtom(atom, ug, resolverFor(fontOfAtom(atom, baseFont)));
    },
  };
}

/** Upstream `SkinParam`'s own defaults for every member `CreoleParser`
 *  reads — the SAME traced set `EntityImageDescriptionDelegates.ts
 *  #buildLocalSkinSimple` documents member by member (`SkinParam.java`:
 *  empty md5 map, identity size hack, unset `padding` -> `same(0)`,
 *  `:1068` monospaced family, `:1074` tab size 8, `:641` dpi 96).
 *  `sheet` self-references `skin` so a `StripeTable`/`StripeTree`
 *  constructed deeper in the dispatch sees the same object back. */
function chromeSkinSimple(
  atomOps: AtomOps,
  sprites: SpriteRegistry | undefined,
  hyperlinkColor?: string | null,
): ISkinSimple {
  const pragma = Pragma.createEmpty();
  const renderer = blockedEmbeddedRenderer();
  const skin: ISkinSimple = {
    // `SkinParam#getSprite` (java:801-807) -- the per-diagram registry the
    // source's own `sprite` commands built, reached here through
    // `ast.sprites` (cdd-T28 row 103). `null` only when the diagram
    // declared none, which is upstream's own empty-registry answer.
    getSprite: (name: string) => sprites?.byName.get(name) ?? null,
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: () => null,
    transformStringForSizeHack: (s: string) => s,
    getValue: () => null,
    values: () => new Map<string, string>(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => MONOSPACED,
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => pragma,
    // D3 (cdd6 T1b): see `ISkinSimple.ts`'s own doc comment for why this is
    // neither named `getHyperlinkColor` nor required.
    getStyleHyperlinkColor: () => hyperlinkColor ?? null,
    sheet: (fontConfiguration, horizontalAlignment, creoleMode, stereo?: FontConfiguration) =>
      new CreoleParser(
        fontConfiguration,
        horizontalAlignment,
        skin,
        { creoleMode, stereotype: stereo ?? fontConfiguration },
        { atomOps, renderer },
      ),
  };
  return skin;
}

/** `{{ … }}` inside chrome text: `EmbeddedDiagram.ts#NestedDiagramRenderer`
 *  is the seam. CDD B7FU-R2: wired to the CORE-owned registration slot
 *  (`core/nested-diagram-registry.ts` — this file must never import `src/
 *  diagrams/class/*`, `tests/architecture/layering.test.ts` Rule 1) that
 *  `src/index.ts#prepareBlock` populates, indirectly, via `class-nested-
 *  diagram-renderer.ts#registerNestedDiagramRenderers` (that function's own
 *  doc comment explains why chrome shares the class-body slot's render/
 *  strip-PI/measure/depth-guard logic instead of a second copy). `undefined`
 *  only when nothing has registered (a unit test importing this module
 *  directly) — mirrors `EntityImageDescriptionDelegates.ts
 *  #blockedEmbeddedRenderer`'s degrade-to-throw, which `EmbeddedDiagram
 *  .ts`'s own catch turns into the `(42, 42)` fallback (java:148-152). */
function blockedEmbeddedRenderer(): NestedDiagramRenderer {
  const registered = getNestedDiagramRenderer();
  if (registered !== undefined) return registered;
  return {
    render(): TextBlock {
      throw new Error(
        'blocks-creole: embedded diagrams ({{ ... }}) inside chrome text (title/legend/header/' +
          'footer/caption) are not supported -- this port supplies no nested-diagram renderer at the ' +
          'chrome seam (EmbeddedDiagram.ts#NestedDiagramRenderer).',
      );
    },
  };
}

/**
 * The klimt `TextBlock` for one chrome element's display lines —
 * `Style#createTextBlockBordered`'s own first statement (java:358-359),
 * `CreoleMode.FULL` and the style's own horizontal alignment verbatim.
 * `Display.create(lines)` (NOT `getWithNewlines`): chrome display lines
 * arrive already split one-per-source-line from `commands.ts`, the same
 * reason `buildDesc` documents for its own `Display.create`.
 *
 * `lineBreak` is the caller's own `LineBreakStrategy` (see
 * {@link buildChromeTextBlock}): `NONE` for title/caption (java:349-350,
 * 369-370) and header/footer (java:123-124); `EntityImageLegend` passes
 * `style.wrapWidth()` (java:54, `PName.MaximumWidth`) -- only `<style>
 * legend { MaximumWidth N } }` sets it (cdd5-T4e).
 */
export function buildChromeCreoleBlock(
  lines: readonly string[],
  style: AnnotationBoxStyle,
  lineBreak: LineBreakStrategy,
  sprites?: SpriteRegistry,
  hyperlinkColor?: string | null,
): TextBlock {
  const fontConfiguration = chromeFontConfiguration(style, hyperlinkColor);
  const atomOps = chromeAtomOps(sprites, fontConfiguration);
  const skinParam = chromeSkinSimple(atomOps, sprites, hyperlinkColor);
  return create0(
    Display.create([...lines]),
    { fontConfiguration, spriteContainer: skinParam, atomOps },
    {
      horizontalAlignment: style.horizontalAlignment,
      maxMessageSize: lineBreak,
      creoleMode: CreoleMode.FULL,
    },
  );
}

/**
 * Measures and draws one chrome element's text through the shared creole
 * pipeline. `width`/`height` are the block's OWN `calculateDimension`
 * (what `TextBlockBordered#getPureTextWidth`/`getTextHeight` add padding
 * to, java:80-91); `body` is the drawn markup with its origin at (0,0),
 * which `blocks.ts` then shifts by padding and margin — upstream's
 * `toDraw.drawU(ugOriginal.apply(color).apply(new UTranslate(left, top)))`
 * (`TextBlockBordered.java:141`).
 *
 * `uid` seeds the fragment's own id namespace (`document-shell.ts
 * #RenderDrawableToFragmentOptions`) — one per chrome element kind, so a
 * legend filter and a footer filter never collide.
 */
export function buildChromeTextBlock(
  paint: ChromeTextPaint,
  lines: readonly string[],
  style: AnnotationBoxStyle,
  measurer: StringMeasurer,
): ChromeTextBlock {
  // cdd5-T4e: only `legend` reads wrapWidth() upstream; `paint.uid` IS the
  // element name at every call site (`blocks.ts`'s `uid: kind`, etc.).
  const lineBreak =
    paint.uid === 'legend' && style.maximumWidth !== undefined
      ? new LineBreakStrategy(String(style.maximumWidth))
      : LineBreakStrategy.NONE;
  const block = buildChromeCreoleBlock(lines, style, lineBreak, paint.sprites, paint.hyperlinkColor);
  const dim = block.calculateDimension(new MeasurerStringBounder(measurer));
  const width = dim.getWidth();
  const height = dim.getHeight();
  // `TextBlockBordered#drawU` (java:138-141): the block is re-stencilled to
  // the PADDED clearance before being drawn, so a stripe that paints to its
  // own clearance edge (a `----` horizontal rule, a table's outer rules)
  // spans the padding too instead of stopping at the text width. Measured
  // on the UN-enlarged block, exactly as upstream measures `textBlock`
  // itself (java:80-91) -- `enlargeMe` returns a new `SheetBlock2` wrapping
  // the SAME `SheetBlock1`, so the dimension is unchanged either way.
  const toDraw = block instanceof SheetBlock2 ? block.enlargeMe(style.padding.left, style.padding.right) : block;
  // `ugOriginal.apply(color)` (java:141): the block is drawn under the
  // BORDER colour, which is what a stripe with no colour of its own paints
  // with -- a `----` horizontal rule (`CreoleHorizontalLine`) and a table's
  // own rules. Text is unaffected: every atom carries its own
  // `FontConfiguration.color`, exactly as upstream's `DriverTextSvg` reads
  // it off the `UText` rather than off the graphic's foreground.
  const drawable: UDrawable = { drawU: (ug: UGraphic) => toDraw.drawU(ug.apply(new Fore(paint.color))) };
  const fragment = renderDrawableToFragment(drawable, { width, height, measurer, uid: paint.uid });
  return fragment.extraDefs === undefined
    ? { body: fragment.body, width, height }
    : { body: fragment.body, extraDefs: fragment.extraDefs, width, height };
}
