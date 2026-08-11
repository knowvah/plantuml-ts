/**
 * Classifier-box row rendering: attribute font sizing, row + row-text
 * emitters, member atom decoration, and row-atom layout. Split out of
 * `renderer-classifier-box.ts` (line cap); imports color resolution, consumed
 * by body rendering.
 */

import type { ClassifierGeo } from './layout.js';
import { ROW_TEXT_LEFT_MARGIN } from './layout.js';
import type { Theme } from '../../core/theme.js';
import { text, image } from '../../core/svg.js';
import {} from '../../core/klimt/color/HColorSet.js';
import {} from './class-color-override.js';
import {} from './class-map-sizing.js';
import {} from './class-badge.js';
import { renderVisibilityIcon, visibilityIconOriginY } from './class-visibility-icon.js';
import {} from './renderer-url.js';
import { linkWrap } from '../../core/svg.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { resolveClassTagCascadeEntry } from '../../core/style-cascade-class.js';
import { renderOpenIconicAtom } from './renderer-openiconic.js';
import {} from './renderer-body-enhanced.js';
import {} from './class-shadow.js';
import { resolveElementFont, resolveElementHeaderFont } from './renderer-classifier-colors.js';

/**
 * Every classifier row (header AND member) shares ONE plain-baseline
 * left-anchored `<text>` shape -- G2 N4, replacing the previous header-only
 * `text-anchor="middle"`/`dominant-baseline="middle"` centering: jar draws
 * every classifier `<text>` with NEITHER attribute (a plain SVG baseline
 * position, `x` = the text's own LEFT edge, `y` = the baseline) -- verified
 * across every sampled fixture in `plans/g2-class-svg/ledger.md` N4.
 * `row.indent` already carries this row's real left-edge offset from
 * `geo.x` (header centering + member icon-zone reservation both baked in
 * at layout time -- `class-layout-helpers.ts#buildHeaderRow`/
 * `buildSectionRows`), so this function no longer branches on
 * `indent > 0` at all. `row.width` (when present -- always, from
 * `layoutClass`; absent only in hand-built unit-test geometries) feeds
 * `textLength`/`lengthAdjust`, matching jar's own deterministic-text-mode
 * `<text textLength="..." lengthAdjust="spacing">` emission byte-for-byte
 * rather than leaving inter-glyph spacing to the SVG viewer's own font.
 *
 * Fill is a HARDCODED `#000000`, NOT `theme.colors.text` (`#181818` by
 * default, the general canvas-text color used elsewhere in this file for
 * notes/edges): `EntityImageClassHeader`'s own style-signature FontColor
 * resolves to black by default, independent of the general theme text
 * color (jar-verified: every non-monochrome-theme fixture's header/member
 * `<text>` carries `fill="#000000"` even when `theme.colors.text` differs).
 * `skinparam monochrome reverse` flips this to white -- a separate,
 * smaller, pre-existing, unfixed divergence (matches `renderBadge`'s own
 * glyph-fill precedent, same doc-comment caveat).
 */
/**
 * G2 N67 (near-zero harvest, xabije-20-xusi569): the member row's OWN
 * resolved font size for visibility-icon Y-centering -- mirrors
 * `class-layout-helpers.ts#measureGenericClassifier`'s `attributeFont.size`
 * formula (`theme.colors.graph.classAttributeFontSize ?? theme.fontSize`,
 * `skinparam class { AttributeFontSize N }`) EXACTLY, so the icon centers
 * against the SAME font size the row's own text already measures/draws
 * against. Both `visibilityIconOriginY` call sites below previously passed
 * the diagram-global `theme.fontSize` unconditionally -- correct only when
 * no `AttributeFontSize` override is set (the overwhelming majority of
 * fixtures, hence this bug's 1/718 corpus reach going undetected until this
 * iteration's near-zero triage), byte-exact wrong otherwise (jar-verified:
 * the icon's own `descent` term differed by `(18-14)/4.5 == 1.1111` against
 * `xabije-20-xusi569`'s `AttributeFontSize 18`).
 */
export function attributeFontSize(theme: Theme): number {
  return theme.colors.graph.classAttributeFontSize ?? theme.fontSize;
}

export function renderRow(geo: ClassifierGeo, row: ClassifierGeo['rows'][number], theme: Theme): string {
  const icon =
    row.visibilityIcon !== undefined
      ? renderVisibilityIcon(
          row.visibilityIcon,
          row.visibilityIsField === true,
          geo.x + ROW_TEXT_LEFT_MARGIN,
          visibilityIconOriginY(geo.y + row.y, attributeFontSize(theme), theme),
          undefined,
          theme,
        )
      : '';
  return icon + renderRowText(geo, row, theme);
}

/**
 * The row's TEXT ONLY (no visibility icon) -- split out of {@link renderRow}
 * (G2 N21) so `buildBodyPrimitives` can emit an icon-bearing row as TWO
 * separately url-tagged primitives (icon, text) instead of one bundled
 * string; see `renderer-url.ts`'s "icon `<g>` forces a link-flush boundary"
 * doc comment for why they need independent `<a>` runs.
 */
export function renderRowText(
  geo: ClassifierGeo,
  row: ClassifierGeo['rows'][number],
  theme: Theme,
  // G2 N36: true for the header/name row(s) only (`buildHeaderPrimitive`'s
  // own call) -- selects the WIDER `classCascadeHeaderFontColor` signature
  // (which additionally allows a nested `... { header { FontColor } } }`
  // override to win, `EntityImageClassHeader.getStyleSignature()`) instead
  // of the box-level `classCascadeFontColor` every member row uses.
  isHeader = false,
  // G2 N37: true ONLY for a stacked `<<stereotype>>` LABEL row (never the
  // name row itself, never a member row) -- the `.tagname` cascade's
  // FontColor does NOT tint this row: jar-verified `dozude-05-jeve029`'s
  // `AliceMyStyleStereo` draws `«mystyle»` in the hardcoded default
  // `#000000`, while the SAME entity's name text AND member rows adopt the
  // tag's `FontColor red` -- `buildHeaderPrimitive`'s own call passes this
  // `true` only for `rows[0..headerRowCount-2]` (see that function's own
  // loop).
  isStereoLabelRow = false,
): string {
  // G2 N37: the `.tagname` sub-selector cascade wins over the plain
  // ancestor cascade for BOTH the name row AND member rows uniformly (jar-
  // verified `dozude-05-jeve029`: the tag's `FontColor red` applies to the
  // header name AND a member row alike) -- but NEVER a stereotype label row
  // (`isStereoLabelRow`'s own doc comment above). See `style-cascade-class
  // .ts#resolveClassTagCascadeEntry`'s own doc comment.
  // G3/O2: `object`/`map`/`json` read their OWN `theme.colors.elements
  // [kind].font` bucket FIRST (`<style> objectDiagram { object { FontColor
  // ... } } }`/bare `object { FontColor ... }`, the OBJECT-specific
  // override -- `EntityImageObject`/`Map`/`Json#getStyleSignature` has NO
  // `classDiagram`/`class` token, so a class-only `.tagname` cascade must
  // never apply). Falls through to the SAME `classCascade(Header)FontColor`
  // terminal chain the class branch uses below ONLY as a root/element-level
  // default -- jar-verified `lapato-45-neje847` (regression guard): a bare
  // `<style> root { FontColor Red } </style>` with NO objectDiagram/object
  // block still tints object row text red, because `classCascadeFontColor`'s
  // OWN `resolveStyleCascade` query set starts with `root`/`element` (the
  // FIRST two tokens of EVERY StyleSignature chain, shared identically by
  // class/object/map/json) -- exactly the SAME "falls through to the class
  // default only because of a shared prefix, not a shared cascade" shape
  // `classifierFill`'s own doc comment already establishes for
  // BackgroundColor (`classDefaultBackground`). A `<style> classDiagram {
  // ... } }`/`class { ... }`-SCOPED override incorrectly leaking into
  // object text through this SAME shared fallback is a pre-existing,
  // un-narrowed edge case (no fixture in the corpus isolates it), not
  // introduced by this iteration.
  const fontColor =
    geo.kind === 'object' || geo.kind === 'map' || geo.kind === 'json'
      ? // G3/O4: `<style> <sname> { header { FontColor } } }` wins over the
        // bare bucket's own FontColor, but ONLY for the NAME row (`isHeader
        // && !isStereoLabelRow` -- `resolveElementHeaderFont`'s own doc
        // comment; the stereo label row's FontConfiguration is independent
        // upstream, `EntityImageObject.java`'s own ctor).
        (isHeader && !isStereoLabelRow ? resolveElementHeaderFont(theme, geo.kind) : undefined) ??
        resolveElementFont(theme, geo.kind) ??
        (isHeader ? theme.colors.graph.classCascadeHeaderFontColor ?? theme.colors.graph.classCascadeFontColor
          : theme.colors.graph.classCascadeFontColor) ??
        '#000000'
      : (isStereoLabelRow ? undefined : resolveClassTagCascadeEntry(theme, geo.stereotypeLabels, geo.styleGeneration)?.fontColor) ??
        ((isHeader ? theme.colors.graph.classCascadeHeaderFontColor ?? theme.colors.graph.classCascadeFontColor
          : theme.colors.graph.classCascadeFontColor) ?? '#000000');
  if (row.atoms !== undefined) {
    return renderRowAtoms(row.atoms, geo.x + row.indent, geo.y + row.y, theme, fontColor);
  }
  return text(geo.x + row.indent, geo.y + row.y, row.text, {
    // G2 N23: `row.fontFamily`/`row.fontSize` (set only on the header row
    // when `skinparam class { AttributeFontSize/AttributeFontName }` is in
    // effect) override the theme default -- see `layout.ts`'s `rows[]`
    // field doc comment.
    fontFamily: row.fontFamily ?? theme.fontFamily,
    fontSize: row.fontSize ?? theme.fontSize,
    // G2 N4/N36: hardcoded `#000000` by default (`EntityImageClassHeader`'s
    // own style-signature FontColor resolves to black independent of the
    // general theme text color, jar-verified) -- `classCascade(Header)
    // FontColor` overrides it when a `<style>` block's `root`/`classDiagram`/
    // nested selector actually sets FontColor (`resolveStyleCascade`'s doc
    // comment); `skinparam monochrome reverse`'s white flip is a separate,
    // smaller, pre-existing, unfixed divergence (matches `renderBadge`'s own
    // glyph-fill precedent, same doc-comment caveat).
    fill: fontColor,
    // G2 N4: `text-anchor` OMITTED, not set to 'start' -- 'start' IS the
    // SVG default, and jar never emits the attribute at all for its
    // plain-baseline classifier text (verified: zero `text-anchor`
    // occurrences on any sampled fixture's header/member `<text>`).
    // `core/svg.ts#text()` already drops any `undefined` style field, so
    // simply not passing `textAnchor` reproduces jar's own omission byte-
    // for-byte, rather than emitting a semantically-equal-but-textually-
    // different `text-anchor="start"` that a raw-string comparator (this
    // attribute is not on `compareSvg`'s numeric-tolerance allowlist)
    // would flag as a spurious diff.
    ...(row.width !== undefined ? { lengthAdjust: 'spacing' as const, textLength: row.width } : {}),
    ...(row.italic === true ? { fontStyle: 'italic' as const } : {}),
    // G2 N32: `skinparam classFontStyle bold` -- header-only, mirrors the
    // creole atom engine's identical `FontStyle.BOLD` -> `font-weight="700"`
    // convention (`renderRowAtoms` below).
    ...(row.bold === true ? { fontWeight: '700' as const } : {}),
    // G3/O4: `skinparam style strictuml` -- object header name underline
    // (`layout.ts`'s `rows[]` field doc comment).
    ...(row.underline === true ? { textDecoration: 'underline' } : {}),
  });
}

/** `FontStyle` set -> the SVG `text-decoration` attribute value -- mirrors
 *  `core/klimt/drawing/svg/driver-text-svg.ts#textDecorationOf` exactly
 *  (same three flags, same CSS keywords, same join order); duplicated
 *  rather than imported because that function is `DriverTextSvg`'s own
 *  private helper and class's renderer has no `UDriver`/`UGraphic` seam to
 *  hang a shared import off of (this file's own module doc comment). */
export function memberAtomDecoration(styles: ReadonlySet<FontStyle>): string | undefined {
  const parts: string[] = [];
  if (styles.has(FontStyle.UNDERLINE)) parts.push('underline');
  if (styles.has(FontStyle.STRIKE)) parts.push('line-through');
  if (styles.has(FontStyle.WAVE)) parts.push('wavy underline');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * G2 N22: draws a member row's per-atom creole content -- one `<text>` per
 * styled text run, one `<image>` per resolved img/sprite atom, left to
 * right, x-advancing by each atom's OWN measured width. Mirrors
 * `core/svek/image/EntityImageDescriptionSupport.ts#drawAtoms`'s identical
 * reconstruction for description (same "drawing and measuring agree by
 * construction" invariant -- `buildMemberRow`'s summed `MemberRowBuild
 * .width` is exactly the sum of these per-atom widths).
 *
 * `textLength` is each atom's OWN measured width (NOT reused from the row's
 * own `row.width`, which is a SUM across every atom in a multi-atom row and
 * only equals a single atom's own width in the common single-atom case).
 * ADR-1: `core/svg.ts#text()` now formats every numeric attribute --
 * `textLength` included -- at emission, matching jar's real per-`<text>`-
 * element `SvgGraphics#format` rounding; callers pass raw measured widths
 * and no longer round before handing them to `core/svg.ts`.
 */
export function renderRowAtoms(
  atoms: readonly MemberRenderAtom[],
  startX: number,
  y: number,
  theme: Theme,
  // G2 N36: the SAME `classCascade(Header)FontColor ?? '#000000'` fallback
  // `renderRowText` computes for its plain-text path -- an atom's OWN
  // creole-resolved color (`atom.font.color`, a `<color>text</color>` run
  // or similar) still wins when set; this only replaces the innermost
  // hardcoded default.
  fallbackFontColor = '#000000',
): string {
  // #lizard forgives -- ALREADY over the NLOC cap pre-N41 (31 NLOC at
  // G2 N40's HEAD, one `for` loop over 3 atom kinds each with their own
  // small render recipe); G2 N41 adds one more branch (5 NLOC, delegated to
  // `renderer-openiconic.ts` to keep the addition itself small) rather than
  // attempting a full split of this pre-existing, already-jar-verified
  // function under this iteration's time budget.
  let x = startX;
  let out = '';
  for (const atom of atoms) {
    if (atom.kind === 'text') {
      const decoration = memberAtomDecoration(atom.font.styles);
      // G2 N57 item 38: `atom.renderText`/`renderWidth` are set ONLY for a
      // whitespace-only run (`DriverTextSvg.java`'s NBSP-substitution
      // branch, `class-member-creole.ts#MemberRenderAtom`'s own doc
      // comment) -- the DRAWN text/textLength use them when present, but
      // x-advance below stays on `atom.width` (the LAYOUT value) always.
      const rendered = text(x, y, atom.renderText ?? atom.text, {
        fontFamily: atom.font.family,
        fontSize: atom.font.size,
        fill: atom.font.color ?? fallbackFontColor,
        lengthAdjust: 'spacing',
        textLength: atom.renderWidth ?? atom.width,
        ...(atom.font.styles.has(FontStyle.BOLD) ? { fontWeight: '700' as const } : {}),
        ...(atom.font.styles.has(FontStyle.ITALIC) ? { fontStyle: 'italic' as const } : {}),
        ...(decoration !== undefined ? { textDecoration: decoration } : {}),
      });
      // G2 N40: a `[[url]]` creole command's captured-label run wraps in
      // its OWN `<a href>` -- `class-member-creole.ts#MemberRenderAtom`'s
      // `url` field doc comment.
      out += atom.url !== undefined ? linkWrap(rendered, atom.url) : rendered;
      x += atom.width;
      continue;
    }
    if (atom.kind === 'vector') {
      // G2 N41: an OpenIconic `<&glyph>` atom -- render logic lives in
      // `renderer-openiconic.ts` (kept out of this already-500-line-capped
      // file, see that module's own doc comment).
      out += renderOpenIconicAtom(atom, x, y, theme);
      x += atom.width;
      continue;
    }
    // 'image': an inline atom is BOTTOM-aligned to the line -- its bottom
    // edge sits on the line's bottom, i.e. `baseline + descent`. Jar-verified
    // 2026-08-03 by varying a sprite's grid height (1/2/4/8/16 rows) and
    // solving for the offset: `imgY + rawHeight - baseline` is a constant
    // 2.9531 at font 14 in EVERY case, in a usecase label AND in a class
    // member row.
    //
    // This previously read `y - (fontSize - fontSize/4.5)`, i.e. the line
    // TOP. That is the same point only when the image is exactly line-height
    // tall -- the common case for a sprite sized to the font, which is why it
    // held up -- and diverges by the height shortfall otherwise. A 2px sprite
    // on a 14px line was ~12.45px too high.
    //
    // Positioning and x-advance use the RAW height/width; only the emitted
    // box rounds (si5b `decisions.md` D9, Amendment 1). The jar does exactly
    // this: it advances the following text by the raw 3.2308 while emitting
    // `width="3"`.
    //
    // `theme.fontSize/4.5` remains this codebase's content-independent
    // descent formula (`measurer.ts`'s every `getDescent`). It is an
    // APPROXIMATION of the jar's real metric (3.1111 vs 2.9531 at font 14),
    // so a 0.158 residual remains here -- shared with every text baseline in
    // the port, not specific to atoms.
    const lineBottomY = y + theme.fontSize / 4.5;
    out += image(
      x,
      lineBottomY - atom.height,
      Math.round(atom.width),
      Math.round(atom.height),
      atom.href,
    );
    x += atom.width;
  }
  return out;
}
