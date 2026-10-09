/**
 * cdd3-T7: `ClassifierGeo['rows'][number]`'s element type, split out of
 * `class-geo-types.ts` when the new `bodyInkHeight` field pushed that file
 * past the project's 500-line hook cap -- a pure move (every consumer keys
 * off `ClassifierGeo['rows']`/`ClassifierGeo['rows'][number]`, both of which
 * resolve identically through this named interface), zero behavior change.
 * Mirrors this file's own `NamespaceGeo`/`ClassGeometry`/`JsonBodyItem`
 * split precedent.
 */
import type { UrlInfo, Visibility } from './ast.js';
import type { MemberRenderAtom } from './class-member-creole.js';

/** Text row to render: [header display, ...member strings] with y offset. */
export interface ClassifierRowGeo {
  text: string;
  y: number;
  indent: number;
  italic?: boolean; // abstract/interface header names — rendered in italic
  /** G2 N32: header-only, `skinparam classFontStyle bold` --
   *  `theme.ts#classFontBold`'s doc comment. Absent for every classifier
   *  with no such override (zero behavior change). */
  bold?: boolean;
  visibilityIcon?: Visibility; // colored icon left of member text
  /** G2 N6: true when this member is a FIELD (not a method) -- gates
   *  the filled-vs-stroke-only fill rule
   *  (`class-visibility-icon.ts#renderVisibilityIcon`'s own doc comment).
   *  Present only alongside `visibilityIcon`. */
  visibilityIsField?: boolean;
  /** G2 N4: the row text's pre-measured (unmargined) width, from the SAME
   *  measurer `layoutClass` sized the box with -- feeds `<text
   *  textLength="..." lengthAdjust="spacing">` (`renderer.ts#renderRow`),
   *  jar's `-DPLANTUML_DETERMINISTIC_TEXT=true` output. Optional: hand-
   *  built test rows omit it (additive on `core/svg.ts#text()`). */
  width?: number;
  /** isw-T2-cls F2b: `DriverTextSvg.java:113-126` for a plain-text row --
   *  the drawn run is shifted right by one space width per LEADING space
   *  (`renderDx`) and its `textLength` is the TRIMMED text's width
   *  (`renderWidth`); `width` stays the layout advance. Absent when the text
   *  draws as written. */
  renderDx?: number;
  renderWidth?: number;
  /** G2 N16: this row's source member's OWN parsed `[[url]]`/`[[[url]]]`
   *  link suffix -- `Member.ownUrl`'s doc comment (N15 tracked presence
   *  only via a boolean `hasUrl`; N16 carries the full value so the
   *  render-side per-primitive `<a>`-run splitting can compare DIFFERENT
   *  member rows' urls for value equality, not just presence). Read by
   *  `renderer.ts`'s classifier-level url-wrap decision
   *  (`renderer-url.ts`). */
  url?: UrlInfo;
  /**
   * G2 N22: this row's text run through the shared creole atom engine
   * (`class-member-creole.ts#buildMemberRow`) -- present on EVERY member
   * row `layoutClass` builds (hand-built test geometries may omit it, as
   * `width`). ABSENT on the header row (upstream's `EntityImageClassHeader`
   * name text is a separate, non-creole mechanism). `renderer-classifier-
   * box.ts#renderRowText` draws one `<text>`/`<image>` per atom, x-
   * advancing by each atom's measured width -- mirrors
   * `EntityImageDescriptionSupport.ts#drawAtoms`.
   */
  atoms?: readonly MemberRenderAtom[];
  /**
   * G2 N23: the header row's kind-badge `<ellipse>` cx, relative to
   * `geo.x` -- `HeaderLayout#drawU`'s `xCircle = h1` term (`h1`/`h2` in
   * `class-layout-helpers.ts#buildHeaderRow`'s doc comment) PLUS
   * `BADGE_LEFT_MARGIN + BADGE_RADIUS`. Header row (rows[0]) only;
   * `renderer-classifier-box.ts#renderBadge` reads it directly rather
   * than back-solving from the header text `indent` (`h1 !== h1 + h2`
   * once `h2 > 0`). Optional: hand-built test geometries omit it and
   * `renderBadge` falls back to its pre-N23 constant.
   */
  badgeIndent?: number;
  /**
   * G2 N23: `skinparam class { AttributeFontSize/AttributeFontName }`
   * (`FontParam.CLASS_ATTRIBUTE`) override -- header row (rows[0]) only,
   * when `measureGenericClassifier` used a non-default font (jar-verified
   * `jisanu-32-gado231`: the header's OWN `<text>` attrs move too --
   * `class-layout-helpers.ts#buildHeaderRow`'s doc comment). Member rows
   * carry theirs per atom (`class-member-creole.ts#buildMemberRow`).
   * Absent = `theme.fontFamily`/`theme.fontSize`.
   */
  fontFamily?: string;
  fontSize?: number;
  /**
   * G3/O4: `skinparam style strictuml` -- `EntityImageObject#getUnderlinedName`
   * (`Display#underlinedName`, jar's own UML-instance-notation convention:
   * an object's name is ALWAYS underlined, and a `name : type` header
   * splits into an underlined name segment + a plain `: type` segment,
   * `jotaga-99-fatu830`'s own citation). OBJECT-kind header rows only --
   * `EntityImageMap`/`Json`/`ClassHeader` never call `underlinedName()`
   * (jar-verified absent from all three). Absent = no underline (the
   * common case, `theme.strictUml` unset).
   */
  underline?: boolean;
  /**
   * CDD T20 (A5/M6): present only alongside `visibilityIcon` -- this
   * member's OWN total wrapped-block height (sum of every physical
   * sub-row the SAME `Member` expands into, `class-member-rows.ts
   * #buildSectionRows`'s own doc comment), when it differs from this
   * row's single-line height. `klimt/geom/PlacementStrategyVisibility
   * .java:56-62`'s `height2` term is the WHOLE member block, not one
   * physical line -- absent (falls back to `attributeFontSize(theme)`
   * at the render call site, `renderer-classifier-box.ts`'s own doc
   * comment) reproduces the pre-T20 single-line behavior byte-for-byte
   * for every non-wrapped member.
   */
  visibilityBlockHeight?: number;
  /**
   * cdd3-T22 (E1-3): present only alongside `visibilityIcon` on a classic
   * member row (`class-member-rows.ts#buildSectionRows`) -- the member
   * block's own TOP relative to this row's baseline `y`, so the renderer can
   * place the icon at `PlacementStrategyVisibility.java:62-67`'s `2 + y +
   * (maxHeight12 - height1) / 2` directly. When set, `visibilityBlockHeight`
   * is always set too (the member's whole block height). Absent on every
   * other row kind, which keeps the baseline-keyed T20 formula.
   */
  visibilityBlockTopDy?: number;
  /**
   * cdd3-T32: set on the FIRST row of a member that word-wrapped into 2+
   * rows. Upstream the member is ONE `rawBody` line (`cucadiagram/
   * BodierAbstract.java:69-86`, matched by `getBestMatch`) and ONE text
   * block (`cucadiagram/MethodsOrFieldsArea.java:287-294`, whose
   * `getInnerPosition` is the whole block), so a `::member` tip note matches
   * `text` and aims at the block (`svek/image/EntityImageTips.java:175-179`).
   * `height` is the sum of the member's rows' heights, `width` the widest.
   */
  memberWrap?: { text: string; height: number; width: number };
  /** cdd3-T32: a wrapped member's continuation (non-first) row -- part of
   *  the block {@link memberWrap} describes, never a match target itself. */
  wrapContinuation?: true;
}
