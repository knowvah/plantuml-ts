# T4b — M3: an empty container's engine size is `calculateDimension`

Agent: `typescript-pro` (sonnet, effort high), worktree `jfp-T4b`. Commit:
`fix(json): size empty containers for the engine as upstream does (T4b)`. Read
[../task-contract.md](../task-contract.md), [../decisions.md](../decisions.md)
(incl. amendments) and `../diagnosis/json-large.md` "M3 — empty-container-size".

## The mechanism (T1b, verified at the B1 close)
Jar: the engine is given `TextBlockJson#calculateDimension` — width
`getWidthColA + getWidthColB` (0 for `[]`/`{}`), height `getTotalHeight`
(`TextBlockJson.java:237-240`); `MIN_WIDTH` exists only at draw time
(`:278-279`, `if (trueWidth == 0) trueWidth = MIN_WIDTH`). `createNode` swaps
width/height (`SmetanaForJson.java:243-244`) and sets **no label** when the node
has no lines (`:253-254`, `if (size > 0) agsafeset(… "label" …)`).
Ours: `TextBlockJson.ts:467` folds `JSON_CELL_MIN_WIDTH` into `totalWidth`;
`json/layout.ts:304` sends it (30) as the engine height; `record-label.ts:58`
sends an explicit empty label `''`. Engine node: jar 15×17, ours 19.75×31.

Ruled at the B1 close: the DECLARED-size half is port-controlled; the label
half's (0,16) is Smetana's `\N` "WE CHEAT" sizing (`labels__c.java:119-122`) —
Smetana arithmetic, not a target. Mirror upstream's STRUCTURE (no label attr
when empty; the engine then sizes the default label however dot-engine does)
and accept the engine's answer.

## Task
1. Keep `MIN_WIDTH` as a draw-time width only (the drawn box is unchanged);
   expose the `calculateDimension` width separately for the engine. Preserve
   upstream names (`calculateDimension`, `MIN_WIDTH`); `@see` the Java.
2. `layout.ts`: declare the engine size from `calculateDimension`.
3. `record-label.ts` / the node builder: no `label` attribute when the node has
   no lines, as `SmetanaForJson.java:253-254`. If our builder cannot express
   "no label" without a `src/core/` change, that is stop 7 — halt and report.
4. Tests first (cited Java values). Measure all 12 rows (debako dometa kicati
   letada sevaji vogeku jidata zasitu bogiku cilemo kidoki nopoku) and every
   other cached row.

## Write-set
`src/diagrams/json/{TextBlockJson.ts,layout.ts,record-label.ts,json-node-position.ts}`,
`tests/unit/json/{empty-container-size.test.ts,record-label.test.ts,TextBlockJson.test.ts}`.

## Acceptance
- Drawn output for every node unchanged in SIZE (rect width/height, text) — only placement may move.
- For the 12 rows: report residue before/after. **Any row whose positional residue RISES is stop 4: do not commit a workaround** — hand back the measured numbers and the mechanism (e.g. dot-engine sizing the default `\N` label wider than Smetana's (0,16)); the orchestrator decides.
- Rows without an empty container byte-identical; 14/7/1 pins, structural + positional gates green.
- `extended-baseline.mts --check`: every mover listed with its mechanism.
