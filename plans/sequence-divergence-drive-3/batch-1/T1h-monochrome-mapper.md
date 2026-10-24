# T1h — `skinparam monochrome` maps every sequence paint colour

Agent: `typescript-pro` (sonnet), worktree `sdd3-T1h`. Commit:
`fix(sequence): apply the monochrome colour mapper to the body`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism (sdd2: `monochrome-mapper-unported`; Java re-read)
`TitledDiagram#muteColorMapper` returns `ColorMapper.MONOCHROME` for
`monochrome true` and `MONOCHROME_REVERSE` for `reverse`
(`TitledDiagram.java:292-299`; sdd2 cited `:295-297`), and `UgDiagram`
installs it on the exporter's `FileFormatOption` for the whole draw pass
(`UgDiagram.java:134-135`), so EVERY colour the sequence body draws is
mapped. The port already has that mapper for other engines:
`Theme.monochrome` (`core/theme.ts:113-120`, filled by the skinparam
accumulator), `colorMapperOf` and `applyColorMapperToFragment`
(`core/klimt/color/fragment-color-mapper.ts:147-195`), used by activity as
`body: applyColorMapperToFragment(body, colorMapperOf(theme))`
(`diagrams/activity/renderer.ts:436-438`). Sequence's `renderPaginated`
returns `children.join('')` unmapped (`sequence/renderer.ts:396`), so it
paints IDENTITY. Apply the same single post-process there. The mapper is a
core file: reuse it, do not edit it (stop 1). Check the two targets' chrome
(title, background): `documentChromeOf` and the chrome composed in
`core/annotations/chrome-export.ts` sit outside this write-set — if a target
still differs only in chrome colours after the body is mapped, hand back the
residual with the file that owns it (stop 1), do not edit it.

## Targets
xezipe-17-tima059, zofibo-80-kisi168 to 0 (12 and 4 units; paint-only).

## Write-set
`src/diagrams/sequence/renderer.ts` and its test. (406 lines; the change is
one call + one import.) Does not overlap T1d (`sequence-frame-metrics.ts`,
`sequence-layout-frame.ts`) or T1e.

## Read-set
`renderer.ts:318-406`; `core/klimt/color/fragment-color-mapper.ts:89-195`;
`diagrams/activity/renderer.ts:425-445`; Java: `TitledDiagram.java:290-313`,
`UgDiagram.java:128-138`, `klimt/color/ColorMapper.java:80-91`.

## Acceptance
- Given `skinparam monochrome true` (and `reverse`), when a sequence diagram
  renders, then every `fill`/`stroke`/`stop-color` in the body is the mapped
  value (unit test on a message, a participant and a note); without the
  skinparam the output is byte-identical to before.
- Given the two targets, then each diffs to 0 or hands back a named chrome
  residual.
- Given the 1042 pins, then every pin stays byte-equal (no pinned fixture
  uses `monochrome`; confirm with grep).

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
