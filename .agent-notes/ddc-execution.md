## Observation: the json edge list is post-order, nodes pre-order
- **Context**: ddc T1a, 16 json/yaml rows `diverged` on `path/@d` only.
- **Finding**: `SmetanaForJson.manageOneNode` adds the node (`:133`) before its child loop but recurses (`:139`) BEFORE `createEdge`/`edges.add` (`:140-141`); `drawMe` draws edges in that list order. dot-engine preserves input edge order, so building `dotInput.edges` by the same recursion is the whole fix (`layout.ts#buildJsonDotEdges`).
- **Impact**: any svek/smetana port that flattens a tree with `walkTree` must check whether upstream's EDGE list is post-order even when its node list is pre-order; `compareSvg` pairs paths by index, so an order delta looks like a geometry delta.
- **Confidence**: High

## Observation: the survey and the structural gate disagree on what "structural" means
- **Context**: `diff-one.mts --structural` printed 0 on tivuru-65 while the survey said `diverged`.
- **Finding**: the gate drops positional attrs (`isPositionalDiff`, incl. `d`/`points`); the survey calls a row `diverged` on any diff with no numeric `delta` (`svg-parity-survey.ts:214-218`), which a `d` string with a different segment count is. `diff-one.mts --survey` shows exactly that set.
- **Impact**: a row can be gate-clean and survey-diverged; measure with the view that owns the verdict you are chasing.
- **Confidence**: High

## Observation: the files engine's klimt seams
- **Context**: ddc T1b re-port of `@startfiles`.
- **Finding**: everything the jar draws for files already existed as ports — `Display.getWithNewlines`/`create7`, `SheetBlock1`, `Opale`, the emoji store (from `assetStore` only, ADR-2), `StyleSignatureBasic.getMergedStyle`; the only new module is a `SkinParam` slice (`files-skin-param.ts`, the wbs/gantt mirror) because `createOpale` reads `getDefaultTextAlignment`/`useUnderlineForHyperlink`/`getPadding`/`getTabSize` and files→gantt imports are forbidden by layering. `DiagramType.FILES` has no `getStyleName` arm, so the document background resolves through `activityDiagram` (`DiagramType.java:293`). The jar draws no title/caption/header/footer/legend for files (`FilesDiagram.java:80-86`, `FilesDiagramFactory` runs no commands).
- **Impact**: a klimt engine port is mostly wiring; budget the time for the SkinParam slice and the style-name fallthrough, not for drawing code.
- **Confidence**: High

## Observation: the empty-source test belongs to the factory base, not to dispatch
- **Context**: ddc T2f/T2g; `@startfiles`/`@endfiles` drew the Welcome page.
- **Finding**: only `PSystemCommandFactory` (`UmlSource#isEmpty`), `PSystemBasicFactory` (line count after `removeInitialNoise`) and `PSystemSingleLineFactory` test emptiness; `PSystemAbstractFactory`'s direct subclasses (files/json/yaml/hcl/git) build from the empty source. The port now lets each plugin declare its `factoryBase` and the registry applies the hoisted test only when every candidate is a command factory.
- **Impact**: when porting a new engine, declare its factory base in its plugin; an empty-body oracle is a cheap first fixture.
- **Confidence**: High
