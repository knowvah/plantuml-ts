/**
 * `Namespace.url` / `Namespace.color` setters, split out of
 * `class-container.ts` to keep that file under the project's 500-line
 * cap (T11) -- re-exported there so `import { setNamespaceUrl } from
 * './class-container.js'` call sites are unaffected, mirroring `ast.ts`'s
 * own split-and-re-export convention for the same reason.
 */
import type { ParseState } from './parser.js';
import { parseUrlBracket } from './class-url.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';

/**
 * T11 (diagnosis A2b E4): thread a namespace header's captured `[[url]]`
 * bracket onto its Namespace. `bracket`/the parse result may be undefined
 * (no url written, or a malformed bracket that fails `parseUrlBracket`'s
 * 5-way grammar) -- both are silent no-ops, same posture as
 * {@link applyUrlStatement}'s (class-url-command.ts) unresolvable-target
 * case. A no-op too when `nsId` no longer resolves to a `Namespace` (a
 * same-line `package X [[url]] {}` collapses to a Classifier via
 * `collapseEmptyNamespace` immediately after this call site runs).
 */
export function setNamespaceUrl(state: ParseState, nsId: string, bracket: string | undefined): void {
  if (bracket === undefined) return;
  const url = parseUrlBracket(bracket);
  if (url === undefined) return;
  const ns = state.ast.namespaces.find((n) => n.id === nsId);
  if (ns !== undefined) ns.url = url;
}

/**
 * T11 (diagnosis A3 M3): thread a namespace header's captured inline
 * colour spec (`NOTE_COLOR`) onto its Namespace, resolved to its
 * bare/`back:` half via {@link resolveBareOrBackColor} (M1's
 * classifier-declaration precedent) -- see `Namespace.color`'s own doc
 * comment for why this resolves at parse time rather than storing the raw
 * compound spec.
 */
export function setNamespaceColor(state: ParseState, nsId: string, colorSpec: string | undefined): void {
  const color = resolveBareOrBackColor(colorSpec);
  if (color === undefined) return;
  const ns = state.ast.namespaces.find((n) => n.id === nsId);
  if (ns !== undefined) ns.color = color;
}
