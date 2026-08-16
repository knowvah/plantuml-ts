# Architecture decisions (pre-made, locked)

If execution surfaces a conflicting constraint, STOP and log it in
`decision-journal.md` — do not silently override.

## D1 — Ordering key: the existing `creationIndex` counter

**Context.** Jar's node order is quark REGISTRATION order (`Plasma.quarks`
is a flat list appended in `register`; a group's `leafs()`/`groups()` walk a
`LinkedHashMap` of children — `plasma/Plasma.java:56-64`,
`plasma/Quark.java:54,153`, `abel/Entity.java:649-667`,
`net/atmp/CucaDiagram.java:852-862`). The port has no quark tick; it has the
shared entity-creation counter that already reproduces jar's `ent%04d`
numbering (`Classifier.creationIndex`, `ClassNote.creationIndex`,
`ClassNote.tipGroupPhantomIndex` for a TIPS leader, `Namespace.creationIndex`).

**Decision.** Order by that counter; declaration position (AST array order)
where it is absent (hand-built ASTs, tests). Entity creation ≈ quark
registration everywhere the corpus reaches; if the gate exposes a fixture
where they differ (a forward reference registers a quark before its entity
exists), record it as a named remainder with the mechanism — do not add a new
tick mid-mission.

**Rejected.** AST declaration order (wrong for packaged-first and forward
references). A new parse-time first-mention tick (new plumbing with no
evidence it is needed).

## D2 — Group membership comes from the AST, at layout

**Context.** `printGroups` needs each leaf's package and each package's
parent. Geos carry neither; `effAst.namespaces[]` carries both
(`Namespace.classifiers` — note ids included — and `parentId`).

**Decision.** `computeLeafDrawOrder(ast)` is pure over the AST and returns
the ordered id list; `layout.ts` builds `leaves` from it. No `namespace`
field is added to any geo. Recursion mirrors `printGroup`: a group's leaves
first (creation order), then its subgroups (`printGroups`, creation order);
an empty package is already a `ClassifierGeo` leaf and takes its slot by its
own `creationIndex`; then unpackaged leaves in creation order.

**Rejected.** Stamping `namespace` on every geo and ordering in the renderer
— the renderer must stay a plain loop (D3).

## D3 — `ClassGeometry.leaves` array order IS the draw order

**Context.** State's `buildFlatStateGeos` puts notes in the same array as
states and sorts once; the renderer and uid/ink walkers are generic.

**Decision.** `ClassGeometry.classifiers` + `notes` are replaced by
`leaves: ClassLeafGeo[]` (`ClassifierGeo | NoteGeo`, discriminated on
`kind`; `NoteGeo.leafType` becomes `kind: 'note' | 'tips'`), built in D1/D2
order; `renderer.ts` iterates it once, dispatching by kind (`GeneralImage
Builder#createEntityImageBlock`'s dispatch). N52's `notesByHost` interleave
and the trailing-notes pass are retired.

**Rejected.** Two arrays plus a separate `drawOrder` list — the "nicer type
over derived order" that mission note-leaf-model's D3 rejected.

## D4 — Ink and uid helpers keep their array parameters

**Context.** `buildInkBox`, `computeClassDocumentDims`,
`buildClassUidPlan`'s inputs take `classifiers`/`notes` arrays; dozens of
tests call them directly. Ink is order-independent.

**Decision.** Keep those signatures; `layout.ts`/`renderer.ts` pass
`classifierLeaves(leaves)` / `noteLeaves(leaves)` views (exported type-guard
filters from `class-geo-types.ts`). The single collection lives at the
geometry level, which is what the model claims.

**Rejected.** Threading `leaves` through every helper — halves nothing but
doubles the test churn.

## D5 — A hidden host no longer swallows its notes

**Context.** `renderer.ts` step 2 `continue`s on `classifier.hidden` BEFORE
`renderHostedNotes`, so `hide A` drops every note `of A`. Jar wraps only the
host's image in `UHidden` (`SvekResult.java:84-87`); the tip still draws
(jar-verified probe 2026-08-15: `hello=1`, 223x84).

**Decision.** The single loop draws every note/tips leaf regardless of its
host's `hidden`; hidden classifiers themselves still draw nothing.

## D6 — Gate design: movement is measured per fixture, in one direction

**Context.** This mission changes rendered output on purpose; the
predecessor's byte-identical bar does not apply, but "moved toward jar" must
be proven, not assumed.

**Decision.** `--vs-jar` over all 802 fixtures is the primary gate:
`order-only` 47 → 0, `other` 77 unchanged, `same` 678 → 725. `--check-order`
proves every changed sha corresponds to a changed uid sequence and vice
versa (nothing but order moved). Shape-match and class DOT-sync stay
diff-empty; pins hold. Unit tests that pinned N52's order are rewritten to
jar's order, each citing the corpus fixture that proves it. `note-order.txt`
is re-baselined once, at close-out (T6).
