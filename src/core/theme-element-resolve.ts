/**
 * Per-element (SName) resolution helpers for {@link Theme} — the color,
 * font-size, and shadowing cascades each element's renderer reads. Split out
 * of `theme.ts` (at the project's 500-line file-size cap) as a mechanical,
 * no-behavior-change extraction; every function is pure over a {@link Theme}
 * and re-exported from `theme.ts` for backward-compatible call sites.
 */
import type { Theme } from './theme.js';
import type { Paint } from './paint.js';
import { resolveColorToSvgHex } from './klimt/color/HColorSet.js';
import { HorizontalAlignment } from './klimt/geom/HorizontalAlignment.js';

/**
 * The pseudo-bucket holding a `<style> .tag { ... }` selector that names no
 * SName: its signature carries only the stereotype, so it matches every
 * element carrying that tag (`Context.java#push` `.`-branch ->
 * `StyleSignatureBasic.empty().addStereotype`; `StyleSignatureBasic
 * #matchAllImpl`). Written by `style-map-element.ts#collectTagStyle`.
 */
export const ANY_ELEMENT_BUCKET = '*';

/** The stereotype-keyed twin of each {@link ElementColors} colour role. */
const STEREOTYPE_PAINT_FIELD = {
  background: 'backgroundColorByStereo',
  border: 'borderByStereo',
} as const;

/**
 * The stereotype tier of one element's colour: a `<<label>>`-qualified
 * `skinparam <sname>BackgroundColor<<label>>` / `<style> <sname> { .label {
 * BackgroundColor } }` (or the SName-less `<style> .label { ... }`) beats the
 * un-qualified bucket, because upstream re-signs such a style at +1000
 * priority (`FromSkinparamToStyle.java#addStyle`, `StyleLoader.java:178-186`
 * `addPriorityForStereotype`; `Context.java#toStyles` for the `<style>`
 * spelling). Keys are CLEANED tags; the LAST label with a value wins,
 * mirroring `StyleSignatureBasic#withTOBECHANGED` fanning the signature out
 * one label at a time and the merge keeping the last-registered value. The
 * SName's own bucket is consulted after the SName-less one.
 */
export function stereotypePaint(
  theme: Theme,
  sname: string,
  role: keyof typeof STEREOTYPE_PAINT_FIELD,
  stereotypes: readonly string[],
): Paint | undefined {
  const field = STEREOTYPE_PAINT_FIELD[role];
  let hit: Paint | undefined;
  for (const bucketName of [ANY_ELEMENT_BUCKET, sname]) {
    const byTag = theme.colors.elements?.[bucketName]?.[field];
    if (byTag === undefined) continue;
    for (const label of stereotypes) hit = byTag[cleanStereoKey(label)] ?? hit;
  }
  return hit;
}

/**
 * The stereotype tier of an element's FONT colour: `skinparam <sname>FontColor<<label>>` (`addConFont(sname)`,
 * FromSkinparamToStyle.java:149,270-283 re-signed at +1000, :292-302,396-408). It colours the element's title AND, by
 * inheritance of the merged style, its stereotype text; `<sname>StereotypeFontColor<<label>>` and the declaration-order
 * `stereoTextFontByStereo` refine the stereotype text only (see `ElementColors.stereoTextFontByStereo`). The LAST label
 * with a value wins, as for {@link stereotypePaint}. `undefined` when no tagged declaration matches.
 */
export function stereotypeFontColor(
  theme: Theme,
  sname: string,
  role: 'title' | 'stereotype',
  stereotypes: readonly string[],
): string | undefined {
  const fields =
    role === 'title'
      ? (['fontByStereo'] as const)
      : (['stereoTextFontByStereo', 'stereotypeFontByStereo', 'fontByStereo'] as const);
  for (const field of fields) {
    let hit: string | undefined;
    for (const bucketName of [ANY_ELEMENT_BUCKET, sname]) {
      const byTag = theme.colors.elements?.[bucketName]?.[field];
      if (byTag === undefined) continue;
      for (const label of stereotypes) hit = byTag[cleanStereoKey(label)] ?? hit;
    }
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/**
 * Resolve the {@link Paint} for one element's color role, cascading
 * element-specific (SName) bucket → root default (decision D4). Never throws on
 * an unrecognized `sname` — it falls through to the root default.
 *
 * `background` resolves to the root node fill (`nodeBackground`, `#F1F1F1` by
 * default), NOT the class-specific `classBackground`, so a `database` (or any
 * non-`class` element) is not tinted with the class color.
 *
 * `stereotypes` (codd-T1c): the element's OWN `<<label>>`s, raw as parsed.
 * Supplied only by callers whose upstream image merges a stereotype-re-signed
 * style (`EntityImageDescription.java:152-160`, `EntityImagePort.java:61-64`
 * via `withTOBECHANGED`); when omitted the cascade is exactly what it was.
 * Only `background` and `border` have a stereotype tier.
 */
export function resolveElementPaint(
  theme: Theme,
  sname: string,
  role: 'background' | 'border' | 'font',
  stereotypes?: readonly string[],
): Paint {
  if (role !== 'font' && stereotypes !== undefined) {
    const tagged = stereotypePaint(theme, sname, role, stereotypes);
    if (tagged !== undefined) return tagged;
  }
  const specific = theme.colors.elements?.[sname]?.[role];
  if (specific !== undefined) return specific;
  switch (role) {
    case 'background': {
      // `root`/`element { BackGroundColor }` (universal SName) cascades a
      // skin's fill (`skin rose` #FEFECE) below the per-bucket tier above and
      // above the `nodeBackground` default -- mirrors state's
      // `resolveStateRootElementBackground` (D3 second consumer, see the
      // `rootElementBackground` field doc).
      const rootEl = theme.colors.graph.rootElementBackground;
      return rootEl !== undefined ? resolveColorToSvgHex(rootEl) : theme.colors.nodeBackground;
    }
    case 'border':
      return theme.colors.border;
    case 'font':
      return theme.colors.text;
  }
}

/**
 * `StyleSignatureBasic#clean` (java) — lowercase every char, DROPPING `_` and
 * `.` entirely. Duplicated from `style-map-element.ts#cleanStereotypeToken`
 * rather than imported: that module reaches this one through
 * `skinparam.ts` → `theme.ts` (which re-exports every `resolveElement*` here),
 * so importing it back would close an ESM import cycle. Six lines, one
 * upstream rule, and the two copies are named for each other.
 */
function cleanStereoKey(name: string): string {
  let out = '';
  for (const ch of name) {
    if (ch !== '_' && ch !== '.') out += ch.toLowerCase();
  }
  return out;
}

/**
 * Resolve the entity/cluster text FONT SIZE override for one element's
 * `sname` and text role, cascading per-stereotype-NAME → STEREOTYPE-specific
 * → the element's own plain override → `undefined` (caller applies its own
 * `theme.fontSize + sizeDelta` default — G1 I4b,
 * `renderer-symbol.ts#textFont`). Mirrors `resolveElementPaint`'s cascade
 * shape but returns `undefined` rather than a hard default, since the numeric
 * default varies by caller (title vs stereotype vs a role-specific
 * `sizeDelta`).
 *
 * `stereotypes` (S1L-tail G4 tier 2): the element's OWN stereotype label(s),
 * raw as parsed. Supplied ONLY by callers that have them in scope; when
 * omitted the name-scoped tier is skipped and the cascade is exactly what it
 * was before that tier existed. See
 * {@link import('./theme-graph-colors.js').ElementColors.stereotypeFontSizeByStereo}
 * for why one CLEANED map serves both the `<style>` and `skinparam`
 * front-ends.
 */
export function resolveElementFontSize(
  theme: Theme,
  sname: string,
  role: 'title' | 'stereotype',
  stereotypes?: readonly string[],
): number | undefined {
  const bucket = theme.colors.elements?.[sname];
  if (bucket === undefined) return undefined;
  if (role === 'stereotype') {
    const byStereo = bucket.stereotypeFontSizeByStereo;
    if (byStereo !== undefined && stereotypes !== undefined) {
      // First matching label wins, in source order -- upstream builds the
      // element's style signature one label at a time (`withTOBECHANGED`),
      // so a diagram declaring two labels that BOTH carry a name-scoped
      // FontSize is already ambiguous upstream; no corpus fixture does.
      for (const label of stereotypes) {
        const scoped = byStereo[cleanStereoKey(label)];
        if (scoped !== undefined) return scoped;
      }
    }
    if (bucket.stereotypeFontSize !== undefined) return bucket.stereotypeFontSize;
  }
  return bucket.fontSize;
}

/**
 * mission skin-file-loading (deferred D3 item): resolve one element's own
 * `getStyle().getShadowing()` — cascades `theme.colors.elements[sname]
 * .shadowing` (`ElementColors.shadowing`'s doc comment) over the
 * diagram-wide `theme.shadowing` (bare `root`/`element`, Batch 1). Mirrors
 * `resolveElementPaint`'s two-tier cascade; always returns a number (never
 * `undefined`), matching `Style#getShadowing()`'s "absent -> 0" default.
 */
export function resolveElementShadowing(theme: Theme, sname: string, stereotypes: readonly string[] = []): number {
  // The stereotype tier (`skinparam <sname>Shadowing<<label>>`, +1000 priority, FromSkinparamToStyle.java:396-408):
  // the LAST label with a value wins, as for `stereotypePaint`.
  const byTag = theme.colors.elements?.[sname]?.shadowingByStereo;
  let tagged: number | undefined;
  if (byTag !== undefined) for (const label of stereotypes) tagged = byTag[cleanStereoKey(label)] ?? tagged;
  if (tagged !== undefined) return tagged;
  const specific = theme.colors.elements?.[sname]?.shadowing;
  if (specific !== undefined) return specific;
  return theme.shadowing ?? 0;
}

/**
 * Resolve one element's own border/line THICKNESS override
 * (`<style> <sname> { LineThickness N }`, e.g. `skin rose`'s
 * `componentDiagram { node, rectangle { LineThickness 1.5 } }`). Returns
 * `undefined` when the element declares none, letting each renderer apply
 * its own built-in default (description leaves: `ENTITY_STROKE_WIDTH` 0.5) --
 * mirroring `resolveElementFontSize`'s "absent -> caller default" shape,
 * since the numeric default varies by element kind. See
 * `ElementColors.lineThickness`'s doc comment.
 */
export function resolveElementLineThickness(theme: Theme, sname: string): number | undefined {
  return theme.colors.elements?.[sname]?.lineThickness;
}

/**
 * Resolve one element's own `MinimumWidth` content-width floor
 * (`<style> <sname> { MinimumWidth N }`, `PName.MinimumWidth`), cascading the
 * element-specific (SName) bucket over the diagram-wide `theme.minimumWidth`
 * (bare `skinparam minClassWidth`) — S1L-b T5, ADR-3. So `<style> package {
 * MinimumWidth 300 }` floors package boxes while a sibling `card` (no scoped
 * override, no global floor) falls through to `undefined` and the box default.
 * Returns `undefined` when neither tier is set, letting `measureBox` apply its
 * own `BOX_MIN_WIDTH_DEFAULT` — mirrors `resolveElementLineThickness`'s
 * "absent -> caller default" shape.
 */
export function resolveElementMinimumWidth(theme: Theme, sname: string): number | undefined {
  return theme.colors.elements?.[sname]?.minimumWidth ?? theme.minimumWidth;
}

/**
 * cdd6 T3g: one element's own `Style#wrapWidth` (`Style.java:330-332`,
 * `PName.MaximumWidth`) -- the SName bucket (`<style> <sname> { MaximumWidth
 * N }`) over `skinparam wrapWidth`, which `FromSkinparamToStyle.java:250`
 * registers on `SName.element` (a member of every element signature, e.g.
 * `EntityImageJson.java:140`'s `{root, element, objectDiagram, json}`).
 * `undefined` = no wrap (`LineBreakStrategy#getMaxWidth` 0,
 * `LineBreakStrategy.java:61-66`). Mirrors {@link resolveElementMinimumWidth}.
 */
export function resolveElementMaximumWidth(theme: Theme, sname: string): number | undefined {
  return theme.colors.elements?.[sname]?.maximumWidth ?? theme.wrapWidth;
}

/**
 * Fold a theme's own bare `root`/`element` `BackgroundColor` (a builtin
 * theme's pre-parsed `styleOverrides`, e.g. `puml-theme-plain.puml:35-37`
 * `root { BackgroundColor $BGCOLOR }`) into `colors.participantBackground`.
 *
 * Upstream merges every matching style in DECLARATION order with
 * `OVERWRITE_EXISTING_VALUE` (`StyleStorage#computeMergedStyle:102-114`),
 * and a theme is declared after `plantuml.skin`'s `participant {
 * BackgroundColor var(--grey-blue) }` (`:197-201`), so its root rule wins
 * over the grey-blue default. Jar-verified: `!theme plain` heads are `#FFF`
 * (`xiceso-64-pelu456`), `!theme amiga` heads are `#0B58A8`. The document's
 * own `<style>` blocks are applied AFTER `resolveTheme`, so they still
 * layer on top (`style-map-theme.ts#StyleMapExtras.rootElementBackgroundRaw`).
 * Same last-wins walk as `style-map-element.ts#resolveRootElementProperty`.
 */
export function foldRootBackgroundIntoSequence(theme: Theme): Theme {
  let raw: string | undefined;
  for (const selector of ['root', 'element']) {
    const value = theme.styleOverrides?.[selector]?.['backgroundcolor'];
    if (value !== undefined) raw = value;
  }
  if (raw === undefined) return theme;
  return { ...theme, colors: { ...theme.colors, participantBackground: resolveColorToSvgHex(raw) } };
}

/**
 * `ClusterHeader.java:121`: a group title's `style.getHorizontalAlignment()` over the signature
 * `{root, element, <diagram>, uSymbol.getSNames(), composite, title}` (`:151-163`). Declarations compete by parse
 * order (`DarkString#mergeWith`, the skin loads first), so a user declaration beats `plantuml.skin:93-99`'s
 * `element { composite,package { title { HorizontalAlignment center } } }`: the container's own
 * `<style> <sname> { HorizontalAlignment X }` bucket, then the root bucket (`skinparam defaultTextAlignment X`,
 * `FromSkinparamToStyle.java:155`). Probed against the jar: `defaultTextAlignment right` right-aligns a
 * `rectangle` title. With neither, the skin's CENTER.
 */
export function resolveClusterTitleAlignment(theme: Theme, sname: string): HorizontalAlignment {
  const elements = theme.colors.elements;
  return elements?.[sname]?.horizontalAlignment ?? elements?.root?.horizontalAlignment ?? HorizontalAlignment.CENTER;
}

/**
 * `EntityImageDescription.java:167` / `Cluster.java:321`: `style.value(PName.RoundCorner)`, RAW and unhalved (the
 * rectangle driver halves it into `rx`/`ry`). Declarations compete by parse order, so a user one beats the
 * componentDiagram skin's `element { RoundCorner 5 }` (`plantuml.skin:193-197`): the element's own bucket
 * (`skinparam <sname>RoundCorner N` / `<style> <sname> { RoundCorner N }`), then the root tier
 * (`skinparam roundCorner N`, `FromSkinparamToStyle.java:164`, which the theme stores in
 * `graph.classCascadeRoundCorner`). `undefined` when neither is set -- the caller applies the skin's 5.
 */
export function resolveElementRoundCorner(theme: Theme, sname: string): number | undefined {
  return theme.colors.elements?.[sname]?.roundCorner ?? theme.colors.graph.classCascadeRoundCorner;
}
