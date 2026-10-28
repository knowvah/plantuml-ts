# gdd family + fixture ledger

Seeded at planning (2026-10-27) from `plans/gantt-engine-port/fixtures.md`
("Open families after batch 8") with the mechanisms corrected by the planning
probes. Each close adds a counts row and updates the family table.

## Counts per checkpoint

| checkpoint | corpus rows | conformant | structural | diverged | errored | jar-error rows | goldens | authored (jar-equal / total) |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| gep b8 (= origin/main `01fe0c79b`) | 265 | 263 | 1 | 1 | 0 | 10 | 252 | 48 byte-equal + 3 error-page-rule (quirk-stereotype-then-as/-on, vega-gantt2: jar and port both reject, ruled-class diffs only) / 51 |
| gdd b0 close (`gdd/T0c` merged) | 265 | 263 | 1 | 1 | 0 | 10 | 252 | 49 byte-equal + 3 error-page-rule / 56; 4 new rows red by design (emoji-separator 23, emoji-note 23, title-hide-footbox 2, header-hide-footbox 2) |

## Families

| family (firstDiff) | rows | mechanism | owner | state |
|---|---:|---|---|---|
| `svg/g/path/@stroke` (transparent link) | xureco-57-lene839 | `driver-path-svg.ts:41-44` `paintsEqual` cannot equate the string `'none'` (`AbstractCommonUGraphic.ts:53`) with the transparent `HColorSimple`, so `DriverPathSvg.java:64-68`'s fast path never fires; 3 paths carry `style="stroke:none;"` (D1) | T1a | open |
| structural `svg/@height` +8 | xikovo-87-rosu902 | top chrome (title/header) + `hide footbox` loses the 8 px footer in the chrome seam; body byte-identical; origin to be pinned by T1b (D2) | T1b → T2a | open |
| emoji in separator names / note bodies | 0 corpus rows; authored `emoji-separator`, `emoji-note` | `TaskDrawSeparator.ts:124`, `AbstractTaskDraw.ts:279` build `new SpriteContainerEmpty()` without the injected emoji store; Java draws from a static registry (`Emoji.java:175-181`) (D3) | T0c → T1c | open |
| nakude "cannot last more than 20 years" | nakude-77-suji787 (conformant) | the jar prints the same message (`GanttDiagram.java:172-181`) under the Welcome block (`PSystemError.java:217-218`); diffs are attribute order + ruled classes (D4) | close 1 | to close, no code |
| mogafu "8 px on width" | mogafu-27-jeci360 (conformant) | error page both sides (`Bad argument for resource`, line 5); width differs only via the version-string line, a ruled class (D4) | close 1 | to close, no code |
| rule-conformant, unpinned | 11 (4 jar error pages, 7 signed accepted divergences incl. the clock row lituri-55) | none — conformant by the 2026-10-10 error-page rule / `accepted-divergences.json` | — | by design |

## Authored fixtures (T0c)

| slug | construct | expected jar | state |
|---|---|---|---|
| emoji-separator | `-- <:innocent:> Phase --` separator name | Twemoji 1f607 as vector `<path>`s (`Emoji.java:175-181` → `SvgSpriteParserFactory`; 5 paths), NOT an `<image>` — planning slip | oracle 147 px (T0c `1774f03f8`); ours `g[1]` childCount 45 vs 51 |
| emoji-note | `note bottom` body with `<:innocent:>` | Twemoji paths in the note (same mechanism; 5 emoji paths after the 2 note-box paths) | oracle 119 px (T0c); ours childCount 39 vs 45 |
| title-hide-footbox | `hide footbox` + `title Test` (xikovo's shape) | height 90 (probe) | oracle 90 (T0c); ours 82 (`svg/@height`, `@viewBox[3]`) |
| header-hide-footbox | `hide footbox` + `header H` | height 51 (probe) | oracle 51 (T0c); ours 43 |
| caption-hide-footbox | `hide footbox` + `caption Cap` (control, already equal) | height 49 (probe) | oracle 49 (T0c); ours 49, 0 diffs |
