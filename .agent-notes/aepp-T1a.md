# aepp-T1a report

## Commits
One commit: feat(oracle): stock-jar verifier and stock-error-pages record

## Java -> ours
- Stock error signal: exit 200. cli/ExitStatus.java:43 (ERROR_200_SOME_DIAGRAMS_HAVE_ERROR),
  :104 getExitCode() returns it when hasErrors; set at Run.java:286 (checkError),
  Run.java:374 (crash image status via ExitStatus.isErrorStatus:56),
  SourceFileReaderAbstract.java:112-113 (PSystemError | PSystemUnsupported).
- Line + message: `-stdrpt:1` (CliFlag.java:226) -> StdrptV1.printInfo/out
  (status=ERROR, lineNumber= position+1, label= per ErrorUml), printed to
  stderr at Run.java:362. CHOSEN over `--check-syntax` (CliFlag.java:138-139):
  Run.java:347 returns right after updateStatus, before any printInfo, so
  check-syntax gives exit code only, no line/message. Message is the stock
  label verbatim, so it may carry " (Assumed diagram type: activity)".
- `scripts/stock-jar-verify.sh` -> `scripts/lib/stock-jar-record.ts` (node strip-types).

## Rows before -> after
- Record: 112 stock errors of 115 candidates (pre-filter: in.svg matches
  "PlantUML version|An error has occurred|Syntax Error|[From "; broader than
  the 107 isJarErrorPage hits; verdict is the stock exit code only).
- Per bucket: unknown 37, wbs 28, activity 14, gantt 11, timing 6, state 4,
  mindmap 3, c4 2, class 2, regex 2, chronology 1, ebnf 1, salt 1.
- Activity: all 14 present, lines/messages match fixtures.md (messages are
  prefixes; 8 carry " (Assumed diagram type: activity)").
- 11 entries have `line: null, message: ''`: exit 200 but no status=ERROR
  stdrpt block (PSystemUnsupported "Diagram not supported" or crash image
  "has crashed"): chronology/lenudo-53-nade902, mindmap/susipa-95-tedu015,
  salt/lakari-33-mone874 (crash, ElementMenuBar:87), unknown/{gibapi-78-fote878,
  kijaro-77-vomi552,lonome-59-lego635,lulanu-89-tase004,micono-65-juka195,
  zugazo-84-raju675}, wbs/ledama-83-xoko366 (crash, SvgGraphics:1156),
  wbs/link-URL-tooltip-0. T2a: treat null line as "errors, no line".
- STOP 9 (oracle error page, stock DRAWS; NOT in record): class/zuduxu-90-kosi876,
  unknown/jadavu-33-cono513, unknown/rubebe-45-sura795 (stock exit 0).
- Re-run with no pin change: record byte-identical (cmp). Stale-SHA test
  fails naming scripts/stock-jar-verify.sh (verified). Stock jar built from
  git archive 97a5992 (fork untouched), seam strings absent, cached at
  oracle/dist/stock/plantuml-stock-97a5992....jar (gitignored; via symlink into main).
- Run takes ~52s at STOCK_JOBS=4.

## Survey/census movers
None (no src/ edit; src/core untouched).

## Not done / notes
- Planning counted 109 error fixtures; pre-filter finds 115 candidates / 112
  errors / 3 draws; differing candidate definitions, not a contradiction.
- Quality gates run: stock-error-pages test 17/17, typecheck, eslint touched. Not run: npm test/build.

## Resume: oracle-widths provenance (user ruling 2026-10-10)
- Script now runs every stock-DRAWS fixture on the oracle jar twice (no -D;
  only -DPLANTUML_DETERMINISTIC_TEXT=true). Exit 0 then 200 => recorded with
  `provenance: 'oracle-widths'`, line/message from the det run's -stdrpt:1
  (both null/'' : crash page). Stock-signal rows carry NO provenance field
  (absent = 'stock'); chosen so the 112 prior rows stay byte-identical.
- Added: class/zuduxu-90-kosi876, unknown/rubebe-45-sura795. Record now 114.
- Not written (stop 9 list): unknown/jadavu-33-cono513 stock=0, oracle-noD=0,
  oracle-det=0 -- a drawn class diagram with "PlantUML version" footer text;
  not an oracle error at all (pre-filter false positive). No oracle-errors-
  under-both case exists.
- Candidate filter left as is: tightening to isJarErrorPage's regex would drop
  the unsupported-page rows; the experiment already excludes jadavu.
- Test pins the exact oracle-widths set; re-run byte-identical (cmp).
