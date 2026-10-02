# T1p-a — ConditionEndStyle HLINE

Agent: typescript-pro, worktree `add2-T1p-a`. Rules: [common.md](common.md).

## Task
Port `skinparam ConditionEndStyle hline` for the if builders:
`FtileIfDown.java` `ConnectionElseHline` (409-445) and `ConnectionHline`
(461-522, `withMerge(NONE)`), and `FtileIfWithLinks.java` `ConnectionHline`
(~421-537). Trace how the jar reads the style (`ConditionEndStyle` enum, the
skinparam/style key, where the factory branches on it) and mirror it. D9: the
skinparam needs a core handler + theme field (find how other activity
skinparams such as `ConditionStyle`/`activityDiamond*` are wired; the handler
tables are `src/core/skinparam-key-handlers-table-{a,b}.ts`).
Corpus: `saxeku-17-gume203` (ws 58 at b0), `pezubu-98-niba240` (ws 101,
swimlanes). Add authored fixtures for if-with-links and nested cases if the
corpus lacks them.

## Write-set
`src/diagrams/activity/layout/{conditional-builder,walk-if-down,walk-if-with-links}.ts`,
`src/diagrams/activity/tiles/{gtile-if-down,gtile-if-with-links}.ts`,
`src/diagrams/activity/activity-style-defaults*.ts`, the core skinparam handler
table file(s) + the theme type/default file the field lives in, new files,
their tests, `tests/fixtures/activity/T1p-a/**`.
Because the core change touches every engine: run
`npm run svg:survey -- <engine> --out <scratch>` for activity + 3 other engines
of your choice before/after and report verdict changes (expect none).

## Acceptance
- saxeku-17-gume203 draws the jar's HLINE closing line (connector elements
  match the golden's), ws falls; pezubu likewise or its residual named.
- Without the skinparam, every if renders byte-identically to before.
