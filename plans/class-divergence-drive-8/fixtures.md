# Row ledger: cdd8

Seeded during planning (2026-10-11, main `84bd0c3f4`,
`render-all --tree all`; `S`/`N` = render-diff structural/numeric). T0a
re-measures every row into `measurements/b0.json` and corrects this table with a
journal row. T0a b0 (2026-10-11): all 20 verdicts and S/N match `b0.json` exactly;
no correction needed (journal row 1). The error-page-conformant rows are not listed: class luzive, sadamo
and zuduxu, and unknown petiku and rubebe.

`final` ∈ `fixed (<commit>)` · `accepted (D11.n)` · `open -> salt-engine-port` ·
`open -> <next mission>`.

## Rows

| tree/slug | verdict | S/N | family | mechanism (planning) | task | final |
|---|---|---|---|---|---|---|
| class/cadutu-02-lazu601 | diverged | 1/414 | elk | `!pragma layout elk` laid out by dot-engine; jar uses ELK 0.12.0 (`CucaDiagram.java:478-479`) | T0c, T3a | |
| class/cirojo-62-dubo306 | diverged | 19/257 | elk | same | T3a | |
| class/gokoru-18-daba136 | diverged | 19/257 | elk | same | T3a | |
| class/lagudi-03-rucu383 | diverged | 1/508 | elk | same | T3a | |
| class/rutefe-49-xeju709 | diverged | 1/168 | elk | same | T3a | |
| class/tegefa-14-koxo759 | diverged | 43/431 | elk | same | T3a | |
| class/temofi-63-vega763 | diverged | 1/414 | elk | same | T3a | |
| class/bixogo-47-xulu385 | structural-match | 0/49 | salt | legend `{{salt}}` renders our "unknown diagram type" box at 300×60 vs jar 111×90; acceptance "payload bytes" is FALSE (D8) | T0a | open -> salt-engine-port |
| class/roxosu-00-pini153 | structural-match | 0/49 | salt | same as bixogo | T0a | open -> salt-engine-port |
| class/nugecu-04-tona107 | structural-match | 0/23 | dot-engine A3 | flat labelled edge mirrored label side (graphviz-issues 23 `[~]`) | T0a | accepted (D11.1) |
| unknown/lubicu-73-fule059 | structural-match | 0/37 | salt | three `{{salt}}` slots; note seam `UNWIRED_NESTED_RENDERER` (cdd7 journal row 3) | — | open -> salt-engine-port |
| unknown/dezobu-62-vuzu421 | structural-match | 0/183 | archimate | `CommandArchimate.java:146-152` → `<<$archimate/icon>>` sprite stereotype; description engine draws the label instead | T1c | |
| unknown/sapofa-97-gizu737 | structural-match | 0/11 | latex | `<latex>` image 120×40 (latex.ts heuristic) vs jar JLaTeXMath 18×22 / 18×17 (`TeXIconBuilder.java:47-56`) | T1d | |
| unknown/vakovo-25-licu237 | structural-match | 0/131 | smetana | captured WITH `!pragma layout smetana` (oracleBlind); G0 re-capture | T0b | |
| unknown/fakone-16-boro774 | structural-match | 0/204 | smetana | same; accepted cdd7 D8, to be retired | T0b | |
| unknown/japode-92-famo984 | structural-match | 0/744 | smetana | same | T0b | |
| unknown/tikiti-02-bagu049 | structural-match | 0/177 | smetana | same | T0b | |
| unknown/xagomi-49-caki729 | structural-match | 0/12 | smetana | same | T0b | |
| unknown/gubeca-19-lemu434 | structural-match | 0/11 | smetana-yaml | nested `{{yaml}}` is JsonDiagram on the Smetana path (CLAUDE.md ruling) | — | accepted (cdd7 D8) |
| unknown/jixibu-01-xave465 | structural-match | 0/11 | smetana-yaml | same | — | accepted (cdd7 D8) |

## ELK fixtures outside the class tree (T3b, movers)

c4 ×1, component ×1, unknown ×1 (`grep -l -i 'pragma layout elk'
test-results/dot-cache/*/*/in.puml`). Recorded by T0a (2026-10-11):

| tree/slug | b0 verdict | task | final |
|---|---|---|---|
| c4/vakasu-51-xiza794 | (b0-eng/parity-c4.json) | T3b | |
| component/dirofi-81-cuga514 | (b0-eng/parity-component.json) | T3b | |
| unknown/foraba-98-sagi735 | (b0.json: not CLASS-routed) | T3b | |
