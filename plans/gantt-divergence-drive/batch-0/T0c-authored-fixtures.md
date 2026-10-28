# T0c — five authored fixtures with jar oracles

Agent: `typescript-pro` (sonnet), worktree `gdd-T0c`. Commit:
`test(gantt): author emoji and hidden-footer chrome fixtures (T0c)`.
Read [../task-contract.md](../task-contract.md) first.

## Context
Three gantt behaviours have no corpus row (D2, D3 in
[../decisions.md](../decisions.md)). Authored fixtures live flat in
`tests/fixtures/gantt/<slug>.puml` + `<slug>.svg` (the jar's render), read by
`tests/oracle/svg-conformance/render-fixture-gantt.ts:70-99`
(`listAuthoredGanttSlugs`, `readAuthoredGanttFixture`) and measured by
`gantt.diff-baseline.ratchet.test.ts` through `authored-baseline.json`
(orchestrator-owned; do not edit it). Existing examples: `vega-gantt8.puml`
(a `note bottom … end note` on line 13), `columns-show-task.puml`.

## Task
Write the five sources below and render each oracle with
`bash scripts/oracle-render.sh <ABSOLUTE out-dir> <absolute puml>` (never a
hand-typed `java -jar`; a relative out-dir resolves against the puml's dir),
then copy the produced svg to `tests/fixtures/gantt/<slug>.svg`. Sources
(keep them this small; the planning probes used the same lines):

- `emoji-separator`: `@startgantt` / `Project starts 2020-07-01` /
  `[Task A] lasts 3 days` / `-- <:innocent:> Phase --` / `[Task B] lasts 2 days` / `@endgantt`
- `emoji-note`: `@startgantt` / `Project starts 2020-07-01` /
  `[Task A] lasts 3 days` / `note bottom` / `Ready <:innocent:>` / `end note` / `@endgantt`
- `title-hide-footbox`: `@startgantt` / `hide footbox` / `title Test` /
  `[Foo] lasts 12 days` / `[Dummy] lasts 10 days and starts 10 days after start` / `@endgantt`
- `header-hide-footbox`: `@startgantt` / `hide footbox` / `header H` / `[Foo] lasts 12 days` / `@endgantt`
- `caption-hide-footbox`: `@startgantt` / `hide footbox` / `caption Cap` / `[Foo] lasts 12 days` / `@endgantt`

Then render ours for each with `npx tsx $T/diff-one.mts <slug>` and report
the diff counts (expected: emoji-separator and emoji-note > 0 with a missing
`image`; title/header > 0 on `svg/@height`; caption 0).

## Write-set
`tests/fixtures/gantt/{emoji-separator,emoji-note,title-hide-footbox,header-hide-footbox,caption-hide-footbox}.{puml,svg}`.
No pin, baseline or src file.

## Acceptance
- Given each `.puml`, when the jar renders it, then the `.svg` has `data-diagram-type="GANTT"` and no error text (a jar error page is stop 13: adjust the source once, report a second error).
- Given `emoji-separator.svg` and `emoji-note.svg`, then each contains exactly one `<image` element.
- Given the three chrome oracles, then their `height` attributes are 90, 51 and 49 px.
- Given `npx tsx $T/diff-one.mts caption-hide-footbox`, then 0 diffs.

## Interface outputs
The five slugs above, consumed by T1c (emoji-*), T2a (title/header/caption) and every close.

Observability: N/A. Rollback: Reversible.
