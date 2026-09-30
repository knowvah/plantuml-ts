## Observation: `skinparam handwritten` always draws a warning banner
- **Context**: T6c, mindmap handwritten export (zature-18-vidu755, zirabo-51-lera821).
- **Finding**: `CommandSkinParam.java:92-93` adds a Warning for any `skinparam handwritten`; `DiagramChromeFactory.java:176-200` draws it as a banner ABOVE the diagram (rounded URectangle + monospace-10 UText), inside the handwritten export. The port's chrome (`annotations/chrome.ts`) has no warnings banner, so every such diagram is shifted up by the banner height (20 px at dpi 96).
- **Impact**: Wiring `UGraphicHandwritten` into the export WITHOUT the banner raises weightedScore 77 -> 319 (each jiggled point then diffs numerically by the banner dy). Land the wiring together with the banner.
- **Confidence**: High

## Observation: UGraphicHandwritten reseeds on every apply
- **Context**: same.
- **Finding**: `Random rnd = new Random(424242L)` is an instance field (UGraphicHandwritten.java:54) and `apply` returns a NEW decorator (java:114-116): the jiggle sequence restarts after every `apply`. Both golden links start with the identical jiggle. `json/renderer-pen.ts` shares one random across the diagram (its own model).
- **Impact**: Banner draws do not perturb diagram jiggles; only their dy.
- **Confidence**: High
