# Architecture decisions — test-budget-invariant

Locked at planning, 2026-08-22, and confirmed by the user. A task that finds a
conflicting constraint **stops and journals it** (stop 7) rather than silently
overriding.

## D1 — Enforce the budget invariant with a fitness test, not a convention

**Context.** A lock-using test whose declared budget is below the lock's
`DEFAULT_MAX_WAIT_MS` (30,000) dies before `acquireBuildLock` can throw, so the
real failure arrives wearing another costume. This has now happened twice: once
recorded in `tests/unit/stdlib-packages.test.ts`'s own comment ("a TIMEOUT
wearing the costume of a packaging failure"), once at `:429`.

**Decision.** Add an architecture fitness test asserting that every test which
acquires the stdlib build lock declares a budget **greater than**
`DEFAULT_MAX_WAIT_MS`, sitting alongside the existing
`tests/architecture/stdlib-read-lock.test.ts`.

**Why not a comment or a review convention.** Both already existed in spirit
and both failed. The repo's own answer to "how does an architectural constraint
stay true" is a fitness function (`~/.claude/rules/architecture.md`), not
vigilance.

**Consequences.** The `:429` class of omission fails at CI time rather than as
an intermittent load flake discovered by a later mission. Costs one new
architecture test.

## D2 — The fitness test must follow at least one level of indirection

**Context.** `:429` never mentions `withStdlibBuildLock`. It calls
`npmPackDryRun`, a same-file helper that holds the lock. A fitness test that
greps test bodies for the helper name would **miss the exact defect it exists
to catch**.

**Decision.** Detection resolves lock usage through same-file helper functions,
not only direct calls inside the `it(...)` body.

**Consequences.** Materially harder than a grep, and it is the entire value of
the test. A version that only finds direct calls must be treated as **not
done** (stop 5), not as a partial pass. Transitive usage across files is *not*
required — `:429`'s shape is same-file, and that bounds the work.

## D3 — One named constant, not 42 literals; the value stays 120,000

**Context.** 42 copies of `120_000` across 10 files violate the repo's
no-magic-literals rule (`~/.claude/rules/code-principles.md`) and make the
value impossible to re-derive in one place.

**Decision.** Extract to a single documented constant in a shared test helper,
carrying its derivation in the doc comment: lock `maxWaitMs` 30,000 + measured
worst critical section ≈20,029 (`.agent-notes/lsh-T4.md`) + margin. **Keep the
value at 120,000.**

**Why the value does not move.** SI36's close-out proposed lowering it, from a
max **wait** of 12,818 ms against 120 s. That omits hold time. A lock-using
test must cover **wait + hold**; the legitimate worst case is ≈50 s, so 120 s
is ~2.4x, not ~9x. Lowering it on the published reasoning would be fitting in
reverse — a constant moved to match a number that was never the right
comparison.

**Consequences.** Any future change to the value becomes deliberate and
evidenced. Extraction touches 10 files in one commit, which is correct: one
constant and all its call sites are a single logical unit
(`~/.claude/rules/parallelism.md`).

## D4 — No global `testTimeout` in `vitest.config.ts`

**Context.** Raising the project default is the tempting one-line fix, and
`vitest.config.ts` currently sets no `testTimeout` at all.

**Decision.** Do not add one.

**Why.** The 5,000 ms default is doing real work across ~16,000 other tests:
it is what catches a genuine hang. Raising it globally blinds all of them to
buy a fix for ~42 that need an explicit, justified budget anyway.

**Consequences.** Budgets stay explicit at the call sites that need them, which
is also what makes D1's fitness test possible to write.

## D5 — `catalog.test.ts` gets diagnosis first; "no change warranted" is allowed

**Context.** `tests/architecture/catalog.test.ts` uses **no lock** (verified: 0
references), so D1's invariant does not apply to it. It runs 406 ms on a quiet
machine and needs a ~12x slowdown to reach the 5,000 ms default.
`buildCatalog()` walks `src/` with `readdirSync` and parses TypeScript to
extract export clauses — genuinely CPU-bound, in-process work.

**Decision.** Diagnose to a stated mechanism **before** any budget is chosen,
and treat "the machine was oversubscribed; document the operating limit rather
than change code" as a **legitimate outcome**, not a failure.

**Why.** Given D3 just caught a premise error produced by exactly this reflex,
raising a number until it goes green is the live risk in this mission. A
per-test timeout exists to distinguish *hung* from *slow*, not to enforce
performance.

**Consequences.** T2 may conclude with no code change at all. Making
`buildCatalog()` faster is explicitly **out of scope** — that is a performance
mission, not a timeout one.

## Routing

Autonomous execution. All tasks `typescript-pro`, sonnet. **T2** (diagnosis)
and **T3** (the indirection-aware fitness test) are the two that carry real
difficulty; the rest is mechanical or editorial. No task is routed to a
review-only agent — `architect-reviewer` has no `Write` or `Bash`.
