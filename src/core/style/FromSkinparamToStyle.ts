/**
 * FromSkinparamToStyle — the `skinparam key value` -> `Style[]` converter:
 * one flat static table (`key -> [{propertyName, styleNames}]`, built once
 * at module load exactly as upstream's `static {}` block builds
 * `knowledge`) plus `convertNow`'s value-normalisation and complex-value
 * (`;`-separated, `text:`-prefixed) parsing. `style-skinparam-segments.ts`
 * (T3a-owned) walks a preprocessed source's flat skinparam map in
 * declaration order and calls {@link convertSkinparam} per entry; the
 * returned `Style[]` is muted into the mindmap's `StyleBuilder` the way
 * `SkinParam.setParam` mutes on the spot (`SkinParam.java:227-234`, D2).
 *
 * The table is ported in full (every `addConvert`/`addConFont`/`addMagic`
 * call, `FromSkinparamToStyle.java:76-267`) rather than trimmed to a
 * mindmap-only subset: `addMagic`/`addConFont` are generators, so the full
 * table costs little extra code, and a hand-trimmed subset risks the
 * "invent vs. omit" trap CLAUDE.md warns against -- a key the `aws-orange`
 * theme sets for an unrelated diagram type (e.g. `participantBorderColor`)
 * still produces the exact upstream `Style`, it is simply never queried by
 * a mindmap `SName` signature (`mindmap/Idea.java:65-90` only ever asks
 * for `root`/`element`/`mindmapDiagram`/`node`/`rootNode`/`leafNode`/
 * `boxless`/`arrow`).
 *
 * Two Java lines are commented out in the upstream source and are
 * correctly NOT ported: the `nodeStereotypeFontSize/Style/Color/Name` and
 * `sequenceStereotypeFontSize/Style/Color/Name` duplicate block
 * (`FromSkinparamToStyle.java:243-247`, already covered by
 * `addMagic(SName.node)` and the line-93-96 sequence rows respectively),
 * and `lifelineStrategy` (`:249`).
 *
 * Genuine gaps, re-measured against this port (not assumed from the retry
 * note's unverified count of 21): every one of the 186 distinct keys the
 * mindmap corpus (`test-results/dot-cache/mindmap/*\/in.puml`, 7 fixtures)
 * plus the `aws-orange` theme fixture (`nukose-24-funi267`, expanded
 * through `preprocess()`) yields was fed through {@link convertSkinparam};
 * exactly 20 produce no `Style` (verified via a throwaway script, not
 * guessed; the full 20-key list and its two groups -- 5 keys `SkinParam`
 * consumes directly, e.g. `dpi`/`monochrome`/`handwritten`; 15 block-form
 * `sequence`/`class`/`object`/`state`/`participant` theme keys absent from
 * `FromSkinparamToStyle.java` itself, `grep`-confirmed -- are pinned in
 * `from-skinparam-to-style.test.ts`'s `KNOWN_GAP_KEYS`, not repeated here).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java
 */
import type { AutomaticCounter } from './AutomaticCounter.js';
import type { PName } from './PName.js';
import type { SName } from './SName.js';
import { Style } from './Style.js';
import { StyleSignatureBasic } from './StyleSignatureBasic.js';
import type { StyleBuilder } from './StyleBuilder.js';
import type { Value } from './Value.js';
import { ValueImpl } from './ValueImpl.js';

/** `StyleLoader.DELTA_PRIORITY_FOR_STEREOTYPE` (`style/StyleLoader.java:178`). */
const DELTA_PRIORITY_FOR_STEREOTYPE = 1000;

interface Data {
  readonly propertyName: PName;
  readonly styleNames: readonly SName[];
}

const knowledge = new Map<string, Data[]>();

/** @see FromSkinparamToStyle.java:414-421 */
function addConvert(skinparam: string, propertyName: PName, ...styleNames: SName[]): void {
  const key = skinparam.toLowerCase();
  const list = knowledge.get(key);
  const entry: Data = { propertyName, styleNames };
  if (list === undefined) knowledge.set(key, [entry]);
  else list.push(entry);
}

/** @see FromSkinparamToStyle.java:424-429 */
function addConFont(skinparam: string, ...styleNames: SName[]): void {
  addConvert(`${skinparam}FontSize`, 'FontSize', ...styleNames);
  addConvert(`${skinparam}FontStyle`, 'FontStyle', ...styleNames);
  addConvert(`${skinparam}FontColor`, 'FontColor', ...styleNames);
  addConvert(`${skinparam}FontName`, 'FontName', ...styleNames);
}

/** @see FromSkinparamToStyle.java:270-286 */
function addMagic(sname: SName): void {
  const cleanName = sname.replace(/_/g, '');
  addConvert(`${cleanName}BackgroundColor`, 'BackGroundColor', sname);
  addConvert(`${cleanName}BorderColor`, 'LineColor', sname);
  addConvert(`${cleanName}BorderThickness`, 'LineThickness', sname);
  addConvert(`${cleanName}RoundCorner`, 'RoundCorner', sname);
  addConvert(`${cleanName}DiagonalCorner`, 'DiagonalCorner', sname);
  addConvert(`${cleanName}BorderStyle`, 'LineStyle', sname);
  addConFont(cleanName, sname);
  addConvert(`${cleanName}Shadowing`, 'Shadowing', sname);
  addConvert(`${cleanName}StereotypeFontSize`, 'FontSize', 'stereotype', sname);
  addConvert(`${cleanName}StereotypeFontStyle`, 'FontStyle', 'stereotype', sname);
  addConvert(`${cleanName}StereotypeFontColor`, 'FontColor', 'stereotype', sname);
  addConvert(`${cleanName}StereotypeFontName`, 'FontName', 'stereotype', sname);
}

/** `participant`/`boundary`/`control`/`collections`/`actor`/`database`/`entity` clickable + magic + header/footer/caption + defaultFontSize. @see FromSkinparamToStyle.java:76-91 */
function buildParticipantAndDocument(): void {
  addConvert('participantClickableBackgroundColor', 'BackGroundColor', 'participant', 'clickable');
  addConvert('participantClickableBorderColor', 'LineColor', 'participant', 'clickable');
  addMagic('participant');
  addMagic('boundary');
  addMagic('control');
  addMagic('collections');
  addMagic('actor');
  addMagic('database');
  addMagic('entity');
  addConFont('header', 'document', 'header');
  addConFont('footer', 'document', 'footer');
  addConFont('caption', 'document', 'caption');
  addConvert('defaultFontSize', 'FontSize', 'element');
}

/** Sequence stereotype + reference. @see FromSkinparamToStyle.java:93-102 */
function buildSequenceStereotypeAndReference(): void {
  addConvert('sequenceStereotypeFontSize', 'FontSize', 'stereotype');
  addConvert('sequenceStereotypeFontStyle', 'FontStyle', 'stereotype');
  addConvert('sequenceStereotypeFontColor', 'FontColor', 'stereotype');
  addConvert('sequenceStereotypeFontName', 'FontName', 'stereotype');
  addConvert('SequenceReferenceBorderColor', 'LineColor', 'reference');
  addConvert('SequenceReferenceBorderColor', 'LineColor', 'referenceHeader');
  addConvert('SequenceReferenceBackgroundColor', 'BackGroundColor', 'reference');
  addConvert('sequenceReferenceHeaderBackgroundColor', 'BackGroundColor', 'referenceHeader');
  addConFont('sequenceReference', 'reference');
  addConFont('sequenceReference', 'referenceHeader');
}

/** Sequence group/box/lifeline/delay/divider/message. @see FromSkinparamToStyle.java:103-120 */
function buildSequenceGroupBoxLifelineDelayDivider(): void {
  addConvert('sequenceGroupBorderThickness', 'LineThickness', 'group');
  addConvert('SequenceGroupBorderColor', 'LineColor', 'group');
  addConvert('SequenceGroupBorderColor', 'LineColor', 'groupHeader');
  addConvert('SequenceGroupBackgroundColor', 'BackGroundColor', 'groupHeader');
  addConFont('SequenceGroup', 'group');
  addConFont('SequenceGroupHeader', 'groupHeader');
  addConvert('SequenceBoxBorderColor', 'LineColor', 'box');
  addConvert('SequenceBoxBackgroundColor', 'BackGroundColor', 'box');
  addConvert('SequenceBoxFontColor', 'FontColor', 'box');
  addConvert('SequenceLifeLineBorderColor', 'LineColor', 'lifeLine');
  addConvert('SequenceLifeLineBackgroundColor', 'BackGroundColor', 'activationBox');
  addConFont('sequenceDelay', 'delay');
  addConvert('sequenceDelayBorderColor', 'LineColor', 'delay');
  addConvert('sequenceDividerBackgroundColor', 'BackGroundColor', 'separator');
  addConvert('sequenceDividerBorderColor', 'LineColor', 'separator');
  addConFont('sequenceDivider', 'separator');
  addConvert('sequenceDividerBorderThickness', 'LineThickness', 'separator');
  addConvert('SequenceMessageAlignment', 'HorizontalAlignment', 'arrow');
}

/** Note, package(+magic), partition, hyperlink. @see FromSkinparamToStyle.java:122-135 */
function buildNotePackagePartition(): void {
  addConFont('note', 'note');
  addConvert('noteBorderThickness', 'LineThickness', 'note');
  addConvert('noteBorderColor', 'LineColor', 'note');
  addConvert('noteBackgroundColor', 'BackGroundColor', 'note');
  addConvert('packageBackgroundColor', 'BackGroundColor', 'group');
  addConvert('packageBorderColor', 'LineColor', 'group');
  addMagic('package_');
  addConvert('PartitionBorderColor', 'LineColor', 'composite');
  addConvert('PartitionBackgroundColor', 'BackGroundColor', 'composite');
  addConFont('Partition', 'composite');
  addConvert('hyperlinkColor', 'HyperLinkColor', 'root');
}

/** Activity + arrow. @see FromSkinparamToStyle.java:137-153 */
function buildActivityAndArrow(): void {
  addConvert('activityStartColor', 'BackGroundColor', 'circle', 'start');
  addConvert('activityEndColor', 'LineColor', 'circle', 'end');
  addConvert('activityStopColor', 'LineColor', 'circle', 'stop');
  addConvert('activityBarColor', 'BackGroundColor', 'activityBar');
  addConvert('activityBorderColor', 'LineColor', 'activity');
  addConvert('activityBorderThickness', 'LineThickness', 'activity');
  addConvert('activityBackgroundColor', 'BackGroundColor', 'activity');
  addConFont('activity', 'activity');
  addConvert('activityDiamondBackgroundColor', 'BackGroundColor', 'diamond');
  addConvert('activityDiamondBorderColor', 'LineColor', 'diamond');
  addConFont('activityDiamond', 'diamond');
  addConFont('arrow', 'arrow');
  addConvert('arrowThickness', 'LineThickness', 'arrow');
  addConvert('arrowColor', 'LineColor', 'arrow');
  addConvert('arrowStyle', 'LineStyle', 'arrow');
  addConvert('arrowHeadColor', 'HeadColor', 'arrow');
}

/** Root defaults, swimlane, title, legend, note alignment, document background. @see FromSkinparamToStyle.java:155-180 */
function buildRootTitleLegend(): void {
  addConvert('defaulttextalignment', 'HorizontalAlignment', 'root');
  addConvert('defaultFontName', 'FontName', 'root');
  addConvert('defaultFontColor', 'FontColor', 'root');
  addConFont('SwimlaneTitle', 'swimlane');
  addConvert('SwimlaneTitleBackgroundColor', 'BackGroundColor', 'swimlane');
  addConvert('SwimlaneBorderColor', 'LineColor', 'swimlane');
  addConvert('SwimlaneBorderThickness', 'LineThickness', 'swimlane');
  addConvert('roundCorner', 'RoundCorner', 'root');
  addConvert('titleBorderThickness', 'LineThickness', 'title');
  addConvert('titleBorderColor', 'LineColor', 'title');
  addConvert('titleBackgroundColor', 'BackGroundColor', 'title');
  addConvert('titleBorderRoundCorner', 'RoundCorner', 'title');
  addConFont('title', 'document', 'title');
  addConvert('legendBorderThickness', 'LineThickness', 'legend');
  addConvert('legendBorderColor', 'LineColor', 'legend');
  addConvert('legendBackgroundColor', 'BackGroundColor', 'legend');
  addConvert('legendBorderRoundCorner', 'RoundCorner', 'legend');
  addConFont('legend', 'legend');
  addConvert('noteTextAlignment', 'HorizontalAlignment', 'note');
  addConvert('BackgroundColor', 'BackGroundColor', 'document');
}

/** Class, object, state. @see FromSkinparamToStyle.java:182-208 */
function buildClassObjectState(): void {
  addConvert('classBackgroundColor', 'BackGroundColor', 'element', 'class_');
  addConvert('classBorderColor', 'LineColor', 'element', 'class_');
  addConvert('classFontSize', 'FontSize', 'element', 'class_', 'header');
  addConvert('classFontStyle', 'FontStyle', 'element', 'class_', 'header');
  addConvert('classFontColor', 'FontColor', 'element', 'class_', 'header');
  addConvert('classFontName', 'FontName', 'element', 'class_', 'header');
  addConvert('classAttributeFontSize', 'FontSize', 'element', 'class_');
  addConvert('classAttributeFontStyle', 'FontStyle', 'element', 'class_');
  addConvert('classAttributeFontColor', 'FontColor', 'element', 'class_');
  addConvert('classAttributeFontName', 'FontName', 'element', 'class_');
  addConvert('classBorderThickness', 'LineThickness', 'element', 'class_');
  addConvert('classHeaderBackgroundColor', 'BackGroundColor', 'element', 'class_', 'header');
  addConvert('objectBackgroundColor', 'BackGroundColor', 'object');
  addConvert('objectBorderColor', 'LineColor', 'object');
  addConFont('object', 'object');
  addConFont('objectAttribute', 'object');
  addConvert('objectBorderThickness', 'LineThickness', 'object');
  addConvert('stateBackgroundColor', 'BackGroundColor', 'state');
  addConvert('stateBorderColor', 'LineColor', 'state');
  addConFont('state', 'state');
  addConFont('stateAttribute', 'state');
  addConvert('stateBorderThickness', 'LineThickness', 'state');
}

/** The 20 plain `addMagic` shape elements. @see FromSkinparamToStyle.java:210-230 */
const MAGIC_SHAPE_SNAMES: readonly SName[] = [
  'agent',
  'artifact',
  'card',
  'interface_',
  'cloud',
  'component',
  'file',
  'folder',
  'frame',
  'hexagon',
  'node',
  'person',
  'queue',
  'rectangle',
  'stack',
  'storage',
  'usecase',
  'map',
  'archimate',
  'hnote',
  'rnote',
];

/** Icon visibility, MinClassWidth, wrapWidth, HyperlinkUnderline, StereotypeAlignment. @see FromSkinparamToStyle.java:232-252 */
function buildIconAndMisc(): void {
  addConvert('IconPrivateColor', 'LineColor', 'visibilityIcon', 'private_');
  addConvert('IconPrivateBackgroundColor', 'BackGroundColor', 'visibilityIcon', 'private_');
  addConvert('IconPackageColor', 'LineColor', 'visibilityIcon', 'package_');
  addConvert('IconPackageBackgroundColor', 'BackGroundColor', 'visibilityIcon', 'package_');
  addConvert('IconProtectedColor', 'LineColor', 'visibilityIcon', 'protected_');
  addConvert('IconProtectedBackgroundColor', 'BackGroundColor', 'visibilityIcon', 'protected_');
  addConvert('IconPublicColor', 'LineColor', 'visibilityIcon', 'public_');
  addConvert('IconPublicBackgroundColor', 'BackGroundColor', 'visibilityIcon', 'public_');
  addConvert('MinClassWidth', 'MinimumWidth');
  // FromSkinparamToStyle.java:243-249 (commented out upstream, not ported):
  // nodeStereotypeFontSize/FontStyle/FontColor/FontName (already covered by
  // addMagic('node')), sequenceStereotypeFontSize/.../FontName (already
  // covered by buildSequence's own rows), lifelineStrategy.
  addConvert('wrapWidth', 'MaximumWidth', 'element');
  addConvert('HyperlinkUnderline', 'HyperlinkUnderlineThickness', 'element');
  addConvert('StereotypeAlignment', 'HorizontalAlignment', 'stereotype');
}

/** Stereotype spot colours (A/C/E/I/N/R/D). @see FromSkinparamToStyle.java:254-267 */
function buildStereotypeSpots(): void {
  addConvert('stereotypeABackgroundColor', 'BackGroundColor', 'spotAbstractClass');
  addConvert('stereotypeABorderColor', 'LineColor', 'spotAbstractClass');
  addConvert('stereotypeCBackgroundColor', 'BackGroundColor', 'spotClass');
  addConvert('stereotypeCBorderColor', 'LineColor', 'spotClass');
  addConvert('stereotypeEBackgroundColor', 'BackGroundColor', 'spotEnum');
  addConvert('stereotypeEBorderColor', 'LineColor', 'spotEnum');
  addConvert('stereotypeIBackgroundColor', 'BackGroundColor', 'spotInterface');
  addConvert('stereotypeIBorderColor', 'LineColor', 'spotInterface');
  addConvert('stereotypeNBackgroundColor', 'BackGroundColor', 'spotAnnotation');
  addConvert('stereotypeNBorderColor', 'LineColor', 'spotAnnotation');
  addConvert('stereotypeRBackgroundColor', 'BackGroundColor', 'spotRecord');
  addConvert('stereotypeRBorderColor', 'LineColor', 'spotRecord');
  addConvert('stereotypeDBackgroundColor', 'BackGroundColor', 'spotDataClass');
  addConvert('stereotypeDBorderColor', 'LineColor', 'spotDataClass');
}

function buildKnowledge(): void {
  buildParticipantAndDocument();
  buildSequenceStereotypeAndReference();
  buildSequenceGroupBoxLifelineDelayDivider();
  buildNotePackagePartition();
  buildActivityAndArrow();
  buildRootTitleLegend();
  buildClassObjectState();
  for (const sname of MAGIC_SHAPE_SNAMES) addMagic(sname);
  buildIconAndMisc();
  buildStereotypeSpots();
}
buildKnowledge();

/**
 * `new StringTokenizer(s, delimiters)` with `returnDelims=false`: every
 * maximal run of non-delimiter characters, dropping empty runs (so
 * consecutive delimiters, and a leading/trailing delimiter, produce no
 * empty token) -- unlike `String#split`, which keeps them.
 */
function javaTokenize(s: string, delimiters: string): string[] {
  const delimSet = new Set(delimiters);
  const tokens: string[] = [];
  let current = '';
  for (const ch of s) {
    if (delimSet.has(ch)) {
      if (current.length > 0) tokens.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

/**
 * `StyleLoader.addPriorityForStereotype` (`style/StyleLoader.java:180-186`):
 * local copy, not an import -- `StyleLoader.ts` is T3a's write-set and does
 * not exist yet. No corpus/theme fixture exercises a `<<stereotype>>`-keyed
 * skinparam, so this path is ported for fidelity but untested here; dedupe
 * against `StyleLoader.ts#addPriorityForStereotype` once T3a lands.
 */
function addPriorityForStereotype(map: ReadonlyMap<PName, Value>): Map<PName, Value> {
  const result = new Map<PName, Value>();
  for (const [name, value] of map) {
    if (!(value instanceof ValueImpl)) throw new Error('ClassCastException: value is not a ValueImpl');
    result.set(name, value.addPriority(DELTA_PRIORITY_FOR_STEREOTYPE));
  }
  return result;
}

/** @see FromSkinparamToStyle.java:396-408 */
function addStyle(
  styles: Style[],
  stereo: string | null,
  propertyName: PName,
  value: Value,
  styleNames: readonly SName[],
): void {
  let map: ReadonlyMap<PName, Value> = new Map([[propertyName, value]]);
  let sig = StyleSignatureBasic.of(...styleNames);
  if (stereo !== null) {
    map = addPriorityForStereotype(map);
    for (const s of javaTokenize(stereo, '&')) sig = sig.addStereotype(s);
  }
  styles.push(new Style(sig, map));
}

/** @see FromSkinparamToStyle.java:386-394 */
function shadowingValue(value: string, counter: AutomaticCounter): Value {
  const lower = value.toLowerCase();
  if (lower === 'false' || lower === 'no') return ValueImpl.regular('0', counter);
  if (lower === 'true' || lower === 'yes') return ValueImpl.regular('3', counter);
  return ValueImpl.regular(value, counter);
}

/** @see FromSkinparamToStyle.java:378-384 */
function isComplexValue(value: string): boolean {
  return value.includes(';') || value.startsWith('text:');
}

/** One `(PName, Value)` pair `readValue` derives from a `;`-token, or `undefined` for a token matching none of its four prefixes. @see FromSkinparamToStyle.java:362-375 */
function resolveReadToken(read: string, counter: AutomaticCounter): { propertyName: PName; value: Value } | undefined {
  if (read.startsWith('text:'))
    return { propertyName: 'FontColor', value: ValueImpl.regular(read.split(':')[1] ?? '', counter) };
  if (read.startsWith('line.dotted')) return { propertyName: 'LineStyle', value: ValueImpl.regular('1;3', counter) };
  if (read.startsWith('line.dashed')) return { propertyName: 'LineStyle', value: ValueImpl.regular('7;7', counter) };
  if (read.toLowerCase().includes('bold'))
    return { propertyName: 'LineThickness', value: ValueImpl.regular('2', counter) };
  return undefined;
}

/** @see FromSkinparamToStyle.java:361-376 */
function readValue(
  styles: Style[],
  stereo: string | null,
  read: string,
  datas: readonly Data[],
  counter: AutomaticCounter,
): void {
  const resolved = resolveReadToken(read, counter);
  if (resolved === undefined) return;
  for (const data of datas) addStyle(styles, stereo, resolved.propertyName, resolved.value, data.styleNames);
}

/**
 * `FromSkinparamToStyle(key)`'s constructor (java:292-303): a `<<stereo>>`
 * suffix splits off via `StringTokenizer(key, "<>")`; a key with none of
 * `stereo`/`cleanKey` is unreachable here since `key.contains("<<")`
 * gates the split.
 */
function splitKeyStereo(key: string): { cleanKey: string; stereo: string | null } {
  if (!key.includes('<<')) return { cleanKey: key, stereo: null };
  const tokens = javaTokenize(key, '<>');
  const first = tokens[0];
  if (first === undefined) throw new Error('NoSuchElementException');
  return { cleanKey: first, stereo: tokens.length > 1 ? (tokens[1] ?? '').trim() : null };
}

/** The key-specific then common value substitutions at the top of `convertNow`. @see FromSkinparamToStyle.java:306-327 */
function normalizeValueForKey(cleanKey: string, rawValue: string): string {
  let value = rawValue;
  if (cleanKey.endsWith('shadowing')) {
    if (value.toLowerCase() === 'false') value = '0';
    else if (value.toLowerCase() === 'true') value = '3';
  } else if (cleanKey === 'hyperlinkunderline') {
    if (value.toLowerCase() === 'false') value = '0';
    if (value.toLowerCase() === 'true') value = '1';
  }

  if (value.toLowerCase() === 'right:right') value = 'right';
  if (value.toLowerCase() === 'dotted') value = '1;3';
  if (value.toLowerCase() === 'dashed') value = '7;7';
  return value;
}

/** `datas == null`: the `shadowing`/`noteshadowing` fallback, else no styles. @see FromSkinparamToStyle.java:330-336 */
function convertUnknownKey(cleanKey: string, stereo: string | null, value: string, counter: AutomaticCounter): Style[] {
  const styles: Style[] = [];
  const lowerKey = cleanKey.toLowerCase();
  if (lowerKey === 'shadowing') addStyle(styles, stereo, 'Shadowing', shadowingValue(value, counter), ['root']);
  else if (lowerKey === 'noteshadowing')
    addStyle(styles, stereo, 'Shadowing', shadowingValue(value, counter), ['root', 'note']);
  return styles;
}

/** The `value.contains(";")` sub-branch: tokenize, apply every extra token via {@link readValue}, and return the first token as the new `value`. @see FromSkinparamToStyle.java:340-348 */
function splitComplexValue(
  styles: Style[],
  stereo: string | null,
  value: string,
  datas: readonly Data[],
  counter: AutomaticCounter,
): string {
  const prefixed = value.startsWith(';') ? ` ${value}` : value;
  const tokens = javaTokenize(prefixed, ';');
  const first = tokens[0];
  if (first === undefined) throw new Error('NoSuchElementException');
  for (const read of tokens.slice(1)) readValue(styles, stereo, read, datas, counter);
  return first;
}

/** @see FromSkinparamToStyle.java:305-359 */
function convertNow(cleanKey: string, stereo: string | null, rawValue: string, counter: AutomaticCounter): Style[] {
  const value0 = normalizeValueForKey(cleanKey, rawValue);
  const datas = knowledge.get(cleanKey.toLowerCase());
  if (datas === undefined) return convertUnknownKey(cleanKey, stereo, value0, counter);

  const styles: Style[] = [];
  let value = value0;
  if (isComplexValue(value)) {
    if (value.includes(';')) value = splitComplexValue(styles, stereo, value, datas, counter);
    else {
      readValue(styles, stereo, value, datas, counter);
      return styles;
    }
  }

  if (value !== ' ')
    for (const data of datas)
      addStyle(styles, stereo, data.propertyName, ValueImpl.regular(value, counter), data.styleNames);
  return styles;
}

/**
 * `new FromSkinparamToStyle(key).convertNow(value, counter); return
 * .getStyles();` flattened to one pure function -- `builder` is only used
 * as the `AutomaticCounter` upstream's `setParam` passes (`StyleBuilder`
 * implements it, `StyleBuilder.ts:31`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java:292-303,305-359,410-412
 */
export function convertSkinparam(key: string, value: string, builder: StyleBuilder): Style[] {
  const { cleanKey, stereo } = splitKeyStereo(key);
  return convertNow(cleanKey, stereo, value, builder);
}
