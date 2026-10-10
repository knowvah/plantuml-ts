# Fixture ledger (isw)

Numbers from lgm's final measurement (main `03f155ea7`, 2026-10-08). T0a re-takes
every one at b0; the b0 column is authoritative. b1 = after the instrument
change; `final` ∈ `exact`, `moved (<mechanism>)`, `library-forced (<experiment>)`.

## Instrument

| Probe | pre-b0 | b0 | b1 | final |
|---|---|---|---|---|
| `DeterministicMeasurer.measure(" ", 12pt)` | 0 | 0 | 3.3 | 3.3 (Math.fround(3.3)) |
| `"a b"` @12: ours / new-jar `textLength` | 13.35 / 13.35 (old jar) | 13.35 / 13.35 (old jar; @14 15.575 = "ab") | 16.65 / 16.65 (seam #4) | 16.65 / 16.65 |
| sampled oracle texts with spaces measuring space = 0 | 538/538 | 48829/48855 all cached in.svg runs with a space (0 match 44; 26 = jar float rounding, no space term) | 47920/47920 unscaled equal DeterministicMeasurer (557 scaled excluded; v2 seam) | 47920/47920 (exact) |
| production manifest changes | — | 4903 rows, 0 err (b0-prod.json) | 0 changes (b0 -> b1) | 1480 changed, all attributed (b2a-prod-attribution.md); b2 -> final 0 |

## The four lgm crash fixtures (D10)

| Fixture | Engine | pre-b0 | b0 | b1 | final |
|---|---|---|---|---|---|
| kovaxi-11-reti348 | usecase | jar crash page (nested), excluded | unchanged; zidebi non-deterministic solo (3 md5s) | real diagram, deterministic | exact: gated again (ORACLE_CRASH_FIXTURES removed), DOT parity green |
| zidebi-71-nocu387 | usecase | jar crash page (nested), excluded | unchanged; zidebi non-deterministic solo (3 md5s) | real diagram, deterministic | exact: gated again (ORACLE_CRASH_FIXTURES removed), DOT parity green |
| runima-82-jigi009 | activity | jar crash page, excluded | unchanged | real diagram, deterministic | exact: conformant, pinned in svg-activity ratchet |
| pixisi-38-kixa563 | activity | jar crash page, excluded | unchanged | real diagram, deterministic | exact: conformant, pinned in svg-activity ratchet |

## Survey totals (conformant / structural-match / diverged)

| Engine | pre-b0 (lgm final) | b0 | b1 | final |
|---|---|---|---|---|
| class | 710/3/10 | 710/3/10 | 670/38/15 | 710/3/10 |
| object | 63/8/9 | 63/8/9 | 61/9/10 | 63/8/9 |
| state | 73/12/188 | 73/12/188 | 63/13/197 | 73/12/188 |
| component | 67/65/134 | 67/65/134 | 67/66/133 | 67/66/133 |
| usecase | 29/18/46 | 29/18/46 (+1 oracle-error) | 29/18/46 | 29/18/46 |
| unknown | 365/54/406 | 365/54/406 | 340/66/419 | 371/54/400 |
| activity | (b0) | 415/1/35 | 90/23/338 | 433/1/17 |
| mindmap | (b0) | 137/1/4 | 135/3/4 | 137/2/3 |
| sequence Σ ws | 304703 | 304703 (1128 scored, 13 refused) | 329854 | 150933 (all 1141 ≤ b0 pin) |

## Reveal families (filled at T1b; one row per family, never deleted)

| Family | Diff-path signature | Fixtures | Mechanism (Java file:line) | Fix task | final |
|---|---|---|---|---|---|
| F1 own measurer | text widths short by n × space (activity 213, sequence inert) | activity 213 + unknown ACTIVITY rows | upstream `ug.getStringBounder()` (Swimlanes.java:239,246; FtileFactoryDelegator.java:223-225) | T2-act, T2-seq, T2b-seq | exact |
| F2 leading/trailing space | text x short by leading spaces; textLength = untrimmed | sequence 123, class 41, state 9, activity 34 (parser trims), core error pages | DriverTextSvg.java:114-126; CommandCase.java:76,87 et al. | T2-core (`driverTextPlacement`), T2-seq, T2-cls, T2-smj, T2-act | exact |
| F3-act trailing special swimlane | band/canvas +2.475 @18pt | activity 80 | Swimlanes.java:116-123,363,436-449 | T2-act | exact |
| F3-seq divider greedy label | divider box one space narrow | sequence 29 | CommandDivider.java:57-62 | T2-seq | exact |
| F3-cls note bodies trimmed | note width misses interior/trailing spaces | class 6 + description | BlocLines.java:234-248 removeEmptyColumns | T2-cls | exact |
| F3-state tabSize | state tab stop 7.7 vs 30.8 | state 1 | Style.java:259-268 → FontConfiguration.java:229-231 | T2-smj | exact |
| F4 ref / description label / mindmap multiline | parser trims | sequence 2, component 1, mindmap 2 | CommandReferenceOverSeveral, CommandMindMapOrgmodeMultiline.java:107-116 | T2-seq, T2-cls, T2-smj | exact |
| F5 wrapWidth / json empty cell / autonumber span | unwrapped text; empty cell 10 vs 13.85; span misses number | activity 4, json 2, sequence 7 | style.wrapWidth() callers; StripeSimple.java:124-129; Display.java:703-712 | T2-act, T2-smj, T2-seq | exact |
| F7 multiline element dedent / creole table split | trimSmart; `\\n` in table cell | class 1, activity 2 | CommandCreateElementMultilines.java:169; Display.getWithNewlines | T2-cls, T2-act | exact |
| F2g error/welcome pages | " "+getError line x | unknown 2, timing 126 (prod only), mindmap 2 | DriverTextSvg.java:118-124 | T2-core | exact |
| seam-crash (instrument) | jar crash page `Direction.java:128` | activity 3 (cemagu, nerete, rosepa) | Snake.java:299-300 vs Direction.java:118-128 | seam #4 v2 (fround, U+0021) | exact |
| residue 2b/2c | swimlaneWrapTitleWidth, `activityDiagram{}`, note padding, object `<style>`, stereotype padding, scale rounding | activity 2, unknown 4, sequence 1 (mezaxa), object 1 (lisepi) | SkinParam.java:980-984; Context.java:68-139; NoteTile.java:289-296; EntityImageObject.java:93-158; Guillemet.java:87-100; SvgGraphics.java:468-475 | T2b-*, T2c-* | exact (susipa re-pinned by ruling) |
