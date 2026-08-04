# Mission A2s — class record-node sizing (size-conformant flip)

Close the class-corpus node width/height deltas against the jar's svek DOT
so the size ratchet flips conformant. Baseline (2026-08-04, main @
`3717e506`): **219/708 conformant (30.9%)**, widened 0, 489 backlog pins.
Structure is 100% EQUAL (708) and must stay so. The gap is small pervasive
WIDTH residuals (heights mostly exact — bare-class 0.666667in already
matches) clustering on identical constant-px offsets: each cluster is ONE
shared mechanism.

**Exit bar (ADR-3):** 100% minus NAMED entries — every fixture still
non-conformant at close is named in [ledger.md](ledger.md) with its
mechanism. ≥90% (637/708) is a progress checkpoint, not the exit.

## Branch

`feature/a2s-class-record-sizing` — branch from main before the first edit.
Merge `--no-ff` (per-task commit IDs are cited). Orchestrator commits after
each batch; agents NEVER run state-mutating git.

## Quality gates — ALL must pass before every batch commit

```sh
npm test              # baseline 478 files / 11,452 tests
npm run typecheck
npm run lint
npm run build
```

Ratchets — a regression in ANY is a STOP:

```sh
npx tsx scripts/measure-class-size-deltas.ts        # widened 0, conformant monotonic UP
npx tsx scripts/dot-sync-report.ts class            # 708 EQUAL held
npx tsx scripts/measure-description-size-deltas.ts  # description ratchet held (320/351, widened 0)
npx vitest run tests/architecture/sizer-renderer-parity.test.ts  # green
```

## Stop conditions

1. Any ratchet WIDENED (class size, description size, DOT EQUAL < 708,
   parity guard red). Diagnose to a mechanism; never re-baseline.
2. Parity-survey dotEqual flip or verdict downgrade (SI13 ADR-2 rule).
3. A diagnosed mechanism requires the SI1 body-layer port
   (`MethodsOrFieldsArea`/`CucaDiagram`/skin cascade) — see
   [decisions.md](decisions.md) ADR-1. Report measured size; do not absorb.
4. A fix would need a FITTED constant — the number cannot be traced to an
   upstream Java expression.
5. Files outside the write-set need changes and no other task owns them.
6. Two consecutive gate failures on the same check; or the same location
   changed 3× without resolving the same failing check.

## Push-forward conditions (decide autonomously, journal it)

- Verdict upgrades / pinned-test drift TOWARD the oracle — proceed with the
  journaled breakdown (SI13 ADR-2 mechanical rule).
- Deleting `oracle/goldens/class/size-backlog.json` entries that measure
  conformant (same commit as the fix that closed them).
- Authoring fixtures + jar oracles to isolate a mechanism (ADR-4).
- Diagnosis finds a different mechanism count than the cluster menu
  predicted.
- Updating colocated class test expectations that assert old (wrong)
  sizes — journal each.

## Method constraints (earned)

- NEVER ship a fitted constant; every number traceable to an upstream
  expression (`~/git/plantuml/src/main/java/net/` — grep the WHOLE net/
  root, never only net/sourceforge/plantuml/).
- An IDENTICAL delta across fixtures = ONE shared cause.
- Diagnosis widens measurement to the full ratchet set, never just the
  named symptom fixtures.
- Verify a subagent's load-bearing claim against the code before acting.
- Jar probe: `java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir>
  -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>`.
  Traps: DOT node order ≠ declaration order (ONE element of interest per
  probe); a single-entity diagram emits NO DOT (always add a throwaway
  second element + edge).

## Batches

| # | Focus | Tasks | Status |
|---|-------|-------|--------|
| 1 | Diagnose the identical-delta clusters (parallel, read-only + probes) | D1 [x] (root cause; D2-D4 stopped — ADR-5) | [x] |
| 2 | G1: fix runOracle flag + regenerate class goldens + re-measure + prune backlog (ADR-5) | G1 [x] (b34a587b; 635/708) | [x] |
| 3 | G2 diagnose [x] (20 mechanisms, batch-3/mechanisms.md) + fix round 1 [x] (commits 72a2c8bb..1b01053c; **686/711 = 96.5%**, backlog 25) | G2, F-A..F-G | [x] |
| 4 | Close-out: cold gates, parity-survey regen, ledger, index | C1 | [ ] |

## Index

- [decisions.md](decisions.md) — ADR-1..4 + operational readiness
- [batch-1/overview.md](batch-1/overview.md) · [batch-1/clusters.md](batch-1/clusters.md) (slug lists per delta cluster)
- [batch-2/overview.md](batch-2/overview.md) — fix-task templates + file ownership
- [batch-3/overview.md](batch-3/overview.md) — residual-round procedure
- [batch-4/overview.md](batch-4/overview.md) — close-out checklist
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md) — append during execution
- [ledger.md](ledger.md) — named remainder (created empty; every entry cites mechanism + evidence)

## Key code map (verified 2026-08-04)

Sizing pipeline (sizer and renderer SHARE this geometry — no split):
`measureClassifier` (src/diagrams/class/class-layout-helpers.ts:388) →
`computeClassifierGeoPipeline` (class-layout-generic-classifier.ts:167;
width :190, height :320) → `buildOneDotNode` (class-dot-graph.ts:235) →
`addNodes` px/72→in (src/core/graph-layout-build.ts:150).

Java spec chain: `EntityImageClass.calculateDimensionSlow`
(svek/image/EntityImageClass.java:100-115) — width = max(body, header)
floored by PName.MinimumWidth, ParamSameClassWidth, kalWidth*1.3; height =
body + header. `HeaderLayout.getDimension` (:68-78) — width = circle +
max(stereo, name) + generic; height = max(circle, stereo+name+10, generic).
`MethodsOrFieldsArea` (cucadiagram/) — rows via `TextBlockLineBefore`
margin (6,4); visibility icon = circledCharacterRadius+3.
`EntityImageClassHeader` — name withMargin(3,3,0,0); circled char
withMargin(4,0,5,5), radius = FontSize(CIRCLED_CHARACTER)/3 + 6.
