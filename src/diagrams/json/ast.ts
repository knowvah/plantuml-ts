/**
 * AST types for PlantUML JSON diagrams (@startjson / @endjson).
 */

import type { DiagramAnnotations } from '../../core/annotations/index.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import type { ScaleSpec } from '../../core/scale-command.js';

export interface HighlightDirective {
  readonly path: readonly string[];
  /** Style class name, e.g. 'h1', 'h2'. Empty string means no named class. */
  readonly styleClass: string;
}

export interface JsonDiagramAST {
  /** Parsed JSON value. Check parseError to distinguish null-as-value from parse failure. */
  root: unknown;
  /** True when JSON.parse failed (invalid JSON body). When false, root may still be null. */
  parseError: boolean;
  /**
   * The diagram type as it appears in the parse-failure message — upstream
   * builds `"Your data does not sound like " + getDiagramType() + " data"`
   * (`JsonDiagram.java:114-115`), so it reads JSON, YAML or HCL.
   *
   * Only the json parser currently reports `parseError`, so only `'JSON'` is
   * reachable today; the field exists so the message cannot silently say JSON
   * once yaml or hcl learn to report one. Defaults to `'JSON'` when unset.
   */
  diagramLabel?: 'JSON' | 'YAML' | 'HCL';
  /** Highlight directives from #highlight lines, each carrying a path and optional style class. */
  highlights: ReadonlyArray<HighlightDirective>;
  /**
   * title/caption/legend/header/footer/mainframe chrome (mission G0b/T6,
   * T8). `title` used to live on a separate bespoke field with its own
   * `titleOffset` layout reservation and renderer draw call (decisions.md
   * D10); T8 removed that whole chain -- title now flows through here like
   * the other five and is drawn once, centrally, by `applyChrome`
   * (src/index.ts). Shared by json/yaml/hcl (hcl never had a bespoke title
   * field to begin with).
   * Always populated by `parseJson`/`parseYaml`/`parseHcl` (default
   * `createAnnotations()`).
   */
  annotations?: DiagramAnnotations;
  /**
   * `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4),
   * populated by {@link matchSpriteCommand} at the SAME dispatch position
   * as {@link matchAnnotationCommand} (tried immediately after it, mirroring
   * upstream's `CommonCommands.addTitleCommands` then `addCommonCommands2`
   * registration order). Optional so hand-authored AST literal fixtures
   * compile unchanged; a real `parseJson/parseYaml/parseHcl()` call always sets it via
   * `createSpriteRegistry()`.
   */
  sprites?: SpriteRegistry;
  /**
   * The `scale …` directive, if the block carried one.
   *
   * Upstream captures this in `StyleExtractor.java:82-83` — one of the six
   * directives the json family's hand-rolled parser recognises at all — and
   * `JsonDiagram.java:90-99` then runs the captured line through
   * `CommonCommands.addCommonScaleCommands` against the diagram. All three of
   * `@startjson`/`@startyaml`/`@starthcl` share that path, because the yaml
   * and hcl factories both construct a `JsonDiagram`.
   *
   * Type-carrying only: resolved to a numeric factor at render time, against
   * the UNSCALED document dimensions, exactly as
   * `TextBlockExporter#computeScaleFactor` does.
   */
  scale?: ScaleSpec;
  /**
   * Parse-time degradations this diagram's own grammar can't represent
   * losslessly -- e.g. yaml's `KEY_AND_FOLDED_STYLE` (`>`), which this
   * port does not implement and folds to an empty value rather than
   * throwing (`yaml-parser.ts`). Surfaced by {@link surfaceParseWarnings},
   * the same `RenderOptions.onWarning`-only channel `surfaceSpriteWarnings`
   * uses for sprite-collision warnings -- no Node global or `console.*` is
   * touched here either. Optional and normally absent (`parseJson` never
   * sets it; `parseHcl` has no degrading construct yet either).
   */
  parseWarnings?: readonly string[];
}

/**
 * The render pipeline's channel for {@link JsonDiagramAST.parseWarnings}:
 * `renderSync()`/`render()` call this once per parsed AST, right after
 * `plugin.parse()`, alongside `surfaceSpriteWarnings` (`src/index.ts`'s
 * `prepareBlock`). `ast` is `unknown` for the same reason
 * `surfaceSpriteWarnings` treats it structurally rather than validating it
 * as a boundary: it is this pipeline's own trusted `plugin.parse()` output,
 * never external input (`~/.claude/rules/security.md`).
 *
 * A no-op when `onWarning` is omitted, matching `surfaceSpriteWarnings`.
 */
export function surfaceParseWarnings(ast: unknown, onWarning: ((message: string) => void) | undefined): void {
  if (onWarning === undefined) return;
  if (typeof ast !== 'object' || ast === null || !('parseWarnings' in ast)) return;
  const warnings = (ast as { parseWarnings?: readonly string[] }).parseWarnings;
  warnings?.forEach((message) => onWarning(message));
}
