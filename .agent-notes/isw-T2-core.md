# isw-T2-core report

## Commits
- 2dbadfa67 fix(isw-T2-core): leading-space x shift in error and welcome pages
- ac15c78ec docs(isw-T2-core): state who owns the leading-space shift for text()
- 24bcb4224 test(isw-T2-core): re-pin stale space=0 jar constants to the seam 4 v2 jar
- (this note commit)

## F2g error/welcome/crash pages
Java DriverTextSvg.java:114-126 -> graphic-strings.ts#drawLine (Welcome block,
GraphicStrings) and error-page-exact.ts#drawSegmentLines (covers the
`' ' + getError()` line, PSystemError.ts:143): both now call
driverTextPlacement(raw, measure(' ').width), shift x by dx, textLength
measured on the trimmed text. error-text.ts#drawRun needs no change (it is only
an emitter; x is passed in). Tests fixed: unwind2-s8-error-page (6),
unwind2-s8-skins (10). Production-visible: every error/welcome page whose line
starts with a space (" Syntax Error?...", " keyword)", sprite-following
text) moves +1 space width in x; textLength is the trimmed width.
Owed rows cleared (survey): unknown/gujuga-46-vifa350, unknown/vesuzo-97-jelo022
(structural-match -> conformant); class/sadamo-18-siva346 maxDelta 3.85 -> 0.
## Not done
- mindmap femiba-70-duvi238 / fogari-75-febu345: unchanged by this work; the
  only remaining diffs are the accepted identity divergences (version banner
  textLength/content, "[From string" vs "[From in.puml", band width). No x /
  leading-space diffs remain. Both stay `diverged` (C-18, user ruling on version).
- mindmap susipa-95-tedu015: NOT a leading-space defect. The jar throws an NPE
  (`Idea.hasChildren() because this.root is null`, mindmap with empty tree)
  and draws the CRASH report (ReportLog.java:105-125 anErrorHasOccurred +
  youShouldSendThisDiagram + JVM properties + stack trace, GraphicStrings);
  ours draws a Syntax Error page (382x316 vs 955x662, white bg). No crash-page
  port exists anywhere in src (grep "has crashed" empty). Needs (a) a crash
  report port in src/core/error (content is JVM/environment values and a Java
  stack trace) and (b) the mindmap engine raising it for a root-less diagram
  (src/diagrams/mindmap, not my write-set). Left open.

## F2-core emitter
svg-shapes.ts#text has no measurer; core callers (usymbol-shapes.ts:111,134
text-anchor middle icon labels, latex.ts:127 node label, dispatcher.ts:346
fixed notice, error-text.ts#drawRun) never emit a leading-space run
(display strings come pre-trimmed; the jar draws these through the klimt
path). No placement-taking variant added (YAGNI, no caller). Doc on text()
now says leading spaces are trimmed without moving x and points to
driverTextPlacement. svg-text-font.ts docs were already correct on base.
No production output change.

## F2-table-cell: mechanism found, fix is OUTSIDE my write-set
Diagnosis site is wrong: core/creole-table.ts#parseTableRow/creole.ts#parseCreoleTokens
have NO production consumer (only tests/unit/creole.test.ts). The
class-header-table-tab note table is drawn by
src/diagrams/class/note-layout-measure-table.ts (cells already untrimmed, per
its comment) and src/diagrams/class/renderer-note-lines.ts#renderTableCellAtom
(:161-176) which emits `text(x, y, atom.renderText ?? atom.text,
{ textLength: atom.renderWidth ?? atom.width })` with no leading-space
shift/trimmed textLength. Fix (class owner): in renderTableCellAtom use
driverTextPlacement(atom.renderText ?? atom.text, spaceWidth), x + dx,
textLength from trimmed text (DriverTextSvg.java:118-126); the layout advance
`cx += atom.width` stays untrimmed. Jar: c at 122.475 vs ours 118.9, e at
161.881 vs 158.306 (= +3.575, one space @13pt). Waits on: class owner.

## S/P tests updated (source of each new value)
- error-page-exact.test.ts: 419x218, rect 143.15, textLengths
  63.963/87.85/85.137/143.15/118.563/119.175/405.125, sadamo 614, 603.138 <-
  test-results/dot-cache/class/{luzive-62-zote562,sadamo-18-siva346}/in.svg.
- Fission.test.ts: 11 lines <- one-JVM jar render (/private/tmp/claude-501/
  isw-diag-core/fis/out/fis.svg), grouped by text y.
- preprocessor-embedded-style: 27.787 <- decoded embedded image in
  dot-cache/unknown/semutu-45-zeno907/in.svg.
- creole-img-render: 104.2125 <- dot-cache/class/jabama-09-kago823/in.svg
  textLength 104.213.
- creole-url-sprite-scale: 1.423785 <- one-JVM render svek-1.dot R1 width.
- annotations-blocks-creole: 139 <- golden count (jar side of same test already 139).
- edge-label-box: 77x22/75x12 <- usecase/jecici-56 svek-1.dot; 81 <- state/
  susena-02-gusa448 svek-1.dot; focaci 57 <- class/focaci-80 svek-1.dot; "~
  initiators" 59 <- one-JVM render ($P/tilde); kafexo 100x41 + 3 lines
  (this is a very / long sentence on / one single line) <- usecase/kafexo-72
  svek-1.dot + in.svg; 84.9375 <- class/xamule-03 in.svg textLength 84.938.

## Still red in my files, waiting on other families
- unwind2-s3-tab-stops: class-header-table-tab (class owner, above);
  activity-action-tab, activity-note-tab (T2-act F1).
- unwind2-s5-theme-order x6 (activity F1).
- unwind2-s11-sprite-atoms x13, unwind-u4-img x3, unwind-u4-sprite x3:
  engine emitters (activity F1 x6; class/state/package/edge leading-space).
- tests/unit stdlib-package-files x2, sprite-package-files, stdlib-packages:
  npm pack dry-run tests, unrelated to text (not investigated).

## Surveys (before = base 46a801487 core files; after = HEAD)
unknown 340/66/419 -> 342/64/419; mindmap, class, sequence, activity verdict
counts identical. Verdict movers: gujuga-46-vifa350, vesuzo-97-jelo022
structural-match -> conformant. Zero conformant losses. maxDelta-only movers
(all decreasing; error/welcome pages): bicusa-63, bizeco-46, curojo-96,
delipu-38, folutu-01, jujade-99, nujapi-78, petiku-70, Timing-short-alias-5/6,
topopo-11, vaxodu-91, xovudi-74 (unknown); sadamo-18 (class).
## Orchestrator pin/baseline changes
Survey baselines for unknown: gujuga-46-vifa350 and vesuzo-97-jelo022 now
conformant (pin them); other movers keep verdict.
