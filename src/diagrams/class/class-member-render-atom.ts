/**
 * class-member-render-atom.ts — `MemberRenderAtom`/`MemberRowBuild`, the
 * render-ready shapes `class-member-creole.ts#resolveMemberAtoms` produces.
 * Split out purely to keep that file under this project's 500-line cap
 * (T26); re-exported there so no import site changes. Pure move, no
 * behavior of its own.
 */
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import type { CreoleAtomUrl } from '../../core/klimt/creole/atom/Atom.js';
import type { DrawablePrimitive } from '../../core/creole-atoms.js';

/**
 * One RESOLVED, render-ready run of a member row -- unlike `CreoleAtom`
 * (whose `'inline'` variant carries an unresolved `InlineAtomToken`), a
 * `'sprite'`/`'img'` atom is already resolved to its drawable `<image>`
 * geometry here, at LAYOUT time (`buildMemberRow`, which already has the
 * `SpriteRegistry` in scope) -- so `renderer-classifier-box.ts` never needs
 * its own sprite-registry parameter, mirroring how `row.width`/`textLength`
 * are already pre-measured at layout time rather than recomputed at render
 * time. A `'latex'` `CreoleAtom` (`<math>`/`<latex>`) resolves to that SAME
 * `'image'` kind, via {@link resolveLatexAtom} -- `AtomMath` measures and
 * draws one image at altitude 0, exactly as `AtomImg` does
 * (`AtomMath.java:64-97`), so it needs no variant of its own. It used to be
 * DROPPED here; once `CommandCreoleBuilder.java:111`'s `CommandCreoleMath`
 * was registered that stopped meaning "renders as its own literal markup"
 * and started meaning "vanishes from the page", which is the strictly worse
 * of the two. An unresolved sprite name IS still dropped, matching
 * `StripeSimple.addSprite`'s "unknown sprite contributes nothing" rule
 * (java :228-236).
 */
export type MemberRenderAtom =
  | {
      readonly kind: 'text';
      readonly text: string;
      readonly font: FontConfiguration;
      /** LAYOUT width -- feeds x-advance and every line/box width sum.
       *  Upstream: `AtomText#calculateDimensionSlow`/`drawU`'s tab-
       *  tokenizer loop, which measures the RAW (unsubstituted) run --
       *  G2 N57 item 38's own finding: for a run that is ENTIRELY
       *  whitespace this is deliberately 0 (`SANS_SERIF_BLOCKS[0][32]`,
       *  byte-exact match of the jar's own width table, full 255-block
       *  comparison, NOT a data gap). Never derived from `renderWidth`. */
      readonly width: number;
      /** G2 N57 item 38: set ONLY when `text` matches `^\s*$` (entirely
       *  whitespace) -- the RENDER-time substitution `DriverTextSvg.java`
       *  applies (`text.matches("^\\s*$") -> text.replace(' ', (char)
       *  160)`, regular space -> NBSP U+00A0) before drawing AND before
       *  re-measuring for the `textLength` attribute. `undefined` for
       *  every other atom (the common case) -- renderers fall back to
       *  `text`/`width` unchanged, matching every other optional-field
       *  "always set by production, absent elsewhere" precedent in this
       *  file (`url` above). Jar-verified against `vicuro-37-tese143`'s
       *  real golden SVG (`textLength="3.575"` for a bare 13pt space). */
      readonly renderText?: string;
      /** The re-measured width of {@link renderText} -- upstream's
       *  `DriverTextSvg.draw` calls `stringBounder.calculateDimension`
       *  a SECOND time on the substituted string, a DIFFERENT value from
       *  `width` (which stays the RAW/layout width, see above). Always
       *  set together with `renderText` (never independently). */
      readonly renderWidth?: number;
      /** G2 N40: set when this run came from a `[[url]]` creole command's
       *  captured label (`core/klimt/creole/atom/Atom.ts#CreoleAtomUrl`) --
       *  `renderer-classifier-box.ts#renderRowAtoms` wraps the emitted
       *  `<text>` in `<a href>` when present. */
      readonly url?: CreoleAtomUrl;
      /** SI30 D2/D3: baseline correction from the row's per-line `Sea`
       *  placement (`core/svek/image/creole-sea-line.ts`'s doc comment has
       *  the full derivation) — 0 for every atom on an all-NORMAL line
       *  (identity property), non-zero only when a `<sup>`/`<sub>` run
       *  shares the line (`FontPosition.getSpace()`, `AtomText.java:
       *  321-323`). Renderers draw at `lineTop + lineHeight -
       *  atom.font.size / 4.5 + dy` — the UNMUTED descent term stays
       *  unchanged (`AtomText.java:213-215`'s own commented-out altitude
       *  line; the real altitude reaches the page through `dy` alone, per
       *  `decisions.md#D2`'s "must not be applied twice" rule). `undefined`
       *  only for a `'text'` atom built directly by a resolver that never
       *  routes through {@link resolveMemberAtoms}'s own Sea pass (today:
       *  {@link resolveEmojiAtom} in `class-member-atom-resolve.ts`, whose
       *  underlying raw atom is `'emoji'`-kind and therefore always gets
       *  `dy = 0` from `Sea` anyway — renderers read `atom.dy ?? 0`). */
      readonly dy?: number;
    }
  | { readonly kind: 'image'; readonly href: string; readonly width: number; readonly height: number }
  /** C-4 (cdd3-T23): an SVG-backed `<$sprite>` atom -- `SvgNanoParser`'s
   *  draw-time `UPath`/`UEllipse`/`UText` decomposition
   *  (`core/creole-atoms-image-resolver.ts#resolveSvgSpriteAtom`, the SAME
   *  function the description/usecase engines call), already resolved at
   *  LAYOUT time exactly like `'image'` above -- `width`/`height` are the
   *  SAME declared (scaled) box; ink lives only in `primitives`, drawn by
   *  `renderer-classifier-rows.ts` at the row's own origin
   *  (`class-member-sprite-render.ts#renderMemberRowDrawable`). Unlike
   *  `'image'`, this kind is NOT excluded from the row's own `Sea` span
   *  (`class-member-creole.ts#resolveMemberAtoms`'s `seaEntries` filter
   *  only names `'image'`) -- bidusa-22-jutu505 jar-verified: the icon
   *  (21.538px) is taller than the row's text (14px), so the row's shared
   *  text atom needs a real `dy` correction to sit at the icon's own `Sea`
   *  bottom, which only happens when this kind's height feeds `maxSpan`.
   *  `dy` mirrors `'vector'`'s own field -- this atom's `Sea` top, set by
   *  `resolveMemberAtoms` via the SAME `atomTopDy`; `undefined` only for a
   *  `'drawable'` atom built OUTSIDE that function (namespace-title runs,
   *  a note line), which keep the flat bottom-anchor `'image'` uses. */
  | {
      readonly kind: 'drawable';
      readonly primitives: readonly DrawablePrimitive[];
      readonly width: number;
      readonly height: number;
      readonly dy?: number;
      /** cdd4-T9 (lecelo-92-loma110): `Atom#getStartingAltitude` for a
       *  `'drawable'` built from Twemoji artwork (`resolveEmojiAtom`) --
       *  `-3*factor` (`AtomEmoji.java:62-64`, `emojiStartingAltitude`).
       *  `undefined`/absent for an SVG-sprite `'drawable'`
       *  (`resolveSvgSpriteAtom`), which upstream's `AtomSprite` reports as
       *  altitude 0 (`memberAtomAltitude`'s own `?? 0` fallback) -- the two
       *  producers of this kind share the shape but not the altitude, so
       *  this field distinguishes them without a second `MemberRenderAtom`
       *  variant. */
      readonly altitude?: number;
    }
  /** G2 N41: an OpenIconic `<&glyph>` atom -- `name`/`factor` feed
   *  `openiconic-glyphs.ts#buildOpenIconicPathD` at RENDER time (needs the
   *  row's own x/y, not known yet at this LAYOUT-time build step -- mirrors
   *  `'image'`'s own "resolve dims here, resolve pixel position later"
   *  split). `fill` is the resolved color (forced `color=`/`#RRGGBB`
   *  override, else the ambient font color, else `#000000`). */
  /** B22/M21: a creole bullet-list marker (`* item`) — upstream's
   *  `klimt/creole/atom/Bullet.java:58-69` draws a real SHAPE, not text:
   *  `order 0` translates `dx(3)` and draws `UEllipse.build(5, 5)`;
   *  `order >= 1` translates `dx(1 + 8*order)` and draws
   *  `URectangle.build(3.5, 3.5)`. Both are stroked with
   *  `UStroke.withThickness(0)` and filled with the font colour, which is
   *  why the emitted shape carries a `fill` and NO stroke — visibly
   *  different from the `VisibilityModifier` glyph (`rx=3` WITH
   *  `stroke-width:1`) that an object member row's `*` draws instead.
   *  `width` is the cell width the layout already reserved, unchanged. */
  | {
      readonly kind: 'bullet';
      readonly order: number;
      readonly fill: string;
      readonly width: number;
      /** C-1: a wrapped bullet line's CONTINUATION row (`Fission.java:87`
       *  — `new StripeSimpleInternal(true, stringBounder, blank(stripe.
       *  getLHeader()))`). `blank()` (java:226-245) returns an atom with
       *  the SAME `calculateDimensionSlow` as the real header (so `width`
       *  above, the reserved cell, is UNCHANGED) but an empty `drawU` — only
       *  row 0 of a wrapped bullet carries the real glyph; every
       *  continuation row's atom sets this `true` so the renderer reserves
       *  the width without drawing the ellipse/rect. `undefined` (falsy)
       *  for every non-wrapped or first-row bullet, matching this file's
       *  "always set by production, absent/false elsewhere" convention. */
      readonly blank?: boolean;
    }
  | {
      readonly kind: 'vector';
      readonly name: string;
      readonly factor: number;
      readonly fill: string;
      readonly width: number;
      readonly height: number;
      /** cdd3-T22: the glyph box's own `Sea` top (`Sea.java:72-89`, with
       *  `AtomOpenIconic#getStartingAltitude` = `-3*factor`,
       *  `AtomOpenIconic.java:72-74`) relative to the row's text baseline --
       *  `class-member-creole-sea.ts#atomTopDy`. Member-row renderers draw
       *  the glyph at `rowBaseline + dy`. Set by every
       *  `resolveMemberAtoms` call; the note renderer does not read it. */
      readonly dy?: number;
    }
  /** C-2: a `#`-prefixed creole numbered-list header (`klimt/creole/legacy/
   *  AtomTextUtils.java:145-159`'s `createListNumber`/`ListNumberAtom` —
   *  `StripeStyle#getHeader`'s `LIST_WITH_NUMBER` branch, `Bullet`'s ordered
   *  sibling). `text` is `"N."` (1-based `CreoleContext#getLocalNumber
   *  (order)` + 1, `StripeStyle.java:59-63`'s own evaluation-before-build
   *  order). `dx` is the per-depth indent the glyph draws AFTER — the width
   *  of `"9. "` × `order` (java:146-151, `marginLeft`), 0 at order 0.
   *  `textWidth` is `text`'s own measured width — the DRAWN `textLength`.
   *  `width` is the FULL reserved cell every row/x-advance uses: `dx +
   *  textWidth + marginRight` (marginRight = width of `"."`, java:152-157) —
   *  mirrors `'bullet'`'s own "layout `width` unchanged, only the glyph was
   *  missing" shape. `blank` mirrors `'bullet'`'s own field above (same
   *  `Fission.java:87` continuation-row rule — both a bullet and a numbered
   *  list are `Stripe`s with an `LHeader`, so `Fission#getSplitted` treats
   *  them identically). */
  | {
      readonly kind: 'listNumber';
      readonly text: string;
      readonly font: FontConfiguration;
      readonly dx: number;
      readonly textWidth: number;
      readonly width: number;
      readonly blank?: boolean;
    };

/** One member row's fully built+measured creole content. */
export interface MemberRowBuild {
  readonly atoms: readonly MemberRenderAtom[];
  /** Sum of every atom's own measured width -- UNROUNDED (ADR-1: `core/
   *  svg.ts` formats every numeric attribute at emission now, so nothing
   *  upstream of that boundary pre-rounds; `sectionWidth`'s max-width scan
   *  and `buildSectionRows`'s stored `row.width` both consume this raw). */
  readonly width: number;
  /** A2s R2i (lozego-15-coci435): this row's own line height. SI30 D2/D3:
   *  now `Sea`'s own reduction (`Sea.java:72-91`'s `doAlign`/
   *  `translateMinYto`/`getHeight`, algebraically `max(altitude) +
   *  max(height - altitude)` for a single stripe stacked at y=0 — see
   *  {@link seaLineHeightAndSpan}) rather than a flat MAX, so a line mixing
   *  a `<sub>` (altitude +3) with NORMAL runs grows correctly. Altitude is
   *  0 for every atom except a `'text'` one with a non-NORMAL
   *  `FontPosition` (`decisions.md#D2`'s literal scope — "Text atoms report
   *  the getStartingAltitude"; emoji/image/vector/bullet keep the PRE-SI30
   *  altitude-0 treatment, unchanged, so this is additive: for an
   *  all-NORMAL line every atom's altitude is 0 and the reduction collapses
   *  back to the original flat MAX (text -> `atomTextLineHeight(font.size)`
   *  i.e. font size floored 10, AtomText.java:179-181; img/sprite/vector ->
   *  the atom's scaled pixel height; emoji -> `39*factor`,
   *  `atom/AtomEmoji.ts`) byte-identical. Upstream: `MethodsOrFieldsArea#
   *  calculateDimensionOnlyMembers` advances `y += dim.getHeight()` PER
   *  MEMBER (java:161-166) where `dim` is that member's own TextBlock
   *  dimension -- a 100px sprite row advances 100*scale, not the uniform
   *  text row height (jar: lozego's `<$test>` field row = 100*14/13 =
   *  107.6923px; node 2.162393in golden-exact). */
  readonly height: number;
}
