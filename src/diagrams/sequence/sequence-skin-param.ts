/**
 * The sequence engine's style seam (sdd1 D1-D4): the style half of
 * upstream's `SkinParam` replayed per command, each sequence element's
 * `getStyleSignature`/`getUsedStyles`, and {@link paintOf}, the reads the
 * `skin/rose/ComponentRose*` classes make off the resulting `Style`.
 *
 * Upstream every event captures `getSkinParam().getCurrentStyleBuilder()`
 * at its command (`sequencediagram/SequenceDiagram.java:130,172,248,270,
 * 289,372,428`), and every `skinparam`/`<style>` mutes that builder where it
 * is dispatched (SkinParam.java:164-167). {@link createSequenceStyleDispatch}
 * / {@link executeDeclarationsBefore} are `WBSDiagramFactory.ts`'s
 * `createStyleDispatch`/`executeDeclarationsBefore` (D2), over the shared
 * `mindmap-style-builder.ts` (D4, imported unchanged).
 *
 * Kinds are carried as the port's AST strings where the AST already spells
 * them: a participant kind as its SName (`ast.ts#ParticipantType`, the
 * `ParticipantType.java:54-82` mapping is the identity), a note as its
 * keyword (`NoteStyle.getNoteStyle`, NoteStyle.java:46-54, maps it).
 *
 * A group/reference HEADER layers the nested `group { header }` /
 * `reference { header }` over the flat `groupHeader`/`referenceHeader` with
 * `Style#mergeNestedChildOver` (Style.java:158-173; Grouping.java:83-96,
 * Reference.java:85-97).
 */
import type { Colors } from '../../core/abel/Colors.js';
import type { UmlSource } from '../../core/block-extractor.js';
import type { SkinparamAssignment } from '../../core/preprocessor.js';
import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import {
  cleanForKeySlow,
  createMindmapSkinParam,
  executeDeclaration,
  positionedDeclarationsOf,
  type SkinParam as StyleSkinParam,
} from '../../core/style/mindmap-style-builder.js';
import { MergeStrategy } from '../../core/style/MergeStrategy.js';
import { StyleParsingException, trin } from '../../core/style/parser/StyleParser.js';
import type { SName } from '../../core/style/SName.js';
import type { Style } from '../../core/style/Style.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import type { StyleSignature } from '../../core/style/StyleSignature.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { HColor } from '../../core/style/Value.js';
import type { Url } from '../../core/url/Url.js';

// ---------------------------------------------------------------------------
// Dispatch (WBSDiagramFactory.ts#createStyleDispatch, D2)
// ---------------------------------------------------------------------------

const EMPTY_SKINPARAM: ReadonlyMap<string, string> = new Map<string, string>();

/** A hand-built source's style sources: no skin, no skinparam, no style. */
const EMPTY_STYLE_SOURCE: NonNullable<UmlSource['styleSource']> = {
  skinparam: new Map<string, string>(),
  styles: [],
};

/**
 * One declaration placed in the document. A skinparam carries its OWN value:
 * a key assigned twice executes twice, each with its value
 * (`SkinParam#setParam`, SkinParam.java:227-252, as `CommandSkinParam.java:101`
 * calls it).
 */
export type SequenceDeclaration =
  | { readonly position: number; readonly key: string; readonly value: string }
  | { readonly position: number; readonly style: string };

/** A `ColorParam` the sequence engine reads through `getHtmlColor`:
 *  `sequenceGroupBodyBackground` (`ColorParam.java:60`) at the group command
 *  (`SequenceDiagram.java:418-419`). */
export type SequenceColorParam = 'sequenceGroupBodyBackground';

/** `HColors.WHITE` is `set.getColorOrWhite("#FFFFFF")` (HColors.java:87). */
const WHITE_TOKEN = '#FFFFFF';

/**
 * The legacy half of upstream's `SkinParam`: the `params` map
 * (SkinParam.java:205) `setParam` fills beside the style conversion
 * (`:227-229`), and the reads a command makes off it at its own line.
 * Mutable, as upstream; `getValue`'s `cacheKeyValue` (`:323-340`) is never
 * cleared, so the FIRST read of a key fixes its answer for the rest of the
 * diagram (jar-verified: a `sequenceGroupBodyBackgroundColor` after the first
 * group, or a second one, reaches no later group). Precedent:
 * `wbs-skin-param.ts:92-136`.
 */
export class SequenceLegacyParams {
  /** @see SkinParam.java:205 */
  private readonly params = new Map<string, string>();
  /** @see SkinParam.java:323 */
  private readonly cacheKeyValue = new Map<string, string | null>();

  /** The `params` half of `setParam`. @see SkinParam.java:227-229 */
  setParam(key: string, value: string): void {
    for (const key2 of cleanForKeySlow(key)) this.params.set(key2, trin(value));
  }

  /** `valueIs(key, expected)`: `expected.equalsIgnoreCase(getValue(key))`.
   *  @see SkinParam.java:347-349 */
  valueIs(key: string, expected: string): boolean {
    return this.getValue(key)?.toLowerCase() === expected.toLowerCase();
  }

  /** @see SkinParam.java:325-340 */
  getValue(key: string): string | null {
    const cached = this.cacheKeyValue.get(key);
    if (cached !== undefined) return cached;
    const result = cleanForKeySlow(key).find((key2) => this.params.has(key2));
    const value = result === undefined ? null : this.params.get(result)!;
    this.cacheKeyValue.set(key, value);
    return value;
  }

  /**
   * `getHtmlColor(param, null, false)` (SkinParam.java:370-396; the only
   * sequence caller passes no stereotype and `clickable` false, and the
   * `background`/`arrowHead` transparent arm is not this param's), as the
   * RAW token a `FrameEvent` colour carries (`ast.ts`, resolved late by
   * `colorSet.getColor`): the value itself where `parseColor` accepts it,
   * else {@link WHITE_TOKEN} -- so `getColor(token)` is `getColorOrWhite(value)`
   * (HColorSet.java:58-63). `undefined` where upstream returns `null`.
   */
  getHtmlColorToken(param: SequenceColorParam): string | undefined {
    // `getParamName(param, false)`: `param.name() + "color"` (SkinParam.java:424-432).
    const value = this.getValue(`${param}color`);
    if (value === null) return undefined;
    return HColorSet.instance().getColorOrNull(value) === undefined ? WHITE_TOKEN : value;
  }
}

/**
 * The `skinparam`/`<style>` commands the preprocessor pulled out of the
 * source, still to be dispatched. Opaque to consumers: read the builder
 * through {@link currentStyleBuilder}.
 */
export interface SequenceStyleDispatch {
  readonly style: StyleSkinParam;
  /** The legacy `params` store, filled in step with {@link style}. */
  readonly params: SequenceLegacyParams;
  /** Source order; the head is the next to execute. */
  readonly pending: SequenceDeclaration[];
}

/**
 * Every declaration at its own document line (T1e): `<style>` blocks at
 * `stylePositions`, each skinparam assignment at `skinparamAssignments`
 * (a `skinparam NAME {` block at its opening line, `CommandSkinParamMultilines
 * .java:90-102`), ordered by line and then by the declaration counter. A
 * declaration the reader never located sits where the one before it does.
 */
function positionedSequenceDeclarations(
  styleSource: NonNullable<UmlSource['styleSource']>,
  stylePositions: readonly (number | undefined)[],
  assignments: readonly SkinparamAssignment[],
): SequenceDeclaration[] {
  const order = styleSource.declarationOrder;
  const located = [
    ...assignments.map((a) => ({
      at: a.order,
      position: a.position,
      declaration: { key: a.key, value: a.value },
    })),
    ...styleSource.styles.map((style, i) => ({
      at: order?.styles[i] ?? Number.MAX_SAFE_INTEGER,
      position: stylePositions[i],
      declaration: { style },
    })),
  ].sort((a, b) => a.at - b.at);
  let position = -1;
  return located
    .map((entry) => {
      position = entry.position ?? position;
      return { position, ...entry.declaration };
    })
    .sort((a, b) => a.position - b.position);
}

/** The diagram's style `SkinParam` before any declaration has executed. */
export function createSequenceStyleDispatch(source: UmlSource): SequenceStyleDispatch {
  const styleSource = source.styleSource ?? EMPTY_STYLE_SOURCE;
  const style = createMindmapSkinParam(styleSource);
  const params = new SequenceLegacyParams();
  if (source.skinparamAssignments === undefined)
    return {
      style,
      params,
      pending: positionedDeclarationsOf(styleSource, source.stylePositions ?? []).map((d) =>
        'style' in d ? d : { position: d.position, key: d.key, value: styleSource.skinparam.get(d.key)! },
      ),
    };
  return {
    style,
    params,
    pending: positionedSequenceDeclarations(styleSource, source.stylePositions ?? [], source.skinparamAssignments),
  };
}

/**
 * Executes every pending declaration placed before document line
 * `position`. A rejected `<style>` block is `CommandStyleMultilinesCSS`'s
 * command error (java:92-93), reported at line 0 (the preprocessor keeps no
 * line for it).
 */
export function executeDeclarationsBefore(dispatch: SequenceStyleDispatch, position: number): ParseRefusal | null {
  while (dispatch.pending.length > 0 && dispatch.pending[0]!.position < position) {
    const declaration = dispatch.pending.shift()!;
    // `setParam` puts the value in `params` before it converts it (SkinParam.java:228-229).
    if (!('style' in declaration)) dispatch.params.setParam(declaration.key, declaration.value);
    try {
      executeDeclaration(
        dispatch.style,
        declaration,
        'style' in declaration ? EMPTY_SKINPARAM : new Map([[declaration.key, declaration.value]]),
      );
    } catch (e) {
      if (!(e instanceof StyleParsingException)) throw e;
      return refuse('execution', 0, 0, `Error in style definition: ${e.message}`);
    }
  }
  return null;
}

/** `getSkinParam().getCurrentStyleBuilder()`. @see SkinParam.java:156-162 */
export function currentStyleBuilder(dispatch: SequenceStyleDispatch): StyleBuilder {
  return dispatch.style.getCurrentStyleBuilder();
}

// ---------------------------------------------------------------------------
// Signatures
// ---------------------------------------------------------------------------

/**
 * The `ComponentType` values that carry a style signature. Upstream's four
 * `ACTIVATION_BOX_{CLOSE,OPEN}_{CLOSE,OPEN}` share one signature
 * (ComponentType.java:82-84) and are one value here.
 */
export type SequenceComponentType =
  | 'PARTICIPANT_HEAD'
  | 'PARTICIPANT_TAIL'
  | 'PARTICIPANT_LINE'
  | 'ACTIVATION_BOX'
  | 'DESTROY'
  | 'DIVIDER'
  | 'ENGLOBER'
  | 'NEWPAGE'
  | 'NOTE'
  | 'DELAY_TEXT'
  | 'DELAY_LINE';

/** A participant kind as its own SName. @see ParticipantType.java:42-50,54-82 */
export type SequenceParticipantSName =
  'participant' | 'actor' | 'boundary' | 'control' | 'entity' | 'queue' | 'database' | 'collections';

/** A note keyword: `NORMAL`, `HEXAGONAL` (`hnote`), `BOX` (`rnote`). @see NoteStyle.java:44-54 */
export type SequenceNoteStyle = 'note' | 'hnote' | 'rnote';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/GroupingType.java:40 */
export type GroupingType = 'START' | 'START_PARTITION' | 'ELSE' | 'END';

/** `SName.root, SName.element, SName.sequenceDiagram`, the head of every sequence signature. */
const SEQUENCE: readonly SName[] = ['root', 'element', 'sequenceDiagram'];

function sequenceSignature(...names: SName[]): StyleSignatureBasic {
  return StyleSignatureBasic.of(...SEQUENCE, ...names);
}

/** Each `ComponentType`'s SNames after `root, element, sequenceDiagram`. @see ComponentType.java:75-108 */
const COMPONENT_TYPE_SNAMES: Readonly<Record<SequenceComponentType, readonly SName[]>> = {
  PARTICIPANT_HEAD: ['participant'], // :76-77
  PARTICIPANT_TAIL: ['participant'], // :76-77
  PARTICIPANT_LINE: ['lifeLine'], // :79-80
  ACTIVATION_BOX: ['activationBox'], // :82-84
  DESTROY: ['lifeLine', 'destroy'], // :86-87 -> LifeEventType.java:47-49
  DIVIDER: ['separator'], // :89-90
  ENGLOBER: ['box'], // :92-93
  NEWPAGE: ['newpage'], // :95-96
  NOTE: ['note'], // :98-99
  DELAY_TEXT: ['lifeLine', 'delay'], // :101-102
  DELAY_LINE: ['lifeLine', 'delay'], // :104-105
};

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/ComponentType.java:75-111 */
export function componentTypeStyleSignature(type: SequenceComponentType): StyleSignatureBasic {
  return sequenceSignature(...COMPONENT_TYPE_SNAMES[type]);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/AbstractMessage.java:75-78 */
export function messageStyleSignature(stereotype?: Stereotype): StyleSignature {
  return sequenceSignature('arrow').withTOBECHANGED(stereotype);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/ParticipantType.java:54-82 */
export function participantTypeStyleSignature(kind: SequenceParticipantSName): StyleSignatureBasic {
  return sequenceSignature(kind);
}

/** `type.getStyleSignature().addClickable(getUrl())`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Participant.java:82-84 */
export function participantStyleSignature(kind: SequenceParticipantSName, url?: Url): StyleSignatureBasic {
  return participantTypeStyleSignature(kind).addClickable(url);
}

/** `getNoteStyle(keyword).getDefaultStyleDefinition()`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/NoteStyle.java:66-74 */
export function noteStyleSignature(kind: SequenceNoteStyle): StyleSignatureBasic {
  if (kind === 'note') return sequenceSignature('note');
  return sequenceSignature('note', kind);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Grouping.java:59-63 */
export function groupingStyleSignature(type: GroupingType): StyleSignatureBasic {
  if (type === 'START_PARTITION') return sequenceSignature('partition');
  return sequenceSignature('group');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Grouping.java:65-69 */
export function groupingHeaderStyleSignature(type: GroupingType): StyleSignatureBasic {
  if (type === 'START_PARTITION') return sequenceSignature('partition', 'header');
  return sequenceSignature('groupHeader');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Reference.java:66-68 */
export function referenceStyleSignature(): StyleSignatureBasic {
  return sequenceSignature('reference');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Reference.java:70-72 */
export function referenceHeaderStyleSignature(): StyleSignatureBasic {
  return sequenceSignature('referenceHeader');
}

// ---------------------------------------------------------------------------
// Styles (each class's getUsedStyles)
// ---------------------------------------------------------------------------

/**
 * `signature.getMergedStyle(styleBuilder)`, which upstream then
 * dereferences. Every skin defines `root` (`TitledDiagram.loadSkin` refuses
 * one that does not, `StyleLoader#getMissingRootProperties`), so only a
 * hand-built empty builder reaches the throw.
 */
function mergedStyle(signature: StyleSignature, builder: StyleBuilder): Style {
  const style = signature.getMergedStyle(builder);
  if (style === undefined) throw new Error(`NullPointerException: no style matches ${signature.toString()}`);
  return style;
}

/** `type.getStyleSignature().withTOBECHANGED(stereotype).getMergedStyle(b)` (`MutingLine.java:105-106`, `LiveBoxesDrawer.java:140`). @see ComponentType.java:75-111 */
export function componentStyle(builder: StyleBuilder, type: SequenceComponentType, stereotype?: Stereotype): Style {
  return mergedStyle(componentTypeStyleSignature(type).withTOBECHANGED(stereotype), builder);
}

/** `ComponentType.NEWPAGE`, merged in the constructor. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Newpage.java:48-58 */
export function newpageStyle(builder: StyleBuilder): Style {
  return componentStyle(builder, 'NEWPAGE');
}

/** `ComponentType.DELAY_TEXT`, merged in the constructor. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Delay.java:51-62 */
export function delayStyle(builder: StyleBuilder): Style {
  return componentStyle(builder, 'DELAY_TEXT');
}

/** `ComponentType.DIVIDER`, merged in the constructor. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Divider.java:51-62 */
export function dividerStyle(builder: StyleBuilder): Style {
  return componentStyle(builder, 'DIVIDER');
}

/**
 * The arrow style, its `LineColor` replaced by the arrow's own colour.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/AbstractMessage.java:67-73
 */
export function messageStyle(builder: StyleBuilder, stereotype?: Stereotype, arrowColor?: HColor): Style {
  return mergedStyle(messageStyleSignature(stereotype), builder).eventuallyOverride('LineColor', arrowColor);
}

/**
 * `{ tmp, stereo }`: the kind's signature with its stereotypes, overridden
 * by the participant's colours; then the stereotype's own style
 * (`forStereotypeItself`) merged over it.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Participant.java:82-96
 */
export function participantStyle(
  builder: StyleBuilder,
  kind: SequenceParticipantSName,
  stereotype?: Stereotype,
  url?: Url,
  colors?: Colors,
): { readonly style: Style; readonly stereo: Style } {
  const signature = participantStyleSignature(kind, url);
  const style = mergedStyle(signature.withTOBECHANGED(stereotype), builder).eventuallyOverride(colors);
  const stereo = style.mergeWith(
    signature.forStereotypeItself(stereotype).getMergedStyle(builder),
    MergeStrategy.OVERWRITE_EXISTING_VALUE,
  );
  return { style, stereo };
}

/** `Stereotype#getStyles`: one stereotype style per style name. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereotype.java:185-193 */
function stereotypeStyles(stereotype: Stereotype, builder: StyleBuilder): Style[] {
  return stereotype.getStyleNames().map((name) => builder.createStyleStereotype(name));
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Note.java:71-82 */
export function noteStyle(
  builder: StyleBuilder,
  kind: SequenceNoteStyle,
  stereotype?: Stereotype,
  colors?: Colors,
): Style {
  let signature = noteStyleSignature(kind);
  if (stereotype !== undefined) signature = signature.mergeWith(stereotypeStyles(stereotype, builder));
  return mergedStyle(signature, builder).eventuallyOverride(colors);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Grouping.java:79-81 */
function groupingNestedHeaderStyleSignature(): StyleSignatureBasic {
  return sequenceSignature('group', 'header');
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Reference.java:82-84 */
function referenceNestedHeaderStyleSignature(): StyleSignatureBasic {
  return sequenceSignature('reference', 'header');
}

/**
 * The flat header style with the nested one layered over it
 * (`flat.mergeNestedChildOver(nested, style, OVERWRITE_EXISTING_VALUE)`).
 * Java's `if (flat == null) return nested;` is dropped: {@link mergedStyle}
 * never returns undefined (it throws where Java would later dereference).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Grouping.java:83-96
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Reference.java:85-97
 */
function nestedHeaderStyle(
  flatSignature: StyleSignature,
  nestedSignature: StyleSignatureBasic,
  parent: Style,
  builder: StyleBuilder,
): Style {
  const flat = mergedStyle(flatSignature, builder);
  const nested = nestedSignature.getMergedStyle(builder);
  return flat.mergeNestedChildOver(nested, parent, MergeStrategy.OVERWRITE_EXISTING_VALUE);
}

/**
 * The body (`header` false) or header style of a grouping, its
 * `BackGroundColor` replaced by `backColor` — the general back colour for
 * the body (`GroupingStart.java:63-68`), the element one for the header
 * (`Grouping.getUsedStyles`, Grouping.java:98-102, applies
 * `backColorElement` to the header style, `backColorGeneral` to the body).
 * A group header merges `groupHeader` with the nested `group { header }`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Grouping.java:83-112
 */
export function groupingStyle(builder: StyleBuilder, type: GroupingType, header: boolean, backColor?: HColor): Style {
  if (!header)
    return mergedStyle(groupingStyleSignature(type), builder).eventuallyOverride('BackGroundColor', backColor);
  if (type === 'START_PARTITION')
    return mergedStyle(groupingHeaderStyleSignature(type), builder).eventuallyOverride('BackGroundColor', backColor);
  const parent = mergedStyle(groupingStyleSignature(type), builder);
  return nestedHeaderStyle(
    groupingHeaderStyleSignature(type),
    groupingNestedHeaderStyleSignature(),
    parent,
    builder,
  ).eventuallyOverride('BackGroundColor', backColor);
}

/**
 * The body (`header` false) or header style of a `ref over` frame; the
 * header merges `referenceHeader` with the nested `reference { header }`.
 * The header's `backColorElement` override (Reference.java:99-101) is the
 * caller's, as no sequence command carries it yet.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Reference.java:66-112
 */
export function referenceStyle(builder: StyleBuilder, header: boolean): Style {
  const style = mergedStyle(referenceStyleSignature(), builder);
  if (!header) return style;
  return nestedHeaderStyle(referenceHeaderStyleSignature(), referenceNestedHeaderStyleSignature(), style, builder);
}

/**
 * A `box` (englober): `ComponentType.ENGLOBER` with the box's stereotypes,
 * its `BackGroundColor` replaced by the box colour.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/Doll.java:103-114
 */
export function dollStyle(builder: StyleBuilder, stereotype?: Stereotype, boxColor?: HColor): Style {
  const signature = componentTypeStyleSignature('ENGLOBER').withTOBECHANGED(stereotype);
  return mergedStyle(signature, builder).eventuallyOverride('BackGroundColor', boxColor);
}

// ---------------------------------------------------------------------------
// Paint -- `sequence-paint.ts` (split at the 500-line cap, sdd1 T3e)
// ---------------------------------------------------------------------------

export { paintOf, type SequencePaint } from './sequence-paint.js';
