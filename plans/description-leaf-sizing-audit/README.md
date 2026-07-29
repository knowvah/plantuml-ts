# Mission — description leaf-sizing audit

**Type: SURVEY.** It produces two reusable reference tables, repairs the
measurement instrument, and installs one guard. It is *not* a
fixture-chasing mission — the fixture families still open (S1L-i, S1L-j,
sprite tail, container remainder) are explicitly out of scope.

## Objective

Description size-conformance went 239/351 (68.1%) → 311/351 (88.6%) over
eight sub-missions. Post-hoc review shows the **same two defect classes
were rediscovered one fixture at a time, four times each**. Both are
enumerable from upstream and should have cost two checklists, not eight
discoveries. This mission builds the checklists, fixes the classifier that
kept pointing at the wrong bucket, and adds a fitness function so class #1
cannot silently recur.

The two classes:

1. **Symbol composition mis-modelled, not mis-measured.** interface/circle
   (`hideText` → `asSmall` from EMPTY name/desc/stereo → bare 18px
   `CircleInterface2`); folder/package (ONE `USymbolFolder`, tab is a
   `mergeTB` BLOCK so it FLOORS width); usecase (`TextBlockInEllipse`:
   alpha from `calculateDimension`, ellipse fit to `Footprint` POINTS via
   smallest-enclosing-circle); control/entity/boundary
   (`USymbolSimpleAbstract`: fixed drawing STACKED above the label).
2. **A feature reaches the RENDERER; the SIZER never calls it.** creole
   lexer; `wrapWidth`/`Fission` (ported AND wired to the renderer, sizer
   never called it); the use-case point fit; per-element `FontSize`
   (`resolveElementFontSize` existed, `renderer-symbol.ts#textFont` called
   it, the sizer did not).

## Branch

`feat/description-leaf-sizing-audit` — branch BEFORE the first edit.
Merge to `main` with `--no-ff` (per `pr-workflow.md`: per-task commit IDs
are cited from ledgers).

## Quality gates — ALL must pass before every commit

```sh
npm test          # vitest — baseline 398 files / 10380 tests
npm run typecheck # tsc --noEmit x2
npm run lint      # eslint src tests demo
npm run build     # vite lib build
```

Plus these ratchets (a regression in any is a STOP condition):

```sh
npx tsx scripts/measure-description-size-deltas.ts   # widened MUST be 0
npx tsx scripts/dot-sync-report.ts component usecase class  # 262 / 90 / 708 EQUAL
npx tsx scripts/measure-class-size-deltas.ts         # 219/708, widened 0
```

Baseline at mission start: **311/351 (88.6%), 40 pins, zero widened.**

### Pre-flight — MEASURED 2026-07-28, not assumed

| Check | Result |
|---|---|
| `npm test` | 398 files / 10380 tests passed |
| `npm run typecheck` / `lint` / `build` | clean |
| description ratchet | 311/351 (88.6%), widened 0, unchanged 351 |
| class ratchet | 219/708, widened 0 |
| DOT parity | component 262 / usecase 90 / class 708, all 100% EQUAL |
| oracle jar | present and runs |
| `feat/description-leaf-sizing-audit` | does not exist yet |
| write-set paths | all present |

Remaining cause buckets at start (**labels are hypotheses — T1 exists
because they have been wrong every time**): container-cluster 12,
other 10, sprite 6, creole-titled-separator 3, icon 2, emoji-unicode 2,
latex 2, multiline-display 2, element-font 1.

`.claude/settings.autonomous.json` gained `Bash(java *:*)` — every task
here verifies against the jar, and the template did not allow it.

## Stop conditions

- The oracle jar (`oracle/dist/plantuml-oracle.jar`) is missing or won't
  run → STOP. Verification is impossible; **never guess a constant.**
- Any change would WIDEN a backlog pin (shrink-only ratchet) → STOP.
- Structural DOT parity drops below 262 / 90 / 708 → STOP.
- The class size ratchet moves off 219/708 → STOP.
- An audit row would be filled in from OUR code rather than upstream Java
  → STOP. That inversion is the exact failure this mission exists to end.
- Files outside a task's write-set need changing → STOP.
- Two consecutive gate failures, or the same location changed 3× without
  resolving the same check → STOP (`diagnosis.md` consecutive-fix rule).
- An architecture decision in `decisions.md` is contradicted → STOP.

## Push forward without asking

- Splitting a file to satisfy the 500-line cap (`leaf-sizing.ts` has been
  split three times already — budget for more).
- `#lizard forgives` for a PRE-EXISTING complexity violation in a file you
  touch, with the reason written inline.
- Re-pinning a delta that shrank; deleting a pin whose fixture flipped
  (do it in the SAME commit as the fix).
- Correcting a unit test that encodes an unverified assumption — but ONLY
  with a jar probe recorded in the new assertion. This has bitten twice.
- Purely stylistic choices with no behavioural effect.

## Method constraints (earned this session — follow them)

- **An IDENTICAL delta across fixtures means ONE shared cause.** Four
  fixtures at 3.1839 fell to one note fix; two at 0.1667 to one
  symbol-family fix. Start every tier from the identical-delta clusters.
- **NEVER ship a fitted constant.** A numeric scan produced 10.9; the
  shipped value is `size/4.5` = 10.888… from
  `StringBounder#getDescent`, which the scan was approximating. Against a
  deterministic oracle there is always a derivable constant. A fitted
  number means you have not found the mechanism yet.
- **Jar probe recipe** — and its two traps:
  ```sh
  java -DPLANTUML_DETERMINISTIC_TEXT=true -DPLANTUML_DUMP_DOT=<dir> \
       -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <file.puml>
  ```
  DOT node order ≠ declaration order (isolate ONE element per diagram),
  and a single-entity diagram emits NO DOT at all
  (`isDegeneratedWithFewEntities`) — always include a second element.
- **Bucket labels are hypotheses, not findings.** Read the fixture and
  compare DOT before trusting any `cause` value.

## Batches

| # | Focus | Tasks | Status |
|---|---|---|---|
| 1 | Instrument + audit (parallel) | T1, T2, T3 | [x] |
| 2 | Resolver disposition | T4 | [x] |
| 3 | Prevention — fitness function | T5 | [x] |
| 4 | Close the gaps (T6 route, T7 actorStyle, T8 archimate, T9 cleanup) | T6–T9 | [x] |
| 5 | Conditional composition refactor (ADR-2) | — | SKIPPED (gate not met) |

## Index

- [decisions.md](decisions.md) — ADR-1..5
- [batch-1/overview.md](batch-1/overview.md)
- [batch-2/overview.md](batch-2/overview.md)
- [batch-3/overview.md](batch-3/overview.md)
- [batch-4/overview.md](batch-4/overview.md)
- [batch-5/overview.md](batch-5/overview.md)
- [diagrams/component-map.md](diagrams/component-map.md)
- [diagrams/data-flow.md](diagrams/data-flow.md)
- [decision-journal.md](decision-journal.md)

## Out of scope

S1L-i (creole titled separators, 3), S1L-j (multiline quoted display, 2),
the sprite tail (6), the container remainder (~5), the creole `{{ }}`
embedded sub-diagram (UNIMPLEMENTED subsystem, ledgered under A3), and the
2 LaTeX fixtures (permanent DIVERGENCE — KaTeX ≠ JLaTeXMath). The audits
MAY reclassify which family a fixture belongs to; they must not start
fixing those families.
