# cdd3-T17 — association couple orientation + subsumed-link uid (E3-16, E3-17)

## Observation: `Relationship.from`/`.to` are NOT jar's `getEntity1()`/`getEntity2()`
- **Context**: E3-17 fix — orienting `subsumeExplicitAssociation`'s
  entity-circle attachment to the removed link's own entity1/entity2.
- **Finding**: `from`/`to` are swapped by `swapDirection`, which composes
  BOTH the arrowhead-decor direction AND the `-up-`/`-left-` direction word
  (`class-arrow-grammar.ts#resolveArrow`'s `decorSwap !== upOrLeft` XOR).
  Jar's `Link#getEntity1()`/`getEntity2()` (`cl1`/`cl2`) are swapped ONLY
  by the direction word (`Link#getInv()`). The two coincide when a
  relationship carries no arrowhead-driven decor swap (e.g. besepi's
  `ia_1000042 -up-> ia_123`, plain arrowhead at ENT2, no `decorSwap`
  contribution) but DIVERGE whenever decor and direction both contribute
  (e.g. `Foo <-- Bar`: `from=Bar,to=Foo` but jar's `getEntity1()=Foo`,
  confirmed via `scripts/oracle-render.sh` on `Foo <-- Bar` + `(Foo,Bar)
  --> Qux`, id `Foo-backto-apoint5`/`apoint5-Bar`). The CORRECT field is
  `Relationship.idEntity1FullId`/`idEntity2FullId` (already documented in
  `class-relationship-ast.ts` as the true `cl1`/`cl2` equivalent, swapped
  only by `upOrLeft`) — my first fix attempt used `ex.from`/`ex.to`
  directly, which passed besepi (coincidence) but broke a pre-existing
  test (`class-assoc-couple2.test.ts` T4, `Foo <-- Bar`); caught by
  running the FULL suite before committing, not just the target fixture.
- **Impact**: any future E3-class fix touching `Relationship.from`/`.to`
  for "which physical entity is this" must check `idEntity1`/`idEntity1FullId`
  instead when the mechanism claims to mirror jar's `getEntity1()`/`Link`
  object identity directly (as opposed to DOT-layout/rendering direction,
  which correctly uses `from`/`to`).
- **Confidence**: High (jar-verified via 2 independent minimal repros +
  besepi; full corpus render-all/pin-diff shows exactly 1 mover, 0 regressions).

## Observation: `test-results/dot-cache/class/<slug>/` can silently go stale
- **Context**: besepi's `render-diff.mts` kept reporting a "ia_1000042 vs
  ia_123" `@id` mismatch on the couple's entity-circle edges even AFTER
  the fix, contradicting my own analysis.
- **Finding**: `scripts/dot-sync-report.ts#plantumlDots` writes a `.done`
  sentinel unconditionally after its `execFileSync` try/catch — even on a
  caught failure/partial run — and never re-invalidates on content match
  (it diffed byte-identical to `oracle/goldens/.../input.puml`). Three
  independent fresh renders (`scripts/oracle-render.sh` x3, plus a forced
  `--rebuild` of `dot-sync-report.ts`) all agree with each other and
  DISAGREE with the committed `test-results/dot-cache/class/
  besepi-37-rori892/in.svg`/`svek-1.dot` (entity1/entity2 order on the
  couple's edges). The committed cache is stale — likely never
  regenerated since an earlier corpus/fixture revision.
- **Impact**: `render-diff.mts`'s "exp" column for this fixture over-
  reports one structural diff that isn't real. T16 (E3-15, same fixture)
  will hit the SAME stale-cache artifact when comparing DOT node/edge
  order — rebuild the cache (`npx jiti scripts/dot-sync-report.ts class
  --slug besepi-37-rori892 --rebuild`) before trusting any `@id`/order
  diff on this fixture, then **revert the resulting `test-results/`
  change** (boundary: never commit `test-results/`) once you've read the
  corrected numbers.
- **Confidence**: High (3 independent fresh jar renders, stable across
  repeats, all agree; committed cache is the outlier).

## Observation: `git stash` is a single stack SHARED across all worktrees
- **Context**: mid-task, `git stash push` (to get a pre-edit baseline)
  followed by `git stash pop` in this worktree (cdd3-T17) returned T14's
  in-progress changes instead of mine — T14 was concurrently doing its
  own stash push/pop in its OWN worktree at the same time. `refs/stash`
  is repo-wide (all worktrees share one `.git`), not per-worktree: my
  pop consumed T14's more-recently-pushed stash entry, and T14's own pop
  (racing with mine) consumed my entry, landing my diff in T14's working
  tree and T14's diff in mine. `git stash list` was empty afterward — both
  entries had been consumed by the wrong side.
- **Recovery**: `git fsck --no-reflog --unreachable | grep commit`, then
  grep each dangling commit's message for `WIP on wt/cdd3-T17`/`WIP on
  wt/cdd3-T14` to find the right stash commit by content (`git show
  <sha>:<path> | grep <my-marker>` — line counts / distinctive doc-comment
  strings), then `git checkout <sha> -- <paths>` to restore. T14
  self-corrected independently before I finished my own recovery (its
  worktree already had its own legitimate files back by the time I
  checked) — no cross-task damage landed in a commit.
- **Impact**: **never use `git stash` when other worktrees may be active**
  (always true in this mission's wave structure). For a before/after
  measurement, use `git diff > /tmp/x.patch && git checkout -- <files> &&
  <measure> && git apply /tmp/x.patch` instead, or a detached second
  worktree at the base commit. This applies to EVERY concurrent task in
  this mission, not just T14/T17 — worth a rule addition or fix-task.md
  amendment.
- **Confidence**: High (directly observed and reconstructed from `git
  fsck`/dangling-commit inspection).

## Status
Closed. besepi-37-rori892: S 30→11 (all 19 `@id` uid-offset mismatches
fixed), N 634→634 unchanged. Residual 9 `@d` (path geometry) + 1
`childCount` diff are E3-15 (printCluster1/DOT node order, T16's scope) —
besepi will not reach 0/0 from this task alone, per the task brief.
render-all/pin-diff over the full 723-fixture corpus: exactly 1 mover
(besepi, as above), 0 transitions, 0 regressions elsewhere.
