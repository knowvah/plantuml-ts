/**
 * Relationship-endpoint identifier grammar (`CLASS_ID`) plus the two small
 * endpoint-string helpers built on it (`stripQuotes`, `splitEndpointPort`),
 * split out of class-relationship-parser.ts to keep that file under the
 * repo's 500-line-per-file cap (T4 Mechanism C, unknown-bucket-routing-repair)
 * — pure move for the helpers, no behavior change beyond the T4 fix itself
 * (see CLASS_ID's own doc comment below).
 */
import type { Classifier } from './ast.js';
import { firstWithName } from './class-namespace.js';

// Atom charset is upstream getClassIdentifier()'s `[%pLN_$]+` — Unicode
// letter/number plus underscore and dollar (regex/Pattern2.java:56), NOT
// ASCII \w. Every regex built from this fragment needs the u flag.
const ID_ATOM = String.raw`[\p{L}\p{N}_$]+`;
// T4 Mechanism C (unknown-bucket-routing-repair): the inter-segment
// separator is a GENERIC character class upstream, not templated from the
// diagram's configured `namespaceSeparator` value at regex-build time --
// `CommandLinkClass.getSeparator()` = `SEPARATOR_CHAR_SINGLE` (`[^%pLN%s
// _$#\:{}<>%g]`, ANY single char that isn't an identifier char or a
// syntactically-reserved one) OR `SEPARATOR_CHAR_DOUBLE` (`\\{2}|::`)
// (`CommandLinkClass.java:81-95`), assembled into `getClassIdentifier()` =
// `SEP?ATOM(?:SEP ATOM)*` (`:177-178`). The diagram's ACTUAL configured
// separator only matters at SPLIT time (`idLeaf`/`splitOnSeparator`,
// class-relationship-parser.ts, already correct) -- the MATCHING grammar
// accepts whatever separator character the source actually used,
// generically, subsuming the previous `\.?` leading-root-marker special
// case (a bare `.` is just one instance of SEPARATOR_CHAR_SINGLE now, not a
// bespoke prefix).
const SEPARATOR_CHAR_SINGLE = String.raw`[^\p{L}\p{N}\s_$#:{}<>"']`;
const SEPARATOR_CHAR_DOUBLE = String.raw`\\\\|::`;
const ID_SEP = String.raw`(?:${SEPARATOR_CHAR_DOUBLE}|${SEPARATOR_CHAR_SINGLE})`;

/**
 * A relationship/lollipop endpoint identifier: a run of separator-joined
 * atoms, or a quoted display string. Exported so class-lollipop.ts
 * (CommandLinkLollipop's ENT1/ENT2) reuses the exact same identifier
 * grammar rather than a second, drifting copy. Every regex built from this
 * fragment needs the `u` flag (ID_ATOM/SEPARATOR_CHAR_SINGLE use `\p{}`).
 */
export const CLASS_ID = String.raw`${ID_SEP}?${ID_ATOM}(?:${ID_SEP}${ID_ATOM})*|"[^"]+"`;

/** Strip a single pair of surrounding double quotes, if present. */
export function stripQuotes(s: string): string {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * A classifier id with an optional `::port` member-name suffix split off.
 * Exported for reuse by class-notes.ts — `note left of Class::member` uses
 * the same entity-ref grammar as a relationship endpoint's `Class::member`
 * (upstream: both ultimately resolve via `CucaDiagram` port-aware lookup).
 *
 * `nsSep` is the diagram's CONFIGURED namespace separator (`state
 * .namespaceSeparator`); `classifiers` is every classifier declared so far.
 * Two upstream guards (both in `CommandLinkClass.executeArg`) suppress the
 * `entity::port` split, in order:
 *  - when `nsSep` is itself `::`, `getPortId`/`removePortId` unconditionally
 *    disable the split — a `::` inside a reference is always a namespace
 *    join in that case, never a port marker;
 *  - otherwise, when the WHOLE raw endpoint already matches an existing
 *    classifier's simple/leaf name (`firstWithName(ent1String) != null`,
 *    line 309/314), the reference resolves to that classifier as-is — a
 *    class explicitly DECLARED with a literal `::` in its name (`class
 *    Role::BadPix` under the default `.` separator, where `::` is just
 *    ordinary name characters, not a separator) must resolve as itself when
 *    later referenced, not get mis-split into a port reference.
 * Both default to values that preserve the unconditional split (`null`/`[]`)
 * for the one caller (class-notes.ts) that does not thread the diagram's
 * separator/classifiers through yet.
 * @see ~/git/plantuml/.../net/atmp/CucaDiagram.java:298-316 (removePortId/getPortId)
 * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:306-317
 */
export function splitEndpointPort(
  raw: string,
  nsSep: string | null = null,
  classifiers: readonly Classifier[] = [],
): { id: string; port?: string } {
  if (raw.startsWith('"')) return { id: stripQuotes(raw) };
  if (nsSep === '::') return { id: raw };
  const sepIdx = raw.indexOf('::');
  if (sepIdx === -1) return { id: raw };
  if (firstWithName(classifiers, nsSep, raw) !== undefined) return { id: raw };
  return { id: raw.slice(0, sepIdx), port: raw.slice(sepIdx + 2) };
}
