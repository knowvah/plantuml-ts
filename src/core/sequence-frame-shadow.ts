/**
 * The sequence grouping frames' merged-style `Shadowing` (unwind2-S9).
 *
 * Upstream reads each frame's drop shadow off ONE merged `Style`:
 * `Grouping`'s constructor merges `root, element, sequenceDiagram, group`
 * (`sequencediagram/Grouping.java:58-62`) and `Reference`'s merges `root,
 * element, sequenceDiagram, reference` (`Reference.java:66-67,111`).
 * `Style#getSymbolContext` turns `getShadowing()` into the `Fashion`'s delta
 * shadow (`Style.java:109-115,277-281`), which
 * `ComponentRoseGroupingHeader#drawBackgroundInternalU` (`skin/rose/
 * ComponentRoseGroupingHeader.java:131`) and `ComponentRoseReference
 * #drawInternalU` (`ComponentRoseReference.java:94`) hand to
 * `URectangle#setDeltaShadow`.
 *
 * The merge is PRIORITY-ordered, not specificity-ordered (see
 * `activity-circle-style.ts`'s head comment for the full citation chain), so
 * `skinparam shadowing true` -- `root { Shadowing 3 }`,
 * `FromSkinparamToStyle.java:306-310,331-332` -- beats `plantuml.skin`'s
 * earlier `element { Shadowing 0.0 }` (`plantuml.skin:92`). This replays it
 * with the faithful style engine ({@link buildMindmapStyleBuilder}).
 *
 * Not modelled: upstream captures the builder CURRENT when the frame's
 * command executes (`Grouping`/`Reference` constructors), so a `<style>`
 * written after a frame does not reach it; this resolves the whole
 * document's declarations once, as `activity-circle-style.ts` does.
 */
import type { PreprocessorResult } from './preprocessor.js';
import type { Theme } from './theme.js';
import { buildMindmapStyleBuilder } from './style/mindmap-style-builder.js';
import { StyleParsingException } from './style/parser/StyleParser.js';
import type { StyleBuilder } from './style/StyleBuilder.js';
import { StyleSignatureBasic } from './style/StyleSignatureBasic.js';

/** What the resolution reads from a preprocessed block. */
export type SequenceFrameShadowSource = Pick<PreprocessorResult, 'skin' | 'skinparam' | 'styles' | 'declarationOrder'>;

/** The two frame styles' `getShadowing()`. */
export interface SequenceFrameShadowing {
  /** `Grouping.java:62`: every `group`/`alt`/`loop`/... frame. */
  readonly group: number;
  /** `Reference.java:67`: a `ref over` frame. */
  readonly reference: number;
}

/**
 * `plantuml.skin` sets `Shadowing 0.0` on `root` and `element` and nowhere
 * else (`plantuml.skin:18,92`), so a non-zero value needs a `skin` line or a
 * declaration that names shadowing: a `shadowing`/`<x>Shadowing` skinparam
 * (`FromSkinparamToStyle.java:279,306,331-334`) or a `<style>` `Shadowing`
 * property. Anything else resolves to 0 without building a style engine.
 */
function mayShadow(pre: SequenceFrameShadowSource): boolean {
  if (pre.skin !== undefined) return true;
  const names = (text: string): boolean => text.toLowerCase().includes('shadow');
  return [...pre.skinparam.keys()].some(names) || pre.styles.some(names);
}

/** The merged style's `getShadowing()` for `root, element, sequenceDiagram,
 *  <leaf>`; 0 when nothing matches (`Style.java:109-115`). */
function shadowingOf(builder: StyleBuilder, leaf: 'group' | 'reference'): number {
  const style = StyleSignatureBasic.of('root', 'element', 'sequenceDiagram', leaf).getMergedStyle(builder);
  return style?.getShadowing() ?? 0;
}

/**
 * The frames' shadowing for `pre`, or `undefined` when both are 0 or a
 * `<style>` block does not parse (`CommandStyleMultilinesCSS.java:92-93`
 * reports a command error; the frames keep their no-shadow default).
 */
export function resolveSequenceFrameShadowing(pre: SequenceFrameShadowSource): SequenceFrameShadowing | undefined {
  if (!mayShadow(pre)) return undefined;
  let builder: StyleBuilder;
  try {
    builder = buildMindmapStyleBuilder(pre);
  } catch (e) {
    if (e instanceof StyleParsingException) return undefined;
    throw e;
  }
  const result = { group: shadowingOf(builder, 'group'), reference: shadowingOf(builder, 'reference') };
  return result.group > 0 || result.reference > 0 ? result : undefined;
}

/** `theme` with `graph.sequenceFrameShadowing` set from `pre` (unchanged
 *  when {@link resolveSequenceFrameShadowing} has nothing). */
export function withSequenceFrameShadowing(theme: Theme, pre: SequenceFrameShadowSource): Theme {
  const sequenceFrameShadowing = resolveSequenceFrameShadowing(pre);
  if (sequenceFrameShadowing === undefined) return theme;
  return {
    ...theme,
    colors: { ...theme.colors, graph: { ...theme.colors.graph, sequenceFrameShadowing } },
  };
}
