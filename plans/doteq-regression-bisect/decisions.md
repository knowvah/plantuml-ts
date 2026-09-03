# Architecture decisions — `doteq-regression-bisect`

Confirmed 2026-09-03. Treat as locked; a conflicting constraint is a stop
condition, not licence to override.

## D1 — Pin the whole predicate stack, take only `src/` from the bisect commit

**Context.** `scripts/svg-parity-survey.ts` imports four symbols from `src/`
and three from `tests/oracle/`; over a 791-commit window those APIs moved, so
bisecting with the checked-out predicate tests a moving ruler.

**Decision.** At each bisect step, restore `scripts/svg-parity-survey.ts` and
`tests/oracle/` from HEAD (`git checkout <HEAD-sha> -- <paths>`); everything
under `src/` comes from the commit under test.

**Consequences.** `dotEqual` means one fixed thing across all steps. Cost:
some old commits will not build against HEAD's predicate — see D2. Rejected:
a minimal `renderSync`-only predicate (cannot capture our emitted DOT without
`setLayoutInputObserver`), and bisecting SVG parity instead (may flip at a
different commit than the metric that actually regressed).

## D2 — `git bisect skip` on commits the pinned predicate cannot build

**Context.** D1 guarantees some steps fail to compile rather than reporting
a verdict.

**Decision.** Skip them, and record each skipped commit with the reason.

**Consequences.** Degrades gracefully — a skipped range narrows the answer to
a span rather than a single commit, which is still actionable. A bisect that
terminates *inside* a span must say so and must still name a mechanism
(stop condition 4).

## D3 — Establish the known-good end empirically, never from the pin

**Context.** The pin claims all three were `true` on 2026-08-12. Distrusting
pins is the reason this mission exists.

**Decision.** T0 runs the predicate at the window's old end and requires
`dotEqual=true` for all three before any bisect starts.

**Consequences.** If any is already `false` there, the regression predates
the window: stop, because the mission's premise is wrong. Costs one extra
checkout plus ~24s of predicate time.

## D4 — One `git worktree` per fixture, each with its own `node_modules`

**Context.** Three bisects run in parallel and each rewrites the working tree.

**Decision.** One worktree per fixture; `parallelism.md`'s one-writer-per-tree
rule applies to checkouts, not just files.

**Consequences.** Three `npm install`s up front, paid once in T0. Worktrees
are removed in T7.

## D5 — Fix tasks are created after their diagnosis, not before

**Context.** Fixing is in scope, but no write-set is knowable until each
cause is found.

**Decision.** Batch 2 is empty at planning time. Each fix task is written
once its artifact exists, taking the artifact's `file:line` origin as its
declared write-set. Two artifacts naming one origin collapse into one task.

**Consequences.** The mission cannot be fully costed up front, which is
accepted. A fix that needs to reach beyond its named origin is stop
condition 2 — the signal that the mechanism was not actually found.
