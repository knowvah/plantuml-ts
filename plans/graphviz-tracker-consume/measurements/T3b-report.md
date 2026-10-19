# T3b report (edge label UEmpty)
Commit fc7152f1a `fix(core): draw the edge label UEmpty so the document extent matches` (unsigned).
Files: src/core/svek/SvekEdge.ts (drawLabelBlock, :330-340), tests/unit/core/svek/svek-edge-label-uempty.test.ts (new, 5 tests).

## Diagnosis (from T3, re-checked against the Java)
- Mechanism: SvekEdge.java:372-373 `withMargin(block, marginLabel, marginLabel)` = TextBlockMarged; TextBlockMarged.java:81-87 drawU draws `UEmpty.create(dim)` (dim = text + (left+right, top+bottom)) only `if (dim.getWidth() > 0)`, then the text at (left, top). LimitFinder#drawEmpty (LimitFinder.java:~130-133) adds (x,y) and (x+w, y+h). Port drawLabelBlock added the margin to the text origin but drew no UEmpty.
- Self-loop: marginLabel = 6 when `startUid.equalsId(endUid)` (SvekEdge.java:372), already carried by the port's `margin`; UEmpty uses the same margin. Jar `a --> a : "m*22"` 354, ours 348 before (6 short), 354 after.
- Multi-line: UEmpty dim comes from the whole block's calculateDimension (widest line, all lines tall); jar `"m*18\nxx"` 242, ours 241 before, 242 after.
- The `> 0` guard is on the MARGED width (text + 2*margin), mirrored.
- Probes + oracles: /private/tmp/claude-501/gtc-T3b/o (vert 199, loop 354, multi 242, short 68, horiz 303 = jar; all equal ours after).

## Render-diff
xenusu-76-sabi405: 0/2 -> 0/0 (pass).

## Surveys (before -> after; /private/tmp/claude-501/gtc-T3b/*)
- component: 194/15/57 -> 198/11/57. Gains (structural-match -> conformant, width/viewBox +1): figika-36-sola271, nevuzi-33-duna992, revusu-28-pexi248, xenusu-76-sabi405.
- usecase: 63/4/26 -> 65/2/26. Gains: dopova-50-digo290, zilisi-99-rate911 (structural-match -> conformant).
- unknown: 495/16/314 -> unchanged. class 723/0/0 and object 63/8/9 unchanged.
- Movers that stay diverged (maxDelta only, first diff unchanged): the document width/height diff dropped from 1 to 0 on cudazo-20-silo903, golati-24-xika861, josoxo-49-taci997, kokodo-61-dano461, pemifo-35-kute324, rekisu-47-pesa949, vaseda-71-suje167, xozabi-42-pixa842 (their remaining first diffs are other mechanisms: arrow-tag stroke/FontColor/dasharray, label text fill). tatori-66-kaci883 and sprite-SVG-fill-management-3: 17 -> 16 (viewBox now 1 closer; childCount diff untouched).
- One mover away from the jar: usecase/kafexo-72-xupa679 maxDelta 161 -> 162. Its document is 328 wide vs 166 expected (a different, pre-existing mechanism: first diff is text/@textLength); the UEmpty adds the same +1 the jar adds, so this is the unrelated 161 px gap growing by the label's margin, not a regression of this change.
- Conformant losses: 0.

## Tests
`vitest run --maxWorkers=4 --testTimeout=60000 tests/unit tests/architecture tests/oracle/svg-conformance`: 1272 files collected, 26208 passed, 0 failed (includes the class, object, state and description golden ratchets: green). typecheck, eslint, prettier clean. No out-of-write-set test pins a closed residual; catalog unchanged (no export change).
