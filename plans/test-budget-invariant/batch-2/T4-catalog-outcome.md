# T4 — Apply T2's diagnosed outcome for `catalog.test.ts`

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/test-budget-invariant`. **You write no `src/`** — stop 1.

T2 diagnosed why `tests/architecture/catalog.test.ts:20` reached vitest's
5,000 ms default under concurrent load. **Read `.agent-notes/tbi-T2.md` first
and follow its recommendation** — you are applying a diagnosis, not making one.

This test uses **no lock**, so D1's invariant does not apply to it. Its budget
question is different: what distinguishes *hung* from *slow machine*?

## Task
Branch on T2's `recommendation`:

- **`no-change`** — make no code change. Record the operating limit T2
  characterised as a comment on the test (or in `.agent-notes/tbi-T4.md` if a
  comment would be noise), so the next person who sees this fail under load
  finds the answer instead of re-diagnosing it. **This is a complete, valid
  outcome — do not invent a change to have something to commit.**
- **`set-budget`** — apply T2's `budgetMs` with a comment carrying T2's
  `derivation` verbatim, and cite `.agent-notes/tbi-T2.md`.

Either way, **do not pick a number yourself**, and do not adjust T2's. If you
believe T2's recommendation is wrong, **stop and journal it** (stop 7) rather
than substituting your own judgement.

Read-only git only; no commits.

## Write-set
- `tests/architecture/catalog.test.ts` (only if T2 says `set-budget`, or for a
  comment if `no-change`)
- `.agent-notes/tbi-T4.md`

Do **not** touch `tests/architecture/stdlib-lock-test-budget.test.ts` — that is
T3's, running right now in parallel.

## Read-set
- `.agent-notes/tbi-T2.md` — **the authority for this task**
- `tests/architecture/catalog.test.ts`
- `plans/test-budget-invariant/decisions.md` — D5

## Architecture decisions (LOCKED — conflict is stop 7)
- **D5** — diagnosis first; `no-change` is legitimate; optimising
  `buildCatalog()` is out of scope.
- **D4** — no global `testTimeout` in `vitest.config.ts` (stop 4).

## Interface contracts
Consumes T2's `{ recommendation, budgetMs?, derivation? }`. Produces no
exported API.

## Acceptance
- Given T2's recommendation, then this task's change matches it exactly — no
  number invented, none adjusted.
- Given `set-budget`, then the comment carries T2's derivation and cites the
  note.
- Given `no-change`, then the operating limit is recorded where the next reader
  will find it, and **no code change was invented**.
- Given `git diff`, then `vitest.config.ts` is unmodified.

## Observability requirements
N/A.

## Rollback
**Reversible.** At most one budget argument and a comment.

## Quality bar
Four gates green. Report `npm test` duration with `uptime` **and** the daemon
readings, settled first. No ceiling.

## Boundaries
- **Always:** follow T2's recommendation; cite it.
- **Never:** touch `src/`; pick or tune a number yourself (stop 3); add a
  global `testTimeout`; touch T3's file; run any git write command.

## Report (<=200 tokens)
T2's recommendation, what you applied, and the citation; the four gates. No
preamble.
