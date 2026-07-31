/**
 * `Stdlib.java`'s stdlib-path key transform, in one place.
 *
 * Extracted from `StdlibStore.ts#resolvePumlResource` (si11a T3) because TWO
 * runtime callers now need it and a second copy is how the port drifts from
 * the jar: the eager path resolves `<bundle/thing>` against an in-memory
 * `BundleData`, while the per-RESOURCE remote path (si11a) must derive the
 * same key to ask a registry for that ONE resource. Both must agree exactly,
 * including the ugly parts, or `<awslib14/Storage/SimpleStorageService>`
 * resolves differently depending on how its bundle happens to be registered.
 *
 * The transform is deliberately faithful to `Stdlib.getPumlResource`
 * (Stdlib.java:98-114) rather than tidied:
 *
 *   - Lowercase the FULL request first, so both the bundle name and the
 *     remainder fold. That is why the key for
 *     `<awslib14/Storage/SimpleStorageService>` is
 *     `storage/simplestorageservice`.
 *   - Strip EVERY `.puml` occurrence, not just a trailing one. Java's
 *     `String#replace(CharSequence, CharSequence)` removes all occurrences of
 *     the literal substring, so `"a.puml/b.puml"` becomes `"a/b"`.
 *     `.split('.puml').join('')` reproduces that exactly -- `split` on a plain
 *     string treats the `.` literally, so no RegExp escaping is involved.
 *   - Split on the FIRST `/` only. The remainder may still contain further
 *     `/`s and is preserved verbatim as the file key.
 *   - `<bundle>` alone, with no `/` at all, resolves to nothing: upstream
 *     returns `null` before ever calling `retrieve` (Stdlib.java:101-102).
 *
 * Alias resolution is NOT here. `StdlibStore.ts#resolveBundle` owns the
 * `link:` chain and its cycle guard, and si11a ADR-2 keeps it there precisely
 * so a remote bundle never needs its own copy.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/Stdlib.java#getPumlResource
 */

/** A stdlib request split into the bundle name and the file key within it. */
export interface StdlibPathParts {
  /** Bundle name, lowercased -- the part before the FIRST `/`. */
  readonly bundle: string;
  /**
   * The file key within that bundle: lowercased, every `.puml` stripped, and
   * any further `/`s preserved (`storage/simplestorageservice`).
   */
  readonly key: string;
}

/**
 * Split a de-bracketed stdlib path (`'C4/C4_Context.puml'`,
 * `'awslib/General/User'`) into its bundle name and file key.
 *
 * Returns `undefined` when `fullname` contains no `/` at all -- upstream
 * treats that as an immediate miss (Stdlib.java:101-102), and checking it here
 * keeps a malformed target from triggering a pointless bundle load.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/Stdlib.java#getPumlResource
 */
export function splitStdlibPath(fullname: string): StdlibPathParts | undefined {
  const cleaned = fullname.toLowerCase().split('.puml').join('');
  const slash = cleaned.indexOf('/');
  if (slash === -1) return undefined;

  return { bundle: cleaned.substring(0, slash), key: cleaned.substring(slash + 1) };
}
