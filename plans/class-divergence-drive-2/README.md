# Mission: `class-divergence-drive-2`

**Branch:** `feat/class-divergence-drive-2` off `origin/main` · **Planned:**
2026-09-24 · **Task prefix:** `cdd2` · **Merge:** merge commit (per-task
commit ids are cited in the journal).

Read `~/.claude/docs/reference/autonomous-execution.md` in full at mission
start and after every compaction. Then this file, then
[`decisions.md`](decisions.md). Everything else is linked from here.

## Objective

Close a second swathe of the class SVG parity survey (`parity-class.json`),
which stands at **560 conformant / 86 structural-match / 77 diverged** (723
oracle; `measurements/b-plan.json`, render-all at `353176512`). Sixty-two
fixtures in five diff-signature groups are in scope — qualifier/port links
(Q, 23), the circled-character glyph family (C, 7), 1 px canvas (R, 11),
dotted-name namespaces (D, 4), small diverged singletons (S, 17) — plus 22
stretch fixtures in identical-signature pairs (batch 5, D9). The groups are
**hypotheses from diff signatures, not diagnoses**: batch 0 traces every
fixture to a Java `file:line` before any fix is written (D1), and
[`fixtures.md`](fixtures.md) is re-grouped from that diagnosis.

The Java at `~/git/plantuml/src/main/java/net/` is the spec. Every task
re-reads the cited method bodies before editing, and ports the WHOLE method
it touches (previous mission: agents twice left the second half of a Java
method unported because "no AC requires it").

## Exit bar (D8)

- Every one of the 62 core fixtures is survey-`conformant`, or its
  `fixtures.md` row carries a mechanism id AND an owner (`final` column)
- `parity-class.json`: conformant ≥ **600**, diverged ≤ **61**
- Zero UNEXPLAINED rises at every batch re-pin (D4)
- `tests/oracle/class-dot-parity.test.ts` still 711/712
- Every other engine's ratchet/diff-baseline/routing/refusal pin unmoved,
  or each mover journaled with its mechanism
- All four gates green with JSON-reporter collected count = on-disk count

## Quality gates — all four before every commit

```sh
npm test              # vitest + 90/90/90 coverage; never a path filter
npm run typecheck     # both tsconfigs
npm run lint
npm run build
```

Batch closes add the survey, census, render-all and pin-diff commands —
[`close-procedure.md`](close-procedure.md). Render oracles only with
`scripts/oracle-render.sh`; never rebuild the cache (D5).

## Batches (D2 order)

| Batch | Group | Tasks | Parallel | Moves layout | Done |
|---|---|---|---|---|---|
| [0](batch-0/overview.md) | pre-flight + diagnosis | T0 · T1–T5 · T6 | T1–T5 ∥ | no | [ ] |
| [1](batch-1/overview.md) | S singletons + D namespaces | T7 · T8 · T9 · T10 | T7 ∥ T8 ∥ T9 (if disjoint) | D only | [ ] |
| [2](batch-2/overview.md) | Q qualifier / port links | T11 · T12 · T13 · T14 | ∥ if T6 finds disjoint | YES | [ ] |
| [3](batch-3/overview.md) | C circled-character glyph | T15 · T16 | — | no | [ ] |
| [4](batch-4/overview.md) | R 1 px canvas + exit bar | T17 · T18 | — | canvas | [ ] |
| [5](batch-5/overview.md) | X stretch pairs (only if ≥ 600) | spec'd by T18 | per T18 | per T18 | [ ] |
| [final](final/T20-mission-close-out.md) | close-out | T20 | — | no | [ ] |

Every batch ends with its close task, which runs one residual round on the
merged tree first (D4), then [`close-procedure.md`](close-procedure.md).
Parallel tasks run in separate worktrees (memory: batch parallelism needs
worktrees; never Serena edit tools inside a worktree).

## Stop conditions

1. A task needs a file outside its write-set and outside every other task's
   in the batch (pre-authorised: a 500-line split re-exported from a
   write-set file, and the task's own test files)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts D1–D10 — amend `decisions.md` and halt
4. Another engine's ratchet/diff-baseline/routing/refusal pin moves without
   a journaled mechanism
5. A re-pin shows a `dotEqual true→false` flip, a conformant fixture leaving
   conformant, or a diff-count rise the batch cannot mechanise
6. Class DOT parity drops below 711/712
7. Any survey `timeout`, or JSON-reporter collected count ≠ on-disk count
8. A mechanism lives in `@knowvah/dot-engine` — file `docs/graphviz-issues/`
   + `TRACKER.md`, halt the task only
9. Anything that would change the pinned oracle (jar symlink, `pin.json`,
   cache `--rebuild`)
10. A batch-0 mechanism is disproved by measurement — journal the
    measurement before a new approach; the fix counter does not reset
11. A Q fix needs a structural rewrite of `class-kal.ts` (D7)
12. An R fix needs an epsilon or rounding tie-break (D6)
13. A C or R fix in `src/core/` moves more than 20 non-class fixtures —
    halt for maintainer review even if every mover is explained

Push-forward conditions: [`decisions.md#push-forward`](decisions.md#push-forward).

## Out of mission

79 non-conformant fixtures are not in this brief. 11 are declared in
`oracle/accepted-divergences.json` (7 ELK, gadufu, bixogo, roxosu, xadado);
the rest already have owners in `planning/next-missions.md`
(`class-divergence-drive — DONE`): dot-engine issues 20/21 and spline
precision (focaci, boseba, majuva, kupetu, konomi, bicabi, famizo, nixema,
paluca, vebini, kicuna), error-page identity (luzive, sadamo), `scale`
(cagace, nadaba, kujiji), dorafa, medosa, pixexi, cukaze, pijiju, popesa's
def-id seed (in stretch as a pair — its T18 spec must read that filing).
Touch one only if its batch-0 diagnosis shows it shares an in-scope
mechanism; then it is journaled and added to `fixtures.md`.

## Documents

- [`decisions.md`](decisions.md) — D1–D10, push-forward
- [`fixtures.md`](fixtures.md) — per-fixture group, task, mechanism, final
- [`close-procedure.md`](close-procedure.md) — the standard batch close
- [`diagnosis/`](diagnosis/) — batch-0 reports (written by T1–T5)
- [`diagrams/component-map.md`](diagrams/component-map.md),
  [`diagrams/data-flow.md`](diagrams/data-flow.md)
- [`decision-journal.md`](decision-journal.md) — append-only
- `measurements/` — `b-plan.json`, then `b0.json` … one per close
- Tools (reused in place, D10): `plans/class-divergence-drive/tools/`
  (`render-diff.mts`, `render-all.mts`, `pin-diff.mts`; README there)
- Prior mission, for mechanism history: `plans/class-divergence-drive/`
  (`decision-journal.md` rows 1–240, `diagnosis/A*.md`, `.agent-notes/cdd-T*.md`)
