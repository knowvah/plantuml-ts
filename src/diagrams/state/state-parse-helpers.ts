/**
 * Grammar-decoding helpers for the state parser's command bodies — split
 * out of `state-parse-state.ts` (which owns the scope-stack/mutation
 * machinery) purely to stay under the file-size cap; `extractDisplayAndId`/
 * `parseLabel` touch no `ParseState`. The concurrent-region guard below
 * (mission state-declared-size-fix/T5, decisions.md#D2) was placed here
 * instead of `state-parse-resolve.ts` purely to keep THAT file under the
 * same file-size cap — it is read-only over `ParseState`/`Scope`, same
 * discipline as everything else in this repo's parser layer.
 */

import type { State, Transition } from './ast.js';
import { type ParseState, type Scope, currentScope, rootScope } from './state-parse-state.js';
import { DiagramRefusal } from '../../core/error/error-diagrams.js';

/**
 * Extract display name and id from a regex match built from `ID_ALT`
 * (`state-commands-declarations.ts`) — the 4-group alternation mirroring
 * `CommandCreateState`'s CODE1-4/DISPLAY1-2 grammar: `id as "quoted"`,
 * `"quoted" as id`, bare `id` alone, or bare `"quoted"` alone.
 *
 * Exactly one of `bareIdGroup`/`quotedGroup` is ever defined (the two
 * top-level alternatives are mutually exclusive by leading character); each
 * side's own trailing `as` clause is independently optional, so the
 * matching side's OTHER group may or may not be defined too:
 *   - `bareIdGroup` defined, `bareIdDisplayGroup` defined  → `id as "disp"`
 *   - `bareIdGroup` defined, `bareIdDisplayGroup` undefined → bare `id` alone
 *     (display defaults to the id itself, mirroring upstream's
 *     `quark.getName()` fallback when `DISPLAY` is null)
 *   - `quotedGroup` defined, `quotedIdGroup` defined  → `"disp" as id`
 *   - `quotedGroup` defined, `quotedIdGroup` undefined → bare `"text"` alone
 *     (the quoted text becomes BOTH the id and the display — same
 *     `quark.getName()` fallback, applied to the quoted text as CODE)
 * @see ~/git/plantuml/.../statediagram/command/CommandCreateState.java:84-98 (CODE1-4/DISPLAY1-2)
 * @see ~/git/plantuml/.../statediagram/command/CommandCreateState.java:176-182 (idShort/display resolution)
 */
export function extractDisplayAndId(
  match: RegExpExecArray,
  bareIdGroup: number,
  bareIdDisplayGroup: number,
  quotedGroup: number,
  quotedIdGroup: number,
): { display: string; id: string } {
  const bareId = match[bareIdGroup];
  if (bareId !== undefined) {
    const display = match[bareIdDisplayGroup];
    return { display: display ?? bareId, id: bareId };
  }
  const quoted = match[quotedGroup]!;
  const quotedId = match[quotedIdGroup];
  return { display: quoted, id: quotedId ?? quoted };
}

/** A group a registered `State` belongs to -- `scope` + which region within
 *  it (`0` = the owner's own, never-concurrent group; `N >= 1` = the `N`th
 *  `--`/`||`-delimited `CONCURRENT_STATE` region). Stands in for upstream's
 *  `Entity#getParentContainer()`/`getCurrentGroup()` identity, which our
 *  port has no single object for (a concurrent region is a `Scope.regions`
 *  slot, not its own `Scope`). */
interface GroupKey {
  scope: Scope;
  region: number;
}

function sameGroup(a: GroupKey, b: GroupKey): boolean {
  return a.scope === b.scope && a.region === b.region;
}

/**
 * Find the scope+region a REGISTERED state currently lives in. Every State
 * this port ever creates passes through the single `registerStateInto`
 * chokepoint (state-parse-resolve.ts), which pushes it into exactly one
 * `scope.regions[N]` array -- so this scan always finds a match for a
 * `state` that came from `resolveExistingState`/`globalByName`/a scope's
 * own `stateIndex`. Root first (never keyed in `scopeByOwner`, whose keys
 * are composite OWNERS only), then every composite's own scope.
 */
function findParentGroup(ps: ParseState, state: State): GroupKey | undefined {
  const scopes: Scope[] = [rootScope(ps), ...ps.scopeByOwner.values()];
  for (const scope of scopes) {
    for (let region = 0; region < scope.regions.length; region++) {
      if (scope.regions[region]!.includes(state)) return { scope, region };
    }
  }
  return undefined;
}

/**
 * Port of `StateDiagram#checkConcurrentStateOk`/`checkConcurrentStateOkInternal`
 * (`StateDiagram.java:70-90`): true when reusing `existing` from the CURRENT
 * scope's region is legitimate. `existing === undefined` is upstream's
 * `code.getData() == null` early return -- a not-yet-created id has no
 * conflicting parent to violate. Otherwise upstream's two symmetric branches
 * (current group concurrent-and-different / existing's own parent
 * concurrent-and-different) collapse to one predicate: false exactly when
 * EITHER side is a concurrent region AND the two groups differ; a boundary
 * crossing between two ordinary (non-concurrent) groups is always fine, and
 * self-reference within the SAME region is always fine.
 * @see ~/git/plantuml/.../statediagram/StateDiagram.java:70-90
 */
function checkConcurrentStateOk(ps: ParseState, existing: State | undefined): boolean {
  if (existing === undefined) return true;
  const current: GroupKey = { scope: currentScope(ps), region: currentScope(ps).regionCursor };
  // Guaranteed to resolve -- see findParentGroup's own doc comment.
  const owner = findParentGroup(ps, existing)!;
  if (current.region === 0 && owner.region === 0) return true;
  return sameGroup(current, owner);
}

/**
 * Throw `DiagramRefusal` when {@link checkConcurrentStateOk} rejects
 * `existing` -- factored out so `state-parse-resolve.ts` call sites add one
 * non-branching statement instead of their own `if`, keeping their CCN
 * unchanged (decisions.md#D2: our error names STATE at the real line, but
 * this parser tracks no per-line position at all -- unlike the class
 * engine's `ast.errorLine` -- so `line` is `undefined` and {@link errorSvg}
 * falls back to the source's last line; the jar's own `mergeV2` banner text
 * may also differ). Exported for `state-parse-resolve.ts`'s `ensureState`/
 * `declareState`/`resolveOrCreateDottedPath` call sites.
 */
export function assertConcurrentStateOk(ps: ParseState, existing: State | undefined, message: string): void {
  if (checkConcurrentStateOk(ps, existing)) return;
  throw new DiagramRefusal(message, undefined, 'state');
}

/**
 * Throw `DiagramRefusal` when a `mode==='neutral'` (transition-endpoint,
 * `ensureState`) dotted resolution manufactured its FINAL segment's DIRECT
 * parent brand-new -- upstream's `CommandLinkStateCommon.java:277-278` gate
 * (`quark.getParent().getData() == null`). `Quark#child`'s per-segment walk
 * (`plasma/Quark.java:116-132`) never assigns Entity DATA to a
 * freshly-manufactured intermediate quark, so a `getEntity`-routed
 * reference whose resolution needed one is a parse error, not a valid
 * resolution (fugedo-34-fice721: `ChildMode1.A` from sibling `ChildMode2`
 * manufactures a phantom `ChildMode2 > ChildMode1` distinct from the real
 * `ParentMode > ChildMode1`). `'phantom'`/`'promote'` mode (composite/frame
 * block opener, leaf-style declare -- `isNeutralMode: false`) never trip
 * this: upstream's `CommandCreatePackageState`/`CommandCreateState` reach
 * the ancestor walk directly via `quarkInContext`, never through
 * `getEntity`, so a brand-new ancestor there is a legitimate declaration.
 * @see ~/git/plantuml/.../statediagram/command/CommandLinkStateCommon.java:277-278
 */
export function assertDottedParentHasData(
  isNeutralMode: boolean,
  directParentWasFreshlyCreated: boolean,
  fullId: string,
): void {
  if (!isNeutralMode || !directParentWasFreshlyCreated) return;
  throw new DiagramRefusal(`The state ${fullId} cannot be used here.`, undefined, 'state');
}

/**
 * Parse a transition label into guard / action / label fields.
 *
 * Formats:
 *   [guard] / action   → guard + action (label = raw text)
 *   [guard]            → guard only
 *   / action           → action only
 *   anything else      → label only
 */
export function parseLabel(raw: string): Pick<Transition, 'guard' | 'action' | 'label'> {
  const trimmed = raw.trim();
  if (trimmed === '') return {};

  // Try to extract [guard] at the start.
  const guardMatch = /^\[([^\]]*)\](.*)$/.exec(trimmed);
  if (guardMatch !== null) {
    const guard = guardMatch[1]!.trim();
    const rest = guardMatch[2]!.trim();
    // After guard, optional "/ action"
    const actionMatch = /^\/\s*(.*)$/.exec(rest);
    if (actionMatch !== null) {
      const action = actionMatch[1]!.trim();
      return {
        guard: guard !== '' ? guard : undefined,
        action: action !== '' ? action : undefined,
        label: trimmed,
      } as Pick<Transition, 'guard' | 'action' | 'label'>;
    }
    // Guard only — carry rest as label when non-empty.
    return {
      ...(guard !== '' ? { guard } : {}),
      ...(rest !== '' ? { label: trimmed } : {}),
    };
  }

  // Try "/ action" with no guard.
  const bareAction = /^\/\s*(.+)$/.exec(trimmed);
  if (bareAction !== null) {
    const action = bareAction[1]!.trim();
    return { action, label: trimmed };
  }

  // Plain label.
  return { label: trimmed };
}
