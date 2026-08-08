/**
 * Stereotype-qualified skinparam key handling (`key.includes('<<')` branch).
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module map.
 *
 * Stereotype-qualified keys are unsupported for MOST properties -- Theme
 * has no general stereotype concept -- EXCEPT the handful modeled below
 * (G2 N51, G4 S9/S15/S16), which mirror upstream's own narrow
 * `SkinParam#getThickness/getColor/getFontSize(Param, Stereotype)`
 * stereotype-qualified-key lookups (a raw VALUE lookup keyed by
 * `param.name() + suffix + stereotype.getLabel(...)`, NOT the `<style>`/
 * StyleSignature cascade `.tagname` sub-selectors use).
 */

import type { SkinparamAccumulator } from './skinparam-accumulator.js';
import { resolveColor } from './skinparam-key-normalize.js';
// Imported from the leaf module, not the `skinparam.ts` barrel that
// re-exports it -- that barrel imports THIS file, so the barrel spelling
// would close an ESM import cycle.
import { ELEMENT_BUCKET_SNAMES } from './skinparam-element-buckets.js';

// G2 N51: `skinparam classBorderThickness<<X>>` -- the ONE stereotype-
// qualified skinparam key this port models (see this module's own doc
// comment for why the rest stay in `unknown[]`). Built via `new RegExp
// (string)` rather than a `/<<.../ ` literal per this project's
// complexity-lint convention for `<`/`>`-bearing patterns (see e.g.
// `renderer-group.ts#XML_UNSAFE_RE`).
const CLASS_BORDER_THICKNESS_STEREO_RE = new RegExp('^classborderthickness<<(.+)>>$');

// G4 S9: `skinparam StateBorderColor<<stereo>> #X` -- the state-diagram
// analog of `classBorderThickness<<X>>` above (`SkinParam#getColor(ColorParam,
// Stereotype)`, a direct stereotype-qualified VALUE lookup, not the
// `<style>`/`.tagname` cascade) -- see `theme.ts#stateBorderColorByStereo`'s
// own doc comment. Scoped to BorderColor only this iteration (Background/
// FontColor/FontSize<<X>> would additionally require threading a per-
// stereotype font size through `state-sizing.ts`'s LAYOUT-time measurement,
// a materially larger, deferred mechanism -- `plans/g4-state-svg/ledger.md`
// S9's own queue).
const STATE_BORDER_COLOR_STEREO_RE = new RegExp('^statebordercolor<<(.+)>>$');

// mission G4 S15: `skinparam stateBackgroundColor<<stereo>> #X` /
// `skinparam stateFontColor<<stereo>> #X` -- same direct-value-lookup shape
// as `STATE_BORDER_COLOR_STEREO_RE` above, see `theme.ts
// #stateBackgroundColorByStereo`'s own doc comment for the precedence tier
// and the FontSize<<X>> exclusion rationale.
const STATE_BACKGROUND_COLOR_STEREO_RE = new RegExp('^statebackgroundcolor<<(.+)>>$');
const STATE_FONT_COLOR_STEREO_RE = new RegExp('^statefontcolor<<(.+)>>$');
// mission G4 S16: `skinparam stateFontSize<<stereo>> N` -- the FontSize<<X>>
// field S9/S14/S15's own queue notes deferred (jar-verified via
// `FromSkinparamToStyle.java`'s `addConFont("state", SName.state)`, which
// registers `stateFontSize`/`stateFontStyle`/`stateFontColor`/`stateFontName`
// as a `PName.FontSize`/etc conversion feeding the `SName.state` style --
// the SAME `SkinParam#getFontSize(stereotype, FontParam...)` direct
// stereotype-qualified VALUE lookup mechanism (`getFirstValueNonNullWithSuffix
// ("fontsize" + stereotype.getLabel(...), ...)`) `STATE_BORDER_COLOR_STEREO_RE`
// already uses for BorderColor -- NOT the `<style>`-block-selector cascade
// family (`stateDiagram { ... }`/`activityBar { ... }`) this mission's
// write-set boundary blocks at `core/style-map-theme.ts#applyStyleMap`; see
// `theme.ts#stateFontSizeByStereo`'s own doc comment for the precedence tier
// and `state-render-colors.ts#resolveStateFontSize`'s own doc comment for
// how the parsed numeric override reaches BOTH layout-time measurement and
// render-time `font-size` emission from this ONE parsed value.
const STATE_FONT_SIZE_STEREO_RE = new RegExp('^statefontsize<<(.+)>>$');

// A2s R2j: `skinparam classAttributeFontSize<<stereo>> N` -- the class-
// diagram FontSize analog of `classBorderThickness<<X>>` above:
// `SkinParam#getFontSize(stereotype, FontParam...)`'s
// `getFirstValueNonNullWithSuffix("fontsize" + stereotype.getLabel(...))`
// tier, a DIRECT stereotype-qualified VALUE lookup ABOVE the plain
// per-param value (SkinParam.java:433-448) -- see `theme-graph-colors-a.ts
// #classAttributeFontSizeByStereo`'s own doc comment. Jar-verified
// `sovuxo-25-tepi226` (R2c probes ps/p1|p3|p4: stereotyped ≡ plain value
// for matching classes; non-matching classes untouched).
const CLASS_ATTRIBUTE_FONT_SIZE_STEREO_RE = new RegExp('^classattributefontsize<<(.+)>>$');

// S1L-tail G4 tier 2: `skinparam <sname>StereotypeFontSize<<label>> N` (flat
// or `skinparam <sname> { StereotypeFontSize<<label>> N }` block form -- the
// preprocessor normalizes both to this ONE key) -- the per-element analog of
// `classAttributeFontSize<<X>>` above, and the SAME `SkinParam#getFontSize
// (stereotype, FontParam...)` stereotype-suffixed VALUE lookup
// (`getFirstValueNonNullWithSuffix("fontsize" + stereotype.getLabel(...))`,
// SkinParam.java:433-448) sitting ABOVE the plain `<sname>StereotypeFontSize`
// tier `skinparam-element-buckets.ts#matchElementFontSizeKey` already reads.
// The captured label needs no cleaning here: `normaliseKey` has already
// lowercased the whole key and stripped `[_.]` from it, which is exactly
// `StyleSignatureBasic#clean` -- so this front-end and the `<style>` one
// (`style-map-element.ts#collectStereotypeTagFontSize`) write the SAME
// cleaned key into the SAME map. Jar-verified `toxine-81-xofo986`, whose
// oracle DOT is byte-identical to `<style>`-spelled `loroto-06-fano471`.
// Scoped to `ELEMENT_BUCKET_SNAMES` at the handler, mirroring every other
// per-element matcher; a non-bucket sname falls through to `acc.unknown`.
const ELEMENT_STEREOTYPE_FONT_SIZE_STEREO_RE = new RegExp('^(\\w+)stereotypefontsize<<(.+)>>$');

type StereoHandler = (
  acc: SkinparamAccumulator,
  stereo: string,
  value: string,
) => void;

/**
 * Regex → handler table for stereotype-qualified keys, tried in order
 * (first match wins). The six patterns are mutually exclusive by
 * construction (each requires a distinct literal prefix), so trying them in
 * table order is behaviorally identical to the original if/else-if chain.
 */
const STEREO_KEY_MATCHERS: ReadonlyArray<readonly [RegExp, StereoHandler]> = [
  [
    CLASS_BORDER_THICKNESS_STEREO_RE,
    (acc, stereo, value) => {
      const v = Number.parseFloat(value.trim());
      if (Number.isFinite(v)) {
        acc.classBorderThicknessByStereo ??= {};
        acc.classBorderThicknessByStereo[stereo] = v;
      }
    },
  ],
  [
    STATE_BORDER_COLOR_STEREO_RE,
    (acc, stereo, value) => {
      acc.stateBorderColorByStereo ??= {};
      acc.stateBorderColorByStereo[stereo] = resolveColor(value);
    },
  ],
  [
    STATE_BACKGROUND_COLOR_STEREO_RE,
    (acc, stereo, value) => {
      acc.stateBackgroundColorByStereo ??= {};
      acc.stateBackgroundColorByStereo[stereo] = resolveColor(value);
    },
  ],
  [
    STATE_FONT_COLOR_STEREO_RE,
    (acc, stereo, value) => {
      acc.stateFontColorByStereo ??= {};
      acc.stateFontColorByStereo[stereo] = resolveColor(value);
    },
  ],
  [
    STATE_FONT_SIZE_STEREO_RE,
    (acc, stereo, value) => {
      const v = Number(value.trim());
      if (Number.isFinite(v)) {
        acc.stateFontSizeByStereo ??= {};
        acc.stateFontSizeByStereo[stereo] = v;
      }
    },
  ],
  [
    CLASS_ATTRIBUTE_FONT_SIZE_STEREO_RE,
    (acc, stereo, value) => {
      const v = Number(value.trim());
      if (Number.isFinite(v)) {
        acc.classAttributeFontSizeByStereo ??= {};
        acc.classAttributeFontSizeByStereo[stereo] = v;
      }
    },
  ],
];

/**
 * {@link ELEMENT_STEREOTYPE_FONT_SIZE_STEREO_RE}'s handler. Kept OUT of
 * {@link STEREO_KEY_MATCHERS} because its regex captures TWO groups (sname
 * AND label) while that table's {@link StereoHandler} contract passes only
 * `m[1]` as the stereotype label — widening the contract would touch all six
 * existing handlers for one addition. Returns whether it consumed `key`; an
 * sname outside {@link ELEMENT_BUCKET_SNAMES} or a non-numeric value is NOT
 * consumed, so it falls through to the table and then to `acc.unknown`,
 * exactly as it did before this matcher existed.
 */
function applyElementStereotypeFontSize(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): boolean {
  const m = ELEMENT_STEREOTYPE_FONT_SIZE_STEREO_RE.exec(key);
  if (m === null) return false;
  const sname = m[1]!;
  const size = Number(value.trim());
  if (!ELEMENT_BUCKET_SNAMES.has(sname) || !Number.isFinite(size)) return false;
  const bucket = (acc.elements[sname] ??= {});
  bucket.stereotypeFontSizeByStereo = { ...bucket.stereotypeFontSizeByStereo, [m[2]!.trim()]: size };
  return true;
}

/**
 * Handles a normalized key already known to contain `<<...>>`. Tries each
 * {@link STEREO_KEY_MATCHERS} regex in order; the first match's handler runs
 * with the captured stereotype label (trimmed). No match falls through to
 * `acc.unknown`.
 */
export function applyStereoOverride(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): void {
  if (applyElementStereotypeFontSize(acc, key, value)) return;
  for (const [re, handler] of STEREO_KEY_MATCHERS) {
    const m = re.exec(key);
    if (m !== null) {
      handler(acc, m[1]!.trim(), value);
      return;
    }
  }
  acc.unknown.push(key);
}
