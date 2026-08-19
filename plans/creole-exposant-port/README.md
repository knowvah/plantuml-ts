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
| [3](batch-3/overview.md) | Class consumers · State consumers (parallel) | T4 T5 | [x] |
| [4](batch-4/overview.md) | Close-out | T6 | [x] |

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

## Close-out (2026-08-19)

**Exit criterion MET.** `juvagu-33-dupa212`'s `s1 width idx1` row (SI29's one
ruled-grown row, 27.57 → 83.57 px) went **exact** at the T3 gate (Batch 2) and
stays exact now; all three authored fixtures' declared sizes match their
`svek-N.dot` (exposant-01-class byte-identical `y`/`font-size` vs the jar's
`in.svg`; exposant-02-usecase `maxSizeDeltaIn=0`; exposant-03-state exact).

**Harness**, `test-results/state-declared-size-baseline.jsonl` (T0 ORIGINAL
pin `273/2660/2558/65/37/0/44` → now `273/2660/2563/60/37/0/42`; exact +5,
mismatched −5, dirty −2): `harness-diff.py` vs the current (already re-pinned)
baseline: **`OK: 0 rows went exact, 0 rows appeared or grew`** — identical,
confirming Batch 3 was the last row-moving batch.

**Manifest**, 2017 fixtures: `manifest-diff.py` vs the current (already
re-pinned) baseline: **`OK: 0 expected moves, 0 unexpected`**. Every fixture
on `expected-moves.txt` was already accounted for at the last re-pin,
including `xeziki-47-zomo866` (Batch 3 T5 collateral, human-accepted at
STOP-4 — state notes now honour per-run `<color:>`, jar draws `#F00` there).
No fixture outside the allow-list moved at any point (grep confirms 0 rows
mentioning `exposant-0*`/`juvagu` remain in the mismatched harness output).

**Ratchets.** Backlog pins removed: class 1 (`exposant-01-class`, T4),
description 1 (`exposant-02-usecase`, T2), state 2 (`juvagu-33-dupa212` +
`exposant-03-state`, T5) — state backlog 63 → 62 entries net. DOT-parity:
state **270/270 EQUAL** (SI29's 268 + 2 new), class **721/721** (+1), object
**80/80** (unchanged), description ratchet **357/357 conformant** (+1);
svg-conformance goldens unchanged (state 60 fixtures/62 tests, rise-only —
no rise needed this mission).

**Coverage / wall-clock.** `npm test`: **613 files / 14,747 pass** (1 todo).
Coverage 95.41 / 90.34 / 96.93 / 96.50 — ≥ 90/90/90, unchanged from the
Batch 3 gate. Wall-clock was sampled twice: **55.0 s** at the first close-out
run and **58.91 s** on the post-reboot re-run (60.26 s including npm), against
SI29's 54.8 s reference — +0.4 % and +7.5 %. Both are under stop 11's +10 %
(60.28 s), so the gate holds, but the spread is machine contention, not a
stable measurement; treat 58.9 s as the honest upper sample.

**Per-task commits** (branch `feat/creole-exposant-port`, off main
`c7ede890`): `dbb283b4` T0 (fixtures+oracles+baselines), `066718ce` T1
(`FontPosition`, exposant command, `getFont`/`getSpace`) + `6f1bf446` fix(T1)
(dropped a stale `<sup>`-is-literal pin), `edce8381` T2 (description
`AtomOps` altitude/mute), `db9d99e2` T3 (`creole-sea-line.ts` — core seams
through `Sea`), `bdd2a54a` T4 (class members/notes, closed-form Sea
specialization), `d19ca450` T5 (state per-run size/dy + `expandRun` width
fix); batch-close docs `812784b5`, `4a4106af`, `e779fb74`, `e7851a1d`.

**Flags for the maintainer.**
1. T4's class consumer uses a closed-form Sea specialization
   (`class-member-creole-sea.ts`) rather than T3's general `leafTextLineLayout`
   seam — jar-verified exact, journaled at gate-2 for human confirmation
   against D2's "through the ported Sea" letter; orchestrator's assessment
   was within D2's intent. Unresolved as a formal ruling, not blocking.
2. T5's sup/sub run baseline carries a documented **~0.667 px residual**
   (`renderer-box.ts#runBaseline`: `CreoleTextRun` exposes no unmuted size
   for the reference descent) — cosmetic, not gated by any ratchet.
3. T3's emoji atoms now report `emojiSquareDim`, journaled as a flag; no
   NORMAL fixture moved.
4. `xeziki-47-zomo866` collateral move (state note colour) — human-accepted,
   see Manifest above.

**Follow-ups.**
- Sequence/activity/WBS creole (`<sup>` stays literal there — D6, no creole
  pipeline; a separate mission).
- `TileText` (unported, no consumer) and `<math>` (KaTeX divergence) — D6.
- T5's ~0.667 px sup/sub baseline residual (flag 2 above).
- `render-manifest.ts` only tracks files literally named `in.puml`; an
  `oracle/goldens/**/input.puml`-only fixture is invisible to the manifest
  gate (T0 note) — mirror into `test-results/dot-cache/` if manifest
  coverage is needed.
- `scripts/oracle-render.sh -o <out>` resolves a relative out-dir against
  the **input file's** directory, not cwd (T0 note).
