/**
 * `ensureClassifier` — the class parser's single classifier-creation
 * chokepoint — split out of `parser.ts` (which sat exactly at the 500-line
 * module cap) and re-exported from it, so every existing
 * `import { ensureClassifier } from './parser.js'` site is unchanged.
 *
 * Mirrors upstream `CommandLinkClass`'s endpoint resolution
 * (`classdiagram/command/CommandLinkClass.java:320-334`): resolve the
 * reference to a quark, reuse `quark.getData()` when it already exists, and
 * only call `CucaDiagram#reallyCreateLeaf` (`net/atmp/CucaDiagram.java:
 * 218-245`, the `cpt1` tick) when it does not.
 */

import type { Classifier, ClassifierKind } from './ast.js';
import { makeClassifier, registerInNamespace, resolveReference } from './class-namespace.js';
import { eventuallyBuildPhantomGroups, isLikeClass } from './class-namespace-resolve.js';
import { stripQuotes } from './class-relationship-parser.js';
import type { ParseState } from './class-parse-state.js';

/**
 * G2 N39: how many `<style>` blocks (their own opening `<style>` tag's
 * source line) sit strictly BEFORE `currentLine` -- the "style generation"
 * a classifier created AT `currentLine` captures, mirroring upstream's
 * `Entity#currentStyleBuilder` snapshot (`ast.ts#Classifier.styleGeneration`'s
 * doc comment). `currentLine === undefined` (a hand-built literal fixture,
 * or a merged-brace line with no tracked position) returns `0` -- the same
 * "no scoping information available" fallback `state.currentLine`'s own
 * doc comment already documents for `Relationship.sourceLine`.
 */
function countStyleBlocksBefore(
  stylePositions: readonly (number | undefined)[],
  currentLine: number | undefined,
): number {
  if (currentLine === undefined) return 0;
  let count = 0;
  for (const pos of stylePositions) {
    if (pos !== undefined && pos < currentLine) count += 1;
  }
  return count;
}

/** Phase-1 output: a reference resolved to its quark (id + owning
 *  namespace + default display), no leaf created yet. */
export interface ClassifierRef {
  readonly id: string;
  readonly nsId: string | null;
  readonly display: string | undefined;
}

/**
 * Phase 1 of `CommandLinkClass#executeArg` -- `quarkInContextSafe`
 * (`CommandLinkClass.java:320-325`): resolve a raw reference to its
 * fully-qualified id, registering its namespace chain (data-less quarks, no
 * tick). `pendingQuarks` are leaves registered by an EARLIER phase-1 call of
 * the same command but not yet created: upstream's `countByName`
 * (`plasma/Plasma.java:104-108`) already counts their quarks.
 */
export function resolveClassifierRef(
  state: ParseState,
  rawName: string,
  display: string | undefined,
  reuseExistingChild: boolean,
  pendingQuarks: readonly Classifier[] = [],
): ClassifierRef {
  return resolveReference({
    namespaces: state.ast.namespaces,
    sep: state.namespaceSeparator,
    activeNamespace: state.activeNamespace,
    // Strip surrounding quotes so a quoted name (`"side1"`) resolves to the same
    // id whether it comes from a declaration, a relationship, or an assoc-couple.
    name: stripQuotes(rawName),
    display,
    classifiers: pendingQuarks.length === 0 ? state.ast.classifiers : [...state.ast.classifiers, ...pendingQuarks],
    reuseExistingChild,
  });
}

/** Whether `ref` names a quark this port has not registered yet: neither a
 *  classifier nor a namespace node (a namespace id -- data-less or not -- is
 *  already a child of its parent through `parentId`). */
function isUnregisteredQuark(state: ParseState, ref: ClassifierRef): boolean {
  if (state.classifierIndex.has(ref.id)) return false;
  return !state.ast.namespaces.some((n) => n.id === ref.id);
}

/**
 * cdd3-T9 S-1b: register a to-be-created leaf's quark as a child of its
 * namespace NOW (`Quark#child` registers it at resolution time,
 * `plasma/Quark.java:57-66`), so a sweep run by another endpoint's creation
 * in between counts it (`countChildren > 0`). Returns the unregistered stub
 * a later phase-1 call counts by name, or undefined when the quark was
 * already registered.
 */
export function registerPendingLeaf(state: ParseState, ref: ClassifierRef): Classifier | undefined {
  if (!isUnregisteredQuark(state, ref)) return undefined;
  registerInNamespace(state.ast.namespaces, ref.nsId, ref.id);
  return makeClassifier(ref.id, 'class', ref.display, ref.nsId);
}

/**
 * Phase 2 -- `reallyCreateLeaf` (`net/atmp/CucaDiagram.java:218-245`) when
 * the quark has no data, else the existing entity. `registered` is true when
 * {@link registerPendingLeaf} already added the id to its namespace.
 */
export function materializeClassifier(
  state: ParseState,
  ref: ClassifierRef,
  kind: ClassifierKind,
  registered = false,
): Classifier {
  const { id, nsId, display: disp } = ref;
  const existing = state.classifierIndex.get(id);
  if (existing !== undefined) {
    return state.ast.classifiers[existing]!;
  }
  const groupAlias = existingGroupAlias(state, id, kind, disp, nsId);
  if (groupAlias !== undefined) return groupAlias;
  const classifier = makeClassifier(id, kind, disp, nsId);
  // G2 N2 (mechanism 3): this is the single classifier-creation chokepoint
  // (declarations AND relationship-endpoint auto-create both funnel
  // through here — see this function's own doc comment) — see
  // ast.ts#Classifier.creationIndex's doc comment.
  state.creationCounter.value += 1;
  classifier.creationIndex = state.creationCounter.value;
  // G2 N39: mirrors upstream `CucaDiagram#createLeaf` capturing
  // `getCurrentStyleBuilder()` AT THIS SAME CHOKEPOINT — see
  // ast.ts#Classifier.styleGeneration's doc comment.
  classifier.styleGeneration = countStyleBlocksBefore(state.stylePositions, state.currentLine);
  const idx = state.ast.classifiers.length;
  state.ast.classifiers.push(classifier);
  state.classifierIndex.set(id, idx);
  if (!registered) registerInNamespace(state.ast.namespaces, nsId, id);
  // Mirrors upstream `reallyCreateLeaf` (CucaDiagram.java:218-228), which
  // unconditionally sets `lastEntity` on every leaf creation. ensureClassifier
  // is the single creation chokepoint for both declarations and
  // relationship-endpoint auto-create, so this covers both call sites —
  // matching upstream, where both paths also funnel through reallyCreateLeaf.
  state.lastEntity = id;
  // cdd-T1: the TAIL of `reallyCreateLeaf` -- CucaDiagram.java:239-240, `if
  // (type.isLikeClass()) eventuallyBuildPhantomGroups(location);`.
  if (isLikeClass(kind)) {
    eventuallyBuildPhantomGroups(state.ast.namespaces, state.ast.classifiers, state.creationCounter);
  }
  return classifier;
}

/**
 * Ensure a classifier exists for the raw reference; create if absent. The
 * reference is resolved to a fully-qualified (namespace-aware) id, so the
 * returned `id` may differ from `rawName` — callers storing the reference
 * elsewhere (relationships, body opener) must use the returned `id`.
 *
 * `reuseExistingChild` mirrors upstream `quarkInContext`'s flag of the same
 * name: true at relation-endpoint sites (a bare name may resolve to an
 * existing classifier declared elsewhere), false at declaration sites
 * (always scope-local, upstream `CommandCreateClass`). Defaults to false so
 * every pre-existing declaration call site is unaffected; endpoint call
 * sites pass `true` explicitly. A single-reference command resolves and
 * creates back to back; a TWO-endpoint link uses the phases separately
 * (`class-command-relationships.ts`, cdd3-T9 S-1b).
 */
export function ensureClassifier(
  state: ParseState,
  rawName: string,
  kind: ClassifierKind = 'class',
  display?: string,
  reuseExistingChild = false,
): Classifier {
  return materializeClassifier(state, resolveClassifierRef(state, rawName, display, reuseExistingChild), kind);
}
/**
 * cdd-T3 (A1 SB4): upstream's `quarkInContextSafe` hands back the
 * ALREADY-EXISTING quark when the reference names one
 * (`net/atmp/CucaDiagram.java:249-286`), and `CommandLinkClass` then reads
 * `quark.getData()` and only falls through to `reallyCreateLeaf` when that
 * data is `null` (`CommandLinkClass.java:326-334`). For a reference naming
 * a declared `package`/`namespace` the data is the GROUP `Entity`, so NO
 * `Entity` constructor runs and NO `cpt1` tick is burned
 * (`abel/Entity.java:171`) — `p1 -> p2` links the two cluster Entities.
 *
 * This port has no unified quark tree: groups live in `ast.namespaces` and
 * leaves in `ast.classifiers`, and `ensureClassifier`'s `classifierIndex`
 * reuse check therefore misses the group case entirely, minting a phantom
 * leaf row (and a tick) for every package-named endpoint. Returning an
 * UNREGISTERED stub here reproduces upstream: the caller still gets the
 * group's resolved `id` for its relationship endpoint (so `renderer-uid.ts
 * #resolveEntityUid` finds it in `namespaceUid`), while `ast.classifiers`,
 * `classifierIndex`, `lastEntity` and the counter are all left untouched.
 *
 * `creationIndex !== undefined` is this port's `quark.getData() != null`:
 * an implicit namespace segment that has not yet been materialised by
 * `eventuallyBuildPhantomGroups` is still a data-less quark (cdd-T1), and
 * upstream WOULD create a leaf for it.
 */
function existingGroupAlias(
  state: ParseState,
  id: string,
  kind: ClassifierKind,
  display: string | undefined,
  nsId: string | null,
): Classifier | undefined {
  const group = state.ast.namespaces.find((n) => n.id === id && n.creationIndex !== undefined);
  if (group === undefined) return undefined;
  return makeClassifier(id, kind, display, nsId);
}
