/**
 * cdd-T15: the class-diagram `<style>` SIGNATURES `style-cascade-class.ts`
 * queries — split out verbatim when the `class.qualified` signature pushed
 * that file past the repo's 500-line cap (a pre-authorised split; each
 * constant's upstream citation travelled with it).
 */

/** `EntityImageClass.getStyleSignature()`: `{root,element,classDiagram,class_}`. */
export const CLASS_SNAMES = ['root', 'element', 'classdiagram', 'class'] as const;
/** `EntityImageClassHeader.getStyleSignature()`: the same set plus `header`. */
export const HEADER_SNAMES = [...CLASS_SNAMES, 'header'] as const;
/** `SvekEdge.java:819`: `{root,element,classDiagram,arrow}`. */
export const ARROW_SNAMES = ['root', 'element', 'classdiagram', 'arrow'] as const;
/** D3: `GraphvizImageBuilder.java:124-126` (`getStyleArrowCardinality`):
 *  `{root,element,classDiagram,arrow,cardinality}` -- a strict superset of
 *  {@link ARROW_SNAMES}, so a bare `arrow { FontSize N }` (no nested
 *  `cardinality` block) already satisfies THIS query too --
 *  `resolveStyleCascade`'s subset-match test only requires a matched
 *  declaration's OWN tokens (here, just `arrow`) to be contained in the
 *  query set. The "fallthrough through arrow, not to the skin default"
 *  decisions.md#D3 requires is therefore free: no separate arrow-only
 *  lookup or explicit fallback branch, just this longer signature queried
 *  against the SAME StyleMap. */
export const CARDINALITY_SNAMES = [...ARROW_SNAMES, 'cardinality'] as const;
/** `EntityImageClassHeader#spotStyleSignature`: `{root,element,spot,spot
 *  <Kind>}` -- generalized across every badge kind (only `root` matches in
 *  practice; kept general so a bare `spot {}`/`spotClass {}` slots in). */
export const SPOT_SNAMES = ['root', 'element', 'spot', 'spotclass'] as const;
/** G2 N66: `EntityImageNote.getStyleSignature()`: `{root,element,
 *  classDiagram,note}` -- `getStyleName()` is `SName.classDiagram` for a
 *  class-diagram note (`AbstractEntityImage.java:96`), so this differs from
 *  `CLASS_SNAMES` ONLY in its last token; a bare `element {}` reaches BOTH
 *  a classifier box and a note body, jar-verified `rubecu-40-cixu870`. */
export const NOTE_SNAMES = ['root', 'element', 'classdiagram', 'note'] as const;
/** cdd-T15: `Kal.java:93-97` — a strict superset of {@link CLASS_SNAMES}. */
export const QUALIFIED_SNAMES = [...CLASS_SNAMES, 'qualified'] as const;
