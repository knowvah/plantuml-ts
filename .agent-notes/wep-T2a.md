## Observation: the root WElement never gets a geometry
- **Context**: porting `Fork#drawU` (Fork.java:99-140)
- **Finding**: only `ITFComposed.java:186-189` and `ITFLeaf.java:107-111` call `setGeometry`; `Fork` draws the root box without recording it. `WBSLink.java:77` draws only when both positions are non-null, so the jar never draws a `(code1) -> (code2)` link that touches the root.
- **Impact**: T2b/T4 must not "fix" a missing root link; it is the jar's output.
- **Confidence**: High

## Observation: an ITFComposed records its subtree origin, not its box
- **Context**: same, `ITFComposed#drawU` (java:186-192)
- **Finding**: `setGeometry(translate, mainDim)` takes the ug's translate BEFORE `UTranslate.dx(wx)`, so a non-leaf node's recorded position is its subtree's top-left, while its box sits `wx = getw1 - mainWidth / 2` to the right. Leaves record their own box.
- **Impact**: `WBSLink` rectangles for non-leaf nodes are offset left of the drawn box in the jar; mirror it.
- **Confidence**: High

## Observation: drawing a subtree at the jar's printed origin is off by 0.001
- **Context**: pinning `mogume-53-tuxe939`'s `Implementation` subtree on its own
- **Finding**: the jar prints `219.687` for an origin that is `219.6874999...` (float32 text widths summed); drawing at the printed value then prints `270.674` where the jar has `270.675`. Compute the origin as `Fork` does (`20 + sibling width + delta1x`, Fork.java:123) or drive the whole tree through `Fork`.
- **Impact**: subtree-level pins must derive their origin, not copy it from the SVG.
- **Confidence**: High
