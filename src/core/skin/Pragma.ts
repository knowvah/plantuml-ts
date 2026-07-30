/**
 * Pragma — the resolved `!pragma <key> <value>` table for one diagram,
 * plus the `WarningHandler` capability every pragma-aware command shares.
 *
 * Upstream: skin/Pragma.java. Ported in full: the private constructor +
 * `createEmpty` factory, `define`, `isDefine`, `undefine`, `getValue`,
 * `isTrue`, `isFalse`, `legacyReplaceBackslashNByNewline` (a static
 * method whose body is the literal `return true;` in the Java too —
 * ported verbatim rather than inlined at call sites, matching
 * `StripeTable.ts#getWithNewlinesInternal`'s own faithful two-branch
 * port of the caller that reads it), `addWarning`/`getWarnings`
 * (`WarningHandler`).
 *
 * ## `getLatexEngine()` is a cited, throwing BLOCKED-ON-THE-PROCESS-SEAM
 *
 * `getLatexEngine()` delegates to `LatexEngine.getSuggestedEngine(this)`
 * (`tikz/LatexEngine.java`, 123 lines, itself unported and out of this
 * task's write-set: `net.sourceforge.plantuml.tikz`, not
 * `net.sourceforge.plantuml.skin`). That method's ENTIRE purpose is
 * probing whether `lualatex`/`xelatex`/`pdflatex` is installed by
 * spawning `ProcessBuilder(command, "--version")` and reading its exit
 * code — genuinely impossible in this port's browser-only `src/`
 * (`CLAUDE.md`'s Architecture Notes: no Node built-ins, no
 * `child_process`). Unlike `utils/SignatureUtils.ts`'s file-read seam
 * (where a caller COULD supply bytes via a callback), there is no
 * meaningful browser substitute for "is a native binary on PATH" — this
 * is the SAME class of gap as `SignatureUtils.ts`'s own BLOCKED-ON-THE-
 * FILE-SEAM note, just for a process instead of a filesystem handle.
 * Thrown, never silently dropped or stubbed to a fixed `NONE`/`UNKNOWN`
 * value (ADR-8 corollary). No caller in this port's reachable scope
 * calls `getLatexEngine()` today — `StripeLatex`/`AtomMath`/
 * `ScientificEquationSafe` (T10e) are the only upstream callers, and
 * none is in this task's write-set — so this is a build/test-time
 * signal only.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/Pragma.java
 */
import { pragmaKeyDefaultValue, pragmaKeyLazyFrom } from './PragmaKey.js';
import type { PragmaKey } from './PragmaKey.js';
import type { Warning } from '../warning/Warning.js';
import type { WarningHandler } from '../warning/WarningHandler.js';

/** One labelled, cited "blocked on a Node/OS process spawn, impossible in
 *  a browser" seam — thrown, never silently dropped or stubbed to wrong
 *  output (ADR-8 corollary, the process-seam sibling of
 *  `utils/SignatureUtils.ts`'s file-seam note). */
function blockedOnProcessSeam(): Error {
  return new Error(
    'Pragma.getLatexEngine: LatexEngine.getSuggestedEngine(pragma) is not yet ' +
      'supported -- tikz/LatexEngine.java (123 lines) spawns a native ' +
      'lualatex/xelatex/pdflatex process to probe installation, which cannot ' +
      'exist in a browser-only src/ (CLAUDE.md: no Node built-ins, no ' +
      'child_process) -- BLOCKED ON THE PROCESS SEAM, mirroring ' +
      'utils/SignatureUtils.ts own file-seam precedent. No caller in this ' +
      'port reachable scope calls getLatexEngine() today.',
  );
}

export class Pragma implements WarningHandler {
  private readonly values = new Map<PragmaKey, string | null>();
  private readonly warnings: Warning[] = [];

  private constructor() {}

  static createEmpty(): Pragma {
    return new Pragma();
  }

  define(keyName: string, value: string | null): void {
    const key = pragmaKeyLazyFrom(keyName);
    if (key !== null) {
      let v = value;
      if (v === null) {
        const defaultValue = pragmaKeyDefaultValue(key);
        if (defaultValue !== null) v = defaultValue;
      }
      this.values.set(key, v);
    }
  }

  isDefine(key: PragmaKey): boolean {
    return this.values.has(key);
  }

  undefine(key: PragmaKey): void {
    this.values.delete(key);
  }

  getValue(key: PragmaKey): string | null {
    return this.values.get(key) ?? null;
  }

  getLatexEngine(): never {
    throw blockedOnProcessSeam();
  }

  isTrue(key: PragmaKey): boolean {
    const value = this.getValue(key);
    return value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'on');
  }

  isFalse(key: PragmaKey): boolean {
    const value = this.getValue(key);
    return value !== null && (value.toLowerCase() === 'false' || value.toLowerCase() === 'off');
  }

  static legacyReplaceBackslashNByNewline(): boolean {
    return true;
  }

  addWarning(warning: Warning): void {
    if (this.warnings.some((w) => w.equals(warning))) return;
    this.warnings.push(warning);
  }

  getWarnings(): readonly Warning[] {
    return this.warnings;
  }
}
