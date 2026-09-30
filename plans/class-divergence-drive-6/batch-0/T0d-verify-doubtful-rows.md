# T0d: verify the doubtful rows (D1)

You are diagnosing, not fixing. Return only the structured report: one line per
row `tree/slug · verdict (VERIFIED | AMENDED | open -> cdd7) · owner task`.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML (Java spec at
`~/git/plantuml`, branch `dot-output`, upstream `97a5992`); read `CLAUDE.md` first
("READ THE JAVA FIRST", "Never fit a value"). cdd5 diagnosed every row; these carry
MEDIUM confidence, "not isolated", or a dot-engine attribution without proof
(mechanisms in `plans/class-divergence-drive-5/fixtures.md` and journal rows 62–87):

| rows | cdd5 claim | what to verify |
|---|---|---|
| unknown/bizasu-70-vaxa243, meramo-02-vasu175, momada-03-zeka599 | json canvas width Δ1 "dot-engine bb vs real dot" | run real `dot -Tdot` on OUR emitted DOT and on the cached `svek-1.dot`; compare bb; name the owner |
| unknown/zasuxe-15-lugo662 | node order inside cluster `abc` | feed our DOT to real dot; is the order ours or dot-engine's? |
| unknown/rojida-14-fuli428 | (+3,+1) whole-diagram shift | isolate the origin |
| unknown/beboke-62-zofu377, febuli-89-dusi249, fezaro-08-nopo877 | empty `usymbol { }` container ink, path not diagnosed | which builder draws them, and where the ink diverges |
| unknown/xuloxo-85-vibu502 (+ c4/gikaju-64-bari602) | C4 `$bl()` lines collected unsplit (`BlockUml.java:153`) | confirm with the jar's preprocessed text |
| unknown/miveni-*, rivino-*, soseka-* | mainframe svek not normalized (L) | confirm `SvekResult.java:130-135` moveDelta is the whole story |
| unknown/josebu-55-seje426, tefeco-12-rato895 | nested sequence queue sprite as text; nested description note not opale | name the exact port line in each nested engine |

## Task
For each row: `render-diff.mts <tree/slug>`, read the Java method and the port line,
instrument in a scratch copy if unsure (never committed), and state the mechanism
with Java `file:line` + port `file:line`, confidence, and the cdd6 task that should
own the fix (from the batch overviews; propose a write-set if it is new). Before
naming dot-engine, real `dot` output must support it (memory:
dot-engine-blame-needs-real-dot); a verified dot-engine finding also gets a draft
`docs/graphviz-issues/` text in your file (the orchestrator files it).

## Write-set
`plans/class-divergence-drive-6/diagnosis/verify.md` only. Never edit `src/`, tests,
`fixtures.md`, or git state. No Serena edit tools.

## Acceptance
- Given each row, then `verify.md` has a verified or amended mechanism with both
  `file:line`s, or `open -> cdd7` with what to instrument next.
- Given any dot-engine attribution, then it quotes the real-`dot` evidence.

**Observability:** N/A. **Rollback:** Reversible (deletable file).
