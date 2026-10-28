# gdd family + fixture ledger

Seeded at planning (2026-10-27) from `plans/gantt-engine-port/fixtures.md`
("Open families after batch 8") with the mechanisms corrected by the planning
probes. Each close adds a counts row and updates the family table.

## Counts per checkpoint

| checkpoint | corpus rows | conformant | structural | diverged | errored | jar-error rows | goldens | authored (jar-equal / total) |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| gep b8 (= origin/main `01fe0c79b`) | 265 | 263 | 1 | 1 | 0 | 10 | 252 | 48 byte-equal + 3 error-page-rule (quirk-stereotype-then-as/-on, vega-gantt2: jar and port both reject, ruled-class diffs only) / 51 |
| gdd b0 close (`gdd/T0c` merged) | 265 | 263 | 1 | 1 | 0 | 10 | 252 | 49 byte-equal + 3 error-page-rule / 56; 4 new rows red by design (emoji-separator 23, emoji-note 23, title-hide-footbox 2, header-hide-footbox 2) |
| gdd b1 close (T1a–T1d merged; pins) | 265 | 264 | 1 | 0 | 0 | 10 | 253 | 51 byte-equal + 3 error-page-rule / 56; 2 rows red (title-hide-footbox 2, header-hide-footbox 2 → T2a); chain b1-eng: 0 losses in 27 engines, 1 mover (xureco diverged → conformant) |

## Families

| family (firstDiff) | rows | mechanism | owner | state |
|---|---:|---|---|---|
| `svg/g/path/@stroke` (transparent link) | xureco-57-lene839 | `driver-path-svg.ts:41-44` `paintsEqual` cannot equate the string `'none'` (`AbstractCommonUGraphic.ts:53`) with the transparent `HColorSimple`, so `DriverPathSvg.java:64-68`'s fast path never fires; 3 paths carry `style="stroke:none;"` (D1) | T1a | CLOSED b1 — `800243227` (gdd/T1a `c621a34f0`): `paintsEqual` equates `'none'` ↔ `isTransparent()` both orders (`HColors.java:133-135`, `XColor.java:91-98`); 3 → 0 diffs; pinned (golden 253) |
| structural `svg/@height` +8 | xikovo-87-rosu902 | T1b (`diagnosis/xikovo.md`, `fe003d477`): the 8 px is day-separator INK (`TimeHeaderSimple.java:145-146` `dy(6)` + `vline(h + 2)`) drawn below the body's dimension; the jar's canvas is `SvgGraphics` `ensureVisible` over every primitive (`:129-134, 620-621, 810-813`), ours sizes the `exportMargin` arm from the stacked dimension alone (`TextBlockExporter.ts:326-327`); a caption stacks 17 px below and covers it (D2, amended) | T2a | open — origin in core; proposed contract change touches the public d.ts (journal row 12) |
| emoji in separator names / note bodies | 0 corpus rows; authored `emoji-separator`, `emoji-note` | `TaskDrawSeparator.ts:124`, `AbstractTaskDraw.ts:279` build `new SpriteContainerEmpty()` without the injected emoji store; Java draws from a static registry (`Emoji.java:175-193`, vector paths via `SvgSpriteParserFactory`) (D3) | T0c → T1c | CLOSED b1 — `32398c121` (gdd/T1c `6131ec959`): both sites take the store (`emojiStoreOf(#skinParam)`, `getEmojiStore()`); authored rows 23 → 0, store-less output byte-identical |
| nakude "cannot last more than 20 years" | nakude-77-suji787 (conformant) | the jar prints the same message (`GanttDiagram.java:172-181` `checkFinalError`) under the Welcome block (`PSystemError.java:217-218`); diff-one at b0 close: 5 diffs, all ruled — `text[18]` version string + its `@textLength` (319.2 vs 371.25), `text[19]` `[From string (line 2) ]` vs `[From in.puml (line 2) ]` + `@textLength`, `rect[3]/@width` (the box around that line). Canvas 532×284 both sides (D4) | close 1 | CLOSED b1 — conformant by the 2026-10-10 error-page rule; no code, no pin, no accepted-divergence entry |
| mogafu "8 px on width" | mogafu-27-jeci360 (conformant) | error page both sides (`Bad argument for resource`, line 5); diff-one at b0 close: 6 diffs, all ruled — `svg/@width` + `@viewBox[2]` 376 vs 384 follow `text[1]` version string `@textLength` 319.2 vs 371.25; `text[2]` `[From string (line 5) ]` vs `[From in.puml (line 5) ]` + `@textLength` (D4) | close 1 | CLOSED b1 — conformant by the 2026-10-10 error-page rule; no code, no pin, no accepted-divergence entry |
| rule-conformant, unpinned | 11 — all stock jar error pages we also error on (`stock-error-pages.json` `gantt/*`; the 10 gantt `accepted-divergences.json` entries were RETIRED 2026-10-26 when the engine landed, `.entries` has 0 gantt ids — journal row 7) | none — conformant by the 2026-10-10 error-page rule; `pin-gantt.mts` refuses them since T1d | — | by design |

## Authored fixtures (T0c)

| slug | construct | expected jar | state |
|---|---|---|---|
| emoji-separator | `-- <:innocent:> Phase --` separator name | Twemoji 1f607 as vector `<path>`s (`Emoji.java:175-181` → `SvgSpriteParserFactory`; 5 paths), NOT an `<image>` — planning slip | oracle 147 px (T0c `1774f03f8`); ours `g[1]` childCount 45 vs 51 |
| emoji-note | `note bottom` body with `<:innocent:>` | Twemoji paths in the note (same mechanism; 5 emoji paths after the 2 note-box paths) | oracle 119 px (T0c); ours childCount 39 vs 45 |
| title-hide-footbox | `hide footbox` + `title Test` (xikovo's shape) | height 90 (probe) | oracle 90 (T0c); ours 82 (`svg/@height`, `@viewBox[3]`) |
| header-hide-footbox | `hide footbox` + `header H` | height 51 (probe) | oracle 51 (T0c); ours 43 |
| caption-hide-footbox | `hide footbox` + `caption Cap` (control, already equal) | height 49 (probe) | oracle 49 (T0c); ours 49, 0 diffs |
