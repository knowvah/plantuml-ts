/**
 * ADR-2's fail-closed MIT allowlist
 * (`plans/si11b-bootstrap-sprite-splitting/decisions.md#adr-2`).
 *
 * Measured against `assets/stdlib.manifest.json` (2026-07-31): only 8 of 34
 * bundles carry a `license` field at all, and the field is free text, not a
 * normalised SPDX id -- `bootstrap1.13.1` is `"MIT License"`, `C4` is
 * `"MIT"`, `adaml` is `"GPL"`, `material7.4.47` is
 * `"Apache License, Version 2.0"`. `awslib14` has NO `license` field
 * whatsoever; its CC BY-ND status exists only as prose in
 * `packages/stdlib-aws/LICENSES.md`.
 *
 * This is deliberately an ALLOWLIST of the exact MIT spellings observed,
 * not a denylist of known-bad strings: a denylist ("refuse GPL/CC BY-ND")
 * fails OPEN on `awslib14`, the one bundle with no `license` field at all
 * and the single case where deriving a modified work would void the grant.
 * `undefined` and every unrecognised string -- including ones that merely
 * look MIT-adjacent -- fail closed by construction.
 */

const MIT_LICENSE_STRINGS: ReadonlySet<string> = new Set(['MIT', 'MIT License']);

/**
 * True only when `license` is an exact MIT spelling on the allowlist.
 * `undefined` (no `license` field -- `awslib14`'s case) and any other
 * string (`"GPL"`, `"Apache License, Version 2.0"`, a typo, an SPDX
 * variant not yet reviewed) all return `false`.
 */
export function isMitAllowed(license: string | undefined): boolean {
  return license !== undefined && MIT_LICENSE_STRINGS.has(license);
}
