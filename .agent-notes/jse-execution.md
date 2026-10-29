## Observation: StyleExtractor applies `<style>` all-or-nothing
- **Context**: jse T1a, the json family's SkinParam built in the parse.
- **Finding**: `StyleExtractor#applyStyles` collects every `<style>` line (a theme's included) into ONE `BlocLines` and runs one `StyleParser#parse`; a parse error throws before `muteStyle`, so NO block applies (`StyleExtractor.java:132-135`). Jar oracle: a valid `jsonDiagram { node { BackGroundColor red } }` plus `<style>{ }</style>` draws the node `#F1F1F1`. A bad `skin` line throws before any `<style>` runs (`:115-129`). The files port (`src/diagrams/files/parser.ts`) keeps earlier blocks and applies `<style>` after a bad skin -- both diverge.
- **Impact**: any engine porting a `StyleExtractor`-based factory must rebuild a fresh skin-only builder on a style error, not keep a partial one.
- **Confidence**: High

## Observation: FromSkinparamToStyle SNames collide with data-diagram signatures
- **Context**: jse T3a, extended mode feeding every skinparam through `convertSkinparam` (user ruling 2026-10-29, full map).
- **Finding**: the converter maps by class-diagram element names, and several land on the json family's own signatures: `node*` → `node`, `sequenceDivider*` → `separator` (the `node+separator` signature, `TextBlockJson.java:286-288`), `arrow*` → `arrow`, `roundCorner` → `root { RoundCorner }`. A theme's skinparams (aws-orange, cerulean) therefore restyle json boxes, and because later lines outrank earlier ones they can beat the theme's own `jsonDiagram { node }` `<style>`. files avoids this only because it whitelists four directives (`files-extensions.ts:26-31`).
- **Impact**: "extended mode = every skinparam" is not a neutral superset; measure each theme row before calling an extended-mode mover a regression or an improvement.
- **Confidence**: High

## Observation: hcl resolves styles as `yamlDiagram`
- **Context**: jse T1a/T3a.
- **Finding**: `TextBlockJson.java:113` names `jsonDiagram` only for `DiagramType.JSON`; yaml AND hcl resolve as `yamlDiagram`. The skin's `yamlDiagram,jsonDiagram` block makes the defaults identical, so the difference is visible only through a user `<style>` selector. Extended-mode hcl `<style>` therefore works through `yamlDiagram` (user ruling: same selector in both modes).
- **Impact**: hcl docs/examples must use `yamlDiagram { … }`.
- **Confidence**: High

## Observation: json harness needs the diagram seed for gradient ids
- **Context**: jse T2b, theme-cerulean measured 5 id-only diffs through `renderFixtureJson`, 0 through `renderSync`.
- **Finding**: production seeds `<linearGradient>` ids with `seedOfUmlSource(umlSource)` (`src/index.ts:86-87,338`); the json harness called `assembleSvg(fragment)` unseeded. Fixed in `render-fixture-json.ts` (activity's HARNESS-SEED precedent).
- **Impact**: any per-engine harness for an engine that can draw a gradient/filter must pass the seed, or gradient rows read as diverged forever.
- **Confidence**: High

## Observation: three confident claims about oracle colours were wrong in one mission
- **Context**: jse batch 0-1 hand-backs and my own journal row 8.
- **Finding**: T0c said a red-FontColor oracle "contains no red" (it painted 8 runs `#F00`); I then claimed `root { FontColor red }` renders black (the jar paints red); the brief said `withTOBECHANGED` was unported (it was already in `StyleSignatureBasic.ts:124`). Each was settled in seconds by `grep -o 'fill="#…"'` on the oracle or a grep of the port.
- **Impact**: before acting on any colour/feature claim from a report or a brief, grep the svg or the source; do not reason from the skin alone (user `<style>` outranks the skin's per-diagram block).
- **Confidence**: High
