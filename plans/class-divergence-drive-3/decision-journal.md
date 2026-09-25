# Decision journal — `class-divergence-drive-3`

Append-only. One row per decision, riser, flip, regroup, stop, or
push-forward call.

| # | When | Task | Decision / finding | Why / evidence |
|---|---|---|---|---|
| 1 | 2026-09-25 | T0 | Branch `feat/class-divergence-drive-3` cut from `origin/main` `e3afcd4a0` (upstream unset so no push can reach main). Oracle: `oracle/dist/plantuml-oracle.jar` -> `~/git/plantuml/build/libs/plantuml-1.2026.8beta1.jar`; `pin.json` plantumlVersion `1.2026.7beta11`, upstreamSha `11ed6720`. Four gates green; JSON reporter 818 files = 818 on disk | T0 steps 1, 2, 6 |
| 2 | 2026-09-25 | T0 | `b0.json` = 607/55/61; pin-diff vs `b-plan.json`: 0 transitions | T0 step 3 |
| 3 | 2026-09-25 | T0 | Engine baseline (D7) at `e3afcd4a0` in `/tmp/cdd3-b0-eng/` (copy committed at `measurements/b0-eng/`), c/s/d/err/to/oe: activity 0/4/369/0/0/0 · board 0/0/4 · c4 0/1/10 · chart 0/0/29 · chronology 0/0/1 · component 0/15/251 · ditaa 0/0/0/0/0/2 · dot 5/0/0 · ebnf 0/0/44 · files 0/0/1 · gantt 0/0/265 · hcl 1/2/0 · json 12/23/15 · mindmap 0/0/142 · network 0/0/3 · object 57/12/11 · packet 0/0/6 · regex 0/0/46 · salt 0/0/51 · sequence 0/0/1135/6 · state 71/14/188 · timing 0/0/126 · unknown 100/89/633/3 · usecase 2/2/89/0/0/1 · wbs 0/0/204 · wire 0/0/18 · yaml 7/28/4 | T0 step 4; diagnosis agents T1–T5 were reading concurrently (render-only, deterministic) |
| 4 | 2026-09-25 | T0 | `pin-goldens.mts` + test added (7 tests green incl. acceptance on a temp copy with real gatula files: golden cmp-equal, `fixtures[0]` unchanged, +1 goldens row per baseline). Validates everything before writing; refuses a twin not `agree`/`ok`. Two PRE-EXISTING tool tests are red: `render-diff.test.mts`/`render-all.test.mts` integration on canuti-20-jotu614 expect 9/3 diffs but canuti has been conformant since cdd1 — stale fixture choice, not a tool defect; left as-is (not in `npm test`), noted for close-out | T0 step 5 |
| 5 | 2026-09-25 | T0 | Push-forward: T1–T5 launched in the main checkout immediately after the gates (read-only, report-only write-sets) rather than after the T0 commit; T0 commit stages explicit paths only | parallelism; D4 |
