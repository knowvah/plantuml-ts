# cdd-T1 — implicit-package uid ticks deferred past their leaf

## Observation: upstream materialises implicit packages in a GLOBAL sweep, not per-resolution
- **Context**: porting `CucaDiagram#eventuallyBuildPhantomGroups` for cdd-T1.
- **Finding**: the T1 spec described a per-resolution "collector" (record the
  ids `ensureNamespaceChain` just created, tick them after the leaf). The Java
  does something strictly wider: `reallyCreateLeaf`'s tail
  (`net/atmp/CucaDiagram.java:239-240`) calls a method that walks **every**
  registered quark (`:325-336`, `for (Quark<Entity> quark : this.quarks())`)
  and materialises a PACKAGE group for each one that is data-less and has
  children. The collector shape cannot reproduce `pidagu-83-dopu070`: there
  the late segments (`org`, `org.junit`, `org.junit.jupiter`) are created by
  the EXPLICIT `package org.junit.jupiter.engine {` path, not by a reference
  resolution, so no per-resolution collector ever sees them. The global sweep
  gets them for free.
- **Impact**: T3 should extend the same global sweep, not build a collector.
- **Confidence**: High (both method bodies read; three fixtures reproduce).

## Interface out (for T3)
`src/diagrams/class/class-namespace-resolve.ts` exports:

```ts
export function isLikeClass(kind: ClassifierKind): boolean;
export function eventuallyBuildPhantomGroups(
  namespaces: Namespace[],            // registration order == Plasma#quarks order
  classifiers: readonly Classifier[], // read-only; used for countChildren
  counter: { value: number },         // the shared cpt1 box (state.creationCounter)
): void;
```

Contract: idempotent. A namespace with `creationIndex !== undefined` is
upstream's `quark.getData() != null` and is skipped; a namespace with zero
children is skipped (`Quark#countChildren`). Called from `parser.ts` at three
places — the tail of `ensureClassifier` under `if (isLikeClass(kind))`
(`CucaDiagram.java:239-240`), and once per finished diagram in
`finalizeParse`/`startNewPage` (`CucaDiagram.java:464`, `getTextBlock`'s own
`this.eventuallyBuildPhantomGroups(null)`). T3's phantom `apoint`/`GMN` ticks
belong in the same sweep-shaped seam, ordered against the same counter.

## Observation: `ensureNamespaceChain`'s `counter` argument now MEANS "this is gotoGroup"
- **Context**: the explicit `package a.b.c {` path (`class-container.ts:114`)
  and implicit reference resolution both called `ensureNamespaceChain`.
- **Finding**: `gotoGroup` (`CucaDiagram.java:349-355`) is handed exactly ONE
  quark and creates a group for it alone; ancestors stay phantoms. So chain
  creation never ticks, and passing `counter` stamps only the INNERMOST
  segment (`stampGotoGroup`). `ResolveInput.counter` was therefore removed —
  `parser.ts:117` was its only supplier.
- **Impact**: any new caller that wants parse-time numbering for a whole chain
  is asking for something upstream does not do.
- **Confidence**: High (jar-verified: `pidagu-83-dopu070` conformant).

## Observation: a dotted link endpoint naming an implicit package still spawns a leaf (open defect)
- **Context**: `runane-30-vena766`/`vusute-48-xono099` structural count rose
  32 -> 37 while every co-present entity's uid became jar-exact.
- **Finding**: `X ..> javax.sound.sampled.AudioFormat`, where that id is an
  implicit PACKAGE, must resolve to the package Entity — upstream's
  `quarkInContext` returns the existing quark, whose data is the phantom group
  from `:325-336`. This port creates a brand-new classifier instead, so the
  SVG carries one extra `class AudioFormat` element (`ent0014`), and
  `compare.ts`'s positional pairing turns that single surplus element into 5
  `@id` mismatches plus `lnk15` vs `lnk14`. `tryReuseExisting`'s
  namespace-collision bail (delasa) only covers BARE names; the dotted path
  has no equivalent guard.
- **Impact**: a separate, entity-EXISTENCE defect (not tick order). It is now
  the whole residual of those two fixtures.
- **Confidence**: High (entity->uid tables of both SVGs read side by side).
