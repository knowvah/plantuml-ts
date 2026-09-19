# Batch 3 — route the remaining template sinks

Needs T3a (the seam escapes). Three tasks in parallel; each is "route
through `attrs()`, nothing else" (stop 6 if a sink needs more).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | 11 sinks in `svg-shapes.ts` (`:397/:403/:411`) and `svg-markers.ts` (`:132/:140/:156/:177-178/:197-199`) | typescript-pro | `src/core/svg-shapes.ts`, `src/core/svg-markers.ts` | T3a | [x] |
| T5a | 8 sinks in `diagrams/`: `class-shadow.ts:54,56`, `state-shadow.ts:62,64`, `board/renderer.ts:12`, `chart/renderer.ts:238`, `class-visibility-icon.ts:271`, `renderer-pseudostate.ts:135` | typescript-pro | those six files | T3a | [x] |
| T5b | 4 sinks in `core/annotations/coord-shift.ts:162-164` and `core/latex.ts:355` | typescript-pro | those two files | T3a | [x] |

Batch exit: `grep -rnE '[a-z:-]+="\$\{' src --include='*.ts'` is empty;
zero comparator diffs; gates green. Journal the count (39 → 0).
