# sep-T5a: salt export margin + scale through the shared chrome path

## Observation: the tracked parity-mindmap.json is stale for two latex rows
- **Context**: comparing the T5a mindmap survey against `HEAD:tests/oracle/svg-conformance/parity-mindmap.json`.
- **Finding**: the tracked file (last written `de0ec0c8b`, aepp-exit) lists `fovule-12-noze408` and `gukofo-85-vira895` as `structural-match`; the salt-engine-port b0/b3 and cdd8 final surveys, and T5a's, all list them `conformant` (142/142). A whole-corpus sha256 comparison against `measurements/T4a/hash-after.json` shows neither row's bytes changed in T5a.
- **Impact**: a verdict diff against the tracked file reports two false mindmap "movers"; compare against the latest batch survey (`measurements/b3-eng/parity-mindmap.json`) or render hashes instead.
- **Confidence**: High

## Observation: the chromed TitledDiagram path needs the producer's margin on the fragment
- **Context**: routing SALT through `TextBlockExporter.ts#finalizeTitledDiagramFragment`.
- **Finding**: `finalizeShellFragment` sees only the fragment, and `Builder#calculateMargin` (`core/TextBlockExporter.java:510-516`) depends on the diagram's style, so the margin is carried as `RenderFragment.exportMargin` (`src/core/dispatcher.ts`), set by both producers' `rawTextBlock`. The style `Margin` holds on the chrome path too: jar probe `measurements/T5a/style-margin-title.puml` (root `Margin 10` + title) = 96x89, matched.
- **Impact**: any further `TitledDiagram` engine on this path must set `exportMargin`; a chromed fragment without one throws.
- **Confidence**: High

## Observation: salt's chrome path must not draw its element tree twice
- **Context**: porting mindmap's `rawTextBlock` shape (first pass at scale 1 for background/defs, then `drawBodyAt`).
- **Finding**: mindmap's first pass draws the full block and discards the body; salt's root `drawU` mutates (`ElementMenuBar` z-index 1), so salt's first pass draws `TextBlockUtils.EMPTY_TEXT_BLOCK` (salt's only gradient source is the background) and the tree is drawn once in `drawBodyAt` (plus the `LimitFinder` pass for a mainframe, as upstream).
- **Impact**: copying mindmap's two-pass shape into another mutating engine changes its output.
- **Confidence**: High

## Observation: chrome + a painted root background puts the rect after the chrome
- **Context**: jar probe `measurements/T5a/background-title.puml` (root `BackgroundColor pink` + title).
- **Finding**: the jar paints the background `<rect>` first in the content `<g>` at the final canvas size (`SvgGraphics.java:188-191` paints in the constructor; `:817-819` resizes it to the final `maxX`/`maxY`). Ours draws it inside `drawBodyAt`'s klimt document (raw-block size 56x60, after the title `<g>`): 2 structural diffs (`g[1]/g[1]` rect vs g). Same mechanism in mindmap's `rawTextBlock`; no mindmap or salt corpus row exercises it. Pre-existing before T5a (the old salt chrome path chromed a body that already contained the rect).
- **Impact**: fixing needs the finalizer to paint the rect first at the final size and both producers' `drawBodyAt` passes to skip painting it.
- **Confidence**: High (salt probe); Medium (mindmap reach, not probed)
