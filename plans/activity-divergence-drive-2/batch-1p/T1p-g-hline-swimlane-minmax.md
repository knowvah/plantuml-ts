# T1p-g — swimlane-aware getMinmax for the HLINE connectors

Agent: typescript-pro, worktree `add2-T1p-g` (after T1p-f lands — it ports the
per-lane draw machinery this needs). Rules: [common.md](common.md).

## Context
`FtileIfWithLinks.java:458-528` `getMinmax` (and `FtileIfLongHorizontal.java:
496-499,521-600`): under swimlanes the HLINE closing line is drawn once per
swimlane pass (the interceptor's lane), clipped to `[first, last]` lanes that
contain a branch tile, NaN outside; `getMinmaxSimple` only without swimlanes.
Our `walk-if-with-links.ts#connectionHlineLinks` and
`walk-if-long-horizontal.ts#connectionHline` use the simple form always
(T1p-a's documented residual: pezubu-98-niba240 ws 57, viewBox width -10,
2 extra elements). Read `.agent-notes/T1p-f-*.md` for how per-lane emission
was ported.

## Task
Port `getMinmax`, `getFirstSwimlane`/`getLastSwimlane`/`atLeastOne`,
`ftileDoesOutcomeInThatSwimlane`, and the per-lane draw of both ConnectionHline
classes, mirroring the Java.

## Write-set
`src/diagrams/activity/layout/{walk-if-with-links,walk-if-long-horizontal}.ts`,
the per-lane emission seam T1p-f created (name it in your report), new files,
their tests, `tests/fixtures/activity/T1p-g/**`.

## Acceptance
- pezubu-98-niba240's HLINE elements match the golden; ws falls or the
  residual is named. Unlaned HLINE output byte-identical.
