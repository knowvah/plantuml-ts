/**
 * `together { }` for the class parser (cdd3-T18): which entities a together
 * block holds.
 *
 * Upstream keeps ONE stack for groups and togethers (`CucaDiagram.stacks`).
 * `currentTogether()` is the top entry when that entry is a `Together`, else
 * null (`atmp/CucaDiagram.java:188-194`). `reallyCreateLeaf` stamps it on
 * every leaf it creates (`:232`). `gotoGroup` stamps it on a group only when
 * it creates the group (`:349-353`). A leaf created implicitly by a link
 * inside the block joins; an entity created BEFORE the block and only named
 * inside it does not (`sipigu-91-baku027`: no `t` subgraph in the jar DOT).
 *
 * This parser keeps groups on `namespaceStack`/`activeNamespace` and
 * togethers on `togetherStack`. The top of upstream's stack is a together
 * exactly when the innermost together frame opened in the active namespace.
 *
 * Leaves are resolved by `creationIndex`, not at each creation site. The
 * parser records `currentTogether()` before every dispatched line
 * ({@link recordTogetherEvent}). No command both changes the stack and
 * creates a leaf, so a leaf's together is the last recorded value before its
 * index ({@link resolveTogetherMembers}).
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:188-194,232,339-353
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandTogether.java:73-76
 */
import type { ClassDiagramAST, ClassTogether } from './ast.js';
import type { ParseState } from './parser.js';
import { closeContainer } from './class-container.js';

/** One open `together {` block: its id and the namespace active at open. */
export interface TogetherFrame {
  readonly ns: string | null;
  readonly id: string;
}

/** `currentTogether()` from creation counter value `at` onwards. */
export interface TogetherEvent {
  readonly at: number;
  readonly id: string | undefined;
}

/** `CucaDiagram#currentTogether` (`atmp/CucaDiagram.java:188-194`). */
export function currentTogether(state: ParseState): string | undefined {
  const top = state.togetherStack[state.togetherStack.length - 1];
  return top !== undefined && top.ns === state.activeNamespace ? top.id : undefined;
}

/** `together {` (`CommandTogether` -> `CucaDiagram#gotoTogether`,
 *  `atmp/CucaDiagram.java:339-341`): a new `Together` whose parent is
 *  `currentTogether()`, pushed on the stack. The matching `}` pops the
 *  together, not the enclosing namespace (nadono-22-gidu983: a stray `}`
 *  once popped the namespace early). */
export function openTogetherBlock(state: ParseState): void {
  const togethers = (state.ast.togethers ??= []);
  const parentId = currentTogether(state);
  const id = `t${togethers.length}`;
  togethers.push({ id, members: [], ...(parentId !== undefined ? { parentId } : {}) });
  state.togetherStack.push({ ns: state.activeNamespace, id });
}

/** Shared `}` handling (rule 4 in class-commands.ts): an open member body
 *  wins, then an innermost together block opened in the CURRENT namespace
 *  scope (LIFO, as upstream's single stack), then the active namespace. */
export function closeBraceScope(state: ParseState): void {
  if (state.pendingBodyId !== null) {
    state.pendingBodyId = null;
    return;
  }
  if (currentTogether(state) !== undefined) {
    state.togetherStack.pop();
    return;
  }
  if (state.activeNamespace !== null) {
    closeContainer(state, state.activeNamespace);
    state.activeNamespace = state.namespaceStack.pop() ?? null;
  }
}

/** Record `currentTogether()` before a line is dispatched, when it changed. */
export function recordTogetherEvent(state: ParseState): void {
  const id = currentTogether(state);
  const last = state.togetherEvents[state.togetherEvents.length - 1];
  if ((last === undefined ? undefined : last.id) === id) return;
  state.togetherEvents.push({ at: state.creationCounter.value, id });
}

/** The together current when the entity with `creationIndex` was created. */
export function togetherAt(events: readonly TogetherEvent[], creationIndex: number): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]!.at < creationIndex) return events[i]!.id;
  }
  return undefined;
}

function joinTogether(ast: ClassDiagramAST, together: string | undefined, id: string): void {
  if (together === undefined) return;
  const t: ClassTogether | undefined = ast.togethers?.find((x) => x.id === together);
  if (t !== undefined && !t.members.includes(id)) t.members.push(id);
}

/**
 * `gotoGroup`'s `result.setTogether(currentTogether())` (`atmp/
 * CucaDiagram.java:349-353`), for a group this `package`/`namespace` opener
 * CREATED. A group that muted an existing leaf keeps that leaf's together:
 * `muteToGroupType` mutates the same entity (`abel/Entity.java:201-204`).
 * Runs inside the opening command, so the last event is the together current
 * before it.
 */
export function joinGroupTogether(
  state: ParseState,
  groupId: string,
  created: boolean,
  mutedCreationIndex: number | undefined,
): void {
  if (!created || state.ast.togethers === undefined) return;
  const at = mutedCreationIndex ?? Number.POSITIVE_INFINITY;
  joinTogether(state.ast, togetherAt(state.togetherEvents, at), groupId);
}

/** Every leaf (classifier, note) with a `creationIndex` joins the together
 *  current at its creation (`atmp/CucaDiagram.java:232`). Run once per
 *  finished page. */
export function resolveTogetherMembers(state: ParseState): void {
  const { ast, togetherEvents } = state;
  if (ast.togethers === undefined) return;
  for (const leaf of [...ast.classifiers, ...ast.notes]) {
    if (leaf.creationIndex !== undefined) joinTogether(ast, togetherAt(togetherEvents, leaf.creationIndex), leaf.id);
  }
}
