# T4 — close-out

## Context

The mechanism has landed. This task makes the written record match what was
**measured**, so the next reader inherits facts rather than optimism.

## Task

1. **Create `planning/mission-index.md`'s SI20 row.** It does **not** exist
   yet — SI20 was scoped in this session from an `.agent-notes` follow-up,
   not from a pre-existing index entry. Match the neighbouring rows' style
   (SI16–SI19 are the closest models). Carry the measured number: **78/80**
   if `rozuxo` closed, and name the two `no-candidate` fixtures as the
   remainder. Do not round up to a headline.
2. **Update `.agent-notes/si17-rozuxo-object-row-port-producer.md`** — the
   note that predicted this mission. Record that it landed, with the commit.
   **Also record that its own scope claim was incomplete:** it said the
   mission was "scoped by precedent rather than by discovery", but the object
   sizing path is `measureObjectClassifier` / `buildFieldBasedObjectGeo`, not
   the class path's `buildNormalClassifierResult`, so
   `portMemberSections` had to be published from a different file entirely.
   Preserve the original note as history — supersede, never delete.
3. **Write new `.agent-notes/` entries** for what a future task would
   otherwise re-derive. At minimum:
   - **The `H + margin` underdetermination.** `rozuxo-44-fudi093` pins only
     the sum, 22 — two objects with the same member height cannot separate
     the header from the body margin, and a stereotyped control was needed.
     This is a reusable shape: *a fixture whose unknowns appear only as a sum
     cannot resolve them individually, however many nodes it has.*
   - Whatever T0 found about `formatObjectMemberText` vs `getDisplay(false)`.
   - Any residue T3 named.
4. **`DIVERGENCES.md`** — an entry ONLY if something is deliberately left
   diverging with a named mechanism. Read the journal and decide. A tracked
   defect with a named owner is a backlog item, not a divergence; absence of
   effort is not a divergence either. If nothing qualifies, say so and write
   nothing.
5. **Create `plans/si20-object-row-ports/ledger.md`** — one section per task
   that changed behavior (T1, T2, T3, plus S1/S2 if either surprised),
   carrying mechanism, origin `file:line`, what it closed, and measured
   before/after.
6. **Append a mission summary to `../README.md`** — tasks completed vs
   planned, gate results, decisions flagged for review, known follow-ups.

## Must be surfaced, not buried

Read `../decision-journal.md` in full and represent accurately in both the
SI20 row and the mission summary:

- Any **write-set expansion** or **frozen-count movement** that occurred, with
  the argument that justified it. SI17 had one of each and recorded both for
  maintainer review; the same standard applies here.
- If class DOT moved at all, that is the named risk from this mission's
  Phase 4 and must be called out prominently, not folded into a total.

## Write-set

- `planning/mission-index.md`
- `.agent-notes/**`
- `DIVERGENCES.md` (conditional)
- `plans/si20-object-row-ports/README.md`
- `plans/si20-object-row-ports/ledger.md` (create)

Do **not** touch `decision-journal.md` — the orchestrator owns it.

## Read-set

- `../decision-journal.md` — the whole thing; it is the source for every
  number you write.
- [ADR-6](../decisions.md#adr-6--the-honest-ceiling-is-7880) — the exit-bar
  arithmetic.
- `planning/mission-index.md` — the SI16–SI19 rows, for style.
- `.agent-notes/si17-rozuxo-object-row-port-producer.md`
- `DIVERGENCES.md` — its existing entry format.
- `plans/si17-class-row-ports/README.md` — its closing mission summary, as
  the model.

## Acceptance criteria

- Given the SI20 row, then it states the measured object DOT count and, if
  below 80, the named cause — never a bar reported as met when it is not.
- Given `.agent-notes/si17-rozuxo-object-row-port-producer.md`, then it
  records the landing, the commit, **and** the correction to its own scope
  claim, with the original preserved.
- Given the `H + margin` finding, then a note exists that a future mission
  could act on without re-deriving it.
- Given the four gates, then all pass.

## Observability requirements

N/A — documentation only.

## Rollback

**Reversible.** Documentation only.

## Quality bar

Every number traceable to a journal entry and a command. Four gates green —
they should be untouched, since this task changes no code.

## Boundaries

- **Always:** prefer the measured number to the planned one.
- **Never:** report an exit bar as met when the gate says otherwise; delete a
  prior diagnosis instead of superseding it; run any state-mutating git
  command.

## Commit format

```
docs(T4): close SI20 with the measured object DOT number
```
