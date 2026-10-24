# T2f — `CommandCreoleSvgAttributeChange`: `<text class=… id=…>` reaches the `<text>`

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2f`. Commit:
`feat(creole): port CommandCreoleSvgAttributeChange and SvgAttributes`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (stops 4, 13). Runs after T2a and T2c
(it extends the same `<text>` emission path; stop 1 if their closed files
must change again).

## Mechanism (sdd2: `creole-svg-attribute-unported`; Java re-read)
`CommandCreoleBuilder` registers `CommandCreoleSvgAttributeChange.create()`
behind `SecurityUtils.allowSvgText()` (`klimt/creole/legacy/CommandCreoleBuilder
.java:119-122`; `SecurityUtils.java:258-260` returns `true`), a command with
starter `<t`, patterns `^(<text[\s:]+([^>]+)/?>(.*?)</text>)` and its EOL
twin (`command/CommandCreoleSvgAttributeChange.java:51-58`;
`Splitter.svgAttributePattern`, ported at `command/Splitter.ts:44`).
`executeAndAdvance` runs `fc.changeAttributes(SvgAttributes.build(group 2))`,
recurses on group 3, restores the font (`:84-97`). `SvgAttributes.build`
parses `(\w+)\s*=\s*("[^"]*"|\w+)` into a sorted map
(`klimt/SvgAttributes.java:63-73`); `FontConfiguration#changeAttributes`
merges it (`FontConfiguration.java:248-251`), `DriverTextSvg` passes
`fontConfiguration.getAttributes()` (`DriverTextSvg.java:178-180`) and
`SvgGraphics#text` writes every entry on the `<text>`
(`SvgGraphics.java:737-738`). Ours: none of it exists — the tag is drawn
literally (`CommandCreoleBuilder.ts:164` registers url last; `SvgAttributes`
is only mentioned in `abel/FontConfiguration.ts:24`). Port, in order:
`klimt/SvgAttributes.ts`; `command/CommandCreoleSvgAttributeChange.ts` (both
patterns, `starters: ['<t']`); the registration in `legacy/CommandCreoleBuilder
.ts` right after url (Java order, `:121-122`); the attribute field on the
creole font type (`klimt/shape/UText.ts` `FontConfiguration`) with
`changeAttributes`; then trace the attributes through the sequence text path
to the emitted `<text>` (`sequence-creole-sheet.ts` recorder ->
`text-block-geo.ts` `TextRun` -> `sequence-text.ts` -> the text emitter's
`TextStyle`). Every hop past the first four files is listed in the hand-back;
a file this spec does not name and that another task owns is stop 1.

## Targets
cizeja-06-zedi526 (18 units): `<text class=foo id=dummy>message</text>`.

## Write-set
New `src/core/klimt/SvgAttributes.ts`,
`src/core/klimt/creole/command/CommandCreoleSvgAttributeChange.ts`; edits to
`legacy/CommandCreoleBuilder.ts`, `src/core/klimt/shape/UText.ts`,
`src/core/abel/FontConfiguration.ts` (only if it must carry the field), and
the text-attribute chain: `sequence/sequence-creole-sheet.ts`,
`text-block-geo.ts`, `sequence-text.ts`, and `src/core/svg-shapes*.ts`
`text()` (post-T0b file) / `svg.ts` `TextStyle` — all free of other
tasks only because T2f depends on T2a and T2c. New src modules: `npm run
catalog`.

## Read-set
`command/CommandCreoleUrl.ts` (a sibling command's shape),
`legacy/CommandCreoleBuilder.ts:60-70,150-170`, `command/Command.ts:20-70`,
`shape/UText.ts:85-130`; Java: `CommandCreoleSvgAttributeChange.java:46-97`,
`SvgAttributes.java:44-100`, `FontConfiguration.java:240-256`,
`SvgGraphics.java:730-740`, `Splitter.java:57-60`.

## Acceptance
- Given `<text class=foo id=dummy>m</text>`, when a label is built, then the
  run is `m` and its `<text>` carries `class="foo" id="dummy"` in key order
  (TreeMap), the tag is not drawn; nested creole inside group 3 still works.
- Given cizeja, then it diffs to 0; no other diagram's `<text>` changes.
- Given the all-engine survey, then no conformant loss and every non-sequence
  mover explained row by row (expected: none unless a corpus uses `<text …>`).
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
