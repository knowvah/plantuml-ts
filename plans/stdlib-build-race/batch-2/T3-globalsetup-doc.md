# T3 — Narrow the globalSetup guarantee to what is actually true

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-build-race`. **No `src/`** — stop 2. This task changes a doc
comment and **no behaviour**.

`tests/helpers/build-stdlib-globalsetup.ts` asserts:

> `globalSetup` completes before any worker spawns, so no test ever observes a
> half-rebuilt tree.

That is true **within one vitest process** and false across two. It is not a
harmless imprecision: it is what led SI33 to scope its search to within-run
writers, correctly eliminate them, and stop with the mechanism unfound. The
comment cost a mission a diagnosis.

## Task
1. Narrow the claim to its real scope, explicitly: it holds within a single
   vitest process, and **not** across concurrent `npm test` invocations sharing
   the same on-disk `packages/*/generated/` tree.
2. Name the mechanism T0 proved, and cite `.agent-notes/sre-T0.md` and
   `scripts/build-stdlib-packages.ts`'s `freshGeneratedDir` so the next reader
   reaches the evidence in one hop.
3. Keep the existing si11a T8 / SI12 T8 history intact — that context is
   correct and still valuable. You are narrowing a claim, not rewriting the
   file's story.
4. If T0 DISPROVED the hypothesis, record that instead: what was ruled out, and
   that the guarantee's scope is still narrower than stated (D5 applies in
   every branch).

Read-only git only; no commits.

## Write-set
- `tests/helpers/build-stdlib-globalsetup.ts` — **comment only**
- `.agent-notes/sre-T3.md`

## Read-set
- `tests/helpers/build-stdlib-globalsetup.ts` — the doc comment, in full
- `.agent-notes/sre-T0.md` — the proven mechanism
- `plans/stdlib-build-race/decisions.md` — D5

## Acceptance
- Given the comment, then its guarantee is scoped to one vitest process and it
  states plainly that it does not hold across concurrent runs.
- Given the comment, then it names the mechanism and cites where the evidence
  lives.
- Given `git diff`, then only comment lines changed — **no behaviour**, verify
  and say so.
- Given the si11a/SI12 history, then it is preserved.

## Observability
N/A — a comment.

## Rollback
Reversible: one comment, one commit.

## Quality bar
Four gates green. `npm test` under 60.3 s on a settled machine.

## Boundaries
- **Always:** verify the diff is comment-only.
- **Never:** touch `src/`; change behaviour; delete the existing history;
  run git write commands.

## Report (<=250 tokens)
The new scoping sentence, confirmation the diff is comment-only, the four gates.
