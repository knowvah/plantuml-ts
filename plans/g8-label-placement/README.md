# G8 — State transition edge-label placement (graphviz-returned coords)

## Objective

Replace `attachTransitionLabel`'s hand-rolled perpendicular-offset
formula (`LABEL_PERP=12`, `state-transition-label.ts`) with the jar's
actual mechanism: consume the graphviz-computed edge-label position
that graphviz-ts already exposes (`EdgeGeometry.label` → the port's
`DotLayoutResult.labelX/labelY`, currently thrown away). The jar
never computes label geometry — it reads dot's returned position
(`SvekEdge#getXY` color-scan). The class diagram already made this
exact switch (ledger G2 N62, `class-geo-builders.ts#attachEdgeLabel`).
Landing atomically with it: the G7-verified-then-reverted stack (T18
FIXEDSIZE wiring + line-split heights, G5/C1 13pt arrow-font width,
T20b ink-walk label-box aggregation). Success: zero size-backlog
widenings, the 14-fixture set within tolerance, then G7 resumes at
T19 toward pesita `AA` 126×104.72.

## Status: STOPPED — stop condition 5 (2026-07-23, after T1)

Pesita-10-dene726's label positions cannot be reproduced: with jar-exact
FIXEDSIZE boxes on all 9 labeled edges of its AA pass (verified 9/9 vs
`svek-3.dot`), the layout's mincross ordering is left-right REVERSED vs
the jar (Idle/Closing swapped; ranks/Y match exactly). Same open gap as
G7 T13/T16 (emission-order sensitivity, cyclic pass). The conversion
formula itself is jar-exact on 11/11 labels across the other 4 fixtures
— see `spec.md`. Awaiting human direction; options in the
decision-journal T1 STOP row.

## Branch

`feat/g8-label-placement` off **`feat/g7-borderpoint-rank`** (G8
depends on G7's landed T7/T11/T12/T16 fixes; G7 is PAUSED on this
mission). Merge G8 back into `feat/g7-borderpoint-rank` with a
**merge commit**; the combined branch reaches `main` only when G7
closes. One commit per task, `feat(T2): ...` per
`~/.claude/rules/commits.md`. Orchestrator commits; subagents never
run git mutations.

## Batches (strictly serial)

| Batch | Scope | Tasks | Status |
|-------|-------|-------|--------|
| [1](batch-1/overview.md) | Convention spec + committed delta harness | T1 | [x] (stop-report form) |
| [2](batch-2/overview.md) | Atomic implementation (placement + reverted stack) | T2 | [ ] |
| [3](batch-3/overview.md) | Close-out: backlog tighten, pins, docs, G7 unblock | T3 | [ ] |

## Docs

- [decisions.md](decisions.md) — D1–D6 (locked 2026-07-23)
- [decision-journal.md](decision-journal.md) — append during execution
- [diagrams/component-map.md](diagrams/component-map.md) /
  [diagrams/data-flow.md](diagrams/data-flow.md)
- Evidence inheritance (read-only):
  `plans/g7-borderpoint-rank/decision-journal.md` (T18/T20/T20b rows —
  mechanisms, the 14-fixture set, reverted diffs' shape),
  `plans/g5-measurer-calibration/ledger.md` §C1 (13pt width fix),
  `tests/unit/state/state-composite-pass.test.ts` (5 `describe.skip`
  TDD suites to enable in T2)

## Quality Gates (after every task that lands code)

```
- command: npm test
  pass: exit 0 (DOT parity 268/268 + census floors + 57-pin ratchet + backlog)
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
- command: npx tsx scripts/measure-state-size-deltas.ts
  pass: zero entries widen vs baseline (T2+: 14-set within tolerance)
  on_fail: stop (full revert first)
- command: git diff --name-only <task-start>..HEAD
  pass: only files in the task's declared write-set
  on_fail: stop
```

## Stop conditions

1. Files outside a task's declared write-set need changes.
2. Two consecutive gate failures on one check, or 3 consecutive fix
   attempts at one code location.
3. A change contradicts D1–D6.
4. Any size-backlog entry would widen in a final state — full revert
   (G5/G7 protocol: `git show HEAD:<path> > <path>`, verify clean,
   re-run gates), then stop.
5. T1's conversion spec cannot reproduce jar-oracle label positions
   on the named fixtures — stop BEFORE T2.
6. T2's final state widens anything or breaks a pin — full revert,
   stop; no variants without human sign-off.
7. Any fixture-conditional branch would be required to pass a gate
   (D5: no special-casing, ever).
8. NEVER modify `../graphviz-ts`. If `EdgeGeometry.label` proves
   wrong vs real dot: file `docs/graphviz-issues/` + PAUSE, no local
   fix.
9. A pinned fixture exercises the changed code despite the
   zero-label census — stop, re-verify the census.

## Push-forward conditions (decide autonomously, journal it)

- Add fixtures to any sweep; spot-check extra corpus fixtures.
- Tighten backlog beyond the 14-set; pin extra byte-exact fixtures.
- Keep or remove the autonom `Math.max` floor per D6's evidence rule.
- Delete disposable probes; additive type fields; doc-comment
  corrections in touched files.
- A task turns out simpler than specced — journal why, proceed.
- Migrate the ortho/`xlabel` path if T2's sweep shows it implicated —
  evidence required, journaled.

## Execution rules

- Subagents use Serena MCP for symbols; `npx tsx` for probes;
  `npm run typecheck` as post-edit bar; no git mutations.
- Jar oracles: `oracle/goldens/state/<slug>/`; cached svek DOT/SVG:
  `test-results/dot-cache/state/<slug>/`. Named fixtures:
  beguxu-19-tize774, fomusu-59-fupe538, bemena-23-zebu249,
  pesita-10-dene726.
- On G8 close: flip `plans/g7-borderpoint-rank/README.md` from
  PAUSED to "unblocked — resume at T19".

## Session summary (2026-07-23 — stopped after Batch 1)

- Tasks completed: 1 of 3 (T1, in its stop-report form). T2/T3 not
  started — stop condition 5.
- Decisions: 3 journal rows; the T1 STOP row is flagged for review
  with the three options for the human.
- Quality gates at the T1 commit: npm test 10235 passed (384 files),
  typecheck, lint, build all green; harness reproduces the untouched
  baseline 149/149 (92 backlog + 57 pins), exit 0, ~1.5 s.
- Delivered: `scripts/measure-state-size-deltas.ts` (permanent SLI
  instrument), comparator unit tests, `spec.md` (conversion formula
  jar-exact 11/11 with the margin+floor FIXEDSIZE mechanism newly
  characterized; §5 pesita divergence report).
- Known issue blocking resume: pesita AA-pass mincross ordering
  reversed vs jar even with jar-exact label boxes (G7 T13/T16 gap).
  T2 is otherwise fully specced by spec.md.
