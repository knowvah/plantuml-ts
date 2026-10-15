# T1c report (orchestrator transcription of the agent hand-back; the worktree file was a stub)

Commit 5649aeccb `fix(core): resolve description entity fill/stroke like the jar` (base a80812e21).
Core: build-theme, skinparam-key-handlers{,-shared,-table-a}, style-map-element, theme-element-resolve,
theme-graph-colors. Description: renderer-entity.ts (499 lines). Tests: entity-colour-precedence (12),
element-stereotype-paint-codd-t1c (11), helper tests/helpers/entity-paint.ts; skinparam(.|-mode-dark).test.ts
updated (pinned a bare `bordercolor`). docs/catalog.md regenerated. .agent-notes/codd-T1c.md (3 obs).

All 13 rows + levuxi, dosixi, xubabi render-diff 0/0 (before: cukafa 1, kagapo 1, lobute 1, somugi 1,
suzemi 1, gocexi 2, rapaji 3, diduxa 10, gafegu 8, kucabo 4, lovapo 8, malado 2, zozutu 4, levuxi 1,
dosixi 1, xubabi 1 structural).

- **M1 stereotype tier not consulted** (lobute, suzemi, somugi, zozutu, kagapo, kucabo, lovapo, dosixi,
  xubabi). Java `EntityImageDescription.java:152-166`, `FromSkinparamToStyle.java:292-302,396-410`,
  `Context.java:62-92`, `StyleSignatureBasic.java:226-235`. Port `renderer-entity.ts:247-253`,
  `theme-element-resolve.ts#resolveElementPaint`, `style-map-element.ts#collectTagStyle`. Fix: stereotype
  tier in resolveElementPaint (last matching label wins; SName bucket beats SName-less `'*'` bucket);
  collectTagStyle fills backgroundColorByStereo/borderByStereo; bare `.tag` → `ANY_ELEMENT_BUCKET` `'*'`;
  tags compared cleaned keeping spaces (kucabo/lovapo jar: `<<static lib>>` matches `.static lib`).
- **M2 dedicated handlers shadow bucket** (cukafa, diduxa, malado, levuxi). Java `FromSkinparamToStyle.java:251-261`.
  Port `skinparam-key-handlers-table-b.ts` via `applyNormalKey`. Fix: `BUCKET_TOO_KEYS` =
  interfacebackgroundcolor, actorbordercolor (also write the bucket). Ruled out: all ten overlapping keys
  (broke the cdd6 `packageBackgroundColor` no-bucket pin).
- **M3 bare `skinparam borderColor` honoured** (diduxa). Java: only `<cleanName>BorderColor`
  (`FromSkinparamToStyle.java:273`), no `ColorParam.border`. Fix: root cascade uses internal key
  `ROOT_LINE_COLOR_KEY = 'root linecolor'`; a user's bare `borderColor` → `unknown[]`.
- **M4 ports ignored inline colours and `port` style** (gocexi, rapaji, gafegu). Java `EntityImagePort.java:61-64,121-140`.
  Fix: drawPortFallback inline override first, then resolveElementPaint(…'port'…, stereotypes); `port`
  admitted to `<style>` routing only (CLUSTER_BUCKET_SNAMES); skinparam portBackgroundColor stays out.

Surveys (base = dsw b5-eng, b0-eng not yet written for these trees): 0 conformant losses.
component 19 movers (17 → conformant incl. betidu-24-xuku720, juvucu-92-bugo434, ponare-43-kazu160 by M1,
levuxi by M2; cojege-69-ruku138, romuco-28-zafo015 → structural-match, residual link-label `use` x+10 y−3.6 =
text-xy family). usecase: kofuca-08-pafi749 → conformant, fariba-82-xolu802 → structural-match (text x
body alignment residual), both M1 via AWSCommon.puml `skinparam rectangle<<stereo>>`. class/object/state 0.

D5 guards green: 8 files, 3641 tests. Full vitest at the commit: 1376 collected, 30144 passed, 4 failed
(npm-pack packaging, worktree-only).

Residuals: port `data-qualified-name` jar `comp.p80` vs ours `p80` (compareSvg ignores it); note/package/
activity/swimlane dedicated handlers not touched (unprobed); SName-first vs last-registered order for
overlapping `.tag` (no fixture); `<sname> { .tag }` now populates ByStereo for class/sequence readers too
(five surveys unchanged).
