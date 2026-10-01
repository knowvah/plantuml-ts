## Observation: shared scratchpad clobbered by a sibling worktree agent
- **Context**: Writing a scratch `diffdump.ts` probe script to
  `/private/tmp/claude-501/.../6fe007b1-.../scratchpad/` while working T2c
  in `add1-T2c`, following the sibling family T2e running in parallel in
  `add1-T2e`.
- **Finding**: A file written to the session scratchpad directory
  (`diffdump.ts`) was silently overwritten mid-task by a sibling subagent
  (T2e) running against a DIFFERENT worktree — the overwritten file's
  hardcoded `REPO` path pointed at `add1-T2e`, not `add1-T2c`, and running
  it threw `MODULE_NOT_FOUND` rather than silently mis-measuring. The
  scratchpad path shown in each agent's environment banner is per-session,
  but evidently collided across two sibling agent sessions spawned from
  the same parent turn.
- **Impact**: A scratch script in this shared location is not safe to
  assume private, even within one subagent's own turn — a sibling family's
  concurrent probe run can overwrite it between write and execute. Giving
  the script a name unique to the worktree (`diffdump-T2c.ts` instead of
  `diffdump.ts`) avoided further collisions for the rest of the task. Any
  future batch-2-style parallel-worktree mission should have each family's
  prompt say to suffix scratch filenames with its own task ID.
- **Confidence**: High (directly observed: wrong `REPO` path in file
  content, wrong module-not-found error naming `add1-T2e`).

## Observation: three T2c mechanisms require src/core edits outside the write-set
- **Context**: Diagnosing `farexi-86-xanu521`/`zanudo-86-seco241`/
  `fofele-65-lozo631`/`naroji-40-nuke022` (ArrowHeadColor), `setecu-78-
  cuko533` (preserveAspectRatio), and `dulezi-77-sana210`
  (activityDiamondFontSize) against the Java.
- **Finding**: All three have a fully-diagnosed, quoted mechanism, but each
  requires a NEW skinparam-key-handler/theme-field wire-up in `src/core/`
  (`skinparam-key-handlers-table-a.ts`/`-b.ts`, `theme-colors-fields.ts`,
  or the hardcoded `preserveAspectRatio="none"` in the FORBIDDEN
  `src/core/klimt/document-shell.ts`) — none of which exists today for
  these three skinparams. The activity-side READ tier
  (`activity-style-defaults.ts`/`activity-text-style.ts`, both in this
  task's write-set) is ready to consume the value the moment core exposes
  it, following the exact same tiered-cascade pattern this task already
  used for `arrowFontColor`/`activity`-bucket `lineThickness` (both of
  which turned out to be READ-side gaps only, already wired on the
  core/write side).
- **Impact**: A future core-scoped task should add: (1)
  `arrowheadcolor`/`defaultarrowheadcolor` skinparam key handlers writing
  a new `ElementColors`/theme field (mirror `arrowcolor`'s `acc.arrow =
  paint` entry, `skinparam-key-handlers-table-a.ts:109-117`); (2) a
  `preserveAspectRatio` field threaded from `Theme` through
  `assembleDocumentShell` (`document-shell.ts:197-199`'s hardcoded
  `'none'`); (3) `activitydiamondfontsize`/`-fontname`/`-fontstyle`/
  `-fontcolor` key handlers mirroring the already-present
  `activitydiamondbackgroundcolor`/`-bordercolor` pair
  (`skinparam-key-handlers-table-b.ts:405-416`), landing in
  `acc.activityDiamondFontSize` -> `theme.colors.graph.diamondFontSize`.
- **Confidence**: High (grepped `src/core/` exhaustively for each key;
  confirmed the Java source via `FromSkinparamToStyle.java` and
  `StyleSignatureBasic.java`).

## Observation: activity action text has zero creole integration
- **Context**: Diagnosing the `[[url{tip}label]]` link-label family
  (`laxibe-66-teme800` etc.) and the table/`%n()` family
  (`activity-creole-table` etc.).
- **Finding**: `activity-renderer-text.ts#drawActivityText` draws its
  `content` argument as ONE literal `<text>` run with a single font
  config — it never calls into the shared creole scanner
  (`src/core/creole-atoms.ts#scanLineForAtoms`/`matchAtomAt`) at all. The
  jar splits `[[url{tip}label]]` into a separate `<a><text>` (the URL,
  underlined, blue) plus a plain trailing `<text>` for the label, and
  reserves real layout height for a `\n`-separated multi-line label
  (confirmed on `bazuma-86-metu353`: the WHOLE canvas height/below-diamond
  layout shifts by 44.944px, which only a layout-side line-count fix can
  produce — not a renderer-only change). Wiring any of this up crosses
  into `src/core/` creole code and, for the multiline-label case, into
  `layout/` (explicitly read-only per this task's own boundary). All 9
  creole/multiline rows were re-slotted rather than patched locally,
  per CLAUDE.md's "do not edit shared core modules" and this task's own
  "layout files read-only" boundary.
- **Impact**: A future task integrating activity text with
  `creole-atoms.ts` should expect to touch BOTH the renderer
  (`activity-renderer-text.ts`, multi-run `<text>`/`<a>` emission) and the
  box-sizing layout path (multi-line height reservation) in the same
  mission — splitting them further would re-create this task's
  re-slot boundary problem.
- **Confidence**: High (read `activity-renderer-text.ts` in full; ran the
  jar's own cached golden SVG for `laxibe-66-teme800` and diffed byte
  content directly).
