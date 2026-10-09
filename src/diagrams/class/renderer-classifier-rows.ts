/**
 * Classifier-box row rendering: attribute font sizing, row + row-text
 * emitters, member atom decoration, and row-atom layout. Split out of
 * `renderer-classifier-box.ts` (line cap); imports color resolution, consumed
 * by body rendering.
 */

import type { ClassifierGeo } from './layout.js';
import { ROW_TEXT_LEFT_MARGIN } from './layout.js';
import type { Theme } from '../../core/theme.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { text, image, decorationLines } from '../../core/svg.js';
import { textRenderDecorations } from '../../core/klimt/drawing/svg/driver-text-svg-decorations.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import {} from '../../core/color-override.js';
import {} from './class-map-sizing.js';
import {} from './class-badge.js';
import { renderVisibilityIcon, visibilityIconOriginY, rowIconTopOriginY } from './class-visibility-icon.js';
import {} from './renderer-url.js';
import { linkWrap } from '../../core/svg.js';
import { renderBulletAtom } from './renderer-note.js';
import { renderListNumberAtom } from './renderer-list-number-atom.js';
import { getFont } from '../../core/klimt/shape/UText.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import { renderRowOpenIconicAtom } from './renderer-openiconic.js';
import { renderMemberRowDrawable } from './class-member-sprite-render.js';
import {} from './renderer-body-enhanced.js';
import {} from './class-shadow.js';
import { classifierCascadeFontColor } from './renderer-classifier-row-font-color.js';
import { parseDeclarationColors } from './class-declaration-extractors.js';
import { atomsOverBack, classifierRowBack } from './class-sprite-back.js';

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
export function attributeFontSize(theme: ScaledTheme): number {
  // cdd-B8FU: the two override tiers are UNSCALED skinparam/`<style>`
  // values (unlike `theme.fontSize`, already scaled by T29's
  // `scaleClassTheme`) -- materialized the same way `edgeStrokeWidth`'s
  // fallback tiers are (`renderer-edge.ts#resolveEdgeStrokeWidth`, T29
  // round 2), so the icon-centering math below stays consistent whichever
  // tier wins.
  const override = theme.colors.graph.classCascadeFontSize ?? theme.colors.graph.classAttributeFontSize;
  return override !== undefined ? override * theme.scaleK : theme.fontSize;
}

/**
 * CDD T20 (M6) / T6FU: the visibility icon's origin Y for a member whose
 * text may be WRAPPED over several physical lines.
 * cdd-B7FU-R3: `attributeFontSize` also reads `classCascadeFontSize` (the
 * `<style> class { FontSize N } }` cascade, `style-cascade-class-font.ts`)
 * ahead of the flat `classAttributeFontSize` skinparam -- the SAME "cascade
 * before flat skinparam" tier `class-layout-fonts.ts#resolveAttributeFont`
 * now carries, mirroring this function's own doc comment's "EXACTLY" claim
 * (`ropera-76-jico895`'s `attr1`/`method1()` visibility icons were 1.111px
 * off-center before this without it).
 *
 * `PlacementStrategyVisibility#getPositions` (java:56-69) centres the icon
 * block on `maxHeight12 = max(iconHeight, textBlockHeight)`, where the text
 * block is the member's WHOLE wrapped TextBlock -- not its first line. The
 * ported form is a closed-form shift of the row's first-line baseline by
 * `(blockHeight - fontSize) / 2`, leaving {@link visibilityIconOriginY}
 * (whose own `rowHeight` param couples the single-line ascent/descent basis
 * to its `maxHeight12` term, so substituting the block total there moves the
 * icon the WRONG way) untouched -- see `.agent-notes/cdd-T20.md`'s M6
 * derivation. cdd3-T22 (E1-3): a classic member row now carries its block
 * top (`visibilityBlockTopDy`) and takes the whole-method port instead.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyVisibility.java:56-69
 */
export function wrappedVisibilityIconOriginY(
  geo: ClassifierGeo,
  row: ClassifierGeo['rows'][number],
  theme: ScaledTheme,
): number {
  const fromTop = rowIconTopOriginY(geo.y + row.y, row, theme);
  if (fromTop !== undefined) return fromTop;
  const fontSize = attributeFontSize(theme);
  const blockHeight = row.visibilityBlockHeight ?? fontSize;
  return visibilityIconOriginY(geo.y + row.y + (blockHeight - fontSize) / 2, fontSize, theme);
}

export function renderRow(geo: ClassifierGeo, row: ClassifierGeo['rows'][number], theme: ScaledTheme): string {
  const icon =
    row.visibilityIcon !== undefined
      ? renderVisibilityIcon(
          row.visibilityIcon,
          row.visibilityIsField === true,
          // cdd3-T34 (E1-8): `ROW_TEXT_LEFT_MARGIN` is a render-time
          // numeral (like `VisibilityModifier`'s own local offsets --
          // see `class-visibility-icon.ts#drawSquare`'s doc comment),
          // scaled by `theme.scaleK` the same way `geo.x` already is.
          geo.x + ROW_TEXT_LEFT_MARGIN * theme.scaleK,
          wrappedVisibilityIconOriginY(geo, row, theme),
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
  theme: ScaledTheme,
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
  //
  // cdd-T19 (A3 M1 text half): a classifier's OWN inline `#text:color`
  // decoration (`class-declaration-extractors.ts#extractDecorations`'s
  // `text?` field, T18) wins over EVERYTHING below -- `Style.java:206-208
  // eventuallyOverride(Colors)` puts the inline `ColorType.TEXT` value into
  // `PName.FontColor` at `Integer.MAX_VALUE` priority (`:191-192`), and
  // `getFontConfiguration(set, colors)` (`:259-263`) checks
  // `colors.getColor(ColorType.TEXT)` BEFORE `value(PName.FontColor)` at
  // all -- i.e. the classifier's own override is checked first, full stop,
  // not merged into the cascade. `MethodsOrFieldsArea.java:240`'s
  // `FontConfiguration.create(skinParam, style, leaf.getColors())` and
  // `EntityImageClassHeader.java:99`'s identical `entity.getColors()` call
  // both pass the SAME per-classifier `Colors`, so the tier applies
  // uniformly to the header AND every member row -- no `isHeader` branch
  // needed. `geo.color` is the raw, un-decomposed `COLOR [LINECOLOR]`
  // capture `renderer-classifier-colors.ts#classifierFill`'s
  // `resolveBareOrBackColor(geo.color)` already reads for the BACK half;
  // `parseDeclarationColors` re-parses the SAME string for its `text:`
  // part (`Colors.java:95-124`, T18's extractor), then resolved to hex
  // exactly like every other named-colour tier this file's own module doc
  // comment documents (`resolveColorToSvgHex`, the M5 precedent).
  const inlineTextColor = parseDeclarationColors(geo.color).text;
  const resolvedInlineTextColor = inlineTextColor !== undefined ? resolveColorToSvgHex(inlineTextColor) : undefined;
  const fontColor = resolvedInlineTextColor ?? classifierCascadeFontColor(geo, theme, isHeader, isStereoLabelRow);
  if (row.atoms !== undefined) {
    // unwind2-S7: a sprite atom tints over the row's back (`class-sprite-back.ts`).
    const atoms = atomsOverBack(row.atoms, classifierRowBack(geo, theme, isHeader));
    return renderRowAtoms(atoms, geo.x + row.indent, geo.y + row.y, theme, fontColor);
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
/** SI30 D2: a text atom's own drawn Y -- the row's baseline `y` plus its
 *  `Sea` correction (`atom.dy ?? 0`). Factored out of {@link renderRowAtoms}
 *  purely to keep that already-over-cap function's own CCN from growing. */
function textAtomRowY(y: number, atom: Extract<MemberRenderAtom, { kind: 'text' }>): number {
  return y + (atom.dy ?? 0);
}

/**
 * cdd2-T8 (S-10): `CommandCreoleMonospaced.java:81`'s `stripe.getSkinParam()
 * .getMonospacedFamily()` substitutes the REAL configured font name for a
 * `""text""` creole run's logical family BEFORE upstream ever draws it --
 * this port's creole engine has no skinparam thread (`CommandCreoleMonospaced
 * .ts`'s own doc comment), so the substitution happens here instead, at the
 * member-row text-emission site, immediately before the atom's family
 * reaches `text()`/`svg-text-font.ts#textFontFamily`. When no
 * `defaultMonospacedFontName` is configured, `atom.font.family` passes
 * through UNCHANGED and `textFontFamily`'s existing `renameLogicalMonospace`
 * rename (`monospaced` -> CSS `monospace`) still applies exactly as before
 * -- zero behavior change for every fixture that never sets this skinparam.
 * Jar-verified `nesivu-99-cexu403`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/command/CommandCreoleMonospaced.java:81
 */
function resolveAtomFontFamily(family: string, theme: Theme): string {
  if (family.toLowerCase() !== 'monospaced') return family;
  return theme.colors.graph.monospacedFontName ?? family;
}

/**
 * {@link renderRowAtoms}'s own `'text'`-kind branch -- split out purely to
 * keep that function's own CCN under this project's complexity cap (T26,
 * the `'listNumber'` branch's own addition tipped it over); pure move, no
 * behavior change.
 *
 * cdd-B7FU-R1: one call for every font-configuration-derived attribute
 * `DriverTextSvg#draw` computes (java:93-173) -- weight (two-tier, so a
 * `skinparam classFontStyle bold` face survives `<plain>`), style,
 * `text-decoration`, the `<back:>` filter and the custom-coloured
 * underline/strike lines.
 */
function renderTextRowAtom(
  atom: Extract<MemberRenderAtom, { kind: 'text' }>,
  x: number,
  y: number,
  theme: ScaledTheme,
  fallbackFontColor: string,
): string {
  const deco = textRenderDecorations(atom.font, getFont(atom.font).size);
  // G2 N57 item 38: `atom.renderText`/`renderWidth` are set ONLY for a
  // whitespace-only run (`DriverTextSvg.java`'s NBSP-substitution
  // branch, `class-member-creole.ts#MemberRenderAtom`'s own doc
  // comment) -- the DRAWN text/textLength use them when present, but
  // x-advance below stays on `atom.width` (the LAYOUT value) always.
  // SI30 D1/D2: drawn at the EFFECTIVE (muted) size (`getFont`), at the
  // row's own baseline `y` PLUS the atom's own Sea correction
  // ({@link textAtomRowY} -- 0 for every atom of an all-NORMAL row, the
  // identity property `creole-sea-line.ts`'s doc comment names).
  const rendered = text(x + (atom.renderDx ?? 0), textAtomRowY(y, atom), atom.renderText ?? atom.text, {
    fontFamily: resolveAtomFontFamily(atom.font.family, theme),
    fontSize: getFont(atom.font).size,
    fill: atom.font.color ?? fallbackFontColor,
    lengthAdjust: 'spacing',
    textLength: atom.renderWidth ?? atom.width,
    ...(deco.fontWeight !== null ? { fontWeight: deco.fontWeight as '700' } : {}),
    ...(deco.fontStyle !== null ? { fontStyle: 'italic' as const } : {}),
    ...(deco.textDecoration !== null ? { textDecoration: deco.textDecoration } : {}),
    ...(deco.backColor !== null ? { textBackColor: deco.backColor } : {}),
  });
  // G2 N40: a `[[url]]` creole command's captured-label run wraps in
  // its OWN `<a href>` -- `class-member-creole.ts#MemberRenderAtom`'s
  // `url` field doc comment.
  const withLink = atom.url !== undefined ? linkWrap(rendered, atom.url) : rendered;
  // Upstream java:180: the extra lines are drawn AFTER the `<text>`.
  const extra = decorationLines(
    deco.extraLines,
    x + (atom.renderDx ?? 0),
    textAtomRowY(y, atom),
    atom.renderWidth ?? atom.width,
    getFont(atom.font).size,
  );
  return withLink + extra;
}

export function renderRowAtoms(
  atoms: readonly MemberRenderAtom[],
  startX: number,
  y: number,
  theme: ScaledTheme,
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
      out += renderTextRowAtom(atom, x, y, theme, fallbackFontColor);
      x += atom.width;
      continue;
    }
    if (atom.kind === 'bullet') {
      // B22/M21: unreachable on this path in practice -- a classifier member
      // row's `*` is a `VisibilityModifier` char (`IE_MANDATORY`), not a
      // creole bullet, because `CreoleMode.SIMPLE_LINE` skips the bullet
      // pattern entirely (`CreoleStripeSimpleParser.java:119-147`, both
      // patterns gated `if (mode == CreoleMode.FULL)`). Handled anyway so the
      // atom union stays exhaustive here, using this file's own
      // line-bottom-minus-height convention rather than the note renderer's.
      out += renderBulletAtom(atom, x, y + theme.fontSize / 4.5 - theme.fontSize, theme.fontSize, theme.scaleK);
      x += atom.width;
      continue;
    }
    if (atom.kind === 'listNumber') {
      // C-2: unreachable on this path in practice for the SAME reason as
      // the `'bullet'` branch above (`CreoleMode.SIMPLE_LINE` skips the
      // `#`-heading pattern too, `CreoleStripeSimpleParser.java:136-144`
      // gated `if (mode == CreoleMode.FULL)`) -- handled anyway so the atom
      // union stays exhaustive here.
      out += renderListNumberAtom(atom, x, y + theme.fontSize / 4.5 - theme.fontSize, theme.fontSize);
      x += atom.width;
      continue;
    }
    if (atom.kind === 'vector') {
      // G2 N41 / cdd3-T22: an OpenIconic `<&glyph>` at its `Sea` top.
      out += renderRowOpenIconicAtom(atom, x, y, theme);
      x += atom.width;
      continue;
    }
    if (atom.kind === 'drawable') {
      // C-4 (cdd3-T23): at its own `Sea` top when `resolveMemberAtoms` set
      // `atom.dy` (mirrors `renderRowOpenIconicAtom`'s identical dual path)
      // -- else the flat `'image'` bottom-anchor below, for a caller that
      // builds a `'drawable'` atom outside that function (namespace-title
      // runs, a note line).
      const drawableOriginY = atom.dy !== undefined ? y + atom.dy : y + theme.fontSize / 4.5 - atom.height;
      out += renderMemberRowDrawable(atom.primitives, x, drawableOriginY);
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
    out += image(x, lineBottomY - atom.height, Math.round(atom.width), Math.round(atom.height), atom.href);
    x += atom.width;
  }
  return out;
}
