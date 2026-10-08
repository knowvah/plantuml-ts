/**
 * The sequence diagram's merged-style `Shadowing`, per element (unwind2-S9,
 * S9b).
 *
 * Upstream reads each element's drop shadow off ONE merged `Style`, through
 * `Style#getSymbolContext` (`Style.java:109-115,277-281`):
 *
 * - an activation box merges `..., activationBox` (`skin/ComponentType
 *   .java:82-84`, `teoz/LiveBoxesDrawer.java:140`);
 * - a divider merges `..., separator` (`skin/ComponentType.java:89-90`);
 * - a grouping frame merges `root, element, sequenceDiagram, group`
 *   (`sequencediagram/Grouping.java:58-62`), a `ref` frame `..., reference`
 *   (`Reference.java:66-67,111`);
 * - a participant merges its kind's signature (`ParticipantType.java:54-82`)
 *   `withTOBECHANGED(stereotype)` (`Participant.java:86-96`);
 * - a note merges `..., note[, hnote|rnote]` (`NoteStyle.java:66-74`) with
 *   its stereotype's own styles (`Note.java:75-82`, `Stereotype.java:185-193`).
 *
 * The merge is PRIORITY-ordered, not specificity-ordered (see
 * `activity-circle-style.ts`'s head comment for the citation chain), so
 * `skinparam shadowing true` -- `root { Shadowing 3 }`,
 * `FromSkinparamToStyle.java:306-310,331-332` -- beats `plantuml.skin`'s
 * earlier `element { Shadowing 0.0 }` (`plantuml.skin:92`). This replays it
 * with the faithful style engine ({@link buildMindmapStyleBuilder}).
 *
 * Not modelled: upstream captures the builder CURRENT when each element's
 * command executes, so a `<style>` written after an element does not reach
 * it; this resolves the whole document's declarations once, as
 * `activity-circle-style.ts` does.
 */
import type { PreprocessorResult } from './preprocessor.js';
import { Stereotype } from './stereo/Stereotype.js';
import type { Theme } from './theme.js';
import { buildMindmapStyleBuilder } from './style/mindmap-style-builder.js';
import { StyleParsingException } from './style/parser/StyleParser.js';
import type { SName } from './style/SName.js';
import type { StyleBuilder } from './style/StyleBuilder.js';
import type { StyleSignature } from './style/StyleSignature.js';
import { StyleSignatureBasic } from './style/StyleSignatureBasic.js';

/** What the resolution reads from a preprocessed block. */
export type SequenceShadowSource = Pick<PreprocessorResult, 'skin' | 'skinparam' | 'styles' | 'declarationOrder'>;

/** A participant kind's own SName (`ParticipantType.java:54-82`). */
export type SequenceParticipantSName =
  'participant' | 'actor' | 'boundary' | 'control' | 'entity' | 'queue' | 'database' | 'collections';

/** A note keyword (`NoteStyle.java:46-54`). */
export type SequenceNoteStyle = 'note' | 'hnote' | 'rnote';

/** Each sequence element's `getShadowing()`. */
export interface SequenceShadowing {
  /** `Grouping.java:62`: every `group`/`alt`/`loop`/... frame. */
  readonly group: number;
  /** `Reference.java:67`: a `ref over` frame. */
  readonly reference: number;
  /** `ComponentType.java:82-84`: an activation box, read by
   *  `LiveBoxesDrawer#drawInternal` (`LiveBoxesDrawer.java:140`). */
  readonly activation: number;
  /** `ComponentType.java:89-90`: a `== divider ==` (`ComponentRoseDivider
   *  .java:74,100,115`). */
  readonly divider: number;
  /** A participant head/tail of `kind`, `stereotype` as written. */
  participant(kind: SequenceParticipantSName, stereotype?: string): number;
  /** A note of keyword `style`, `stereotype` as written. */
  note(style: SequenceNoteStyle, stereotype?: string): number;
}

const SEQUENCE_ROOT: readonly SName[] = ['root', 'element', 'sequenceDiagram'];

/**
 * `plantuml.skin` sets `Shadowing 0.0` on `root` and `element` and nowhere
 * else (`plantuml.skin:18,92`), so a non-zero value needs a `skin` line or a
 * declaration that names shadowing: a `shadowing`/`<x>Shadowing` skinparam
 * (`FromSkinparamToStyle.java:279,306,331-334`) or a `<style>` `Shadowing`
 * property. Anything else resolves to 0 without building a style engine.
 */
function mayShadow(pre: SequenceShadowSource): boolean {
  if (pre.skin !== undefined) return true;
  const names = (text: string): boolean => text.toLowerCase().includes('shadow');
  return [...pre.skinparam.keys()].some(names) || pre.styles.some(names);
}

/** `getShadowing()` of a merged style; 0 when nothing matches. */
function shadowingOf(builder: StyleBuilder, signature: StyleSignature): number {
  return signature.getMergedStyle(builder)?.getShadowing() ?? 0;
}

/** `Stereotype.build`, or nothing for an absent/blank label. */
function stereotypeOf(label: string | undefined): Stereotype | undefined {
  return label === undefined || label.trim() === '' ? undefined : Stereotype.build(label);
}

/** `Note#getUsedStyles` (`Note.java:75-82`): the note signature merged with
 *  `stereotype.getStyles(styleBuilder)` (`Stereotype.java:185-193`). */
function noteSignature(builder: StyleBuilder, style: SequenceNoteStyle, label?: string): StyleSignature {
  const path: SName[] = style === 'note' ? ['note'] : ['note', style];
  const signature = StyleSignatureBasic.of(...SEQUENCE_ROOT, ...path);
  const stereotype = stereotypeOf(label);
  if (stereotype === undefined) return signature;
  return signature.mergeWith(stereotype.getStyleNames().map((name) => builder.createStyleStereotype(name)));
}

/** A memoizing {@link SequenceShadowing} over one builder. */
function shadowingFrom(builder: StyleBuilder): SequenceShadowing {
  const memo = new Map<string, number>();
  const cached = (key: string, compute: () => number): number => {
    let value = memo.get(key);
    if (value === undefined) memo.set(key, (value = compute()));
    return value;
  };
  return {
    group: shadowingOf(builder, StyleSignatureBasic.of(...SEQUENCE_ROOT, 'group')),
    reference: shadowingOf(builder, StyleSignatureBasic.of(...SEQUENCE_ROOT, 'reference')),
    activation: shadowingOf(builder, StyleSignatureBasic.of(...SEQUENCE_ROOT, 'activationBox')),
    divider: shadowingOf(builder, StyleSignatureBasic.of(...SEQUENCE_ROOT, 'separator')),
    participant: (kind, label) =>
      cached(`p|${kind}|${label ?? ''}`, () =>
        shadowingOf(builder, StyleSignatureBasic.of(...SEQUENCE_ROOT, kind).withTOBECHANGED(stereotypeOf(label))),
      ),
    note: (style, label) =>
      cached(`n|${style}|${label ?? ''}`, () => shadowingOf(builder, noteSignature(builder, style, label))),
  };
}

/**
 * The elements' shadowing for `pre`, or `undefined` when no declaration can
 * shadow anything or a `<style>` block does not parse
 * (`CommandStyleMultilinesCSS.java:92-93` reports a command error).
 */
export function resolveSequenceShadowing(pre: SequenceShadowSource): SequenceShadowing | undefined {
  if (!mayShadow(pre)) return undefined;
  try {
    return shadowingFrom(buildMindmapStyleBuilder(pre));
  } catch (e) {
    if (e instanceof StyleParsingException) return undefined;
    throw e;
  }
}

/** `theme` with `graph.sequenceShadowing` set from `pre` (unchanged when
 *  {@link resolveSequenceShadowing} has nothing). */
export function withSequenceShadowing(theme: Theme, pre: SequenceShadowSource): Theme {
  const sequenceShadowing = resolveSequenceShadowing(pre);
  if (sequenceShadowing === undefined) return theme;
  return {
    ...theme,
    colors: { ...theme.colors, graph: { ...theme.colors.graph, sequenceShadowing } },
  };
}
