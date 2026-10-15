# T7a report (codd/T7a, base ecdaea5b2)

## Commits
- 7eede8b57 fix(description): draw edge labels at the label table corner (T6-A)
  files: src/core/svek/SvekEdge.ts (core, D5), src/diagrams/description/{layout-geo-post,layout-helpers-types,renderer-edge}.ts,
  tests/unit/core/svek/svek-edge.test.ts, tests/unit/description/codd-t7a-edge-label-corner.test.ts, docs/catalog.md
- f0251a64d fix(description): decode the %n() newline sentinel in displays (T6-G)
  files: parse-helpers-strings.ts, tests/unit/description/parse-helpers.test.ts
- fcff0651d fix(description): backtrack a quoted display past an embedded quote (T6-H)
  files: parse-helpers.ts, parse-helpers-strings.ts, tests/unit/description/parse-helpers.test.ts

## render-diff structural/numeric, before -> after
buduco, cigite, fimoxe, fodena, keniji, luniju, nedapu, pegali, cojege, romuco: 0/2 -> 0/0
babafi 0/4 -> 0/2 (label part gone; remaining 2 = entity text alignment, T6-B)
bagoze 1/21 -> 1/0 (remaining S: second Rainbow path `-[#blue,dashed;#red]->` unported)
fogexa 0/4 -> 0/0; radiga 0/4 -> 0/0; tilexe 0/12 -> 0/0; vosuxa 0/4 -> 0/0; zodare 0/4 -> 0/0
usecase/vibunu 0/4 -> 0/0
unknown/vuvave 3/16 -> 4/11 (G fixed: display splits; structural +1 is T6-F: UHorizontalLine in the cluster title throws
  "decoration failed" in Cluster.drawU, lines after `----` vanish; renderer-cluster.ts is T7b's)
unknown/xipane 24/19 -> 1/7 (S: rect/@fill #FFF vs none = container inline #color, renderer-cluster.ts:187-188; N = title x, T7b)

## Diagnosis artifacts
### T6-A
- Mechanism: description drew the label with the DOT label-table CENTRE as UText origin; the jar draws the label block at the
  table's min corner + labelShield, inside withMargin(marginLabel).
- Origin: Java SvekEdge.java:951-954 (drawU), :741-748 (labelXY), :808-815 (getXY), :372-373 (marginLabel 1 / 6 self-loop),
  :353-356 (labelShield). Port: layout-geo-post.ts#addEdgeLabel -> renderer-edge.ts#buildInput -> SvekEdge.ts#drawLabels.
- Chain (buduco): table 86x15, centre cx; ours x=cx (116.68), jar x = cx - 43 + 1 = 74.68; y: jar baseline = cy - 7.5 + 1 + 10.111.
  Delta x = w/2-1 always.
- Ruled out: measurer (textLength equal), dot-engine (native lp == ours, D8), table size (equal, DOT table == labelWidth echo).
- Fix: label gets w,h (echoed labelWidth/labelHeight, set with labelBoxWidth/Height in link-edge-attrs#applyMainLabel, so == DOT
  table; edgeLabelTables(inp) is not reachable from ResultEdge); SvekEdge.drawLabelBlock: corner = centre - trunc(size)/2,
  draws buildTextBlock(splitDisplayLines(text) joined, CENTER) at corner + margin (6 when fromUid === toUid, else 1). A
  stereotype link label is merged above the label in the same block (as link-edge-attrs#mainLabelText sizes it).
  labelShield kept 0: the port parses no middle decor (DescriptiveLink has no field) -- not added (nothing would set it).
- Jar probes (oracle-render.sh, /private/tmp/claude-501/codd-T7a/probe): multi-line `first\nsecond longer line` (table 107x28,
  lines centred in one block), self-loop `loop` (table 36x25, marginLabel 6), stereotype-only `<<includes>>` (64x15).
- Kept on the old path (no w,h): link-note labels (dikexa; usecase fogiku/jafuke) and ortho `xlabel` labels.
- Test change: svek-edge.test.ts harness now measures with DeterministicMeasurer (the old stub returned height 0) and the
  PLAIN_WITH_LABEL golden textLength is 20.962 (the cached babafi in.svg says 20.962, the constant said 20.963).

### T6-G
- Mechanism: resolveNewlineEscapes handled only \n \r \l; U+E100 (Jaws.BLOCK_E1_NEWLINE, what %n() leaves) was not split.
- Origin: Java Display.java:330-333 (getWithNewlines, `rawMode == false && c == BLOCK_E1_NEWLINE`); port
  parse-helpers-strings.ts#resolveNewlineEscapes (:209). Chain: one-line display "Foox----* y" -> cluster 113x69 vs 74x107.
- Fix inline in resolveNewlineEscapes (BackSlash.hiddenNewLine(), honouring the existing [[ ]] rawMode) instead of routing the
  whole string through parseWithNewlines: that would also change \t, \l alignment and `<math>` handling for every caller.
- Ruled out: the preprocessor (it emits the sentinel as Java does).

### T6-H
- Mechanism: port's `"[^"]+"` forms and splitLeadingQuote (first closing quote) refused an embedded `"`; Java's lazy `.+?`
  backtracks until the remainder of the concat matches. Origin: CommandCreateElementFull.java:130 (DISPLAY_CORE, CODE_WITH_QUOTE);
  port parse-helpers.ts:127,129,137,145 and parse-helpers-strings.ts#splitLeadingQuote.
- Other `[%g].+?[%g]` alternatives checked: CommandPackageWithUSymbol.java:82 DISPLAY1 (package path uses the same
  parseNameSection); `\(\)[%s]*[%g][^%g]+[%g]` is NON-lazy in Java, so the `()"code"` branch of RE_DQ_AS_WRAPPED keeps [^"]+.
  CommandLinkElement `[%g]([^%g]+)[%g]` and Labels.java are non-lazy -> untouched.
- Closing-quote choice: earliest `"` whose tail starts with as<space>, <<, $, [[, #, { or end; keeps the first quote otherwise
  (zero change for every input that parsed before).
- Not done: `%g` also contains U+201C/U+201D; the port only handles ASCII `"` (pre-existing, out of scope).

## Surveys (worktree vs a clean ecdaea5b2 worktree, same dot-cache), zero conformant losses
- component 127 -> 142 conformant: buduco cigite cojege fimoxe fodena fogexa keniji luniju nedapu pegali radiga romuco tilexe
  vosuxa zodare (structural-match -> conformant). gevozu-46-sasu860, sunuju-01-pote718 diverged -> structural-match.
- usecase 38 -> 40: cevuji-49-bile305, vibunu-17-guso486 -> conformant; dopova-50-digo290, zilisi-99-rate911 diverged -> structural-match.
- unknown 450 -> 452: kuduba-74-taki821, lebuca-31-sese441 -> conformant. c4: unchanged (2 conformant).
- Files: /private/tmp/claude-501/codd-T7a/{component,usecase,unknown,c4}-{before,after}.json

## Census (component, deterministic)
- 0-diff fixtures 126 -> 141; sum 3608 -> 3403; 39 rows fall.
- Rises: gevozu-46-sasu860 165->166, sunuju-01-pote718 165->166 -- the permanent KaTeX `<latex>` link label (text where the jar has
  image: re-pairing). No others.
- Per-attribute check (compareSvg diffs dumped for all component+usecase rows in both trees): 24 diff paths have a larger delta
  and 13 appear that were not there. All explained; none is a mis-placed label:
  - magic-arrow labels (berelu g5/g9, funeme g4/g5; jar draws a glyph polygon + text after it): the old centre origin was a
    coincidence. funeme: our x 50.14 = corner 49.14 + 1; jar 63.14 = corner + 1 + 13 (arrow = font size). The glyph is unported in
    description (class-magic-arrow.ts doc: "description does not draw the glyph"); sizing already reserves it.
  - label content features the block path cannot draw yet: `<$sprite>`/`<img>` (bivira, ruciga: buildTextBlock gets no
    resolveAtomImage), `[[url label]]` (malumi), wrapped long text (kafexo, jar 19 children). Same wrongness before.
  - re-pairing by index (jecici edge order, xacaxe, sotine, fetefi): different elements compared; jecici 120 -> 105 diffs.
  - zosuje: every label shifted by the document Margin 10 20 30 40 (+40 x / +10 y); delta now uniform (T4 chrome).

## Tests
- targeted (tests/unit/description, tests/unit/core/svek, tests/architecture, tests/oracle/svg-conformance/description.*.test.ts,
  lgm-t1c-svek-chrome.test.ts): 100 files collected, 1635 tests passed.
- D5 guards (class/object/state golden ratchets, class/object/state dot-parity, wrapper-parity, layout-parity ratchet, description
  golden + diff-baseline ratchets): 10 files, 3758 tests passed.
- typecheck, eslint, prettier clean; lizard (CCN 10, 30 NLOC, 5 params) clean. parse-helpers-strings.ts is 563 lines (532 before my +31);
  the >500 limit was already exceeded at base.

## D5 journal (core SvekEdge.ts)
SvekEdge's only importer is description renderer-edge.ts. New exports: EDGE_LABEL_MARGIN, SELF_LOOP_EDGE_LABEL_MARGIN;
SvekEdgeLabel gains optional w,h (absent = old origin path). New core import: image/EntityImageDescriptionTextBlock#buildTextBlock,
creole/DisplayNewlines#splitDisplayLines.

## Residuals / follow-ons (mechanisms)
1. Magic-arrow glyph draw in description (berelu, funeme, zosuje family): needs class-magic-arrow's glyph geometry moved to core.
2. Label atoms: pass resolveAtomImage to the label block (sprites/img in labels: bivira, ruciga); `[[url]]` label (malumi).
3. Post-colon `<<st>> text` label: jar draws ONE line "«st» text" (probe: table 57x15); the port splits the stereotype out
   (link-grammar.ts#extractLinkStereotype) and sizes/draws it as two lines. Stereotype-only labels (cevuji) are exact.
4. Self-loop edges (`a --> a : loop`) are dropped entirely by description (no link group at all); jar draws it. Not label-related.
5. Ortho (`linetype ortho`) xlabel labels still use the old origin path (xlabelWidth echo is not forwarded to the geo).
6. bagoze: second Rainbow path of `-[#blue,dashed;#red]->` unported (childCount 3 vs 4).
7. vuvave/rebena: T6-F (cluster title UHorizontalLine). xipane fill: colour track (renderer-cluster.ts:187-188).
8. Middle-decor labelShield 7: no port field; no corpus row.
