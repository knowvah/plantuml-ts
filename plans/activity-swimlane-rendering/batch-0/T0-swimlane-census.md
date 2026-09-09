# T0 — Pin the pre-change swimlane census

**Agent:** orchestrator (baseline JSON — see the batch overview)
**Depends on:** —

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Read [`../README.md`](../README.md)
and [`../decisions.md`](../decisions.md) first — every decision is locked.

Before any source changes, pin what the activity engine emits for
swimlanes today, at a granularity the two existing baselines cannot express.

## Read-set

- `tests/oracle/svg-conformance/activity.style-baseline.test.ts` — the
  DIRECT precedent. Mirror its structure, its three-way
  `baseline`/`error`/`jar-error` status handling, its `(absent)` convention
  and its no-`describe.skipIf` rule
- `oracle/goldens/svg-activity/diff-baseline.json` — the 268-fixture
  partition to reuse
- `tests/oracle/svg-conformance/render-fixture-activity.ts` — the seam

## Write-set

- `oracle/goldens/svg-activity/swimlane-baseline.json` (create)
- `tests/oracle/svg-conformance/activity.swimlane-baseline.test.ts` (create)
- `.agent-notes/asr-T0.md` (create)

## Task

Restrict to fixtures whose source contains a `|lane|` line (detect from the
`.puml`, not a slug list). For each, record for OURS and for the JAR:

1. count of vertical `<line>`s spanning (almost) the full canvas height —
   the dividers — and their `x` positions
2. count of `<text>` elements in the title band, with their `font-size`,
   `x` and `text-anchor`
3. whether a band `<rect>` is present, and its `fill`
4. lane count from the AST, and the resolved lane `x`/`width` from geometry
5. the root `<svg>` `@width`/`@height`

Carry the same `status` discrimination the sibling gates use; detect
`jar-error` from the golden's own content via the shared needle, never from
a slug list.

## Interface contract (consumed by T5, T6, T7)

```json
{ "$comment": "", "measuredAt": "", "measuredAgainstCommit": "",
  "fixtures": [{ "slug": "", "status": "baseline",
    "laneCount": 0,
    "ours": { "dividerXs": [], "titles": [{"fontSize":"","x":"","anchor":""}],
              "bandRect": null, "lanes": [{"x":0,"width":0}],
              "width": "", "height": "" },
    "jar":  { "…same shape…" } }] }
```

## Acceptance criteria

- Given the committed corpus, when the census runs, then every `|lane|`
  fixture is recorded and the count is stated in `.agent-notes/asr-T0.md`
- Given the pinned file, when the gate runs on an unchanged tree, then it
  passes
- Given a fabricated census differing from the pin, when the comparison
  function is called directly, then it fails naming the fixture and the
  differing quantity
- Given the census, then the divider-count and title-count totals for OURS
  and for the JAR are both reported in the notes

## Observability

N/A — no new observable operations. This pin IS the instrument.

## Rollback

**Reversible.** One new JSON plus one new test; deleting them reverts it.

## Quality bar

All four gates green. Run the FULL `npm test`, not `vitest run tests/unit`.
Check the `Test Files` count — a `coverage/.tmp` race can under-collect and
still exit 0.

## Commit

`test(asr-T0): pin the pre-change swimlane census`
