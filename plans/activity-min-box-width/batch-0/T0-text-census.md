# T0 — Pin the pre-change text census

**Agent:** orchestrator (baseline JSON) · **Depends on:** —

## Context

Read [`../README.md`](../README.md) and [`../decisions.md#d5`](../decisions.md).
Direct precedent: `tests/oracle/svg-conformance/swimlane-census.ts` (a PURE
core with no vitest import, so a plain `npx jiti` script can both generate
the pin and re-pin it) plus `activity.swimlane-baseline.test.ts` (the gate:
three-way `baseline`/`error`/`jar-error` status from the golden's own
content via `JAR_ERROR_PAGE_RE`, AC0 population/partition, AC1 equality,
AC2 discrimination on fabricated censuses, AC3/AC3b for the two error
statuses, no `describe.skipIf`). Mirror that split exactly.

## Read-set

- `tests/oracle/svg-conformance/swimlane-census.ts`,
  `activity.swimlane-baseline.test.ts`, `activity.style-baseline.test.ts`
- `tests/oracle/svg-conformance/normalize.ts:117-124` (`NormalizedNode`;
  `style="…"` is expanded into attributes, so `fill:#000` in a style and
  `fill="#000"` count once)
- `oracle/goldens/svg-activity/diff-baseline.json` — the 268/82/23 partition
- `.agent-notes/asr-T0.md` — why the first-cut instrument over-counted

## Write-set

- `oracle/goldens/svg-activity/text-baseline.json` (create)
- `tests/oracle/svg-conformance/text-census.ts` (create)
- `tests/oracle/svg-conformance/activity.text-baseline.test.ts` (create)
- `.agent-notes/amb-T0.md` (create)

## Task

Population: every `status:"baseline"` fixture (268), same partition as the
siblings. For OURS and for the JAR record, over the normalized tree:

1. `fill` histogram over every `<text>` (`(absent)` counted)
2. `text-anchor` histogram over every `<text>` (`(absent)` counted)
3. `inset` histogram: for every `<text>` whose immediately preceding
   element sibling is a `<rect>`, `round3(text.x − rect.x)`. The jar's
   action text sits at `rect.x + 10` (Padding, `plantuml.skin:360`); ours at
   `rect.x + width/2`
4. `textCount` (tripwire, as in the style census)

## Interface contract (consumed by T6)

```json
{ "$comment": "", "measuredAt": "", "measuredAgainstCommit": "",
  "fixtures": [{ "type": "activity", "slug": "", "status": "baseline",
    "ours": { "fill": {}, "anchor": {}, "inset": {}, "textCount": 0 },
    "jar":  { "…same shape…" } }] }
```

## Acceptance criteria

- Given the committed corpus, when the census runs, then 268 baseline / 82
  error / 23 jar-error are recorded and the corpus totals (fill, anchor,
  inset histograms summed over OURS and over the JAR) are stated in the notes
- Given the pinned file, when the gate runs on an unchanged tree, then it passes
- Given a fabricated census differing from the pin in one histogram, when
  `checkCensus` is called directly, then it fails naming the fixture, the side
  and the moved histogram
- Given the jar's `cizixu-00-koro700`, then its inset histogram is `{ "10": 2 }`
  and its anchor histogram `{ "(absent)": 2 }` — asserted as an instrument test

## Observability

N/A — this pin IS the instrument.

## Rollback

**Reversible.** Three new files plus notes; deleting them reverts it.

## Quality bar

All four gates green. Full `npm test`; check `Test Files` ≥ 699.

## Commit

`test(amb-T0): pin the pre-change activity text census`
