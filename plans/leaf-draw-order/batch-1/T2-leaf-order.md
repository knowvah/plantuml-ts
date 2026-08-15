# T2 — `computeLeafDrawOrder(ast)`: jar's node order, pure over the AST

## Context

plantuml-ts ports PlantUML; the Java is the spec — READ IT before writing.
Jar draws leaf nodes in `bibliotekon` insertion order:

- `GraphvizImageBuilder#buildImage` (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:225-227`):
  `printGroups(stringBounder, dotData.getRootGroup()); printEntities(stringBounder, getUnpackagedEntities());`
- `printGroups(parent)` (`:411-425`): for each child group of `parent`
  (`dotData.getGroupHierarchy().getChildrenGroups(parent)` = `Entity#groups()`,
  `abel/Entity.java:659-667`, quark-children insertion order): skip removed;
  an EMPTY package is muted to `LeafType.EMPTY_PACKAGE` and printed as a
  LEAF at that slot; else `printGroup(g)`.
- `printGroup(g)` (`:427-435`): `printEntities(g.leafs())` (the group's own
  direct leaves, `abel/Entity.java:649-657`, quark-children order) THEN
  `printGroups(g)` (its subgroups). Leaves before subgroups.
- `getUnpackagedEntities()` (`:397-403`): `dotData.getLeafs()` whose parent is
  the root — `CucaDiagram#leafs()` (`net/atmp/CucaDiagram.java:852-862`), the
  flat quark-registration order (`plasma/Plasma.java:56-64`).
- Notes (`LeafType.NOTE`) and member-tip leaves (`LeafType.TIPS`, ONE per
  (host, side), created by the group's FIRST `::member` note —
  `command/note/CommandFactoryTipOnEntity.java:214-231`) are ordinary leaves.

The port's parse-side data (`src/diagrams/class/ast.ts`): `Classifier
.creationIndex`, `ClassNote.creationIndex` (attached / freestanding notes),
`ClassNote.tipGroupPhantomIndex` (the TIPS entity's rank, set on a member-tip
group's LEADER only — `class-note-decl-ast.ts:156-188`), `Namespace
{ id, classifiers: string[] (member ids, notes included), parentId?,
creationIndex? }`. Decision D1: this counter IS the ordering key; declaration
position is the fallback where a value is absent.

## Task

Create `src/diagrams/class/class-leaf-order.ts` exporting

```ts
export function computeLeafDrawOrder(ast: ClassDiagramAST): readonly string[];
```

returning every `ast.classifiers[].id` and every `ast.notes[].id` exactly
once, in jar's order:

1. Root groups (namespaces with no `parentId`), ordered by
   `Namespace.creationIndex` (fallback: array position). For each: its
   member leaves (`Namespace.classifiers` ∩ classifier/note ids) by
   creation rank, THEN its child namespaces recursively (same rule).
2. Then every leaf in no namespace, by creation rank.

Creation rank of a leaf: `Classifier.creationIndex`; `ClassNote
.creationIndex`; for a member-tip note (`targetPort !== undefined`) the rank
of its group LEADER's `tipGroupPhantomIndex` — every tip in the same
(`target`, `position`) group sits at the leader's rank, in array order among
themselves (they draw as one TIPS leaf upstream, `note-tips-resolve.ts`
recovers the same grouping). A leaf with no rank keeps its position relative
to its array neighbours (stable sort on rank with `undefined` treated as
"stay put": use a stable sort over `[rankOrArrayIndexFallback]` — document
the exact fallback in the function's doc comment; the D1 requirement is
that a hand-built AST with no indices yields classifiers-then-notes in array
order, byte-identical to today).

Write `tests/unit/class/class-leaf-order.test.ts` FIRST (TDD), using
`parseClass` on small `.puml` sources so real creation indices are exercised
(see `tests/unit/class/class-note-creation-index.test.ts` for how existing
tests obtain a parsed AST), plus one hand-built-AST fallback case.

## Write-set

- `src/diagrams/class/class-leaf-order.ts` (new)
- `tests/unit/class/class-leaf-order.test.ts` (new)

## Read-set

- The Java lines cited above (read them, do not trust this summary).
- `src/diagrams/class/ast.ts:90-110` (Namespace), `:319-390` (ClassDiagramAST)
- `src/diagrams/class/class-note-decl-ast.ts:110-188` (`creationIndex`,
  `tipGroupPhantomIndex` semantics)
- `src/diagrams/class/class-classifier-ast.ts:250-270` (`Classifier.creationIndex`)
- `src/diagrams/class/note-layout-groups.ts:38-90` (`groupNotes`/`mergeKey` —
  the tip grouping to mirror)
- `src/diagrams/state/state-composite-pass.ts#sortSpecsByCreationIndex`
  (state's precedent for the stable-sort shape)
- `tests/unit/class/class-note-creation-index.test.ts` (parse helper pattern)

## Architecture decisions

D1, D2 (`../decisions.md`). Locked: no new parse-time tick; no geo field.

## Interface contracts

Output consumed by T4 (`layout.ts`): `readonly string[]` — a permutation of
all classifier ids ∪ note ids of the SAME `ast` object passed to
`layoutSinglePage` (i.e. the post-`filterRemovedEntities` AST). Ids not in
the returned list must not exist; T4 asserts `length` equality.

## Acceptance criteria

- Given `class X / package P { class A / note "n" as N } / class Y / note left of X : hello`
  (parsed), when computed, then the order is `[P.A's id, N, X, Y, __note_1]`
  — jar-verified 2026-08-15 (`P.A, P.N, X, Y, GMN6`).
- Given `package P { package Q { class B } class A }` (parsed), when computed,
  then `[A, B]` — a group's own leaves precede its subgroups (`printGroup`).
- Given `class U { m } / class V / note right of U::m (multi-line, tip) /
  class W` (parsed), when computed, then the tip note sits between V and W
  ONLY if its `tipGroupPhantomIndex` is between their `creationIndex`es —
  assert the exact position by reading the parsed indices in the test, not
  by assuming.
- Given a hand-built AST with no `creationIndex` anywhere (two classifiers,
  one note, one namespace), when computed, then classifiers keep array order
  and the note follows — today's order (D1 fallback).
- Given any input, then the result has exactly
  `classifiers.length + notes.length` entries with no duplicates.

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run tests/unit/class/class-leaf-order.test.ts`,
then `npm test` (never piped) — coverage 90/90/90 for the new file.
Complexity hook: ≤30 NLOC / ≤10 CCN per function — split the recursion into
small helpers.

## Observability requirements

N/A — no new observable operations.

## Rollback notes

Reversible (revert the commit).

## Boundaries

- Always: cite each Java line in a `@see` on the function that mirrors it.
- Never: consult positions/geometry; never import from `layout.ts`,
  `renderer*.ts`, or geo types (this must stay a pure AST function).
- No git commands (the orchestrator commits: `feat(T2): ...`).
