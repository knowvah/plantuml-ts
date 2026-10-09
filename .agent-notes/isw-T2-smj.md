# isw-T2-smj report

## Commits (branch isw/T2-smj)
1. F2-state  fix: state runs draw trimmed width + leading-space shift
2. F3-state  fix: state text uses fixed tabSize 8
3. F4-mm     fix: mindmap multiline block keeps leading spaces
4. F5-json   fix: json empty cell is one space atom
5. SM        test: Smetana canvas allow-lists
6. S/P state test: state tests follow re-captured oracle
7. S/P mindmap test: mindmap tests follow re-captured oracle
8. refactor: state-run-placement.ts (500-line cap)

## Families
- F2-state: DriverTextSvg.java:113-126 + AtomText.java:222-231 -> new src/diagrams/state/state-run-placement.ts
  (`placeToken`, via core `driverTextPlacement`), carried as StateTextRun.drawDx/drawWidth
  (state-sizing-creole.ts expandRun/toRun); renderer-box.ts renderStateRuns emits x+drawDx and
  textLength drawWidth. renderer-composite-box.ts needed no change (it calls renderStateRuns).
  Owed cleared: coteta, gizati, votoki, duzazu, vixobo, fibudu, mazuzu, kinuca, xasoka (survey: conformant).
  Production change: every state run with leading spaces (descriptions, table cells, notes using runs)
  moves right by n*space and its textLength shrinks to the trimmed width.
- F3-state: Style.java:259-268 -> FontConfiguration.java:229-231 (tabSize 8); stateCreoleOpts ignores theme.tabSize.
  Owed cleared: lokija. Production change: `skinparam tabSize` no longer affects state text (jar ignores it; jar-verified
  on lokija with/without `skinparam tabSize 2`). state-dot-parity lokija green with no pin change.
- F4-mm: CommandMindMapOrgmodeMultiline.java:107-116 + CommandMultilines2.java:98-103 + BlocLines.java:271-283
  -> CommandMindMapOrgmodeMultiline.ts collectOrgmodeMultilineBlock: first line trimEnd only, middle lines raw,
  last line END group 1 of the raw string. The klimt draw path (driver-text-svg leadingSpaceAdjust) already shifts x;
  no change needed. Owed cleared: geketu, kijafe. Production: `**: text` multiline nodes keep leading spaces
  (node grows by n*space, text shifts).
- F5-json: StripeSimple.java:124-129 -> TextBlockJson.ts: all-empty atom list becomes [' '] (splitStripe('') yields ['']).
  Fix is inside TextBlockJson.ts, Fission.ts untouched. Owed cleared: cazuru, tacizo (+ jozapu, hcl-title-only, unwind-u1).
  Production: empty json/yaml cells (`{}`, `[]`, "") are 13.85 wide at 14pt instead of 10; valueLines hold ' '.
- SM: unwind2-s2b-jar.test.ts: SMETANA_CANVAS excludes svg/@width and svg/@viewBox[2] for the two Smetana-forced fixtures.
  json-family-structural.ts: per-fixture SMETANA_ROUNDED_CANVAS excludes `svg/g[1]/rect[1]/@width` for yaml/vapoda-87-piku740 only
  (rect[1] is the theme background there; in other fixtures it is a node and stays gated).
  Mechanism (verified in Java): Smetana rounds node width/height to whole points (gen/lib/common/shapes__c.java:253-254,
  1807-1808; Macro.java:1560-1562) -> 21.55 becomes 22: child x 5+22+37=64 (jar) vs 63.55 (ours).

## S/P tests updated (source of new value)
- state-sizing-creole: papifi 130.425 / textLength 110.425, mefici 182.4, xasoka 185.375 / 118.037, kubona 156.9375 / 54.513,
  rejike 154.4875, lokija 111.2625 (+ x 42.8/73.6, tab stop 8), kinuca 213.7375 + cell x 15.85/78.762/137.825 + rule x 200.737,
  juvagu 56.9187 + sup x 42.8: from test-results/dot-cache/state/<slug>/svek-N.dot and in.svg.
- state-composite-pass: nimana 52.65 / 77.1875 / 71.4187 (in.svg textLength 52.65/77.188/71.419).
- layout-ink-extent JAR_A.width 2.799514 (pacami svek-3.dot); lgm-T1d pesita AA '640.844,148,134,104.72' (in.svg);
  state-dot-flat gizati 0.903646in; state-note-layout fatupo 2.725781in (oracle/goldens svek-1.dot);
  state-json-sizing + transition-label-ink: float32 closeTo (P).
- mindmap-layout: all 6 cases re-probed with LayoutProbe (+DIM line) on oracle/dist jar, one JVM each (scratch copy of the probe
  with a DIM println; repo probe untouched); ours == jar exactly. finger-impl: fresh one-JVM jar render (24.637/27.787, link path).
  label-creole: tests/unit/mindmap/fixtures/trailing-space{,-root}.jar.svg re-rendered with scripts/oracle-render.sh.
  warnings-banner 302px / textLength 258.813 and render-plugin dezuza title x 177.45: from in.svg.
- unit/json/layout.test.ts (\r case): valueLines [' ',' '] per F5; nujuke-14-nabo073 rd = 0 vs new jar.

## Not done / orchestrator actions
- blankLine NBSP width 0 (state-sizing-creole.ts): left unchanged. No jar fixture proves a difference
  (gefefe-91-xoge233 0 diffs; box min width 50 hides it).
- mindmap.diff-baseline.ratchet still red for 3 rows:
  * femiba-70-duvi238 (7 -> 8) and fogari-75-febu345 (7 -> 10): error-page leading-space x shift, src/core/error/error-page-exact.ts:180-192
    (T2-core). Not touched.
  * susipa-95-tedu015: re-pin 318 -> 337 (jar renders a NPE crash page whose 20 stack lines have 2 leading spaces; ours a
    syntax-error page; +19 unfixable x diffs). Orchestrator: set mindmap.diff-baseline susipa to 337.
  fovule-12-noze408 is back to 40 (green, no re-pin).
- No pin/golden changes needed for: state.golden.ratchet, mindmap.golden.ratchet, json.golden.ratchet, state-dot-parity
  (all green as-is; goldens were already re-captured). svek size-backlog lokija entry (oracle/goldens/state/size-backlog.json)
  could be deleted if it is still listed (not checked; read-only).
- Observation (unverified, out of scope): CommandMultilines2.isValid returns OK_PARTIAL for any single line, so a one-line
  `**: text;` block upstream may keep consuming following lines; ours (collectOrgmodeMultilineBlock, firstEnd branch) treats it as complete.
- Pre-existing: src/diagrams/state/renderer-box.ts is 529 lines (>500), untouched net.

## Verification
- Surveys (own engines) vs b1-eng: state 273 (73 conformant), mindmap 142 (137), json 50, yaml 39: 0 losses; all 14 owed rows conformant.
- Green: tests/unit/{state,mindmap,json}, state-dot-parity, {state,mindmap,json}.golden.ratchet, json-family-structural,
  isw-measurer architecture, npm run typecheck, eslint.
