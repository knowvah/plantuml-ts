/**
 * `RealDebug` — the opt-in creation-point capture for `Real`s.
 *
 * Orchestrator ruling (gep T4d): `CAPTURE_CREATION_POINT` reads
 * `System.getProperty`/`System.getenv("PLANTUML_REAL_DEBUG")`
 * (`RealDebug.java:80-81`). `src/` may not read `process.env`, and the port
 * is a browser-safe library: the same situation as upstream's TeaVM build,
 * where `create()` returns `null` (`RealDebug.java:88-92`). So the flag is
 * the constant `false`; `create()`, `printCreationStackTrace()` and the
 * `RealDebug | null` fields elsewhere keep upstream's structure.
 * `isTrue` (`:108-110`) only parses that flag and has no caller left.
 *
 * `System.err.println` and `Logme.error(Throwable)` (`:101-106`) are not
 * mirrored (no console in `src/`, eslint `no-console`; precedent
 * `src/core/elk/MyElkEdge.ts`); the only reachable branch upstream under
 * TeaVM is the `null` one, which printed the "rerun with" hint.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/real/RealDebug.java
 */
export class RealDebug {
  /** `RealDebug.java:80-81`, fixed `false` by the ruling above. */
  private static readonly CAPTURE_CREATION_POINT: boolean = false;

  /** `RealDebug.java:83` `creationPoint` (a `Throwable`). */
  readonly creationPoint: Error;

  /** `RealDebug.java:88-92`: `null` unless the capture flag is set. */
  static create(): RealDebug | null {
    if (RealDebug.CAPTURE_CREATION_POINT) return new RealDebug();
    return null;
  }

  /** `RealDebug.java:94-97`. */
  private constructor() {
    this.creationPoint = new Error();
  }

  /**
   * `RealDebug.java:101-106`. Both branches only print (`System.err`,
   * `Logme.error`), which is not mirrored (see the class comment).
   */
  static printCreationStackTrace(debug: RealDebug | null): void {
    if (debug === null) {
      // RealDebug.java:102-103: System.err.println("(creation point not captured; ...)")
      return;
    }
    // RealDebug.java:105: Logme.error(debug.creationPoint)
  }
}
