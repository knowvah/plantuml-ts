# T20 — Close-out

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. The mission's coverage
work is done and its baselines are re-pinned. D6 made coverage the deliverable
and required that residual fidelity be **measured and filed**, not chased — a
divergence is a considered product choice, never an effort excuse, and the
census is what makes that claim honest rather than rhetorical.

This task produces the artifacts that make the next mission cheap.

## Task

**1. Regenerate the catalog.** `npm run catalog` — this mission added ~15
modules. `tests/architecture/catalog.test.ts` gates the drift.

**2. Write `findings/CLOSE-OUT.md`** with, at minimum:
- tasks completed vs planned; decisions made, with any flagged for review
- final scoreboard against the brief's three SLIs
- **the per-bucket residual census D6 requires**: for every closed bucket, its
  fixture count and the distribution of remaining `weightedScore`s, so the
  follow-on mission can size itself without re-measuring
- every residual that did not close, each with a named mechanism and
  `file:line`
- the artefact/regression split from T18, with counts

**3. File the follow-ons in `planning/next-missions.md`:**
- **the fidelity follow-on** — the residual census as a work queue, sized from
  the numbers rather than from adjectives
- **`nuvoja-46-dezu541`** — a **harness** item, not a command gap: its source
  is `!includedef macro` and it fails because that macro is absent from the
  fixture include store. Filing it as a command gap would send the next
  mission hunting a `Command` that does not exist.
- **anything T11 deferred** (`EmbeddedDiagram`, `%newline()`), each with the
  measured fixture cost that justified the deferral
- **anything T8 or T12 journaled** as a render residual (`hnote`/`rnote`
  shapes, `**`/`!!` CREATE/DESTROY semantics)

**4. Verified `@knowvah/dot-engine` findings**, if any surfaced: a
self-contained `.md` in `docs/graphviz-issues/` **plus** a `TRACKER.md` line,
filed before this iteration closes. Living only in a mission ledger is not
filed. (Sequence emits no DOT, so this is unlikely — but check rather than
assume.)

**5. Update this brief's `README.md`** — mark every batch done and add a
close-out section pointing at `findings/CLOSE-OUT.md`.

**Do not write a `DIVERGENCES.md` entry for teoz-only behavior.** Per D4,
parsing `&` and `{anchor}` and not drawing them is upstream's own behavior
under the classic renderer, not a divergence. An entry would misrepresent it.

## Write-set

- `docs/catalog.md` (regenerated)
- `findings/CLOSE-OUT.md` (new)
- `planning/next-missions.md`
- `plans/sequence-command-coverage/README.md`
- `docs/graphviz-issues/*.md` + `TRACKER.md` — only if a finding surfaced

## Read-set

- `findings/tally.md` and `findings/adjudication.json` (T19, T18)
- `../decision-journal.md` — every entry; flagged ones go in the close-out
- `planning/next-missions.md` — match the existing entry format
- `../decisions.md#d4`, `#d6`

## Architecture decisions in force

D6 (locked): the census is **mandatory**. A close-out that reports coverage
without the residual distribution has not discharged D6.
D4 (locked): no divergence entry for teoz-only behavior.

## Interface contracts

N/A — terminal task.

## Acceptance criteria

- Given `npm run catalog:check`, then no drift.
- Given `findings/CLOSE-OUT.md`, then it carries the per-bucket residual
  distribution, not just totals, and every unclosed residual has a `file:line`
  mechanism.
- Given `planning/next-missions.md`, then the fidelity follow-on is sized from
  measured numbers, and `nuvoja-46-dezu541` is filed as a harness item.
- Given `DIVERGENCES.md`, then it has **no** new entry for teoz `&`/anchor.
- Given this brief's `README.md`, then every batch is checked and the close-out
  is linked.

## Observability

This task publishes the mission's final report.

## Rollback

**Reversible.** Documentation and a regenerated catalog.

## Quality bar

All four gates green, including `catalog:check`.

## Boundaries

- **Always**: size a follow-on from measured numbers.
- **Never**: report a residual without a mechanism; never write a divergence
  entry for teoz-only behavior; never leave a dot-engine finding in a ledger
  only.
- **Ask first**: nothing — this is the terminal task. If something is
  unreportable, that is a stop, not a soft close.

## Commit

`docs(T20): close out sequence-command-coverage`

Body required: the final scoreboard and what was filed forward.
