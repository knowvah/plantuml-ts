# T2 — Diagnose `catalog.test.ts` to a stated mechanism

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/test-budget-invariant`. **You write no `src/`** — stop 1. **You write no
fix.** This task produces a mechanism, and nothing else.

`tests/architecture/catalog.test.ts:20` ("is up to date with `src/`") failed
with `Error: Test timed out in 5000ms` during SI36's concurrent trials. Unlike
the other failing test, it **uses no lock** (verified: 0 references to
`withStdlibBuildLock`). `buildCatalog()` (`scripts/generate-catalog.ts:191`)
walks `src/` with `readdirSync` and parses TypeScript to extract export
clauses — genuinely CPU-bound, in-process work.

Measured: **406 ms** on a quiet machine (load 2.73), against the 5,000 ms
default. It needs roughly a **12x** slowdown to trip.

## Task
Establish the mechanism, per `~/.claude/rules/diagnosis.md`. Your deliverable
is the diagnosis artifact:

- **Mechanism** — the specific cause, in one or two sentences.
- **Origin** — the `file:line` where it originates.
- **Causal chain** — why a 406 ms test reaches 5,000 ms.
- **Ruled out** — what you eliminated, and the evidence that eliminated it. An
  empty "ruled out" means you guessed.

Instrument before hypothesising. Candidate questions, not a script to follow:
does the cost scale with worker count, with concurrent suites, or with load
generally? Is it CPU starvation, or does something serialise (filesystem,
TypeScript parse, the `readdirSync` walk)? Is the 12x reachable at plausible
load, and at what load does it first appear?

**"No code change is warranted" is a legitimate conclusion (D5).** If the
mechanism is "the machine was oversubscribed", say so and characterise the
operating limit — at what load does this test become unreliable? That is a
finding, not a failure.

**Do not choose a budget in this task.** T4 applies whatever you conclude.

Read-only git only; no commits.

## Write-set
- `.agent-notes/tbi-T2.md` only
- `scripts_scratch/T2/**` for probes, deleted before you finish

Do **not** modify `tests/architecture/catalog.test.ts` — that is T4's.

## Read-set
- `tests/architecture/catalog.test.ts` — 2 tests, the slow one is `:20`
- `scripts/generate-catalog.ts` — `buildCatalog()` at `:191`, the walk at
  `:55`, the parse at `:108-121`
- `.agent-notes/lsh-T4.md` — SI36's trial logs and the failure signatures
- `plans/stdlib-lock-sharing/README.md` close-out — the load-response data
  (load 4.37 pass, 28.15 pass, 57.07 fail)
- `plans/test-budget-invariant/decisions.md` — D5

## Architecture decisions (LOCKED — conflict is stop 7)
- **D5** — diagnosis before any budget; "no change warranted" is permitted.
  Making `buildCatalog()` faster is **out of scope** (that is a performance
  mission).

## Interface contracts
T4 consumes: `{ mechanism: string, originFileLine: string, causalChain:
string, ruledOut: string[], recommendation: 'set-budget' | 'no-change',
budgetMs?: number, derivation?: string }`. If `recommendation` is
`'set-budget'`, `derivation` must state how the number was obtained from
measurement — **not** "the value that made it pass".

## Acceptance
- Given the diagnosis, then it states mechanism, origin `file:line`, causal
  chain, and a non-empty "ruled out" with its evidence.
- Given a load figure, then it is accompanied by the daemon and load-average
  readings taken beside it.
- Given a recommendation, then it is either `no-change` with a characterised
  operating limit, or `set-budget` with a derivation from measurement.
- Given the tree, then `git status --short` shows only your note.

## Observability requirements
N/A — this task measures; it does not instrument production.

## Rollback
N/A — no code changes.

## Quality bar
Four gates green. Before **any** timing number, poll `uptime` **and**
`ps -Aceo pcpu,comm | grep -E
'suggestd|corespotlightd|mds_stores|biomesyncd|BiomeAgent'`, and wait for the
1-minute load average to settle too — a settle check polling only daemons
started an SI36 run at load 57. Quote the load beside every number. Note the
measurement trap: if you generate load to reproduce the failure, timing taken
during that load is the condition under test, not a baseline — separate them.

## Boundaries
- **Always:** instrument before hypothesising; state what you ruled out.
- **Never:** touch `src/`; modify `catalog.test.ts`; pick a budget; optimise
  `buildCatalog()`; run any git write command.

## Report (<=300 tokens)
The four-part diagnosis artifact; the recommendation with its derivation or
its operating limit; the four gates. No preamble.
