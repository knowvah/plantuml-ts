/**
 * Per-element (SName) style-bucket matching for the skinparam pipeline.
 *
 * Split out of skinparam.ts to keep that file under the project's 500-line
 * file-size cap — see skinparam.ts's own doc comment for the full module map.
 */

/**
 * Descriptive/deployment SNames carrying per-element style buckets (D4,
 * widened G1 I4b). Matches upstream `FromSkinparamToStyle.java`'s `addMagic`
 * registration list (`agent, artifact, boundary, card, cloud, collections,
 * component, control, database, entity, file, folder, frame, hexagon,
 * interface_, node, package_, person, queue, rectangle, stack, storage,
 * usecase` plus the four early-registered `boundary, control, collections,
 * actor, database, entity`), restricted to SNames reachable from a
 * component/usecase diagram (`descriptive-keywords.ts`'s `USymbol` union) —
 * the flat-scoped keywords (class/interface as a class-diagram concept/enum/
 * note/activity) keep their own explicit `resolveSkinparam` cases. `label`
 * is additionally included though it has no upstream `addMagic` entry: it is
 * a valid `<style> label { ... }` selector target regardless (style-block
 * routing does not go through `addMagic`, only skinparam-key translation
 * does — `collectElementStyleBuckets` shares this same allowlist for both
 * mechanisms), jar-verified via `zonobi-55-zuna105`'s `<style>label{FontSize
 * 19}` fixture.
 */
export const ELEMENT_BUCKET_SNAMES = new Set([
  'database',
  'component',
  'node',
  'actor',
  'usecase',
  'artifact',
  'rectangle',
  'agent',
  'boundary',
  'card',
  'cloud',
  'collections',
  'control',
  'entity',
  'file',
  // `SName.participant` (`style/SName.java:132`) -- every sequence
  // participant kind's style signature is `root, element, sequenceDiagram,
  // <kind>` (`ParticipantType.java:55-80`), and this is the DEFAULT kind's.
  // Its siblings (actor, database, boundary, control, entity, queue,
  // collections) were all already here; the one they share a diagram with
  // was not, so `<style> participant { BackgroundColor }` resolved to no
  // bucket at all.
  'participant',
  'folder',
  'frame',
  'hexagon',
  'interface',
  'package',
  'person',
  'queue',
  'stack',
  'storage',
  'label',
  // G2 N32: the class-diagram kind BADGE's own spot color (`element.spot
  // .spot<Kind>`, `EntityImageClassHeader.java#spotStyleSignature` /
  // `FromSkinparamToStyle.java:254-267`) -- reachable via a bare `<style>
  // spotClass { BackgroundColor; LineColor; FontColor }` selector (this
  // bucket mechanism, for FREE) AND the legacy flat `stereotype<X>
  // BackgroundColor`/`stereotype<X>BorderColor` skinparam form (X in
  // A/C/E/I/N -- `matchStereotypeSpotColorKey` below translates the letter
  // to the SAME sname). Scoped to the 5 badge kinds this port's own
  // `class-badge.ts#badgeFill` supports (class/abstract/interface/enum/
  // annotation) -- upstream also has `spotRecord`/`spotDataClass`
  // (stereotypeR/D), unsurveyed, no `ClassifierKind` member exists for
  // either yet (narrower scope, matches `badgeFill`'s own precedent).
  'spotclass',
  'spotabstractclass',
  'spotinterface',
  'spotenum',
  'spotannotation',
  // G2 N34: class-diagram note bucket (`<style> note { BackgroundColor ...
  // } </style>`, `EntityImageNote.java#getStyleSignature` -- `SName.note`
  // under `SName.element`) -- reachable for FREE via this same generic
  // per-element-bucket mechanism, mirroring N32's `spotclass` precedent.
  // The nested `.tagname` sub-selector (`note { .faint { ... } }`, matching
  // a note's OWN `<<stereotype>>` via `withTOBECHANGED`) is a SEPARATE,
  // deeper mechanism -- surveyed, not built (G2 N34 ledger).
  'note',
  // G3/O1: `object`/`map`/`json` each carry their OWN StyleSignature
  // upstream (`EntityImageObject`/`Map`/`Json#getStyleSignature` --
  // `SName.object`/`map`/`json`, all under `SName.objectDiagram`),
  // independent of class's `SName.class_` -- UNLIKE class/interface/enum,
  // which upstream coincidentally share ONE StyleSignature
  // (`renderer-classifier-box.ts#classifierFill`'s own doc comment). Reused
  // for FREE via this same generic per-element bucket for the PLAIN
  // `skinparam {object,map,json}BackgroundColor` form (jar-verified against
  // majake-62-pero492: `skinparam objectBackgroundColor red` tints every
  // plain object's box). The LEGACY tag-scoped form
  // (`objectBackgroundColor<<tag>>`) is a SEPARATE, larger mechanism (ALL
  // `<<tag>>`-suffixed skinparam keys are discarded to `unknown[]` except
  // `classBorderThickness<<X>>` -- see this file's own `key.includes('<<')`
  // early-branch doc comment), deferred, not built here.
  'object',
  'map',
  'json',
  // mission G4 S10: `EntityImageState`/`EntityImageStateCommon`'s own
  // `StyleSignatureBasic.of(root, element, stateDiagram, state)` -- the SAME
  // generic per-element bucket mechanism `object`/`map`/`json` already reuse
  // for FREE (G3/O1 precedent above), for the PLAIN `skinparam
  // {state}BackgroundColor`/`{state}BorderColor`/`{state}FontColor`/
  // `{state}FontSize` form (`xexika-61-fedu273`'s own bare
  // `StateBackgroundColor` skinparam, `plans/g4-state-svg/ledger.md` S9).
  // Scoped at the CONSUMPTION site (`state/state-render-colors.ts
  // #resolveStateFillBucketed`) to the plain leaf box, composite box, and
  // choice/history/deepHistory pseudostates only -- initial/final/fork/
  // join/syncBar keep their OWN distinct default colors (`PSEUDO_ANCHOR_
  // COLOR`/`SYNCHRO_BAR_COLOR`, unrelated `state` StyleSignature) and never
  // consult this bucket, mirroring `EntityImagePseudoState`'s real upstream
  // per-kind StyleSignature split.
  'state',
]);

export type ElementColorRole = 'background' | 'border' | 'font';

const ELEMENT_ROLE_SUFFIXES: ReadonlyArray<
  readonly [suffix: string, role: ElementColorRole]
> = [
  ['backgroundcolor', 'background'],
  ['bordercolor', 'border'],
  ['fontcolor', 'font'],
];

/**
 * Numeric font-size suffixes (G1 I4b) — kept separate from
 * `ELEMENT_ROLE_SUFFIXES` because the stored value is a `number`, not a
 * `Paint` (`parseColor` does not apply). `stereotypefontsize` is checked
 * ahead of `fontsize` for readability only — both suffixes are tried
 * independently per key regardless of order (a key can match at most one).
 */
const ELEMENT_FONT_SIZE_SUFFIXES: ReadonlyArray<
  readonly [suffix: string, role: 'fontSize' | 'stereotypeFontSize']
> = [
  ['stereotypefontsize', 'stereotypeFontSize'],
  ['fontsize', 'fontSize'],
];

/**
 * If `key` is a normalized element-scoped color key
 * (`<sname>(background|border|font)color` for a bucket SName), return its
 * `sname`/`role`; otherwise `undefined`.
 */
export function matchElementColorKey(
  key: string,
): { sname: string; role: ElementColorRole } | undefined {
  for (const [suffix, role] of ELEMENT_ROLE_SUFFIXES) {
    if (key.endsWith(suffix)) {
      const sname = key.slice(0, key.length - suffix.length);
      if (ELEMENT_BUCKET_SNAMES.has(sname)) return { sname, role };
    }
  }
  return undefined;
}

/**
 * G2 N32: `stereotype<X>BackgroundColor`/`stereotype<X>BorderColor` (X in
 * A/C/E/I/N) -- upstream's LEGACY flat-key spelling for the SAME `spot<Kind>`
 * style bucket `matchElementColorKey` reaches via the modern `<style>
 * spotClass { ... }` selector spelling (`FromSkinparamToStyle.java:254-267`
 * explicitly converts one into the other). No `FontColor` legacy key exists
 * upstream for this family -- `font` (glyph color) is `<style>`-only,
 * matches `matchElementColorKey`'s own 3-role shape returning only
 * background/border for this matcher.
 */
const STEREOTYPE_SPOT_LETTER_SNAME: Readonly<Record<string, string>> = {
  a: 'spotabstractclass',
  c: 'spotclass',
  e: 'spotenum',
  i: 'spotinterface',
  n: 'spotannotation',
};

export function matchStereotypeSpotColorKey(
  key: string,
): { sname: string; role: ElementColorRole } | undefined {
  const m = /^stereotype([acein])(background|border)color$/.exec(key);
  if (m === null) return undefined;
  const sname = STEREOTYPE_SPOT_LETTER_SNAME[m[1]!];
  if (sname === undefined) return undefined;
  return { sname, role: m[2] === 'background' ? 'background' : 'border' };
}

/**
 * If `key` is a normalized element-scoped font-size key
 * (`<sname>(Stereotype)?FontSize` for a bucket SName — G1 I4b, mirrors
 * `matchElementColorKey`), return its `sname`/`role`; otherwise `undefined`.
 */
export function matchElementFontSizeKey(
  key: string,
): { sname: string; role: 'fontSize' | 'stereotypeFontSize' } | undefined {
  for (const [suffix, role] of ELEMENT_FONT_SIZE_SUFFIXES) {
    if (key.endsWith(suffix)) {
      const sname = key.slice(0, key.length - suffix.length);
      if (ELEMENT_BUCKET_SNAMES.has(sname)) return { sname, role };
    }
  }
  return undefined;
}

/**
 * mission skin-file-loading (deferred D3 item): `<sname>Shadowing`
 * (`<sname>` a bucket SName -- `ELEMENT_BUCKET_SNAMES`), the per-element
 * skinparam form of `Theme.shadowing`/`ElementColors.shadowing`'s own doc
 * comment. Mirrors `matchElementFontSizeKey`'s identical suffix-match shape;
 * the bare (no-sname) `shadowing` key is handled as its OWN switch case
 * (below), not here -- an empty `sname` slice is never a bucket SName.
 */
export function matchElementShadowingKey(key: string): { sname: string } | undefined {
  const suffix = 'shadowing';
  if (!key.endsWith(suffix)) return undefined;
  const sname = key.slice(0, key.length - suffix.length);
  return ELEMENT_BUCKET_SNAMES.has(sname) ? { sname } : undefined;
}

/**
 * Upstream `FromSkinparamToStyle.java#getShadowingValue`: `false`/`no` ->
 * `0`, `true`/`yes` -> `3`, else the raw numeric value passed through.
 * Returns `undefined` for a non-numeric, non-boolean-word value (mirrors
 * this file's other numeric parsers' `Number.isFinite` guard).
 */
export function parseShadowingValue(value: string): number | undefined {
  const lower = value.toLowerCase();
  if (lower === 'false' || lower === 'no') return 0;
  if (lower === 'true' || lower === 'yes') return 3;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
