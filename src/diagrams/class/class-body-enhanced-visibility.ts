/**
 * `visibilityIcon`/`visibilityBlockHeight`/`visibilityBlockTopDy` for one
 * enhanced-body row -- split out of `class-body-enhanced-layout.ts` purely
 * to keep that file under the project's 500-line cap (cdd5-T4e).
 *
 * cdd5-T4e (enhanced-body-icon-block-height, `unknown/rinidi-95-neko205`):
 * the enhanced body never groups wrapped continuation lines under one
 * shared member (unlike `class-member-rows.ts#memberBlockHeights`'s
 * classic-path grouping), so every row here is its OWN one-row block --
 * `visibilityBlockHeight` is simply its own height, and `visibilityBlockTopDy`
 * is `blockTop - y` exactly like `class-member-rows.ts#buildOneRow`'s
 * identical `blockTop - y` call (`y` is the row's BASELINE, `blockTop` its
 * TOP -- NOT 0: a first, jar-verified-wrong attempt hardcoded `0` here and
 * shifted EVERY OTHER icon row in the diagram by `baselineOffset`, since
 * `rowIconTopOriginY` reads it as an absolute offset from the baseline, not
 * "no correction needed"). Omitting both fields left
 * `renderer-classifier-rows.ts`'s `row.visibilityBlockHeight ?? fontSize`
 * fallback centring a `<size:30>` icon row's `+` on the 14px font instead
 * of its real 30px row (`PlacementStrategyVisibility.java:62-67`'s
 * `(maxHeight12 - height1) / 2`, `(30 - 14) / 2 = 8`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/geom/PlacementStrategyVisibility.java:62-67
 */
import type { Member } from './ast.js';
import { isMethodMember } from './class-member-rows.js';
import type { ClassifierGeo } from './layout.js';
import type { MemberRowBuild } from './class-member-creole.js';

type IconVisibilityFields = Pick<
  ClassifierGeo['rows'][number],
  'visibilityIcon' | 'visibilityIsField' | 'visibilityBlockHeight' | 'visibilityBlockTopDy'
>;

function iconVisibilityFields(
  m: Member,
  rowHeight: number,
  blockTopDy: number,
): IconVisibilityFields | Record<string, never> {
  if (m.visibilityExplicit !== true) return {};
  return {
    visibilityIcon: m.visibility,
    visibilityIsField: !isMethodMember(m),
    visibilityBlockHeight: rowHeight,
    visibilityBlockTopDy: blockTopDy,
  };
}

/** Params for {@link buildEnhancedRow}, bundled to stay under this
 *  project's 5-param cap (mirrors `class-member-rows.ts#OneRowInput`'s own
 *  identical rationale). */
export interface EnhancedRowInput {
  readonly m: Member;
  readonly text: string;
  readonly build: MemberRowBuild;
  readonly rowTop: number;
  readonly indent: number;
  readonly baselineOffset: number;
  readonly bottomAnchor: number;
}

/** One enhanced-body row's full geometry object -- split out of
 *  `class-body-enhanced-layout.ts#buildRowsBlockRows`'s `.map` callback
 *  purely to keep that function under the project's NLOC cap; no behavior
 *  change (a pure move plus this task's own `iconVisibilityFields` fix). */
export function buildEnhancedRow(input: EnhancedRowInput): ClassifierGeo['rows'][number] {
  const { m, text, build, rowTop, indent, baselineOffset, bottomAnchor } = input;
  const hasImageAtom = build.atoms.some((a) => a.kind === 'image');
  const y = rowTop + (hasImageAtom ? build.height - bottomAnchor : baselineOffset);
  return {
    text,
    y,
    indent,
    width: build.width,
    atoms: build.atoms,
    ...iconVisibilityFields(m, build.height, rowTop - y),
    ...(m.ownUrl !== undefined ? { url: m.ownUrl } : {}),
  };
}
