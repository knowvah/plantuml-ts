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

// `skinparam classFontSize<<stereo>> N` -- the class HEADER analog. `class` is
// deliberately NOT in `ELEMENT_BUCKET_SNAMES` (it has its own explicit
// `resolveSkinparam` cases), so the generic per-element matcher below cannot
// claim this key; it gets its own entry, exactly as
// `CLASS_ATTRIBUTE_FONT_SIZE_STEREO_RE` does. See `theme-graph-colors-a.ts
// #classFontSizeByStereo`'s own doc comment for the upstream route (a
// stereotype-RE-SIGNED style, not a suffixed value lookup) and for the
// `tabaxa-70-pomu341` jar evidence.
const CLASS_FONT_SIZE_STEREO_RE = new RegExp('^classfontsize<<(.+)>>$');

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

// `skinparam <sname>FontSize<<label>>` — the ELEMENT's own font size under a
// stereotype, as distinct from the stereotype TEXT's size above. Written by
// the flat key or by `skinparam <sname> { <<label>> { FontSize N } }`: upstream
// `SkinLoader#getFullParam` (SkinLoader.java:82-87) concatenates the block
// context into `object<<Foo1>>FontSize`, then `SkinParam#cleanForKeySlow`
// (SkinParam.java:283-300) moves the `<<x>>` to the END — so both spellings
// arrive as ONE key, exactly as `preprocessor.ts` normalizes them.
//
// This is the WIDEST `<<...>>` pattern in this module: `\w+` swallows any
// prefix, so `statefontsize<<foo>>` matches it with `sname=state` — and
// `state` IS in `ELEMENT_BUCKET_SNAMES`. It must therefore be tried LAST, after
// {@link ELEMENT_STEREOTYPE_FONT_SIZE_STEREO_RE} *and* after every entry of
// {@link STEREO_KEY_MATCHERS}, so the specific spellings claim their keys
// first. Running it earlier silently swallowed `statefontsize<<X>>`.
const ELEMENT_FONT_SIZE_STEREO_RE = new RegExp('^(\\w+)fontsize<<(.+)>>$');
/** B13/M22: `skinparam <sname>BackgroundColor<<label>>`. Same `\\w+`-prefix
 *  hazard as {@link ELEMENT_FONT_SIZE_STEREO_RE} -- it also matches
 *  `statebackgroundcolor<<X>>`, whose own `STEREO_KEY_MATCHERS` entry must
 *  win, so its handler runs AFTER that table. */
const ELEMENT_BACKGROUND_COLOR_STEREO_RE = new RegExp('^(\\w+)backgroundcolor<<(.+)>>$');

type StereoHandler = (
  acc: SkinparamAccumulator,
  stereo: string,
  value: string,
) => void;

/**
 * Regex → handler table for stereotype-qualified keys, tried in order
 * (first match wins). The seven patterns are mutually exclusive by
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
  [
    CLASS_FONT_SIZE_STEREO_RE,
    (acc, stereo, value) => {
      const v = Number(value.trim());
      if (Number.isFinite(v)) {
        acc.classFontSizeByStereo ??= {};
        acc.classFontSizeByStereo[stereo] = v;
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
 * `skinparam <sname>FontSize<<label>>` — the ELEMENT's own size under a
 * stereotype. Runs LAST — after {@link applyElementStereotypeFontSize} and
 * after the whole {@link STEREO_KEY_MATCHERS} table — because its `\w+` prefix
 * also matches those tables' keys (`statefontsize<<X>>` most of all); anything
 * reaching here is the plain element form. Same non-consumption contract as
 * {@link applyElementStereotypeFontSize}: a non-bucket sname or a non-numeric
 * value falls through to `acc.unknown`.
 */
function applyElementFontSizeByStereo(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): boolean {
  const m = ELEMENT_FONT_SIZE_STEREO_RE.exec(key);
  if (m === null) return false;
  const sname = m[1]!;
  const size = Number(value.trim());
  if (!ELEMENT_BUCKET_SNAMES.has(sname) || !Number.isFinite(size)) return false;
  const bucket = (acc.elements[sname] ??= {});
  bucket.fontSizeByStereo = { ...bucket.fontSizeByStereo, [m[2]!.trim()]: size };
  return true;
}

/**
 * `skinparam <sname>BackgroundColor<<label>>` — the ELEMENT's own background
 * under a stereotype. Exact mirror of {@link applyElementFontSizeByStereo},
 * including its ordering contract: runs LAST, after the whole
 * {@link STEREO_KEY_MATCHERS} table, because the `\w+` prefix also matches
 * that table's `statebackgroundcolor<<X>>`. A non-bucket sname falls through
 * to `acc.unknown` unconsumed.
 *
 * B13/M22: upstream needs no such per-key matcher at all — its
 * `FromSkinparamToStyle` ctor strips `<<...>>` off ANY raw key before the key
 * is ever looked up (`:292-302`), so EVERY skinparam supports a stereotype
 * qualifier for free. This port models that with an allowlist, which is a
 * real structural divergence; see the ledger's M22 row for the measured cost
 * of re-mirroring it (7 matcher rows, 13 `*ByStereo` fields, 63 consumer
 * sites) and why that is tracked separately rather than done inline.
 */
function applyElementBackgroundColorByStereo(
  acc: SkinparamAccumulator,
  key: string,
  value: string,
): boolean {
  const m = ELEMENT_BACKGROUND_COLOR_STEREO_RE.exec(key);
  if (m === null) return false;
  const sname = m[1]!;
  if (!ELEMENT_BUCKET_SNAMES.has(sname)) return false;
  const bucket = (acc.elements[sname] ??= {});
  bucket.backgroundColorByStereo = {
    ...bucket.backgroundColorByStereo,
    [m[2]!.trim()]: resolveColor(value),
  };
  return true;
}

/**
 * Handles a normalized key already known to contain `<<...>>`. Order is
 * specific-before-generic: {@link applyElementStereotypeFontSize}, then each
 * {@link STEREO_KEY_MATCHERS} regex in table order (the first match's handler
 * runs with the captured stereotype label, trimmed), then the catch-all
 * {@link applyElementFontSizeByStereo}. No match falls through to
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
  // LAST, and deliberately so — see `ELEMENT_FONT_SIZE_STEREO_RE`: its `\w+`
  // prefix also matches `statefontsize<<X>>`, whose own table entry above must
  // win.
  if (applyElementFontSizeByStereo(acc, key, value)) return;
  if (applyElementBackgroundColorByStereo(acc, key, value)) return;
  acc.unknown.push(key);
}
