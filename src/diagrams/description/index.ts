/**
 * Description diagram plugin — the consolidated engine for component, use-case,
 * and deployment diagrams (upstream `DescriptionDiagramFactory`). Wires the
 * merged parser, symbol-aware layout, and the klimt-backed renderer (T17
 * cutover) into one SyncPlugin keyed off the full
 * `CommandCreateElementFull.ALL_TYPES` keyword set.
 */

import type { UmlSource } from '../../core/block-extractor.js';
import type { SyncPlugin, CompleteSvg, RenderFragment } from '../../core/dispatcher.js';
import { internalSpriteStoreFrom } from '../../core/internal-sprite-store.js';
import { internalEmojiStoreFrom } from '../../core/internal-emoji-store.js';
import type { DescriptionDiagramAST } from './ast.js';
import type { DescriptionGeometry } from './layout.js';
import type { ElkBackend } from '../../core/elk/elk-backend.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { seedOf } from '../../core/klimt/drawing/svg/svg-graphics-core.js';
import { parseDescription } from './parser.js';
import { layoutDescription } from './layout.js';
import { layoutDescriptionElk } from './description-elk-adapter.js';
import { ELK_RENDER_SYNC_UNSUPPORTED } from '../../core/elk/layout-services.js';
import {
  CUCA_DOCUMENT_MARGIN_BOTTOM,
  CUCA_DOCUMENT_MARGIN_LEFT,
  CUCA_DOCUMENT_MARGIN_RIGHT,
  CUCA_DOCUMENT_MARGIN_TOP,
} from '../../core/atmp/CucaDiagram.js';
import { degenerateBlockDims, renderDescription, unwrapKlimtSvg } from './renderer.js';
import { isEmpty } from '../../core/annotations/index.js';

/**
 * Reconstructs the raw `@start.../@end...` block text `UmlSource.seed()`
 * (see `svg-graphics-core.ts#seedOf`'s doc comment) hashes upstream.
 *
 * `UmlSource.lines` (this port's `block-extractor.ts`) already strips the
 * `@start`/`@end` marker lines and trims leading/trailing blanks before the
 * plugin ever sees them, so the exact original marker token (`@startuml` vs
 * `@startcomponent`, any trailing title text, and any blank lines the
 * extractor trimmed) is unrecoverable at this layer — a known, documented
 * gap (see the T17 mission report). `@startuml`/`@enduml` is the closest
 * reconstructable approximation and matches the common case exactly.
 *
 * This only affects the seed-derived gradient/shadow/filter ids
 * (`SvgGraphicsCore`'s `filterUid`/`shadowId`/`gradientId`) — diagrams with
 * no gradient fill or shadow never reference those ids anywhere in the
 * rendered SVG, so the approximation is invisible for the overwhelming
 * majority of description diagrams.
 */
function reconstructSourceForSeed(block: UmlSource): string {
  // Prefer the RAW block lines (`@start`/`@end` + directives included) --
  // the exact list the jar's `UmlSource.seed()` hashes. Falls back to the
  // directive-stripped interior wrapped in `@startuml`/`@enduml` for
  // hand-built literal fixtures that carry no raw source (always directive-
  // free, so the two agree). See `UmlSource.rawSourceLines`'s doc comment.
  // cdd3-T27: the preprocessed list upstream really hashes wins when present
  // (`PSystemBuilder.java:232-240`, `assemble-svg.ts#seedOfUmlSource`).
  if (block.seedSourceLines !== undefined) return block.seedSourceLines.join('\n');
  if (block.rawSourceLines !== undefined) return block.rawSourceLines.join('\n');
  return ['@startuml', ...block.lines, '@enduml'].join('\n');
}

/**
 * The ELK maker's geometry (`SvekResult`'s stand-in): `MyElkDrawing#calculateDimension` is the margin-less block
 * the chrome composes around (`TextBlockExporter` then adds `CucaDiagram#getDefaultMargins`, as it does for svek).
 */
function layoutElkGeometry(
  ast: DescriptionDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  backend: ElkBackend,
): DescriptionGeometry {
  const { drawing, block } = layoutDescriptionElk(ast, theme, measurer, backend);
  return {
    totalWidth: block.getWidth() + CUCA_DOCUMENT_MARGIN_LEFT + CUCA_DOCUMENT_MARGIN_RIGHT,
    totalHeight: block.getHeight() + CUCA_DOCUMENT_MARGIN_TOP + CUCA_DOCUMENT_MARGIN_BOTTOM,
    nodes: [],
    edges: [],
    elk: drawing,
    preChromeWidth: block.getWidth(),
    preChromeHeight: block.getHeight(),
    ...(ast.seed !== undefined ? { seed: ast.seed } : {}),
    ...(ast.sprites !== undefined ? { sprites: ast.sprites } : {}),
    ...(ast.scale !== undefined ? { scale: ast.scale } : {}),
  };
}

export const descriptionPlugin: SyncPlugin<DescriptionDiagramAST, DescriptionGeometry> = {
  type: 'description',

  parse(block, options) {
    // F4-f piece 1: ADR-2's asset channel reaches the parser here and
    // nowhere else. `SkinParam#getSprite` (java:801-807) consults the
    // per-diagram registry FIRST and `SpriteImage.fromInternal`'s
    // classpath bundle second, so the internal store must be attached at
    // registry-construction time -- `sprite $N jar:<path>` resolves while
    // the command executes (`CommandSpriteFile.java:108-112`), i.e. during
    // this call, not later at layout/render time.
    const ast = parseDescription(
      block,
      options?.assetStore === undefined ? undefined : internalSpriteStoreFrom(options.assetStore),
      // Same channel, separate store: emoji artwork resolves by codepoint,
      // sprites by bundle path, and only sprites have the .svg/.png probe.
      options?.assetStore === undefined ? undefined : internalEmojiStoreFrom(options.assetStore),
    );
    // T17 seed thread (see ast.ts's `DescriptionDiagramAST.seed` doc
    // comment) — computed once here, at the only point the raw source text
    // is available anywhere in the plugin pipeline.
    return { ...ast, seed: seedOf(reconstructSourceForSeed(block)) };
  },

  // cdd3-T28 (E3-9): the layout measurer rides on the geometry so `render`
  // draws `<text textLength>` with the measurer that sized the layout --
  // `SyncPlugin#render(geo, theme)` has no measurer parameter (the class
  // plugin carries it the same way, `class/index.ts#layoutSync`).
  // cdd8 T3b: `!pragma layout elk` (CommandPragma.java:128-129, CucaDiagram.java:478-479, 950-952) swaps in
  // `CucaDiagramFileMakerElk`. A diagram that requires ELK must not silently fall back to dot-engine.
  requiresElk(ast) {
    return ast.layoutEngine === 'elk';
  },

  layoutSync(ast, theme, measurer, services) {
    const chromed = ast.annotations !== undefined && !isEmpty(ast.annotations);
    const chrome = chromed ? { chromed: true as const } : {};
    if (ast.layoutEngine === 'elk' && ast.nodes.length > 0) {
      if (services?.elk === undefined) throw new Error(ELK_RENDER_SYNC_UNSUPPORTED);
      return { ...layoutElkGeometry(ast, theme, measurer, services.elk), measurer, ...chrome };
    }
    return { ...layoutDescription(ast, theme, measurer), measurer, ...chrome };
  },

  render(geo, theme): CompleteSvg | RenderFragment {
    // klimt (renderDescription) emits a complete document itself and does
    // not route through the shared svgRoot assembler (decisions.md D2) —
    // its chrome, when T7 lands, applies inside its own klimt pipeline.
    const svg =
      geo.measurer === undefined ? renderDescription(geo, theme) : renderDescription(geo, theme, geo.measurer);
    if (geo.chromed !== true) return { completeSvg: svg };
    // lgm-T1c: chrome is composed around the margin-less block, so the klimt
    // document is unwrapped here and declares that block -- see
    // `DescriptionGeometry#chromed`.
    const block =
      geo.degenerate === true
        ? { preChromeWidth: degenerateBlockDims(geo).width, preChromeHeight: degenerateBlockDims(geo).height }
        : geo.preChromeWidth !== undefined && geo.preChromeHeight !== undefined
          ? { preChromeWidth: geo.preChromeWidth, preChromeHeight: geo.preChromeHeight }
          : {};
    return {
      ...unwrapKlimtSvg(svg, theme.colors.background),
      ...block,
      ...(geo.frameInk !== undefined ? { frameInk: geo.frameInk } : {}),
      // codd-T4: a style `Margin` (`TextBlockExporter.java:510-516`) is the margin the exporter applies AFTER chrome.
      ...(theme.diagramMargin !== undefined ? { documentMargin: theme.diagramMargin } : {}),
      // codd-T4: scale/dpi resolve against the chrome-composed dimension, at assembly.
      ...(geo.scale !== undefined ? { scaleSpec: geo.scale } : {}),
      ...(theme.dpi !== undefined ? { dpi: theme.dpi } : {}),
    };
  },
};
