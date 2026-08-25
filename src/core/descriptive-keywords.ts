/**
 * Shared descriptive-keyword table — single source of truth for the descriptive
 * diagram engine (component / use-case / deployment).
 *
 * Mirrors upstream PlantUML's `CommandCreateElementFull.ALL_TYPES`
 * (`net.sourceforge.plantuml.descdiagram.command`), which keys every descriptive
 * element off one keyword set, each carrying a `USymbol` shape. Consumed by the
 * Phase-1 dispatch guard (`class`/`sequence` `accepts()`) and the Phase-2
 * description engine (AST, parser, layout, renderer).
 *
 * See plans/consolidate-description-engine/decisions.md — D2 (full `ALL_TYPES`),
 * D3 (descriptive-signal guard, exclusions `interface`/`package`/`actor`).
 */

import {
  isSpriteMultilineOpenLine,
  isSpriteMultilineCloseLine,
  isSvgSpriteOpenLine,
  isSvgSpriteCloseLine,
} from './sprite-commands.js';

/**
 * Every shape in upstream `ALL_TYPES`, plus `note` — a leaf entity created by
 * `CommandFactoryNote`/`CommandFactoryNoteOnEntity`/`CommandFactoryNoteOnLink`
 * (`net.sourceforge.plantuml.command.note`), never dispatched through the
 * `ALL_TYPES` keyword table (notes have their own `note ...` grammar).
 * Business variants of `actor`/`usecase` (upstream `actor/` / `usecase/`) map
 * to the `-business` symbols. The `port` symbol covers the `port` / `portin` /
 * `portout` keywords.
 */
export type USymbol =
  | 'component'
  | 'interface'
  | 'node'
  | 'package'
  | 'folder'
  | 'frame'
  | 'cloud'
  | 'database'
  | 'storage'
  | 'actor'
  | 'actor-business'
  | 'usecase'
  | 'usecase-business'
  | 'rectangle'
  | 'artifact'
  | 'card'
  | 'file'
  | 'queue'
  | 'stack'
  | 'agent'
  | 'boundary'
  | 'control'
  | 'entity'
  | 'person'
  | 'hexagon'
  | 'label'
  | 'circle'
  | 'collections'
  | 'port'
  | 'action'
  | 'process'
  | 'note';

/**
 * Keyword → `USymbol`, in upstream `ALL_TYPES` declaration order. Business
 * variants (`actor/`, `usecase/`) precede their plain forms, mirroring upstream
 * so the longer token is preferred during alternation. The single source the
 * other exports are derived from — never hand-duplicate this list.
 */
const KEYWORD_SYMBOL_ENTRIES: readonly (readonly [string, USymbol])[] = [
  ['person', 'person'],
  ['artifact', 'artifact'],
  ['actor/', 'actor-business'],
  ['actor', 'actor'],
  ['folder', 'folder'],
  ['card', 'card'],
  ['file', 'file'],
  ['package', 'package'],
  ['rectangle', 'rectangle'],
  ['hexagon', 'hexagon'],
  ['label', 'label'],
  ['node', 'node'],
  ['frame', 'frame'],
  ['cloud', 'cloud'],
  ['action', 'action'],
  ['process', 'process'],
  ['database', 'database'],
  ['queue', 'queue'],
  ['stack', 'stack'],
  ['storage', 'storage'],
  ['agent', 'agent'],
  // `archimate` is NOT part of upstream `CommandCreateElementFull.ALL_TYPES`
  // -- it is its own dedicated command (`descdiagram/command/
  // CommandArchimate.java`, mandatory `#color` token then CODE/DISPLAY,
  // `as <alias>` supported) registered separately in the diagram factory.
  // T8 (description-leaf-sizing-audit) wires only its single-line leaf
  // form here; `CommandArchimateMultilines` (`[ … ]` body) and
  // `CommandArchimatePackage` (`{ … }` group) are filed, not implemented
  // (plans/s1l-leaf-sizing/ledger.md).
  //
  // Mapped to the EXISTING 'rectangle' USymbol, not a new 'archimate' tag:
  // upstream's `USymbols.ARCHIMATE = new USymbolRectangle(SName.archimate)`
  // is the SAME `USymbolRectangle` class `USymbols.RECTANGLE` uses, just
  // parameterized with a different `SName` -- and `SName` is read ONLY by
  // `getSNames()` (CSS/stereotype class naming during `drawU`), never by
  // `asSmall`/`asBig`'s `calculateDimension` (verified: `USymbolRectangle
  // .ts` never reads `this.sname` in either). Sizing is therefore
  // byte-identical to plain `rectangle`. Reaching the TRUE `USymbols
  // .ARCHIMATE` singleton (for its distinct CSS class) would require a new
  // `fromStringWithSkinParam` branch in `core/svek/image/
  // EntityImageDescriptionSupport.ts` -- out of this task's write-set;
  // filed in the ledger as a rendering-fidelity follow-up, not a sizing gap.
  ['archimate', 'rectangle'],
  ['usecase/', 'usecase-business'],
  ['usecase', 'usecase'],
  ['component', 'component'],
  ['boundary', 'boundary'],
  ['control', 'control'],
  ['entity', 'entity'],
  ['interface', 'interface'],
  ['circle', 'circle'],
  ['collections', 'collections'],
  ['port', 'port'],
  ['portin', 'port'],
  ['portout', 'port'],
];

/** The descriptive keyword list (lowercase), in upstream declaration order. */
export const ALL_TYPES: readonly string[] =
  KEYWORD_SYMBOL_ENTRIES.map(([keyword]) => keyword);

/** Keyword → `USymbol` shape lookup. */
export const KEYWORD_TO_SYMBOL: ReadonlyMap<string, USymbol> = new Map(
  KEYWORD_SYMBOL_ENTRIES,
);

export function stripSpriteRegions(lines: readonly string[]): string[] {
  const out: string[] = [];
  let inSprite = false;
  let inSvgSprite = false;
  for (const line of lines) {
    const t = line.trim();
    if (inSprite) {
      if (isSpriteMultilineCloseLine(t)) inSprite = false;
      continue;
    }
    // S1L-f part 2b: the `sprite name <svg …>` form needs the same treatment
    // — the bootstrap bundle is ~7200 lines of them, which buries the real
    // diagram content far past SCAN_LINE_LIMIT.
    if (inSvgSprite) {
      if (isSvgSpriteCloseLine(t)) inSvgSprite = false;
      continue;
    }
    if (isSvgSpriteOpenLine(t)) {
      inSvgSprite = true;
      continue;
    }
    if (isSpriteMultilineOpenLine(t)) {
      inSprite = true;
      continue;
    }
    out.push(line);
  }
  return out;
}
