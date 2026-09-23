# cdd-T31 — hide/show by name: separator, cascade, scope prefix

Status: **round 1 executed + merged** (`9e34f7eb`), **round 2 executed**
on the fast-forwarded worktree (`cdd-t31`, branch `cdd/t31`, now at
`e4ce044af` + round-2 commit). Round-1 gates green: `npm test` 802
passed / 1 skipped (804 test files, on-disk `find` count matches),
typecheck (both tsconfigs)/lint/build clean, DOT parity 711/712 (100% of
the 711 non-oracle-blind, 1 pre-existing `directionOk` diverging-check
failure unrelated to E5) UNCHANGED from before (hide/show never reaches
the svek export — the file's own pre-existing invariant, re-verified,
not touched).

## Round 2 (both stop-1 items closed)

The coordinator granted both round-1 stop-1 items as an extended
write-set once T34 (which would otherwise own these files) had not yet
started: `layout.ts`, `renderer.ts`, `class-geo-namespace-types.ts`,
`class-command-containers.ts`, plus `class-geo-builders.ts` (where
`buildNamespaceGeos` actually lives) and `class-container.ts` (where its
`setNamespaceStereotype`/`setNamespaceUrl` siblings live, the natural
home for the new `setNamespaceTags`).

**senece-96-fomu913** (1+45 -> 0+0 exact) needed TWO mechanisms, not
one:
1. `NamespaceGeo.hidden` (threaded from the same `computeHiddenIds` set
   `ClassifierGeo.hidden` already used) + a `renderer.ts` skip on the
   namespace-cluster loop, porting `Cluster#drawU`'s `if
   (group.isHidden()) return;` (svek/Cluster.java:298-300). This alone
   fixed the STRUCTURAL diff (`childCount exp=1|act=2`) but left 45
   numeric diffs (a uniform Y+32/X+16 canvas-size and position offset).
2. `LimitFinder#apply` (klimt/drawing/LimitFinder.java:78-83) does NOT
   special-case `UHidden` — a hidden CLASSIFIER's wrapped `draw()` calls
   (`SvekResult.java:85`) still accumulate ink; only `Cluster#drawU`'s
   early return skips ink for the CLUSTER's own decoration specifically.
   First attempt filtered BOTH hidden classifiers AND hidden namespaces
   out of `layout.ts#assembleShiftedGeometry`'s ink walk — overcorrected
   (canvas shrank to 85x129 against the jar's 277x178). Filtering ONLY
   namespaces landed exact. This is a genuinely asymmetric upstream rule
   (leaf-hidden vs. group-hidden behave differently for ink) that is easy
   to get wrong by symmetry-intuition alone — read the Java, don't
   assume.

**verufu-58-jile750** (1+86 -> 0+0 exact) needed only the previously-
identified gap: `class-command-containers.ts`'s `package` regex made its
TAGS1/TAGS2 runs capturing (were non-capturing/discarded), renumbering
every subsequent match-index reference in that one rule, and a new
`setNamespaceTags` (`class-container.ts`) calling the SAME
`parseTagTokens` a classifier's own `$tag` declaration already uses —
citing `CommandPackage.java:198`'s `CommandCreateClassMultilines
.addTags` -> `Entity#addStereotag` (CommandCreateClassMultilines.java:
321-329). Round 1's fold+cascade logic (already unit-tested against a
hand-built AST literal) needed zero changes once the field was
populated — exactly as predicted in round 1's notes.

Round-2 gates: `npm test` 805 passed / 1 skipped (807 test files,
on-disk count matches) — the ONE remaining failure
(`tests/unit/scripts/parity-dashboard.test.ts`'s D9 drift gate, an
`activity`-engine diff-baseline weightedScore mismatch, 61006 vs 60991)
is confirmed PRE-EXISTING via `git stash`: it fails identically with
every round-2 change reverted, on files (`docs/parity-report.md`,
activity-engine inputs) this task never touches. Not fixed — out of
write-set and not this task's mechanism. Typecheck/lint/build clean.
DOT parity 711/712 unchanged (confirms the fix is render/ink-layer only,
never touches DOT construction). Zero regressions across the eleven
no-regression guards + cicovi + delasa (delasa unaffected, still
21+10643 — its own hidden-namespace fixture shape doesn't exercise
either round-2 mechanism).

## The fixWhat-prefix gap (not in the original diagnosis)

The spec's Context section cited `CucaDiagram#fixWhat` (net/atmp/
CucaDiagram.java:638-646) as a "lead, not a spec" for defect (c). Reading
it revealed it is NOT the same mechanism as the gender family's
`byPackage(getCurrentGroup())` AND-gate (`class-directives-removal.ts
#directiveAppliesTo`, DIRECT-parent equality on `classifier.namespace`).
`fixWhat` instead unconditionally PREFIXES `what` with the enclosing
group's qualified id + separator, UNCONDITIONALLY for `hideOrShow2`
(pattern-form hide/show) AND `removeOrRestore` alike, whenever
`getNamespaceSeparator() != null` (not magic) and the current group is
non-root. Two consequences worth flagging for a future reader:

1. It runs BEFORE `HideOrShow`'s own `$`/`<<...>>`/`@unlinked` shape
   dispatch, so an in-package `hide $tag` stops looking like a tag
   selector once prefixed (`"pack1." + "$tag"` no longer `startsWith('$')`).
   This is a faithfully-preserved upstream quirk (ported in `isApplyable`),
   not special-cased away — no fixture in this task's scope exercises it,
   but a future task adding `hide $tag`-inside-`package` fixtures should
   expect this behavior, not "fix" it.
2. `removeOrRestore` ALSO calls `fixWhat` upstream (same unconditional
   prefix), but `RemoveRestoreDirective` has NO `scopeNsId` field (adding
   one is outside T31's ast.ts write-set, which names only
   `HideShowPatternDirective.scopeNsId`) — so `remove`/`restore`'s own
   in-package prefix stays unported. This is consistent with (not a new
   gap beyond) `filterRemovedEntities`'s pre-existing "group removal not
   implemented" note in the same file. Filed as a `next-missions.md`
   candidate if a fixture ever needs it.

## Namespace.tags: added, NOT populated (stop-condition-1, narrow)

`Namespace.tags?: string[]` was added to `ast.ts` (authorized field) and
`computeHiddenIds`'s namespace fold reads it uniformly with
`Classifier.tags`/`ClassNote.tags`. It is verified CORRECT via a
hand-built `ClassDiagramAST` literal test (`class-hideshow-name-scope
.test.ts`'s last describe block) that sets `Namespace.tags` directly —
the fold+cascade logic hides the tagged namespace and cascades to its
child.

It is NOT populated by the real parser: `class-command-containers.ts`'s
`package` regex captures its TAGS1/TAGS2 runs (`$tag` tokens either side
of the stereotype) as NON-CAPTURING groups and discards them outright
(the file's own pre-existing comment already says so: "group removal/
tag-selection on packages is not implemented"). Wiring this requires
editing `class-command-containers.ts` (capture the groups, call a new
`setNamespaceTags` similar to `setNamespaceStereotype`/`setNamespaceUrl`)
— outside T31's write-set (`class-directives-removal.ts`,
`class-hideshow-dispatch.ts`, `ast.ts` field additions only). This is
WHY verufu-58-jile750 (`hide $txn` on `package p1 $txn`) shows ZERO
render-diff movement (structural=1/numeric=86 unchanged before/after):
the data-layer mechanism is ready and unit-tested; the parser-side
population is a separate, narrowly-scoped follow-on.

## Namespace cluster suppression: NOT wired (stop-condition-1, the bigger gap)

`computeHiddenIds` now returns namespace ids too, and `layout.ts
#buildClassifierGeos` already consumes the set for CLASSIFIERS (existing,
untouched code — `hiddenIds.has(classifier.id)` → `hidden: true`), so a
cascaded-hidden classifier's content correctly stops drawing (confirmed:
senece-96-fomu913's `util1` classifier no longer appears in the rendered
SVG at all — verified by inspecting `measurements/out/senece-96-fomu913
.ours.svg` directly). But `layout.ts#buildNamespaceGeos` and
`renderer.ts`'s namespace-cluster loop (`for (const ns of geo.namespaces)
{ ... wrapCluster(...) }`, unconditional, no hidden check) never consult
`hiddenIds` for NAMESPACES — upstream's `Cluster#drawU` (`svek/
Cluster.java:298-300`) returns immediately when `group.isHidden()`,
skipping the border/title/content entirely; our port still draws an
EMPTY `util` cluster box. Confirmed via render-diff: senece's ONLY
structural diff is `svg/g[1][childCount] exp=1 | act=2` — the jar has
just `Foo2`; ours has the empty `util` cluster PLUS `Foo2`.

Fixing this needs `layout.ts` (thread `hiddenIds` into
`buildNamespaceGeos`, stamp a `hidden` field on `NamespaceGeo` —
`class-geo-namespace-types.ts`) and `renderer.ts` (skip `wrapCluster` for
a hidden namespace) — three files, none in T31's write-set, and larger
than the one-line mirror edits below. Filed as a `next-missions.md`
candidate: "namespace-cluster hidden suppression (svek/Cluster.java:
298-300), unblocks senece-96-fomu913 and (once Namespace.tags is
populated) verufu-58-jile750."

## Two judgment calls on the write-set boundary (documented, not silent)

1. **`ast.namespaceSeparator` wiring in `parser.ts`/`class-command-
   directives.ts`** (two one-line mirror edits: `makeDefaultAST()`'s
   `namespaceSeparator: '.'` default, and the existing `set separator`
   rule's `state.ast.namespaceSeparator = state.namespaceSeparator;`).
   These two files are NOT in the overview.md table's write-set summary,
   but the spec's own Task section explicitly instructs "set from
   parser.ts:179 the same way state.namespaceSeparator already is" and
   the spec's read-set explicitly cites `class-command-directives.ts:
   87-94` and `parser.ts:100-115,175-185,350-360` by exact line range —
   a strong signal these two single-field edits were intended, not an
   oversight. Made the call to proceed (both edits are exactly the
   `description/command-table-directives.ts` precedent the spec itself
   names). Reversible: a 2-line revert if the maintainer disagrees.
2. **File splits for the 500-line/complexity hooks** (`ast.ts` ->
   `class-hideshow-ast.ts`; `class-directives-removal.ts` ->
   `class-directives-hide-cascade.ts` + `class-directives-remove-ranks
   .ts`) — pure code motion, re-exported so every existing import site
   is unchanged, mirroring this codebase's own established split-and-
   re-export convention (the precedent `ast.ts`/`class-directives-
   removal.ts` headers already document). `computeRemovedRanks` was
   ALSO decomposed into one push-helper per entity kind while moving it
   (same branch conditions, just named) — lizard's own baseline-diff
   policy treats a moved function in a new file as brand new, so the
   pre-existing CCN 14 needed a genuine reduction, not just relocation.

## A real bug caught by the TDD test suite before it shipped

`ast.namespaceSeparator ?? '.'` (my first draft) coalesces BOTH `null`
(magic/`set separator none`) and `undefined` (unset) to `'.'` — `??`
does not distinguish them. This silently defeated the entire magic-
separator strip path. Caught by `class-hideshow-name-scope.test.ts`'s
"under set separator none" test, fixed with an explicit
`resolveSeparator(ast)` helper (`=== undefined ? '.' : ast
.namespaceSeparator`), documented with its own doc comment on why
`undefined`/`null` are deliberately distinct here.

## Before/after (render-diff.mts, structural+numeric)

| fixture | before | after |
|---|---|---|
| cicovi-23-zipe215 (target, defect a) | 10+4 | **0+0 exact** |
| senece-96-fomu913 (target, defect b) | 1+45 | 1+45 (unchanged — data layer fixed, empty-cluster-box gap above blocks full parity) |
| verufu-58-jile750 (target, defect b tags) | 1+86 | 1+86 (unchanged — Namespace.tags population gap above blocks any movement) |
| bijevi-38-duza931 (guard) | 7+7 | 7+7 (unchanged) |
| delasa-80-jusu462 (guard) | 22+10643 | **21+10643** (one structural diff resolved — the same matchEntityName fix newly hides the collapsed-empty-package leaves `pdwzmyysm_abstract.siwd`/`mssrda.siwd`, matching the jar) |
| nijeli-04-ponu844 (guard) | 19+3 | 19+3 (unchanged) |
| jakapi-64-tine258 (guard) | 0+458 | 0+458 (unchanged) |
| xifuza-00-paze682 (guard) | 0+140 | 0+140 (unchanged) |
| cutasu-32-zete658 (guard) | pass | pass (unchanged) |
| julixi-10-jide878 (guard) | 0+2 | 0+2 (unchanged) |
| rulite-35-muno361 (guard) | 0+2 | 0+2 (unchanged) |
| lecelo-92-loma110 (guard) | 6+7 | 6+7 (unchanged) |
| gekope-01-ricu859 (guard) | 0+2 | 0+2 (unchanged) |
| xogixe-78-zuro619 (guard) | pass | pass (unchanged) |

No fixture regressed (no structural/numeric count rose); delasa improved
by one. DOT parity 711/712 before and after (unchanged, as expected —
hide/show never reaches the svek export).
