# b0-8beta1: non-class engines under the 8beta1 re-pin (D2)

Every T0b->T0d verdict and dotEqual transition, from `diff-<engine>.txt` (pin-diff).
Movers are counted over verdict + dotEqual only (the survey's gating fields).

| engine | fixtures | cache in.svg changed | verdict/dotEqual movers | gains | losses | classification |
|---|---|---|---|---|---|---|
| activity | 373 | 17 | 0 | 0 | 0 | none needed |
| board | 4 | 0 | 0 | 0 | 0 | none needed |
| c4 | 11 | 0 | 0 | 0 | 0 | none needed |
| chart | 29 | 0 | 0 | 0 | 0 | none needed |
| chronology | 1 | 0 | 0 | 0 | 0 | none needed |
| component | 266 | 0 | 0 | 0 | 0 | none needed |
| ditaa | 2 | 0 | 0 | 0 | 0 | none needed |
| dot | 5 | 5 | 0 | 0 | 0 | none needed |
| ebnf | 44 | 0 | 0 | 0 | 0 | none needed |
| files | 1 | 0 | 0 | 0 | 0 | none needed |
| gantt | 265 | 2 | 0 | 0 | 0 | none needed |
| hcl | 3 | 0 | 0 | 0 | 0 | none needed |
| json | 50 | 0 | 0 | 0 | 0 | none needed |
| mindmap | 142 | 1 | 0 | 0 | 0 | none needed |
| network | 3 | 0 | 0 | 0 | 0 | none needed |
| object | 80 | 0 | 0 | 0 | 0 | none needed |
| packet | 6 | 0 | 0 | 0 | 0 | none needed |
| regex | 46 | 1 | 0 | 0 | 0 | none needed |
| salt | 51 | 1 | 0 | 0 | 0 | none needed |
| sequence | 1141 | 32 | 0 | 0 | 0 | none needed |
| state | 273 | 2 | 0 | 0 | 0 | none needed |
| timing | 126 | 0 | 0 | 0 | 0 | none needed |
| unknown | 825 | 18 | 0 | 0 | 0 | none needed |
| usecase | 94 | 2 | 0 | 0 | 0 | none needed |
| wbs | 204 | 7 | 0 | 0 | 0 | none needed |
| wire | 18 | 0 | 0 | 0 | 0 | none needed |
| yaml | 39 | 0 | 0 | 0 | 0 | none needed |

## Notes

- No non-class engine has a verdict or dotEqual mover. Every changed oracle was already non-conformant
  on both sides, or (dot) changed only in the host graphviz banner comment
  (`15.1.0 (20260618.0150)` -> `16.1.0 (20260904.0139)`), which compare.ts does not read.
- The changed-oracle counts (93 cache files in total) are upstream movement on already-diverged fixtures;
  they are not classified individually because D2 classifies movers, and there are none.
