# T1 — defer implicit-package uid ticks past their triggering leaf

**Agent:** typescript-pro (opus) · **Depends on:** —

## Context

Upstream never creates an implicit intermediate package eagerly: a
qualified name only creates Quarks, and the package's `Entity` (uid tick)
is materialised at the TAIL of `reallyCreateLeaf` — AFTER the leaf that
caused it (`net/atmp/CucaDiagram.java:239-240`, `if
(type.isLikeClass()) eventuallyBuildPhantomGroups(location);`, and the
method itself at `:325-336` walking `this.quarks()` for every data-less
quark with children). The uid comes off the one shared counter
(`CucaDiagram.java:129 cpt1`, minted in
`net/sourceforge/plantuml/abel/Entity.java:171`). Our parser ticks the
whole namespace chain outer→inner in `class-namespace-resolve.ts:127-128`
(`ensureNamespaceChain`, `counter.value += 1; ns.creationIndex =
counter.value;`) — called from `parser.ts:117`'s `resolveReference` —
BEFORE `parser.ts:129` stamps the triggering classifier's own
`creationIndex` (`ensureClassifier`, `state.creationCounter.value += 1`).
The report (`diagnosis/A1-order.md` SB1, HIGH confidence, 41/41 detector
agreement) is a lead: re-read `reallyCreateLeaf` and `ensureNamespaceChain`
yourself before touching either — the fix is a re-ORDER of two counter
ticks, not a rewrite of either function.

An EXPLICIT `package a.b.c { class X }` still numbers its own innermost
segment at `gotoGroup` time (`pidagu-83-dopu070`: explicit innermost
package is `ent0001`, the class `ent0002`, only the ancestors implicit and
late) — only segments created as a SIDE EFFECT of resolving a qualified
reference move.

## Task

TDD — tests first in `parser.test.ts` (or the file's actual existing name
under `tests/unit/class/` — confirm before creating a new one) and a new
`class-namespace-resolve.test.ts` case:

1. Write failing tests reproducing the three worked cases from the report:
   `xakatu-11-tapu041` (4 implicit packages `ent0002..0005`, leaf
   `ent0001`), `vuresa-33-kumu160` (interleaved leaf/implicit-ancestor
   order), `pidagu-83-dopu070` (explicit innermost package ticks at
   `gotoGroup`, only its 3 ancestors are late).
2. Implement the post-pass: `ensureNamespaceChain` (`class-namespace-
   resolve.ts:94-137`) stops ticking `creationIndex` for namespaces created
   as a side effect of an implicit (non-`gotoGroup`) reference resolution;
   instead, record which namespace ids were newly created during that
   resolution (return them, or track via a passed-in collector) and have
   the CALLER — `ensureClassifier` (`parser.ts:95-148`) — tick them AFTER
   its own `state.creationCounter.value += 1; classifier.creationIndex =
   ...` line, walking the collected ids outer→inner (mirrors upstream's
   `quarks()` walk order — verify iteration order against `xakatu`'s
   expected `2,3,4,5` sequence).
3. Do NOT change the explicit `package { }` block path (`class-container.ts`
   or wherever `gotoGroup`'s TS equivalent lives — find it via
   `search_for_pattern` for the explicit-package parse command; it must
   keep ticking at parse time, matching `pidagu`).
4. Re-run T0's `render-all.mts` against `measurements/base.json`; every
   fixture that changes verdict must be one of the 41 SB1 slugs (or
   `gufife-94-ropa486`, added by hand per the report) or `delasa-80-jusu462`
   (SB1∩SB2 overlap — do not chase SB2's link-order symptom here, only the
   uid numbers). Any OTHER mover is stop 3 — halt and journal.
5. Confirm none of the 412 baseline-conformant fixtures lose conformance
   (draw order — `class-leaf-order.ts` — and the exact/fallback gate in
   `renderer-uid.ts` both key off `creationIndex`, so this is a real risk,
   not a formality).

## Read-set

`diagnosis/A1-order.md` SB1 section (whole, lines 24-101); Java:
`~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:129,218-240,
325-336`; `~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/
Entity.java:165-175`. TS: `src/diagrams/class/parser.ts:95-180` (whole
`ensureClassifier` plus the explicit-package command nearby);
`src/diagrams/class/class-namespace-resolve.ts:94-137` (`ensureNamespaceChain`),
`:300-330` (`resolveQualified`/`resolveReference`); `src/diagrams/class/
class-leaf-order.ts` (draw-rank consumer of `creationIndex` — read to
confirm this change doesn't need a matching edit there);
`src/diagrams/class/renderer-uid.ts:344-395` (`buildClassUidPlan`'s
exact/fallback gate — confirm it still finds `isExact(geo)` true for the
41 fixtures after the reorder).

## Write-set

`src/diagrams/class/parser.ts`, `src/diagrams/class/
class-namespace-resolve.ts`, their existing test files under
`tests/unit/class/` (extend, don't rename), `plans/class-divergence-drive/
measurements/t1.json`, `plans/class-divergence-drive/decision-journal.md`,
`.agent-notes/cdd-T1.md`.

## Interface out (consumed by T3)

`ensureNamespaceChain`'s implicit-segment collector (exact shape is this
task's implementation choice — document it in `.agent-notes/cdd-T1.md` so
T3 can extend the same collector for its phantom `apoint`/`GMN` ranks
rather than inventing a second mechanism).

## Acceptance criteria

- Given `xakatu-11-tapu041`, when rendered, then the 4 packages number
  `ent0002..ent0005` and the leaf is `ent0001`, matching the jar exactly
- Given `vuresa-33-kumu160` and `pidagu-83-dopu070`, then their full uid
  sequences equal the jar's (per the report's worked arithmetic)
- Given the SB1 41-fixture detector (`diagnosis/A1-order.md`'s "cluster uid
  > minimum descendant leaf uid" check), when re-run against this port's
  output, then it fires 0/41 (was 41/41 before the fix)
- Given `render-all.mts` against `base.json`, then every verdict change is
  in {the 41 SB1 slugs, `gufife-94-ropa486`, `delasa-80-jusu462`} and no
  previously-conformant fixture regresses
- Given an explicit `package a.b.c { class X }` fixture (`pidagu`), then
  the innermost package's uid is unchanged from before this task

## Observability

N/A — no new observable operation; parser-internal counter sequencing.

## Rollback

Reversible — revert the task's commit; no data migration, no persisted
state outside the ratchet pins (which T1 does not touch — re-pin is the
batch close's job, D11).

## Quality bar

Four gates green. `npx tsx ../tools/render-diff.mts xakatu-11-tapu041
vuresa-33-kumu160 pidagu-83-dopu070` before/after counts pasted into the
commit body. Complexity hooks: `parser.ts` and `class-namespace-resolve.ts`
stay ≤500 lines (split further if this pushes either over — push-forward
list permits it, write-set may not grow beyond adding the split file),
functions ≤30 NLOC, CCN ≤10, ≤5 params.

## Boundaries

Always: re-read `reallyCreateLeaf` and `Entity`'s constructor before
changing tick order (CLAUDE.md "READ THE JAVA FIRST"); every constant
carries its `file:line`. Ask first: touching `class-leaf-order.ts` if step
5 finds it needs a matching change (widens the write-set — confirm with
the batch owner before editing). Never: change the explicit
`package { }` block's own tick timing (pidagu); fit a uid value without
re-deriving it from the counter arithmetic; rebuild the oracle cache (D12).

## Commit

`fix(cdd-T1): defer implicit-package uid ticks past their leaf`

Body: cites `CucaDiagram.java:239-240,325-336` and the reorder; notes the
41-fixture detector result before/after.
