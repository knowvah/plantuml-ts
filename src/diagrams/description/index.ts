/**
 * Description diagram plugin — the consolidated engine for component, use-case,
 * and deployment diagrams (upstream `DescriptionDiagramFactory`). Wires the
 * merged parser, symbol-aware layout, and the klimt-backed renderer (T17
 * cutover) into one SyncPlugin keyed off the full
 * `CommandCreateElementFull.ALL_TYPES` keyword set.
 */

import type { UmlSource } from '../../core/block-extractor.js';
import type { SyncPlugin, CompleteSvg } from '../../core/dispatcher.js';
import { internalSpriteStoreFrom } from '../../core/internal-sprite-store.js';
import { internalEmojiStoreFrom } from '../../core/internal-emoji-store.js';
import type { DescriptionDiagramAST } from './ast.js';
import type { DescriptionGeometry } from './layout.js';
import { hasDescriptiveElement } from '../../core/descriptive-keywords.js';
import { seedOf } from '../../core/klimt/drawing/svg/svg-graphics-core.js';
import { parseDescription } from './parser.js';
import { layoutDescription } from './layout.js';
import { renderDescription } from './renderer.js';

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
  if (block.rawSourceLines !== undefined) return block.rawSourceLines.join('\n');
  return ['@startuml', ...block.lines, '@enduml'].join('\n');
}

export const descriptionPlugin: SyncPlugin<
  DescriptionDiagramAST,
  DescriptionGeometry
> = {
  type: 'description',

  accepts(lines: readonly string[]): boolean {
    // Claim any block carrying a full ALL_TYPES keyword (incl. interface/
    // package/actor, which this engine owns) or an element shorthand. Superset
    // of hasDescriptiveSignal — mirrors upstream's single DESCRIPTION factory.
    return hasDescriptiveElement(lines);
  },

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

  layoutSync(ast, theme, measurer) {
    return layoutDescription(ast, theme, measurer);
  },

  render(geo, theme): CompleteSvg {
    // klimt (renderDescription) emits a complete document itself and does
    // not route through the shared svgRoot assembler (decisions.md D2) —
    // its chrome, when T7 lands, applies inside its own klimt pipeline.
    return { completeSvg: renderDescription(geo, theme) };
  },
};
