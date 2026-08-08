# F3-diag — `fariba-82` residual sub-diagnosis

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML (Java). The
diagnosis mission (`s1l-tail-diagnosis`) resolved `fariba-82-xolu802`'s
*reported* 0.388889in headline delta to two independent 14px causes — E1 (a
`keyword code <<st>> [` multi-line form drops the stereotype into a
non-capturing group) and E2 (`\t` measures as zero-width instead of advancing
to a tab stop) — and scheduled their fixes as `F1-b` (E1, already landed in
Batch 1) and `F4-c` (E2, scheduled for Batch 4).

**But E1+E2 do not fully explain the fixture.** `container-cluster.md`'s
`fariba-82` record carries an explicit `nextStep` (reproduced below verbatim
— this is not a paraphrase):

> A residual remains after E1+E2: node `sh0006` (the awslib `User(user,
> "Trusted user", "")` element) is oracle 1.462500 × 1.722222 vs ours
> 1.462500 × 1.750000 = **+2px height (0.027778in)**, reproduced in isolation
> and INDEPENDENT of label width (identical +2 at `"Trusted"`). That alone
> keeps the fixture above the 0.01in bar, so the fix mission must diagnose it
> too: instrument the `$User [64x64/16z]` sprite + label stack height in
> `measureEntityLeaf`.

Once F4-c's tab-stop fix lands, this +2px residual becomes `fariba-82`'s
**entire** remaining delta — and 0.027778in is above the mission's 0.01in
conformance bar. If F4-c ships believing the fixture closes and this residual
is still open, the fixture stays non-conformant and the mission's Batch 4
running total is wrong. That is why this task runs in Batch 3, before F4-c,
per SYNTHESIS §8's explicit sequencing note: **"Schedule the `fariba-82`
residual diagnosis (§4) before F4-c. It is the one task whose stated gain is
not guaranteed by its own fix."**

## Task

**This is a diagnosis task, not a fix.** No source changes (ADR-2/ADR-5).
Read `~/.claude/rules/diagnosis.md` before starting — its method
("instrument before hypothesizing", "no fix before a stated mechanism") and
its stop conditions govern this task directly, not by analogy.

1. Reproduce the +2px `sh0006` residual in isolation: measure the awslib
   `User(user, "Trusted user", "")` element (or an equivalent minimal probe
   carrying the SAME `$User [64x64/16z]` sprite + two-line label) against the
   oracle jar, independent of the rest of `fariba-82`'s source.
2. Instrument the sprite + label stack height computation in
   `measureEntityLeaf` (`src/diagrams/description/leaf-sizing-entity.ts:223`)
   to find where the +2px enters — this is the prior finding's own
   `nextStep`, carried forward, not a fresh starting point.
3. Either:
   - **Resolve it**: state the mechanism (cause, `file:line`, causal chain),
     what you ruled out and the evidence that ruled it out — the full
     artifact `~/.claude/rules/diagnosis.md` requires before any fix is
     proposed (do not implement the fix; that is F4-c's or a follow-up's
     job — this task's write-set is docs-only regardless of outcome), OR
   - **Record it unresolved**: `status: unresolved` with a populated
     `ruledOut` list and a concrete `nextStep`. **This is a legitimate
     outcome, not a failure** — see Boundaries below.

## Write-set

- `plans/s1l-tail-fix/findings/fariba-82-residual.md` (new file; create the
  `plans/s1l-tail-fix/findings/` directory if it does not exist yet)

Nothing else. No `src/` path. Probes go in `scripts_scratch/` and MUST be
deleted before finishing, per the diagnosis-mission precedent this task
inherits (`s1l-tail-diagnosis/batch-1/T1-container-cluster.md`'s write-set
rule).

## Read-set

- `~/.claude/rules/diagnosis.md` — **read it**; its method and stop
  conditions are binding here
- `../../s1l-tail-diagnosis/findings/container-cluster.md` — the `fariba-82`
  record in full (the fixture's arithmetic, the E1/E2 split, `ruledOut` items
  (a)–(e), and the `nextStep` quoted above)
- `../../s1l-tail-diagnosis/findings/SYNTHESIS.md` §4 ("Honest gaps — 0
  unresolved fixtures, 1 open sub-diagnosis") and §8 ("Sequencing notes for
  the planner")
- `../decisions.md` — ADR-2 (no source changes), ADR-5 (this mission's own
  version of "unresolved is legitimate": push-forward rule 4 in `../README.md`)
- `../README.md` — push-forward rule 4, worded for THIS mission: *"F3-diag
  cannot resolve the `fariba-82` residual — record `unresolved` with
  `ruledOut` + `nextStep` and let the fixture stay open. Do not invent a
  mechanism to reach 347; F4-c would act on it."*
- `src/diagrams/description/leaf-sizing-entity.ts:223` — `measureEntityLeaf`,
  the function this task's `nextStep` names as the instrumentation target
- Required first (mandatory for any sizing bug, per CLAUDE.md):
  `planning/usymbol-composition.md`, `planning/sizer-renderer-parity.md`
- Oracle: `oracle/goldens/description/fariba-82-xolu802/` and
  `test-results/dot-cache/component/fariba-82-xolu802/` (jar-side input/output
  for isolating the `sh0006` node)

## Architecture decisions

ADR-2 (no source changes — docs-only write-set), ADR-5 (the mission's
unresolved-is-legitimate ruling, restated as push-forward rule 4 above — both
locked, per `../decisions.md`.

## Interface contract

One record, following the SAME schema the diagnosis mission used
(`../../s1l-tail-diagnosis/findings/SCHEMA.md` — copy the block verbatim, do
not vary field names or order): `bucketLabel`, `delta`, `status`,
`mechanism`, `originFileLine`, `causalChain`, `ruledOut`, `sharedCauseWith`,
`proposedWriteSet`, `sizeEstimate`, `confidence`, and (if `status:
unresolved`) `nextStep`.

## Acceptance criteria

- **Given** the `sh0006` residual, **when** reproduced, **then** the isolated
  probe's measured dimensions and the oracle's are both stated explicitly in
  the record (not just "confirmed" — the actual numbers).
- **Given** a claim of resolution, **when** recorded, **then**
  `originFileLine` is a real file and line, and `ruledOut` is non-empty with
  evidence for each item (an empty `ruledOut` on a non-trivial residual means
  the cause was guessed, per `diagnosis.md`).
- **Given** the residual cannot be resolved, **when** recorded, **then**
  `status: unresolved` with `ruledOut` and a concrete, actionable `nextStep`
  — and the record does NOT invent a plausible-sounding mechanism to appear
  complete. The mission's Batch 4 (`F4-c`) will act on exactly what this file
  says; a fabricated diagnosis is strictly worse than an admitted gap.
- **Given** either outcome, **when** the record states its conclusion,
  **then** it explicitly says whether `fariba-82` is expected to close once
  F4-c's tab-stop fix also lands, or whether it stays open — this is the one
  piece of information the Batch 4 task and the mission README's running
  count (346 vs 347) depend on.
- **Given** completion, **when** `git diff --name-only` runs, **then** no
  `src/` path appears and `scripts_scratch/` is empty.

## Quality bar

**Not the code gates** (`npm test`/`typecheck`/`lint`/`build`/ratchets) —
this task changes no `src/` file, so those gates are meaningless as a
pass/fail signal for it. The quality bar is:

```sh
git diff --name-only   # no src/ path; only the new findings file (+ dir)
ls scripts_scratch/     # empty or absent
```

Capture `$?` directly; never pipe a gate.

## Observability

N/A — no new observable operations; this task produces a document.

## Rollback classification

Fully reversible, zero risk to the codebase. Revert = delete the findings
file (and the `findings/` directory, if this is the first task in the batch
to create it and nothing else populated it).

## Boundaries

**Always:** instrument before hypothesizing; state the mechanism artifact
(cause, `file:line`, causal chain, ruled-out) before considering the task
done, per `diagnosis.md`; read the required tables first; use Serena MCP
tools for symbol navigation.

**Ask first:** if reproducing the residual requires a NEW authored fixture
(ADR-7 precedent from the mission decisions — generating a jar oracle for a
NEW fixture is approved work) rather than isolating the existing
`fariba-82-xolu802` oracle.

**Never:** modify `src/`; propose or implement a fix (that is out of scope
regardless of what this task discovers); invent a mechanism to make
`fariba-82` appear resolved so the mission can claim 347 — **`unresolved`
with populated `ruledOut` + `nextStep` is a legitimate, complete outcome for
this task.** If unresolved, `fariba-82` stays open and the mission lands at
346, and that is correct, not a shortfall to paper over. Do not touch
`size-backlog.json`; do not leave probe files in `scripts_scratch/`.

## Commit format

`docs(F3-diag): fariba-82 sh0006 residual diagnosis` — or defer to the
orchestrator, per the mission's usual convention for docs-only tasks.
