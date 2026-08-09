/**
 * jsonDiagram / yamlDiagram / hclDiagram `<style>` block → `Theme.colors
 * .graph.json` field mapping, plus the `.tagname` style-class → `#highlight`
 * override table.
 *
 * These three diagram families render through the SAME "json" graph-color
 * bucket (`Theme['colors']['graph']['json']`) and their `node` / `arrow` /
 * `node.separator` / `node.highlight` sub-selectors resolve via IDENTICAL
 * field-extraction logic, parametrized only by the selector prefix
 * ("jsondiagram" / "yamldiagram" / "hcldiagram") — verified byte-identical
 * modulo variable naming when this module was split out. json ALSO defines
 * a legacy bare `element` / `element.header` / `element.highlight` selector
 * trio that yaml/hcl do not (yaml/hcl instead use a single
 * `<prefix>.element` selector, header-background only) — this is the only
 * asymmetry between the three families; node/arrow/separator/highlight are
 * fully shared via {@link computeDataDiagramFamilyOverride}.
 *
 * Relocated verbatim from `style-map-theme.ts` (not refactored — see
 * .agent-notes) to keep that module under the project's 500-line cap; each
 * `<prefix>.node` extraction is additionally grouped into color/geometry/
 * font sub-functions purely to satisfy per-function NLOC/CCN limits — field
 * assignments, conditions, and relative processing order are unchanged.
 */

import type { Theme } from './theme.js';
import type { StyleMap } from './skinparam.js';
import { resolveColor } from './skinparam.js';

type JsonGraphOverride = NonNullable<Theme['colors']['graph']['json']>;
type StyleProps = ReadonlyMap<string, string>;

/** Style-class entry for a `.tagname` selector → `#highlight <<tagname>>` override. */
interface HighlightClassEntry {
  background?: string;
  fontColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
}

/** `<prefix>.node` background/border/arrowColor/fontColor/lineDasharray. */
function computeDataDiagramNodeColorOverride(node: StyleProps): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const bg = node.get('backgroundcolor');
  if (bg !== undefined) override.background = resolveColor(bg);
  const lc = node.get('linecolor');
  if (lc !== undefined) {
    override.border = resolveColor(lc);
    override.arrowColor = resolveColor(lc);
  }
  const fc = node.get('fontcolor');
  if (fc !== undefined) override.nodeFontColor = resolveColor(fc);
  const nls = node.get('linestyle');
  if (nls !== undefined) override.nodeLineDasharray = nls.replace(/[-;]/g, ',');
  return override;
}

/** `<prefix>.node` linethickness/roundcorner/maximumwidth. */
function computeDataDiagramNodeSizeOverride(node: StyleProps): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const lt = node.get('linethickness');
  if (lt !== undefined) {
    const parsed = parseFloat(lt);
    if (!isNaN(parsed)) override.nodeLineThickness = parsed;
  }
  const rc = node.get('roundcorner');
  if (rc !== undefined) {
    const parsed = parseFloat(rc);
    if (!isNaN(parsed)) override.roundCorner = parsed;
  }
  const mw = node.get('maximumwidth');
  if (mw !== undefined) {
    const parsed = parseFloat(mw);
    if (!isNaN(parsed)) override.maximumWidth = parsed;
  }
  return override;
}

/** `<prefix>.node` horizontalalignment/fontsize. */
function computeDataDiagramNodeTextOverride(node: StyleProps): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const ha = node.get('horizontalalignment');
  if (ha !== undefined) {
    const lower = ha.toLowerCase();
    if (lower === 'center' || lower === 'left' || lower === 'right') override.textAlign = lower;
  }
  const fsz = node.get('fontsize');
  if (fsz !== undefined) {
    const parsed = parseFloat(fsz);
    if (!isNaN(parsed)) override.nodeFontSize = parsed;
  }
  return override;
}

/**
 * `<prefix>.node` fontname/fontstyle/fontweight — fontweight is processed
 * LAST (matching the original property-scan order), so an explicit
 * FontWeight always overrides FontStyle's own bold inference.
 */
function computeDataDiagramNodeFontOverride(node: StyleProps): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const fn_ = node.get('fontname');
  if (fn_ !== undefined) override.nodeFontFamily = fn_;
  const fst = node.get('fontstyle');
  if (fst !== undefined) {
    const lower = fst.toLowerCase();
    override.nodeFontBold = lower.includes('bold');
    override.nodeFontItalic = lower.includes('italic');
  }
  const fw = node.get('fontweight');
  if (fw !== undefined) override.nodeFontBold = fw.toLowerCase().includes('bold');
  return override;
}

function computeDataDiagramNodeOverride(styleMap: StyleMap, prefix: string): Partial<JsonGraphOverride> {
  const node = styleMap.get(`${prefix}.node`);
  if (node === undefined) return {};
  return {
    ...computeDataDiagramNodeColorOverride(node),
    ...computeDataDiagramNodeSizeOverride(node),
    ...computeDataDiagramNodeTextOverride(node),
    ...computeDataDiagramNodeFontOverride(node),
  };
}

/** `<prefix>.arrow { LineColor / LineThickness / LineStyle }`. */
function computeDataDiagramArrowOverride(styleMap: StyleMap, prefix: string): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const arrow = styleMap.get(`${prefix}.arrow`);
  if (arrow === undefined) return override;
  // A `LineStyle 3-3` becomes the SVG `stroke-dasharray:3,3`, COMMA-separated:
  // `UStroke#getDasharraySvg` hands back a `double[]` and
  // `SvgGraphicsCore#setStrokeWidth` joins the pair with a comma
  // (`svg-graphics-core.ts:382-383`, mirroring the jar). All three call sites
  // here used a space, which no jar output ever contains.
  const lc = arrow.get('linecolor');
  if (lc !== undefined) override.arrowColor = resolveColor(lc);
  const lt = arrow.get('linethickness');
  if (lt !== undefined) {
    const parsed = parseFloat(lt);
    if (!isNaN(parsed)) override.arrowThickness = parsed;
  }
  const ls = arrow.get('linestyle');
  if (ls !== undefined) override.arrowDasharray = ls.replace(/[-;]/g, ',');
  return override;
}

/** `<prefix>.node.separator { LineColor / LineThickness / LineStyle }`. */
function computeDataDiagramSeparatorOverride(styleMap: StyleMap, prefix: string): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const sep = styleMap.get(`${prefix}.node.separator`);
  if (sep === undefined) return override;
  const sc = sep.get('linecolor');
  if (sc !== undefined) override.separatorColor = resolveColor(sc);
  const st = sep.get('linethickness');
  if (st !== undefined) {
    const parsed = parseFloat(st);
    if (!isNaN(parsed)) override.separatorThickness = parsed;
  }
  const sls = sep.get('linestyle');
  if (sls !== undefined) override.separatorDasharray = sls.replace(/[-;]/g, ',');
  return override;
}

/** `<prefix>.node.highlight { BackgroundColor / FontColor / FontStyle }`. */
function computeDataDiagramHighlightOverride(styleMap: StyleMap, prefix: string): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const hl = styleMap.get(`${prefix}.node.highlight`);
  if (hl === undefined) return override;
  const hlbg = hl.get('backgroundcolor');
  if (hlbg !== undefined) override.highlightBackground = resolveColor(hlbg);
  const hlfc = hl.get('fontcolor');
  if (hlfc !== undefined) override.highlightFontColor = resolveColor(hlfc);
  const hlfs = hl.get('fontstyle');
  if (hlfs !== undefined) {
    const lower = hlfs.toLowerCase();
    override.highlightFontBold = lower.includes('bold');
    override.highlightFontItalic = lower.includes('italic');
  }
  return override;
}

/**
 * json's own bare `element` / `element.header` / `element.highlight`
 * selector trio — see this module's head doc comment for why yaml/hcl
 * instead use a single `<prefix>.element` selector ({@link
 * computeDataDiagramHeaderElementOverride}).
 */
function computeJsonElementOverride(styleMap: StyleMap): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const elem = styleMap.get('element');
  if (elem !== undefined) {
    const bg = elem.get('backgroundcolor');
    if (bg !== undefined) override.background = resolveColor(bg);
    const lc = elem.get('linecolor');
    if (lc !== undefined) {
      override.border = resolveColor(lc);
      override.arrowColor = resolveColor(lc);
    }
  }
  const elemHeader = styleMap.get('element.header');
  if (elemHeader !== undefined) {
    const hbg = elemHeader.get('backgroundcolor');
    if (hbg !== undefined) override.headerBackground = resolveColor(hbg);
    const fs = elemHeader.get('fontstyle');
    if (fs !== undefined) override.headerFontBold = fs.toLowerCase().includes('bold');
  }
  const elemHighlight = styleMap.get('element.highlight');
  if (elemHighlight !== undefined) {
    const hlbg = elemHighlight.get('backgroundcolor');
    if (hlbg !== undefined) override.highlightBackground = resolveColor(hlbg);
  }
  return override;
}

/**
 * yaml's/hcl's shared `<prefix>.element { BackgroundColor }` selector —
 * header-background only (the yaml/hcl sibling of {@link
 * computeJsonElementOverride}'s 3-selector trio).
 */
function computeDataDiagramHeaderElementOverride(styleMap: StyleMap, prefix: string): Partial<JsonGraphOverride> {
  const override: Partial<JsonGraphOverride> = {};
  const elem = styleMap.get(`${prefix}.element`);
  if (elem === undefined) return override;
  const bg = elem.get('backgroundcolor');
  if (bg !== undefined) override.headerBackground = resolveColor(bg);
  return override;
}

/**
 * Shared node/arrow/separator/highlight composition for one diagram family,
 * layered over its own (family-specific) element-bucket override. Spread
 * order mirrors the original source order (element bucket, then node, then
 * arrow, then separator, then highlight) — significant because several
 * fields (e.g. `background`/`border`/`arrowColor`) may be set by more than
 * one of these groups, and the original if-chain processes them in exactly
 * this order (later declarations win).
 */
function computeDataDiagramFamilyOverride(
  styleMap: StyleMap,
  prefix: string,
  elementOverride: Partial<JsonGraphOverride>,
): Partial<JsonGraphOverride> {
  return {
    ...elementOverride,
    ...computeDataDiagramNodeOverride(styleMap, prefix),
    ...computeDataDiagramArrowOverride(styleMap, prefix),
    ...computeDataDiagramSeparatorOverride(styleMap, prefix),
    ...computeDataDiagramHighlightOverride(styleMap, prefix),
  };
}

/** `jsonDiagram { element / element.header / element.highlight / node / arrow / … }`. */
export function computeJsonFamilyOverride(styleMap: StyleMap): Partial<JsonGraphOverride> {
  return computeDataDiagramFamilyOverride(styleMap, 'jsondiagram', computeJsonElementOverride(styleMap));
}

/** `yamlDiagram { element / node / arrow / … }`. */
export function computeYamlFamilyOverride(styleMap: StyleMap): Partial<JsonGraphOverride> {
  return computeDataDiagramFamilyOverride(
    styleMap,
    'yamldiagram',
    computeDataDiagramHeaderElementOverride(styleMap, 'yamldiagram'),
  );
}

/** `hclDiagram { element / node / arrow / … }`. */
export function computeHclFamilyOverride(styleMap: StyleMap): Partial<JsonGraphOverride> {
  return computeDataDiagramFamilyOverride(
    styleMap,
    'hcldiagram',
    computeDataDiagramHeaderElementOverride(styleMap, 'hcldiagram'),
  );
}

/**
 * Style classes (`.h1`, `.h2` etc.) → per-class highlight color overrides,
 * used by `#highlight <<h1>>` directives to color individual rows. Returns
 * `undefined` when no `.`-prefixed selector sets any of the four supported
 * properties (matching the original "only assign when non-empty" gate).
 */
export function computeHighlightClassesOverride(
  styleMap: StyleMap,
): Record<string, HighlightClassEntry> | undefined {
  const highlightClasses: Record<string, HighlightClassEntry> = {};
  for (const [selector, props] of styleMap.entries()) {
    if (!selector.startsWith('.')) continue;
    const className = selector.slice(1);
    const classEntry: HighlightClassEntry = {};
    const bg = props.get('backgroundcolor');
    if (bg !== undefined) classEntry.background = resolveColor(bg);
    const fc = props.get('fontcolor');
    if (fc !== undefined) classEntry.fontColor = resolveColor(fc);
    const fs = props.get('fontstyle');
    if (fs !== undefined) {
      const lower = fs.toLowerCase();
      classEntry.fontBold = lower.includes('bold');
      classEntry.fontItalic = lower.includes('italic');
    }
    if (Object.keys(classEntry).length > 0) {
      highlightClasses[className] = classEntry;
    }
  }
  return Object.keys(highlightClasses).length > 0 ? highlightClasses : undefined;
}
