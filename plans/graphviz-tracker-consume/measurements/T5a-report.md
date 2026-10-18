# T5a report

Commit: 4dc650800 `fix(description): split ortho xlabel link labels into display lines` (unsigned).
Files: src/diagrams/description/{layout.ts,layout-geo-post.ts} (in-lane extension), tests/unit/description/gtc-t5a-ortho-label-lines.test.ts (new).

## Row: unknown/xagonu-36-sudi116 render-diff 45/887 -> 30/170 (structural/numeric)
Cleared: all g[26..29] text content, textLength and childCount diffs (the 4 `\r` links).
Remaining at g[26..29]: 4 numeric `text[1]/@x` (blank first line, see core residual below).

## Diagnosis A: literal `\rA.` prefix (label text)
- Mechanism: `Display.getWithNewlines` (Display.java:273-300) splits on `\n`, `\l`, `\r` (`\r` also sets naturalHorizontalAlignment
  = RIGHT), so `\rA.Interact with app` = lines `""`, `"A.Interact with app"`. The jar draws the label as a block
  (SvekEdge.java:951-954) even for the ortho xlabel (SvekEdge.java:434-441).
- Origin (port): the label reached SvekEdge without a table, so it took the plain-text fallback `SvekEdge.ts:319-322`
  (`UText.build(text)`, no split). The table is `re.labelWidth/Height`, which graph-layout.ts:181-186 echoes from
  `attributes.labelWidth` only; an ortho edge carries `xlabelWidth/xlabelHeight` instead (link-edge-attrs.ts:386-390), so
  `layout-geo-post.ts#addEdgeLabel` had no table. Non-ortho labels already split (probe: `\r`, `\n`, `\l` all correct).
- Fix: `EdgeMapping.xlabelTableByDotId` (layout-geo-post.ts), built in layout.ts from `edgeDotBuild.dotEdges` attrs; used when
  the engine echoed no `labelWidth`. Not touched: src/core.
- Ruled out: `Display` split code (works off-ortho), link-grammar label capture (label arrives intact), layout/dot (dotEqual).

## Diagnosis B: link `<g>` childCount 3 vs 4
- The missing element is the jar's blank first label line: `<text ...>&#160;</text>` (U+00A0, the empty line of `["", "A..."]`),
  verified with a jar probe (/private/tmp/claude-501/gtc-T5a/o2/t1.svg, scripts/oracle-render.sh). It is the same cause as A: once the
  label is split, the blank line is drawn and childCount is 4.

## Tests
- New failing-first: gtc-t5a-ortho-label-lines.test.ts (ortho `\r`, `\n`, `\l`; expected from the jar probe; blank-line x masked, see residual).
- `vitest run --testTimeout=60000 --maxWorkers=4 tests/unit/description tests/architecture tests/oracle/svg-conformance/description.*.test.ts`:
  91 files collected, 91 passed, 1608 tests. typecheck, eslint, prettier clean.

## Surveys before -> after (/private/tmp/claude-501/gtc-T5a/<tree>-{before,after}.json, no timeouts)
- component 203/12/51 -> 204/12/50; usecase 65/3/25 (+1 oracle-error) unchanged; unknown 496/16/313 unchanged.
- Losses: 0. Mover: component zosaxo-93-nici652 diverged (`g[5]/text[1]/@textLength`) -> conformant (ortho label split, mechanism A).
  xagonu: firstDiff g[26]/text -> g[37]/@id, still diverged.

## Residuals
1. STOP 1 (core): the blank first line of a right-aligned label is centred, jar right-aligned (e.g. xagonu g[26] x 116.919 vs 64.959;
   probe 98.37 vs 81.795). Origin: `src/core/svek/SvekEdge.ts:336` hard-codes `HorizontalAlignment.CENTER` and ignores both
   `splitDisplayLines(...).align` (DisplayNewlines.ts:361, the `\l`/`\r` natural alignment) and `skinparam defaultTextAlignment`
   (`SvekEdge.java:376-381` getMessageTextAlignment; `Display.java:648-649` natural alignment overrides). Needs a core task; the
   test masks this x.
2. For T5b, remaining xagonu diffs (30/170): link draw order and ortho routing. Diff counts per `svg/g[1]/g[n]`:
   g[37]:18, g[38]:31, g[39]:17, g[45]:30, g[46]:31, g[47]:31, g[30]:37, g[48]:1.
   First paths: `g[37]/@id exp=lnk39 act=lnk37` (jar draws obc-to-mapp (10) before obc-to-aep (8) and aep-to-obc (9): links
   lnk37/38/39 are in a different draw order), `g[45]/@id exp=lnk46 act=lnk45` (jar order lnk46, lnk47, lnk45 = mwv-to-obp-1,
   obp-to-mwv-1, user-to-mwv), `g[30]/path[1]/@d[0] exp=658.71 act=291.292` (an ortho path at a different location, dx 367.418).
   These are edge order and ortho routing, not label text.
