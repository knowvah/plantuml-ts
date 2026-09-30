/**
 * The mindmap's `StyleBuilder`: the style half of upstream's `SkinParam`
 * (java:155-265) replayed over a preprocessed source (decision D2).
 *
 * Upstream builds it while commands execute: `getCurrentStyleBuilder()`
 * lazily loads the default skin (`plantuml.skin`, or the `skin <name>`
 * `TitledDiagram.loadSkin` accepted), then every `skinparam` line
 * (`setParam`) and every `<style>` block (`CommandStyleMultilinesCSS`)
 * mutes it where it is dispatched. The port's preprocessor has already
 * collected both; `declarationOrder` puts them back in source order, the
 * same reading `style-skinparam-segments.ts#declarationsOf` makes (that
 * seam's segments are built for the flat `StyleMap` and cannot carry
 * `:depth(n)`/`*` selectors, so only its order is reused here).
 *
 * The parse replays them BETWEEN the mindmap commands
 * (`MindMapDiagramFactory.ts`, {@link positionedDeclarationsOf}): each
 * `Idea` captures the builder current when it is added (MindMap.java:124-125,
 * 139), so a `<style>` block after some ideas reaches only the later ones.
 *
 * Not ported: `applyPendingStyleMigration` (SkinParam.java:254-261) —
 * nothing in the jar ever puts into `paramsPendingForStyleMigration`
 * (grep of `src/main/java/net/`), so it is a no-op at every call site; and
 * `params`, the flat skinparam map the style engine never reads.
 */
import type { PreprocessorResult } from '../preprocessor.js';
import { readLines, StyleParser, StyleParsingException, trin } from './parser/StyleParser.js';
import { STRICTUML_SKIN } from './skins/plantuml-skin.js';
import type { Style } from './Style.js';
import type { StyleBuilder } from './StyleBuilder.js';
import { convertSkinparam as convertSkinparamDefault } from './FromSkinparamToStyle.js';
import { getMissingRootProperties, loadSkin, NoStyleAvailableException } from './StyleLoader.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:121 */
export const DEFAULT_SKIN = 'plantuml.skin';

/** `TitledDiagram.loadSkin`'s `newSkin + ".skin"`. @see TitledDiagram.java:161 */
const SKIN_EXTENSION = '.skin';

/**
 * `new FromSkinparamToStyle(key).convertNow(value, builder)` then
 * `getStyles()` — T3b's `convertSkinparam` (`FromSkinparamToStyle.ts`).
 */
export type ConvertSkinparam = (key: string, value: string, builder: StyleBuilder) => Style[];

/** What the builder reads from a `PreprocessorResult`. */
export type MindmapStyleSource = Pick<PreprocessorResult, 'skin' | 'skinparam' | 'styles' | 'declarationOrder'>;

type Declaration =
  | { readonly at: number; readonly key: string }
  | { readonly at: number; readonly style: string; readonly index: number };

/**
 * A {@link Declaration} placed in the document: it has executed before
 * every source line whose position is greater than `position`.
 */
export type PositionedDeclaration =
  { readonly position: number; readonly key: string } | { readonly position: number; readonly style: string };

/**
 * Each skinparam key (at its last assignment) and each `<style>` block on
 * the one declaration counter; a result with no order puts every
 * skinparam before every block (style-skinparam-segments.ts:33-42).
 */
function declarationsOf(source: MindmapStyleSource): Declaration[] {
  const order = source.declarationOrder;
  const keyAt = (key: string): number => order?.skinparam.get(key) ?? -1;
  const styleAt = (i: number): number => order?.styles[i] ?? Number.MAX_SAFE_INTEGER;
  return [
    ...[...source.skinparam.keys()].map((key) => ({ at: keyAt(key), key })),
    ...source.styles.map((style, index) => ({ at: styleAt(index), style, index })),
  ].sort((a, b) => a.at - b.at);
}

/**
 * {@link declarationsOf} with a document position each: a `<style>` block
 * sits at its opening tag's line (`stylePositions`, parallel to
 * `pre.styles`); a skinparam — for which the preprocessor records only its
 * place on the declaration counter, not a line — sits at the position of
 * the declaration before it (-1, before every line, when none is), as does
 * a block with no recorded line. So the relative order of the two streams
 * is exact, and a skinparam executes no later than upstream would; one
 * written AFTER an idea but before the next `<style>` block is applied
 * early (no corpus mindmap has one).
 */
export function positionedDeclarationsOf(
  pre: MindmapStyleSource,
  stylePositions: readonly (number | undefined)[],
): PositionedDeclaration[] {
  let position = -1;
  return declarationsOf(pre).map((declaration) => {
    if (!('style' in declaration)) return { position, key: declaration.key };
    position = stylePositions[declaration.index] ?? position;
    return { position, style: declaration.style };
  });
}

/** `\<\<(.*?)\>\>`. @see SkinParam.java:197-198 */
const STEREO_PATTERN = /<<(.*?)>>/g;

/**
 * The skinparam keys `key` stands for: lowercased, `_`/`.` removed, the
 * `sequence(participant|actor)` and `<type>arrow` prefixes collapsed,
 * `align` at the end widened, then one key per `<<stereotype>>`, each with
 * every stereotype removed and that one re-appended.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:279-301
 */
export function cleanForKeySlow(key: string): string[] {
  key = trin(key.toLowerCase());
  key = key.replace(/_|\./g, '');
  key = key.replace(/sequence(participant|actor)/g, '$1');
  key = key.replace(/(activity|class|component|object|sequence|state|usecase)arrow/g, 'arrow');
  key = key.replace(/align$/, 'alignment');

  const bare = key.replace(STEREO_PATTERN, '');
  const result = [...key.matchAll(STEREO_PATTERN)].map((m) => `${bare}<<${m[1]!}>>`);
  if (result.length === 0) result.push(key);
  return result;
}

/**
 * `MultilinesStrategy.REMOVE_STARTING_QUOTE`: a line whose trimmed form
 * starts with `'` is dropped before the block is parsed.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/MultilinesStrategy.java:46-63
 */
function removeStartingQuote(lines: readonly string[]): string[] {
  return lines.filter((s) => !trin(s).startsWith("'"));
}

/**
 * The style members of upstream's `SkinParam`. Mutable, as upstream: the
 * builder is created on first use and replaced by every `muteStyle`, so a
 * caller holding an earlier `getCurrentStyleBuilder()` keeps the earlier
 * style (an `Idea`, MindMap.java:124-125).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:124-265
 */
export class SkinParam {
  /** @see SkinParam.java:124 */
  private skin = DEFAULT_SKIN;
  /** @see SkinParam.java:125 */
  private styleBuilder: StyleBuilder | undefined;

  constructor(private readonly convertSkinparam: ConvertSkinparam) {}

  /** @see SkinParam.java:156-162 */
  getCurrentStyleBuilder(): StyleBuilder {
    this.styleBuilder ??= this.getCurrentStyleBuilderInternal();
    return this.styleBuilder;
  }

  /** @see SkinParam.java:164-167 */
  muteStyle(modifiedStyles: Iterable<Style>): void {
    this.styleBuilder = this.getCurrentStyleBuilder().muteStyle(modifiedStyles);
  }

  /** @see SkinParam.java:174-177 */
  setDefaultSkin(newSkin: string): void {
    this.skin = newSkin;
  }

  /** The requested skin, else the default one. @see SkinParam.java:183-197 */
  private getCurrentStyleBuilderInternal(): StyleBuilder {
    try {
      return loadSkin(this.skin);
    } catch (e) {
      if (!(e instanceof StyleParsingException || e instanceof NoStyleAvailableException)) throw e;
    }
    return loadSkin(DEFAULT_SKIN);
  }

  /**
   * Each cleaned key converted and muted; `style strictuml` then mutes
   * with `strictuml.skin`.
   * @see SkinParam.java:227-252
   */
  setParam(key: string, value: string): void {
    for (const key2 of cleanForKeySlow(key))
      this.muteStyle(this.convertSkinparam(key2, value, this.getCurrentStyleBuilder()));

    if (key.toLowerCase() === 'style' && value.toLowerCase() === 'strictuml')
      this.muteStyle(new StyleParser(this.getCurrentStyleBuilder()).parse(readLines(STRICTUML_SKIN)));
  }

  /** `CommandStyleMultilinesCSS.executeNow` on the block's inner lines. @see CommandStyleMultilinesCSS.java:85-90 */
  executeStyle(block: string): void {
    const lines = removeStartingQuote(readLines(block));
    this.muteStyle(new StyleParser(this.getCurrentStyleBuilder()).parse(lines));
  }
}

/**
 * `TitledDiagram.loadSkin`: the default skin becomes `<name>.skin` only
 * when that sheet loads and defines every mandatory root property (else
 * upstream reports a command error and keeps the default).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/TitledDiagram.java:159-182
 */
function loadSkinCommand(skinParam: SkinParam, newSkin: string): void {
  const filename = newSkin + SKIN_EXTENSION;
  let styleBuilder: StyleBuilder;
  try {
    styleBuilder = loadSkin(filename);
  } catch (e) {
    if (e instanceof NoStyleAvailableException || e instanceof StyleParsingException) return;
    throw e;
  }
  if (getMissingRootProperties(styleBuilder).length > 0) return;
  skinParam.setDefaultSkin(filename);
}

/**
 * The mindmap's style storage after the skin, then every skinparam and
 * `<style>` block in source order. `convertSkinparam` is T3b's
 * `FromSkinparamToStyle` bridge.
 *
 * A `skin` line is applied first: the preprocessor records no position for
 * it, while upstream ignores a `skin` read after the builder already exists
 * (SkinParam.java:157-160 is lazy; jar-probed: `skinparam hyperlinkColor
 * red` then `skin rose` keeps plantuml.skin).
 *
 * @throws StyleParsingException from a `<style>` block upstream rejects
 *   (`CommandStyleMultilinesCSS.java:92-93` turns it into a command error).
 */
export function buildMindmapStyleBuilder(
  pre: MindmapStyleSource,
  convertSkinparam: ConvertSkinparam = convertSkinparamDefault,
): StyleBuilder {
  const skinParam = createMindmapSkinParam(pre, convertSkinparam);
  for (const declaration of declarationsOf(pre)) executeDeclaration(skinParam, declaration, pre.skinparam);
  return skinParam.getCurrentStyleBuilder();
}

/**
 * The diagram's style `SkinParam` before any skinparam or `<style>`
 * block has executed — only the `skin` line applied (see
 * {@link buildMindmapStyleBuilder} for why it goes first).
 */
export function createMindmapSkinParam(
  pre: Pick<MindmapStyleSource, 'skin'>,
  convertSkinparam: ConvertSkinparam = convertSkinparamDefault,
): SkinParam {
  const skinParam = new SkinParam(convertSkinparam);
  if (pre.skin !== undefined) loadSkinCommand(skinParam, pre.skin);
  return skinParam;
}

/**
 * One declaration as its command executes it: `CommandSkinParam`
 * (`setParam`, SkinParam.java:227-252) or `CommandStyleMultilinesCSS`
 * (java:85-90).
 * @throws StyleParsingException from a `<style>` block upstream rejects.
 */
export function executeDeclaration(
  skinParam: SkinParam,
  declaration: { readonly key: string } | { readonly style: string },
  skinparam: ReadonlyMap<string, string>,
): void {
  if ('style' in declaration) skinParam.executeStyle(declaration.style);
  else skinParam.setParam(declaration.key, skinparam.get(declaration.key)!);
}
