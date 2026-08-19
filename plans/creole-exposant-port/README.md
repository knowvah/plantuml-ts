# Mission: creole-exposant-port (SI30)

**Port PlantUML's `<sup>`/`<sub>` creole commands — `CommandCreoleExposantChange`
→ `FontPosition` EXPOSANT/INDICE on `FontConfiguration` — through the klimt
core and every engine that draws creole atoms (description/component/usecase,
class, state), so superscript/subscript text is measured with the muted font
(size−3, min 2), placed by `Sea`'s starting-altitude rule (−6/+3), and drawn
that way; exit = `juvagu-33-dupa212`'s last real state row exact and three
authored fixtures matching their oracles.** Planned 2026-08-18 off SI29's
one human-ruled grown row (`plans/state-declared-size-fix/decision-journal.md`
batch-2; `planning/next-missions.md` §4). Register row **SI30** at T6.

**Branch:** `feat/creole-exposant-port` (from `main` at or after `5090b49d`) ·
**Merge:** merge commit · **Agents run no git** — the orchestrator commits each
task by pathspec.

## The oracle and the exit

- `npx jiti scripts/measure-composite-declared-size.ts --mismatched-only` vs
  the pinned `test-results/state-declared-size-baseline.jsonl` (gitignored;
  SI29 left it at 272/2654/2555/62/37/0/43). Gate:
  `plans/state-declared-size-fix/scripts/harness-diff.py` (reused by path).
  juvagu-33 `s1 width idx1` (83.57 px) must go exact; the −1.0 px height row is
  expected to close via D2. Baseline re-pins shrink-only (D5).
- `render-manifest` vs `test-results/render-manifest-baseline.json` — only
  fixtures containing `<sup>`/`<sub>` plus the three authored ones may move
  (`manifest-diff.py` + [expected-moves.txt](expected-moves.txt)).
- Authored fixtures (T0): declared sizes match their `svek-N.dot`; DOT-parity
  goldens pass; svg-conformance goldens rise-only.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Authored fixtures + oracles + baselines | T0 | [x] |
| [1](batch-1/overview.md) | klimt core: `FontPosition`, exposant command, `getFont` mute | T1 | [x] |
| [2](batch-2/overview.md) | Description `AtomOps` · core seams through `Sea` (parallel) | T2 T3 | [x] |
| [3](batch-3/overview.md) | Class consumers · State consumers (parallel) | T4 T5 | [ ] |
| [4](batch-4/overview.md) | Close-out | T6 | [ ] |

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage ≥ 90/90/90)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/cep-now.jsonl && python3 plans/state-declared-size-fix/scripts/harness-diff.py test-results/state-declared-size-baseline.jsonl /tmp/cep-now.jsonl
  pass: "OK: N rows went exact, 0 rows appeared or grew" — then re-pin: cp /tmp/cep-now.jsonl test-results/state-declared-size-baseline.jsonl
  on_fail: stop            # stop 3
- command: npx jiti scripts/render-manifest.ts --out /tmp/cep-manifest.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/cep-manifest.json plans/creole-exposant-port/expected-moves.txt
  pass: "OK: N expected moves, 0 unexpected" — then re-pin the manifest baseline
  on_fail: stop            # stop 4
- command: npx vitest run tests/oracle/state-dot-parity.test.ts tests/oracle/class-dot-parity.test.ts tests/oracle/description-parity.ratchet.test.ts tests/oracle/object-dot-parity.test.ts tests/architecture/layering.test.ts
  pass: all green (state 268/268 EQUAL + T0's goldens; class/description/object counts unchanged or better)
  on_fail: stop            # stop 5 / 6
- command: git diff --name-only <last-batch-commit>..HEAD
  pass: only the batch's declared write-sets (+ shared ratchet files, baselines, journal, brief)
  on_fail: stop
```
Wall-clock: report `npm test` time each batch; > +10 % of 54.8 s after T3 is stop 11.

## Stop conditions

1. A task must write a file outside its write-set that no task owns (shared,
   pre-declared: `oracle/goldens/state/size-backlog.json` and the class/
   description backlog files, the two gitignored baselines,
   `expected-moves.txt`, `decision-journal.md`, this brief).
2. Two consecutive gate failures on the same check.
3. Harness regression: any row appears or grows vs the previous baseline.
4. `render-manifest` moves a fixture with no `<sup>`/`<sub>` that is not an
   authored fixture.
5. Any DOT-parity ratchet falls (state < 268/268, class < 720, description
   < 356, object < 80) or a svg-conformance golden count drops.
6. `tests/architecture/layering.test.ts` needs an ALLOWLIST entry or
   `KNOWN_DEBT` becomes non-empty.
7. A numeric constant without a `~/git/plantuml` `file:line`, or a delta that
   shrinks without the mechanism explaining ALL of it — no `dy`/height term
   that is not `FontPosition.getSpace` ± a measured descent.
8. A finding contradicts a locked decision (decisions.md D1–D7).
9. T1/T3: a NORMAL-only line's measured width/height or drawn output changes
   (identity property).
10. Same location changed 3× consecutively without the check clearing.
11. `npm test` wall-clock > +10 % of 54.8 s after T3.
12. `.claude/catalog.md` absent — do NOT create it (guard, not a halt).

## Push forward (journal the call)

Helper filenames/shape within D1 · authored-fixture slug names · one helper
for class notes and members · tightening a ratchet a task made exact
incidentally (log rows) · re-slicing a fixture between T4/T5 (keep
provenance) · rewriting the stale "unported" comments inside the owning task
(`creole-text-lines.ts:48-54`, `state-sizing-creole.ts:33-37`,
`EntityImageDescriptionDelegates.ts:129-147`, `CommandCreoleBuilder.ts` doc)
· regression tests from a fixture's `in.puml` · probes under
`scripts_scratch/T<N>/` deleted before commit; gated tracing in `src/` only if
reverted · minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D7 (locked) · [decision-journal.md](decision-journal.md)
- [expected-moves.txt](expected-moves.txt) — written by T0, appended per batch
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- Precedents: SI29 `plans/state-declared-size-fix/` (harness gates, commit
  discipline, rulings on grown rows), `planning/sizer-renderer-parity.md`.
- Java: `klimt/creole/command/CommandCreoleExposantChange.java`,
  `klimt/font/FontPosition.java`, `klimt/font/FontConfiguration.java:98-104,
  277-280,370-372`, `klimt/creole/legacy/AtomText.java:175-193,197-233,321-323`,
  `klimt/creole/Sea.java:60-80`, `klimt/creole/SheetBlock1.java:114-150`,
  `klimt/creole/legacy/CommandCreoleBuilder.java:104-105`.
