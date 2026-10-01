# T3e — creole and alignment in activity text

Agent: typescript-pro, worktree `add1-T3e`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
Row 26(b): activity text has zero creole integration — `drawActivityText` draws content as one literal run. The jar renders action/label text through the creole `Sheet` (`[[url{tip}label]]` -> `<a>` + underlined text, tables, `%n()`, `____` separators), and the action box is sized from that `TextBlock`. Use the shared klimt creole/TextBlock path READ-ONLY (how do class/state/mindmap render creole bodies? reuse that) — sizing in `gtile-action.ts` must use the same block. Also `skinparam defaultTextAlignment center` (`molexa`: first line x 26 vs jar 83.975).

## Rows (b2)
- **creole [[url{tip}label]] in action text**: `gaxezi-48-zesa921`, `laxibe-66-teme800`, `nisexe-68-vabu320`, `pekuxe-00-bovi270`, `zamagu-75-vape137`
- **creole table / %n() / ____ in action text**: `activity-creole-table`, `fabule-54-pili300`, `niletu-83-lego826`
- **skinparam defaultTextAlignment center in action text**: `molexa-46-redi999`

## Write-set
`src/diagrams/activity/{activity-renderer-text,activity-text-placement}.ts`, `src/diagrams/activity/tiles/{gtile-action,gtile-label}.ts`, the tests exercising them, new tests (names unique to T3e).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
