# S1L Tail Diagnosis — mechanism tables for the 26 remaining description size misses

## Objective

Description size-conformance sits at **321/351 = 91.5%**, widened 0. Thirty
fixtures miss the 0.01in bar; two are the permanent LaTeX divergence and two
are the unported creole `<code>` monospace block (GH #24, deliberately out of
scope). This mission diagnoses the remaining **26 to a `file:line` mechanism
each** and re-partitions them by TRUE shared cause.

**This mission writes no source code.** Its deliverable is the input to a
separate fix mission, which cannot be planned until these mechanisms are
known. See [decisions.md](decisions.md) ADR-2 and ADR-3.

## Why diagnosis is its own mission

The bucket labels below come from a **first-match cause classifier** that the
project's own instrumentation header calls a hypothesis generator, not a
finding. It has previously merged six unrelated bugs under one label
(`container-cluster`, S1L-e). On 2026-08-06 three fixtures sharing one label
and one identical +1 delta turned out to be **two different mechanisms in two
different engines** — and the "algebraically derived" fix inherited from a
prior mission would have regressed an already-ratcheted golden.

Batching fix work on these labels would therefore assign the wrong files to
the wrong agents. The labels are provenance, not a work breakdown.

## Scope — 26 fixtures

| Bucket (label only) | n | Task |
|---|---|---|
| container-cluster | 9 | [T1](batch-1/T1-container-cluster.md) |
| sprite | 5 | [T2](batch-1/T2-sprite.md) |
| element-font | 5 | [T3](batch-1/T3-element-font.md) |
| creole-titled-separator (S1L-i) | 2 | [T4](batch-1/T4-creole-titled-separator.md) |
| multiline-display (S1L-j) | 2 | [T5](batch-1/T5-multiline-display.md) |
| other | 2 | [T6](batch-1/T6-other.md) |
| icon | 1 | [T7](batch-1/T7-icon.md) |

**Excluded, deliberately:** `gevozu-46-sasu860` + `sunuju-01-pote718` (LaTeX,
permanent divergence — `DIVERGENCES.md`); `gafico-37-cuma657` +
`nujito-06-neca370` (unported `<code>` monospace block, GH #24 — a creole
feature port, not a sizing defect; stays pinned).

## Branch

`feature/s1l-tail-diagnosis` off `main`.

## Batches

- [x] [Batch 1](batch-1/overview.md) — T1–T7, seven diagnosis tasks, fully
      parallel (each writes exactly one findings file; zero write conflicts).
      **Complete 2026-08-06: 26/26 fixtures diagnosed, 0 unresolved.** Gates
      green; `src/` byte-identical to `main`; measurement diff-identical to the
      pre-batch baseline. Two items await a maintainer ruling — see
      [decision-journal.md](decision-journal.md).
- [x] [Batch 2](batch-2/overview.md) — T8 synthesis: re-partition all 26 by
      true mechanism across bucket boundaries.
      **Complete 2026-08-06:** [findings/SYNTHESIS.md](findings/SYNTHESIS.md).
      26 fixtures → **13 mechanism groups**; 0 unresolved, 0 proposed
      divergences. Seven buckets scattered into thirteen groups with only one
      surviving as a partition (ADR-3 vindicated). The `xufexu-38`/`pivudu-29`
      cross-task contradiction is ruled ONE mechanism on source evidence
      (`BodyEnhancedAbstract.ts:84-90`), not on either record's assertion.
      Fix-mission batch plan closes the tail to **347/351 = 98.9%**, leaving
      only the 4 deliberately excluded fixtures.

## Quality gates

```sh
npm test              # vitest — baseline green, must stay green
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src tests demo
npm run build         # vite library build
npx tsx scripts/measure-description-size-deltas.ts   # 321/351, widened 0
git diff --name-only  # MUST contain no src/ path (ADR-2)
```

All five must pass. Never pipe a gate — `tail`'s exit code masks the real
one; capture `$?` directly.

## Stop conditions

STOP and wait for a human when:

1. Any change under `src/` is required (violates ADR-2) — journal it, don't
   do it.
2. A task needs to write outside its declared write-set.
3. Two consecutive quality-gate failures on the same check.
4. A finding would contradict an approved ADR.
5. The same fixture has been instrumented 3+ times without reaching a
   mechanism; if 3+ fixtures in ONE bucket go unresolved, stop the task.
6. Diagnosis implies an oracle regeneration or jar patch (maintainer-approved
   territory — the A2s ADR-5 precedent).

## Push forward on judgment

1. Choice of probe or instrumentation technique.
2. A recorded mechanism turns out wrong — record the correction, continue.
   ADR-4 expects this.
3. A fixture belongs to a different bucket than labelled — record
   `sharedCauseWith`, continue. ADR-3 expects this.
4. A fixture already measures conformant (stale pin) — record it, do NOT
   delete the pin (ADR-2).
5. **A mechanism is unresolved after bounded effort** — record it as
   `unresolved` WITH `ruledOut[]` and the next instrumentation step, then
   continue. Per `~/.claude/rules/diagnosis.md` this is a valid in-progress
   state, NOT a failure. Do not invent a plausible mechanism to appear
   complete: a fabricated diagnosis is worse than an honest gap, because the
   fix mission will act on it.
6. A proposed `DIVERGENCES.md` entry — write the proposal, flag it for the
   maintainer, continue (ADR-6). Never self-approve a divergence.

## Documents

- [decisions.md](decisions.md) — the six approved ADRs
- [findings/SCHEMA.md](findings/SCHEMA.md) — the per-fixture record format
  (T8's interface contract)
- [diagrams/data-flow.md](diagrams/data-flow.md) — the diagnosis loop
- [diagrams/component-map.md](diagrams/component-map.md) — modules under
  investigation
- [decision-journal.md](decision-journal.md) — appended during execution

## Required reading before ANY fixture

`planning/usymbol-composition.md` and `planning/sizer-renderer-parity.md` —
`CLAUDE.md` marks both "READ BEFORE ANY SIZING BUG, ANY ENGINE". Every task's
read-set includes them.

---

## Mission summary — complete 2026-08-06

**Tasks:** 8 planned, 8 completed (T1–T7 parallel, T8 synthesis).
**Fixtures:** 26 planned, 26 diagnosed to a `file:line` mechanism.
**0 unresolved. 0 fabricated. 0 proposed divergences.**

### Result

26 fixtures → **13 mechanism groups**. Seven classifier buckets scattered;
only `multiline-display` survived as a partition, and it was short one member.
`computeContainerBbox` — the site the largest bucket is *named after* — is
implicated by **zero** of the 26. ADR-3 was not a precaution; it was load-
bearing. Fix plan projects **321/351 → 347/351 (98.9%)**, leaving exactly the
four deliberately excluded fixtures.

### What ADR-4 caught

Five inherited mechanisms were re-verified; **three did not survive**, and at
least two would have sent the fix mission to edit a line that changes nothing:

- **S1L-i** — recorded blocker `CreoleStripeSimpleParser.ts:95` is *not on the
  path* for either fixture; its 62.5-vs-37.6px figure no longer reproduces.
- **`gogamo-72`** — filed as element-font; it is a **parser** gap. The sizer
  reproduces the jar exactly once given the stereotype.
- **`vivido-49`** — its historical cause is credited to a subsystem the fixture
  does not even exercise (it contains no `<img>` markup).
- **S1L-j** — confirmed verbatim but incomplete twice: 3 fixtures not 2, and
  entirely parse-side, so no `leaf-sizing*.ts` edit is warranted.

### Findings that outrank any single mechanism

1. **`maxSizeDeltaIn` discards node identity** (`tests/oracle/svek-dot.ts:251-253`)
   — sorts each side's dimensions into one multiset and pairs by index. It is
   the minimum-cost 1-D matching, so it **deflates**. The exposure is therefore
   **false conformance among the 321 PASSING fixtures**: a permutation of
   correct values reports delta 0 with every node wrong. **Recommend a
   by-node-id metric + re-measure of all 351 before these numbers are used as
   fix targets — it may change what "321/351" means.**
2. **`measureNote` (`leaf-sizing.ts:215-226`) is the highest-value site in the
   tail** — 12 lines, four distinct causes, 5 fixtures outright. Everything it
   needs (`BodyFactory.create3`→`BodyEnhanced2`) is already ported and already
   wired for entity `desc`.
3. **`kokebo-27` is not a port defect** — its golden was captured without
   `PLANTUML_DETERMINISTIC_TEXT`.

### Maintainer rulings issued during execution

| Item | Ruling |
|---|---|
| `kokebo-27` stale golden | **Sweep all 351** goldens, as its own task with its own gates |
| `kovaxi-11`/`zidebi-71` `EmbeddedDiagram` 42×42 fallback | **Reproduce faithfully.** No divergence declared |
| T8's out-of-write-set ledger correction | **Keep** — corrections belong where the stale claims live |

### Quality gates (final, all green)

`npm test` 545 files / 12,262 tests · `typecheck` · `lint` · `build` all exit 0.
`measure-description-size-deltas` 321/351, widened 0, **diff-identical to the
pre-mission baseline**. `git diff main -- src/` **empty** — ADR-2 satisfied at
byte level, not merely by filename.

### Known issues / follow-ups

- **`fariba-82`** is recorded `resolved`, but its two mechanisms explain only
  the *reported* delta; node `sh0006` carries a reproduced, **undiagnosed**
  +2px that becomes the headline once they land. It is the only group whose
  gain is not guaranteed by its own fix — sub-diagnose it *before* F4-c.
- The harness metric audit (item 1 above) is **not yet done** and gates the
  trustworthiness of every target number in `SYNTHESIS.md`.
- Two defects were found that **no golden covers** (emoji-only line height;
  three further NO-MATCH declaration shapes) — corpus gaps, not regressions.
