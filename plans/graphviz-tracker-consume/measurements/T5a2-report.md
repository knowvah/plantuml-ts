# T5a2 report

Commit: see `git log -1` (fix(core): align edge label lines by defaultTextAlignment and \l \r), unsigned.
Files: src/core/svek/SvekEdge.ts, src/diagrams/description/renderer-edge.ts,
tests/unit/description/{gtc-t5a2-label-alignment.test.ts (new), gtc-t5a-ortho-label-lines.test.ts (x unmasked)}.
link-edge-attrs.ts not needed.

## Java quoted
- SvekEdge.java:376-381: `getMessageTextAlignment(diagramType, skinParam)`: STATE -> `stateMessageAlignment`; else
  `return skinParam.getDefaultTextAlignment(HorizontalAlignment.CENTER);` used at :285 `create0(font, alignment, ...)`.
- Display.java:648-649 (`create0`): `if (getNaturalHorizontalAlignment() != null) horizontalAlignment = getNaturalHorizontalAlignment();`
  (natural set by `\l`/`\r`, Display.java:288-300).

## Diagnosis
- Mechanism: `SvekEdge.ts#drawLabelBlock` (was :336) built the block with a literal `HorizontalAlignment.CENTER` and dropped
  `splitDisplayLines(...).align`, so neither `defaultTextAlignment` nor a `\l`/`\r` marker ever reached the label block. In xagonu the
  `\r` links' blank first line sat centred (x 64.959) instead of right (116.919).
- Fix: `parseWithNewlines(...).naturalHorizontalAlignment ?? input.labelAlignment ?? CENTER`; new `SvekEdgeInput.labelAlignment`,
  passed by description `renderer-edge.ts` from `theme.colors.elements.root.horizontalAlignment` (the root bucket
  `skinparam defaultTextAlignment` fills, as for cluster titles). State is not passed (its own `stateMessageAlignment`), class not
  passed: unchanged default CENTER. Markers now apply in all engines that use drawLabelBlock, as in Java.
- Ruled out: layout (labels' table/centre unchanged), the split (T5a).

## Jar probes (scripts/oracle-render.sh, /private/tmp/claude-501/gtc-T5a2/p/v*.puml; x of "ab" in a 38.35 wide block)
centre 43.834; defaultTextAlignment right 55.777; left 31.89; `\r` alone 55.777; `\l` alone 31.89; `\l` + right skinparam 31.89;
`\r` + left skinparam 55.777; ortho + right 30.887 (defghij at 7). All pass in the new test (8 cases).

## Verification
- xagonu-36-sudi116 render-diff: 30/170 -> 30/165; the four g[26..29] `text[1]/@x` diffs cleared. Remaining 30 structural / 165 numeric
  are T5b's (link draw order g[37..39], g[45..47]; ortho routing g[30] etc.).
- Surveys (/private/tmp/claude-501/gtc-T5a2/<tree>-{before,after}.json; unknown before = T5a's after, identical code, because the
  unknown before-run overlapped my first edit): component 204/12/50, usecase 65/3/25 (+1 oracle-error), unknown 496/16/313,
  all unchanged. No movers, no losses.
- Tests: tests/unit/description, tests/unit/core, tests/architecture, description.* ratchets, class/object/state golden ratchets,
  `--testTimeout=60000 --maxWorkers=4`: 490 files collected, 490 passed (9030 tests). typecheck, eslint, prettier clean.
