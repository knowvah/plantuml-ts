/**
 * Skeleton2 — the `|_` creole tree guides. Upstream lives in the salt
 * package, but its only caller is `klimt/creole/atom/AtomTree.java:63,80`;
 * this port already has it beside that caller
 * (`src/core/klimt/creole/atom/Skeleton2.ts`, jar-verified there). This
 * module is the salt-package path to that same class — a re-export, not a
 * second copy, so the two can never drift.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/salt/element/Skeleton2.java:46-136
 */
export { Skeleton2 } from '../../../core/klimt/creole/atom/Skeleton2.js';
