# Production manifest b0 -> b2a: 1118 changed, attributed (D10-AMEND RULED)

Method: per-engine counts from `production-manifest.mts --diff b0-prod.json`; every non-activity/sequence/class engine's changed fixtures were rendered pre-2a (62ef0e149) vs b2a with production options and the first differing element read (`/private/tmp/claude-501/isw-orch/proddiff.sh`). b0 -> b1 itself: 0 changes.

| Engine | Changed | Family (evidence) |
|---|---|---|
| activity | 442 | T2-act F1 (measurer injection: production activity text now measured by the resolved measurer instead of a hard-coded width table), F2/F3/F5/F7 |
| sequence | 330 | T2-seq F2 (trim-then-measure, leading x), F3 divider, F4 ref, F5 autonumber span, X note int width |
| unknown | 132 | T2-core F2g (error page `' '+getError()` line x +1 space) and T2-act F1 (ACTIVITY-typed rows) |
| timing | 126 | T2-core F2g — every timing fixture is an error page ("Syntax Error?" x 5 -> 8.85) |
| class | 44 | T2-cls F2a-f, F3, F7 |
| state | 18 | T2-smj F2-state, F3-state tabSize |
| mindmap | 6 | F2g error pages (femiba, fogari, susipa), F4-mm (geketu rect 65.85 -> 73.55, kijafe x +3.025, fovule) |
| json | 5 | F5-json (empty cell " " atom: width 32 -> 35, empty text -> NBSP) |
| object | 4 | T2-cls F2b (jotaga ": type" x +3.85), F2e (tujasu edge label), F2 legend (zicope), embedded diagram (zuvila) |
| usecase | 3 | T2-cls F3d/F2 (nobiza note x +4.113), embedded `{{ }}` contents (kovaxi, zidebi) |
| yaml | 2 | F5-json (jozapu cell 10 -> 13.85; ketunu empty text) |
| network | 2 | F2g error pages |
| component | 2 | T2-cls F4 (detona `[ .. ]` label width 945 -> 950), F3d (tuliba note x +4.113) |
| gantt | 1 | F2g welcome/error page ("keyword)" x 138 -> 141.3) |
| c4 | 1 | F2g error page |

No unattributed change.

# b2a -> b2: 696 more changed (sequence 315, unknown 108, activity 81, class 63, json 37, yaml 31, state 13, component 12, mindmap 12, object 10, usecase 7, c4 3, chart 2, hcl 2)

Sampled 2 per engine (fc1b997a7 vs b2, production options): every non-sequence sample is T2b-ca M4 — coordinates moved by title/header/legend/chrome now printed once at 3 decimals (`formatShiftedCoordinates`, SvgGraphics.java:468-475; e.g. `x="105.50416666666663"` -> `105.504`). sequence + SEQUENCE-typed unknown: T2b-seq note tiles (canvas width, e.g. TeozTimelineIssues_0002 493 -> 687 px). Plus T2b-obj object/map/json `<style>` + stereotype padding, T2c-scale scaled activity numbers, T2c-stereo json/description stereotypes (per agent reports). No unattributed change.
