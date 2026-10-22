/**
 * Test-side paints for the frame, `ref`, newpage and delay families (sdd1
 * T3a): what layout resolves, over the default skin or a `@startuml` body's
 * declarations, so a hand-built geo carries the paint its renderer requires.
 */
import { buildBlockUmls } from '../../../src/core/BlockUmlBuilder.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import type { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import type { SequenceGeometry } from '../../../src/diagrams/sequence/ast.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { groupingPaints, type FramePaints } from '../../../src/diagrams/sequence/sequence-frame-metrics.js';
import { referencePaints } from '../../../src/diagrams/sequence/ref-body-geo.js';
import {
  createSequenceStyleDispatch,
  currentStyleBuilder,
  delayStyle,
  executeDeclarationsBefore,
  newpageStyle,
  paintOf,
  type SequencePaint,
} from '../../../src/diagrams/sequence/sequence-skin-param.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { DEFAULT_SEQUENCE_STYLE_BUILDER } from '../../helpers/sequence-source.js';

/** The render pipeline's `UmlSource` for a `@startuml` body (`index.ts#umlSourceOfBlock`). */
export function sourceOf(body: string): UmlSource {
  const block = buildBlockUmls(`@startuml\n${body}\n@enduml`)[0]!;
  if (!block.ok) throw new Error('preprocessor failure');
  return {
    ...block.source,
    rawStyles: block.preprocessed.styles,
    stylePositions: block.preprocessed.stylePositions,
    skinparamAssignments: block.preprocessed.skinparamAssignments,
    styleSource: block.preprocessed,
  };
}

/** The builder after every declaration of `body`. */
export function builderOf(body: string): StyleBuilder {
  const dispatch = createSequenceStyleDispatch(sourceOf(body));
  if (executeDeclarationsBefore(dispatch, Number.POSITIVE_INFINITY) !== null) throw new Error('style refused');
  return currentStyleBuilder(dispatch);
}

/** A group opener's paints over `builder`, as `sequence-layout-frame.ts` resolves them. */
export function groupPaintsOf(
  builder: StyleBuilder = DEFAULT_SEQUENCE_STYLE_BUILDER,
  colors: { readonly backColorGeneral?: string; readonly backColorElement?: string } = {},
): FramePaints {
  return groupingPaints({
    kind: 'frame',
    frameType: 'alt',
    label: '',
    branches: [[]],
    branchLabels: [''],
    styleBuilder: builder,
    branchStyleBuilders: [builder],
    ...colors,
  });
}

/** A `ref`'s paints over `builder`, as `ref-body-geo.ts` resolves them. */
export function refPaintsOf(builder: StyleBuilder = DEFAULT_SEQUENCE_STYLE_BUILDER): FramePaints {
  return referencePaints({ styleBuilder: builder });
}

/** The default skin's group paints (`plantuml.skin:116-129`). */
export const DEFAULT_GROUP_PAINTS: FramePaints = groupPaintsOf();

/** The default skin's `ref` paints (`plantuml.skin:155-170`). */
export const DEFAULT_REF_PAINTS: FramePaints = refPaintsOf();

/** The default skin's newpage paint (`plantuml.skin:16,91-93,189-191`). */
export const DEFAULT_NEWPAGE_PAINT: SequencePaint = paintOf(
  newpageStyle(DEFAULT_SEQUENCE_STYLE_BUILDER),
  HColorSet.instance(),
);

/** The default skin's delay paint (`plantuml.skin:300-305`). */
export const DEFAULT_DELAY_PAINT: SequencePaint = paintOf(
  delayStyle(DEFAULT_SEQUENCE_STYLE_BUILDER),
  HColorSet.instance(),
);

/** Parse and lay out a `@startuml` body through the pipeline's own source. */
export function layoutBody(body: string, measurer: StringMeasurer): SequenceGeometry {
  const ast = parseSequence(sourceOf(body));
  if ('refused' in ast) throw new Error(`refused: ${ast.message}`);
  return layoutSequence(ast, defaultTheme, measurer);
}
