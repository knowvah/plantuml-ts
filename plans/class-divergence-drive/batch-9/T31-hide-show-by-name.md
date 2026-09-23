# T31 — `hide`/`show` by name: separator strip + group cascade

**Agent:** typescript-pro (sonnet) · **Depends on:** — · parallel with
T32/T33 (worktrees).

## Context

Two independent defects in one file (A2b E5). **(a)** Upstream strips a
qualified name to its leaf ONLY at `Plasma.MAGIC_SEPARATOR` (`\u0001`,
`plasma/Plasma.java:85-88`); a class diagram sets the separator to `"."`
(`objectdiagram/AbstractClassOrObjectDiagram.java:65` →
`net/atmp/CucaDiagram.java:144-148`), so `pack1.Foo1` (built at
`plasma/Quark.java:57-66`) contains no magic separator and `hide Foo1`
must NOT match it — the jar keeps `pack1.Foo1` drawn. Our
`matchEntityName` (`class-directives-removal.ts:185-187`) strips
unconditionally (`/(?:::|\.)([^.:]+)$/`), so we wrongly hide it. Only
`set separator none` (already parsed, `class-command-directives.ts:87-
94`, sets `state.namespaceSeparator = null`) restores magic-separator
semantics and makes the bare pattern match. **(b)** `Entity#isHidden`
(`abel/Entity.java:430-442`) returns true when the PARENT container is
hidden, and `Cluster#drawU` (`svek/Cluster.java:298-300`) skips drawing
when `group.isHidden()`; `computeHiddenIds` (`class-directives-
removal.ts:306-323`) iterates only `ast.classifiers`/`ast.notes` —
`ast.namespaces` (id/display/parentId, `ast.ts:91-120`) is never
consulted and there is no parent cascade. A third, uncited gap found
while reading the dispatch: `CucaDiagram#fixWhat` (`net/atmp/
CucaDiagram.java:638-646`) PREFIXES `what` with the enclosing group's
qualified name when a directive is parsed inside a `package {}` block
(the `HideShowDirective`/`HideShowKindDirective` gender forms already
record this as `scopeNsId` via `stampGroupScope`,
`class-hideshow-dispatch.ts:39-40`) — but the PATTERN form (`hide Foo1`,
`hide $txn`, `class-hideshow-dispatch.ts:88-92`) never calls
`stampGroupScope` and `HideShowPatternDirective` (`ast.ts:230-235`) has
no `scopeNsId` field at all, so an in-package `hide` can never resolve
to a same-package sibling the way upstream's prefix does. The report is
a lead: re-read the cited bodies before editing.

## Task

1. Tests first, one per mechanism, using the fixtures below.
2. (a) Make `matchEntityName` separator-aware: strip to leaf only when
   the ACTIVE separator is magic (`set separator none`); otherwise match
   the id verbatim (plus the `fixWhat` prefix from step 3). Thread
   `ast.namespaceSeparator` (does not exist on `ClassDiagramAST` yet —
   add it, set from `parser.ts:179` the same way `state.namespaceSeparator`
   already is) through to `computeHiddenIds`/`computeRemovedIds`.
3. (c) Add `scopeNsId?: string` to `HideShowPatternDirective` (`ast.ts:
   230-235`), call `stampGroupScope` in the pattern-directive resolver
   (`class-hideshow-dispatch.ts:88-92`), and prefix `what` with the
   scope namespace's qualified id before matching (mirrors `fixWhat`).
4. (b) In `computeHiddenIds`, walk `ast.namespaces` the same way it
   walks `ast.classifiers` (fold directives, including `$tag`/
   `<<stereotype>>` — check whether `Namespace` needs a `tags?: string[]`
   field for `verufu-58-jile750`'s `package p1 $txn`; add it minimally if
   so). Then cascade: a classifier/namespace is hidden if its own fold is
   true OR any ancestor (walk `parentId`) is hidden.
5. `.agent-notes/cdd-T31.md`: the `fixWhat`-prefix gap (not in the
   original diagnosis), and whether `Namespace.tags` was added.

## Read-set

`class-directives-removal.ts:170-200,300-330`; `class-hideshow-
dispatch.ts:30-95`; `ast.ts:91-120,150-165,230-260`; `class-command-
directives.ts:87-94`; `parser.ts:100-115,175-185,350-360`. Java:
`plasma/Plasma.java:85-88`; `plasma/Quark.java:57-66`; `net/atmp/
CucaDiagram.java:144-148,638-646`; `cucadiagram/HideOrShow.java:110-124`;
`abel/Entity.java:430-442`; `svek/Cluster.java:298-300`;
`objectdiagram/AbstractClassOrObjectDiagram.java:65`. Diagnosis:
`diagnosis/A2b-entity-groups.md` E5.

## Write-set

`src/diagrams/class/class-directives-removal.ts`,
`src/diagrams/class/class-hideshow-dispatch.ts`,
`src/diagrams/class/ast.ts` (`namespaceSeparator`, `HideShowPatternDirective
.scopeNsId`, optional `Namespace.tags` fields only), their `*.test.ts`
files, `.agent-notes/cdd-T31.md`, `decision-journal.md` (append-only).

## Acceptance criteria

- Given `cicovi-23-zipe215` (`package pack1 { class Foo1 }` + `hide
  Foo1`), when rendered, then `pack1`, `pack1.Foo1`, `Foo2`, `Foo3` are
  all drawn (jar keeps the qualified leaf — defect (a) fixed)
- Given `senece-96-fomu913` (`hide Foo1`/`hide Foo3`/`hide util`), then
  only `Foo2` is drawn (the `util` namespace and its children are
  cascaded-hidden — defect (b))
- Given `verufu-58-jile750` (`hide $txn` on `package p1 $txn`), then
  `foo1`/`foo3` are drawn and `p1`/`p1.inside1` are not
- Given `git diff --name-only`, then only the write-set changed and no
  fixture outside E5's full+partial reach (`bijevi-38-duza931`,
  `delasa-80-jusu462`, `nijeli-04-ponu844`, `jakapi-64-tine258`,
  `xifuza-00-paze682`, `cutasu-32-zete658`, `julixi-10-jide878`,
  `rulite-35-muno361`, `lecelo-92-loma110`, `gekope-01-ricu859`,
  `xogixe-78-zuro619`) regresses on `render-diff.mts`

## Observability

N/A — no new observable operations.

## Rollback

Reversible — revert the task's commits; pins are committed with the
code.

## Quality bar

`npm test`, `npm run typecheck`, `npm run lint`, `npm run build` all
green (JSON-reporter collected count = on-disk count). `npx tsx
tools/render-diff.mts cicovi-23-zipe215 senece-96-fomu913 verufu-58-
jile750` before/after. Files ≤500 lines, functions ≤30 NLOC, CCN ≤10,
≤5 params.

## Boundaries

Always: re-read `CucaDiagram.java:638-646` before implementing the
prefix — it is a lead, not a spec. Ask first: any stop condition in
`../README.md`; adding `Namespace.tags` if it touches more than the one
field. Never: touch `class-directives.ts`'s GENDER-family fold
(`directiveAppliesTo`, unrelated mechanism, already correct); fit a
value without a citation.

## Commit

`fix(cdd-T31): hide/show by name — separator, cascade, scope prefix`

Body: why — one file had three compounding gaps (unconditional strip,
no group cascade, no in-package prefix) that individually look like
three bugs but share upstream's single `HideOrShow`/`fixWhat` mechanism.
