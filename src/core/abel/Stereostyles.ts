/**
 * Stereostyles — the `<<<name>>>` triple-guillemet style references an
 * entity can carry (`stereo/Stereostyles.java`).
 *
 * SI1/T5 consumed-slice LOCAL port (full member surface: `NONE`,
 * `isEmpty`, `build`, `getStyleNames`). Upstream home is `stereo/` —
 * move to `src/core/stereo/Stereostyles.ts` when convenient (that
 * package exists but is outside this task's write-set). Upstream's
 * `Pattern2`/`Matcher2` regex wrappers become a native `RegExp`
 * (established convention — see `stereo/StereotypeDecoration.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:45
 */
export class Stereostyles {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:46 */
  static readonly NONE = new Stereostyles();

  /** `LinkedHashSet<String>` → insertion-ordered `Set`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:48 */
  private readonly names = new Set<string>();

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:50-51 */
  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:53-55 */
  isEmpty(): boolean {
    return this.names.size === 0;
  }

  /** `Pattern2.cmpile("\\<{3}(.*?)\\>{3}")`.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:57 */
  private static readonly p = /<{3}(.*?)>{3}/g;

  /** `build(String)` — collect every `<<<name>>>` group.
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:59-65 */
  static build(label: string): Stereostyles {
    const result = new Stereostyles();
    for (const m of label.matchAll(Stereostyles.p)) if (m[1] !== undefined) result.names.add(m[1]);
    return result;
  }

  /** Unmodifiable view → readonly snapshot (same translation as
   * `plasma/Quark.ts#getChildren`).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/stereo/Stereostyles.java:67-69 */
  getStyleNames(): readonly string[] {
    return [...this.names];
  }
}
