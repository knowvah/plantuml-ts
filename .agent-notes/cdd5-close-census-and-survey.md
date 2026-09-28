## Observation: the class census now renders through renderSync, and agrees with the survey
- **Context**: cdd5 T1 (D3) and the b1..b5 closes.
- **Finding**: `renderClassFixture` (tests/oracle/svg-conformance/render-fixture-class.ts) is a thin `renderSync(markup, { measurer, assetStore, includeStore })` wrapper; the class census and the class ratchet both use it. Survey, census and render-all agreed on all 1011 CLASS rows at every close. The unknown-bucket CLASS rows (routing-baseline `type: unknown`, `ourType: CLASS`) are censused and pinned under `oracle/goldens/svg-class/unknown/<slug>/`; their routing/refusal goldens rows are keyed `unknown/<slug>` (the gates derive slug as the path under the type root).
- **Impact**: a "census vs survey disagreement" on class is now a real signal, not dispatch drift. `pin-goldens.mts --tree unknown` writes the right row keys; hand-edits must too.
- **Confidence**: High.

## Observation: renderer console output corrupts the survey's worker frames
- **Context**: cdd5 T5 close, unknown/puvako-69 and sufura-56 surveyed `errored: unparseable worker frame: [Log] ...`.
- **Finding**: `!log` (src/core/tim/EaterLog.ts, faithful port) writes via console.info to the persistent worker's stdout, which is the JSON-lines channel. Fixed by `svg-parity-workers.ts#routeConsoleToStderr` at worker start.
- **Impact**: any new console output in src/ is now safe for the survey; check other harnesses that frame on stdout before trusting an "errored" row that renders fine in-process.
- **Confidence**: High.

## Observation: the survey's dotEqual counts nested-embed layout graphs
- **Context**: cdd5 b4/b5 closes, unknown/gubeca-19 and jixibu-01 dotEqual true -> false after their {{yaml}}/{{json}} embeds started to draw.
- **Finding**: `setLayoutInputObserver` captures every layout the render runs, including the nested embed's (3 graphs of 2 nodes for gubeca: measure + draw passes). The jar's nested json/yaml goes through Smetana (JsonDiagram) and dumps no svek DOT, so the counts can never match.
- **Impact**: a dotEqual false on a fixture with a drawn {{ }} embed is a harness artifact until the observer scopes to the outer diagram. Filed for cdd6.
- **Confidence**: High (instrumented).
