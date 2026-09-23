/**
 * `parseRelationshipLine`'s per-section field resolution — split out of
 * class-relationship-parser.ts (mechanical extraction: identical logic and
 * Java citations, purely relocated) to keep that function under the repo's
 * per-function NLOC/CCN complexity-hook cap.
 */

import type { Classifier } from './ast.js';
import type { ArrowInfo, ArrowStyleOverrides, MiddleDecor } from './class-arrow-grammar.js';
import { parseArrowDecorsRaw } from './class-arrow-grammar.js';
import type { UrlInfo } from './class-url.js';
import { splitEndpointPort, stripQuotes } from './class-relationship-id-grammar.js';
import { decomposeLabel } from './class-relationship-label-decompose.js';
import { idLeaf, pickDirectional, sidedRelFields, type OptionalRelFields } from './class-relationship-parser.js';
import { cleanStereotypeToken } from '../../core/style-map-element.js';

type FromTo<T> = { from: T; to: T };
type IdDecor = OptionalRelFields['idEntity1Decor'];

/** Endpoint id/decor/sided-field resolution for `parseRelationshipLine`'s
 *  arrow-token path. `m`/`nsSep`/`classifiers`/`info` are exactly that
 *  function's own locals; see `Relationship.idEntity1`'s doc comment
 *  (class-relationship-ast.ts) for the `upOrLeft`-vs-`swapDirection` split
 *  this mirrors (G2 N9/N30). */
type EndpointFields = {
  id: FromTo<string>;
  idNames: FromTo<string>;
  idFullNames: FromTo<string>;
  idDecors: FromTo<IdDecor>;
  sided: ReturnType<typeof sidedRelFields>;
};

export function resolveRelationshipEndpoints(
  m: RegExpExecArray,
  nsSep: string | null,
  classifiers: readonly Classifier[],
  info: ArrowInfo,
): EndpointFields {
  const rawDecors = parseArrowDecorsRaw(m[5]!);
  const idDecors = pickDirectional(info.upOrLeft, rawDecors.decor1, rawDecors.decor2);
  const left = splitEndpointPort(m[1]!, nsSep, classifiers);
  const right = splitEndpointPort(m[9]!, nsSep, classifiers);
  const id = pickDirectional(info.swapDirection, left.id, right.id);
  const idNames = pickDirectional(info.upOrLeft, idLeaf(left.id, nsSep), idLeaf(right.id, nsSep));
  const idFullNames = pickDirectional(info.upOrLeft, left.id, right.id);
  const sided = sidedRelFields(m, info.swapDirection, left, right);
  return { id, idNames, idFullNames, idDecors, sided };
}

/**
 * Stereotype-tag + label (with embedded-multiplicity decomposition)
 * resolution. Mutates `sided` in place exactly as the pre-extraction inline
 * code did -- embedded multiplicities only surface when neither endpoint had
 * an explicit quoted quantifier (see the full derivation in
 * class-relationship-parser.ts's git history / this function's origin).
 * `m[11]`/`m[12]` are REL_RE's stereotype/label groups (see that file's own
 * group-numbering doc comment).
 */
export function resolveRelationshipLabel(
  m: RegExpExecArray,
  info: ArrowInfo,
  sided: Pick<OptionalRelFields, 'fromMultiplicity' | 'toMultiplicity'>,
): { stereotypeTags: string[]; label: string | undefined } {
  const stereotypeTags = (m[11] ?? '')
    .replace(/^<</u, '')
    .replace(/>>$/u, '')
    .split(',')
    .map((t) => cleanStereotypeToken(t.trim()))
    .filter((t) => t.length > 0);
  let label = m[12]?.trim();
  if (label !== undefined && m[3] === undefined && m[6] === undefined) {
    const dec = decomposeLabel(label);
    if (dec !== null) {
      label = dec.mid;
      const mult = pickDirectional(info.swapDirection, dec.first, dec.second);
      sided.fromMultiplicity = mult.from;
      sided.toMultiplicity = mult.to;
    } else {
      label = stripQuotes(label);
    }
  } else if (label !== undefined) {
    label = stripQuotes(label);
  }
  return { stereotypeTags, label };
}

type IdentityInput = {
  label: string | undefined;
  length: number;
  weight: number | undefined;
  idNames: FromTo<string>;
  idDecors: FromTo<IdDecor>;
  idFullNames: FromTo<string>;
  styleOverrides: ArrowStyleOverrides;
};
type IdentityFields = Pick<
  OptionalRelFields,
  | 'label'
  | 'length'
  | 'weight'
  | 'idEntity1'
  | 'idEntity2'
  | 'idEntity1Decor'
  | 'idEntity2Decor'
  | 'idEntity1FullId'
  | 'idEntity2FullId'
  | 'lineStyleOverride'
  | 'thicknessOverride'
  | 'colorOverride'
>;

/** The id/label/style half of `buildRelOptionalFields`'s record -- split out
 *  purely to stay under the complexity hook's per-function NLOC cap. */
function buildIdentityFields(input: IdentityInput): IdentityFields {
  const { label, length, weight, idNames, idDecors, idFullNames, styleOverrides } = input;
  return {
    label,
    length,
    weight,
    idEntity1: idNames.from,
    idEntity2: idNames.to,
    idEntity1Decor: idDecors.from,
    idEntity2Decor: idDecors.to,
    idEntity1FullId: idFullNames.from,
    idEntity2FullId: idFullNames.to,
    lineStyleOverride: styleOverrides.lineStyle,
    thicknessOverride: styleOverrides.thickness,
    colorOverride: styleOverrides.color,
  };
}

type DirectionInput = {
  styleOverrides: ArrowStyleOverrides;
  stereotypeTags: string[];
  info: ArrowInfo;
};
type DirectionFields = Pick<
  OptionalRelFields,
  | 'single'
  | 'norank'
  | 'parentIsLinkEntity1'
  | 'swapDirection'
  | 'stereotypeTags'
  | 'dotEdgeReversed'
  | 'invertedLinkBurnsTick'
>;

/** The direction/rank/tag half of `buildRelOptionalFields`'s record -- see
 *  {@link buildIdentityFields}'s own doc comment for why this is split out.
 *  `single`/`norank` (`WithLinkType.goSingle`/`.goNorank`, SI1/T11),
 *  `parentIsLinkEntity1` (the hierarchical dot-rank swap, only meaningful
 *  for extension/implementation), `swapDirection`/`dotEdgeReversed`/
 *  `invertedLinkBurnsTick` (G2 N59/T1 B33/B21 M20 -- the three independent
 *  arrowhead-vs-direction-word swaps `class-arrow-grammar.ts#ArrowInfo`'s
 *  own doc comments derive), and `stereotypeTags` (B7/M8, `<<a,b>>`). */
function buildDirectionFields(input: DirectionInput): DirectionFields {
  const { styleOverrides, stereotypeTags, info } = input;
  const isHierarchical = info.type === 'extension' || info.type === 'implementation';
  return {
    single: styleOverrides.single,
    norank: styleOverrides.norank,
    parentIsLinkEntity1: isHierarchical ? info.swapDirection : undefined,
    swapDirection: info.swapDirection === true ? true : undefined,
    ...(stereotypeTags.length > 0 ? { stereotypeTags } : {}),
    dotEdgeReversed: info.swapDirection !== info.upOrLeft,
    ...(info.upOrLeft === true ? { invertedLinkBurnsTick: true as const } : {}),
  };
}

type RelOptionalFieldsInput = IdentityInput &
  DirectionInput & {
    sided: ReturnType<typeof sidedRelFields>;
    dashedBody: boolean;
    hidden: true | undefined;
    url: UrlInfo | undefined;
    middleDecor: MiddleDecor | undefined;
  };

/** Assembles `withOptionalFields`'s second argument (the full optional-field
 *  record) -- one bundled input object to stay under the complexity hook's
 *  5-parameter cap. Behavior and every Java citation are unchanged from the
 *  pre-extraction inline object literal; see `class-relationship-ast.ts`'s
 *  `Relationship` doc comments for each field's own upstream mirror, and
 *  {@link buildIdentityFields}/{@link buildDirectionFields} for the two
 *  halves this composes. */
export function buildRelOptionalFields(input: RelOptionalFieldsInput): OptionalRelFields {
  return {
    ...input.sided,
    ...buildIdentityFields(input),
    ...buildDirectionFields(input),
    // T5: see class-relationship-ast.ts's `Relationship` doc comments for
    // each of the four fields below.
    dashedBody: input.dashedBody,
    hidden: input.hidden,
    url: input.url,
    middleDecor: input.middleDecor,
  };
}
