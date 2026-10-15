/**
 * codd T1a (D4): the svg-description golden ratchet's eligibility rule as pure
 * functions, shared by `description.golden.ratchet.test.ts` and
 * `plans/component-divergence-drive/measurements/pin-description.mts`.
 *
 * Source of DOT-EQUAL truth is the per-type survey file
 * `tests/oracle/svg-conformance/parity-<type>.json` (current), NOT the legacy
 * `parity.json` (stale since 2026-09-21).
 *
 * `renderFixture` always runs the description engine directly; the survey runs
 * `renderSync`, whose registry (`src/index.ts:302`, `registry.resolve`) picks
 * the engine. The two agree only where the router picks the description
 * engine, so rows of the `unknown`/`c4` survey buckets are eligible only when
 * `routing-baseline.json` records `ourType === 'DESCRIPTION'`.
 */

export const DESCRIPTION_ENGINE_TYPE = 'DESCRIPTION';

/** Survey buckets whose rows the description engine owns unconditionally. */
export const DIRECT_TYPES = ['component', 'usecase'] as const;
/** Survey buckets whose rows are eligible only when routed to DESCRIPTION. */
export const ROUTED_TYPES = ['unknown', 'c4'] as const;
export const ELIGIBLE_TYPES = [...DIRECT_TYPES, ...ROUTED_TYPES] as const;

export interface SurveyRow {
  readonly slug: string;
  readonly verdict?: string;
  readonly dotEqual?: boolean;
}

export interface Eligibility {
  readonly ok: boolean;
  readonly reason: string;
}

function isRoutedType(type: string): boolean {
  return (ROUTED_TYPES as readonly string[]).includes(type);
}

/** Whether a survey row may be pinned (ignoring zero-diff, which the caller
 *  measures). `ourType` is the routing-baseline value for the row's
 *  dot-cache twin; it is consulted only for the routed buckets. */
export function dotEligibility(type: string, row: SurveyRow | undefined, ourType: string | undefined): Eligibility {
  if (!(ELIGIBLE_TYPES as readonly string[]).includes(type)) {
    return { ok: false, reason: `type ${type} is not a description ratchet type` };
  }
  if (row === undefined) return { ok: false, reason: `no parity-${type}.json row` };
  if (row.dotEqual !== true) return { ok: false, reason: `dotEqual=${String(row.dotEqual)} in parity-${type}.json` };
  if (isRoutedType(type) && ourType !== DESCRIPTION_ENGINE_TYPE) {
    return { ok: false, reason: `routing-baseline ourType=${String(ourType)}, not ${DESCRIPTION_ENGINE_TYPE}` };
  }
  return { ok: true, reason: 'dotEqual=true' + (isRoutedType(type) ? `, routed ${DESCRIPTION_ENGINE_TYPE}` : '') };
}
