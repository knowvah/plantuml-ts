import type { Warning } from './Warning.js';

/**
 * WarningHandler — the two-method capability `Pragma` (and, upstream,
 * other diagnostic-collecting objects) implements to accumulate
 * `Warning`s in insertion order with value-based de-duplication.
 *
 * Upstream: warning/WarningHandler.java. Ported in full.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/warning/WarningHandler.java
 */
export interface WarningHandler {
  addWarning(warning: Warning): void;
  getWarnings(): readonly Warning[];
}
