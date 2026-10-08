# lgm-T1c -- state + description draw the framed SvekResult un-normalized

## Commits (branch lgm/T1c, merged feat/large-group-mirror ea6639f3b clean, no conflicts)
- 64f7b6979 wip(lgm-T1c): mechanism (state + description + margin table row); one commit, not split
- d88790d0d merge of feat/large-group-mirror (T1b)
- test(chrome): pin state and description chrome against jar renders (tests, catalog)

## Java -> ours
- DiagramChromeFactory.java:278-337 (decorateWithFrame never calls the original's calculateDimension; computeDelta :332-337)
  + SvekResult.java:130-135 (moveDelta(6-minX,6-minY) therefore never runs) -> framed body drawn in layout frame +
  DotLayoutResult.originShift; chrome (T1a's chrome-mainframe.ts) frames RenderFragment.frameInk and applies delta.
  - state: src/diagrams/state/layout.ts#applyMainframePlacement (+ applyStateDocumentMargin now declares
    preChromeWidth/Height = svekDimension(ink)); renderer.ts forwards preChrome*/frameInk.
  - description: layout-ink-shift.ts#placeBody (replaces computeInkShift; framed => dx,dy = originShift, frameInk = ink+m);
    layout.ts assembles preChrome*/frameInk; index.ts#render returns an unwrapped RenderFragment (klimt document
    unwrapped via unwrapKlimtSvg) ONLY when the diagram has chrome (geo.chromed), so src/index.ts is untouched and
    chrome-free descriptions stay byte-identical CompleteSvg.
- UgDiagram.java:124-128 / TextBlockExporter.java:159-203: state and description are CucaDiagram margin (0,5,5,0):
  STATE and DESCRIPTION rows added to core/document-margin.ts. This also fixes unframed title/legend (block-width
  centering): state-title-only 32 -> 1 diff, component-title-only 21 -> 0.

## Verified claim
Jar state-frame: box x=11 with frame (block at x=1) vs x=7 without; reproduced exactly after the change.

## Write-set expansions (all non-forbidden, minimal; report/accept)
- src/core/document-margin.ts (2 table rows)
- src/diagrams/state/state-geo-types.ts (preChromeWidth/Height, frameInk, originShift fields)
- src/diagrams/state/layout-ink-extent.ts (export computeStateInkBox, 1 function)
- src/diagrams/description/layout-helpers-types.ts (preChrome*, frameInk, chromed fields)
- tests/unit/description/layout-ink-shift.test.ts, tests/unit/core/document-margin.test.ts (adapted/extended)
- comment refs to computeInkShift remain in description/renderer*.ts (not in write-set; stale name only)

## Fixtures before -> after (probe: renderSync+DeterministicMeasurer vs jar)
state-frame 85 -> 1 (label textLength, chrome-independent); component-frame 44 -> 0; usecase-frame 48 -> 0;
state-frame-chrome 98 -> 1; state-title-only 32 -> 1; state-frame-notes 88 -> 8 (note draw order, body);
component-frame-chrome 55 -> 0; component-title-only 21 -> 0; deployment-frame -> 1 (cloud glyph path coord);
usecase-frame-note -> 5 (note entity order, body); state-frame-composite 124 -> 62 (OPEN, below) -> 0 with patch.
Fixtures with nested clusters (node{component}, rectangle{usecase}) differ from the jar WITHOUT any chrome (cluster
body defects) so they were dropped from the chrome set.

## engdiff (merged base ea6639f3b -> after, all 28 engines, one per command)
movers=5 conformant-losses=0: component gevaje-94-sajo802, tusugu-95-geju398; unknown safuke-64-vuzo599,
tilege-34-riki742; usecase gigofe-94-zepe032 -- all structural-match -> conformant (title/legend/caption chrome rows).
Elements (state component usecase unknown): away=0 toward=0.

## Ratchet movers
state/description/class/object golden + description diff-baseline ratchets pass unchanged. The 5 rows above are in
parity-*.json / census-*.json, not in diff-baseline pins: re-pin/census refresh (orchestrator): parity-component,
parity-unknown, parity-usecase (+census-component, census-usecase). No rises.

## NOT DONE / needs the orchestrator
1. Composite state under mainframe: `layoutComposite` (state-composite-geo.ts, T1b-owned, forbidden) must carry the
   top pass's originShift. Exact change (tested: state-frame-composite -> 0 diffs; patch in
   /private/tmp/claude-501/lgm-T1c/composite-originshift.patch):
   in `layoutComposite`, replace the final return with
   `return { totalWidth: result.width, totalHeight: result.height, states, transitions, ...(result.originShift !== undefined ? { originShift: result.originShift } : {}) };`
   Then flip the "open" test in tests/oracle/svg-conformance/lgm-t1c-svek-chrome.test.ts to `expect(pathsOf(...)).toEqual([])`.
2. Degenerate single-leaf description (placeBody not reached; no preChrome) -- chrome as before; unprobed with a frame.
3. tests/oracle/svg-conformance/render-fixture-state.ts (forbidden) calls applyChrome directly; state now declares
   preChromeWidth, so that harness composes chrome without the margin step. It moved no pinned row, but should switch to
   applyExportedChrome (as render-fixture-class/sequence do).

## DIVERGENCES.md: retire the `mainframe` entry for state/description
Proposed text (replace the "state and description draw the normalized body" clause): "mainframe: no divergence.
STATE and DESCRIPTION draw the framed SvekResult in the raw svek frame (DiagramChromeFactory.java:278-337;
SvekResult.java:130-135 never runs) and chrome frames the LimitFinder ink; composite states pending the
originShift carry-through in state-composite-geo.ts." Remove the entry entirely once item 1 lands.

## Observation: description chrome without a mainframe was also wrong
- Context: title-only fixtures. Finding: chrome was centred on the finished canvas (margin included); jar centres on the
  margin-less block. Impact: any engine added to document-margin.ts's table must declare preChromeWidth/Height.
  Confidence: High.
