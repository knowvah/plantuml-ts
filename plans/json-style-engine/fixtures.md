# jse family + fixture ledger

Seeded at planning (2026-10-29) from `parity-{json,yaml,hcl}.json` and the
structural manifest at main `d0d37ec18`. Each close adds a counts row.

## Counts per checkpoint

| checkpoint | json c/s/d | yaml c/s/d | hcl c/s/d | pins json/yaml/hcl | manifest clean + ceilings | target rows open | extended movers (journaled) |
|---|---|---|---|---|---|---|---|
| main `d0d37ec18` | 14/35/1 | 7/31/1 | 1/2/0 | 14/7/1 | 150 + 3 | 4 | — |
| b0 close | 14/35/1 | 7/31/1 | 1/2/0 | 14/7/1 | 155 + 3 (5 authored appended) | 4 (+8 authored open) | 0 (baseline written, 218 rows) |
| b1 close | 14/35/1 | 7/31/1 | 1/2/0 | 14/7/1 | 155 + 3 | 4 (+8) | 0 |
| b2+b3 joint close | 14/35/1 | 7/31/1 | 1/2/0 | 14/7/1 | 167 + 3 (12 authored appended) | **0** (all 4 target + 8 authored clean) | 17 vs b1 (10 toward jar, 7 full-map theme; journal row 28) + 8 ADDED examples |

## Target rows

| slug | structural diffs at plan | mechanism (ddc journal row 33) | owner | state |
|---|---:|---|---|---|
| json/highlight-stereotype | 2 | `#highlight "a" <<warn>>`: the stereotype class colour (`withTOBECHANGED`, `TextBlockJson.java:141-146,296-299`) unread | T1b → T2b | closed: 2 → 0, T2b `b3129cc84` (`withTOBECHANGED` row fill, `TextBlockJson.java:141-146,296-299`) |
| json/style-highlight-block | 7 | `jsonDiagram { highlight {…} }` unread (`:145`) | T1b → T2a/T2b | closed: 7 → 0, T2b (`+highlight` font + fill, `:145`) |
| json/style-header-separator-arrow | 13 | `header` FontColor (`:148`), `separator` LineColor/LineThickness (`:286-288`) unread; no header font field | T1b → T2a/T2b | closed: 13 → 0, T2b (`+header` FontColor `:148`, `node+separator` stroke `:286-288`, arrow `SmetanaForJson.java:119-120`) |
| json/theme-cerulean | 23 | theme `root { FontColor; LineColor }` and `node { roundcorner 20; BackgroundColor $PRIMARY-$PRIMARY_DARK }` (gradient, `defs`) never reach json | T1a/T1b → T2b | closed: 23 → 0, T2b + T2h harness seed (gradient `<defs>`, RoundCorner, `#2683B9`, `TextBlockJson.java:281-284`) |

## Authored fixtures (T0c)

One row per new `.puml`: construct, the Java it exercises, state per close.

| slug | type | construct | state |
|---|---|---|---|
| json/diagram-fontcolor-no-node | json | `<style> jsonDiagram { FontColor red }`, no `node` block (`TextBlockJson.java:150`) | b0: 8 diffs → b3: clean, appended |
| json/root-fontcolor | json | `<style> root { FontColor red }` (`TextBlockJson.java:150`) | b0: clean, appended to manifest |
| json/header-highlight | json | `node { header { FontColor blue } highlight { BackGroundColor yellow } }` + `#highlight` (`+header+highlight`, `TextBlockJson.java:141-143`) | b0: 2 diffs → b3: clean, appended |
| json/header-fontsize | json | `header { FontSize 20 }` (measurement, `TextBlockJson.java:148`) | b0: 7 diffs → b3: clean, appended |
| json/separator-style | json | `separator { LineColor red; LineThickness 2 }` (`TextBlockJson.java:286`) | b0: 10 diffs → b3: clean, appended |
| json/arrow-style | json | `arrow { LineColor red; LineThickness 2 }` (`SmetanaForJson.java:118-119,170-175`) | b0: clean, appended |
| json/node-roundcorner | json | `node { RoundCorner 25 }` (`SmetanaForJson.java:123-124,167`) | b0: clean, appended |
| json/theme-carbon-gray | json | theme declaring its own `jsonDiagram { node }`, flat fill (`puml-theme-carbon-gray.puml:627-634`) | b0: clean, appended |
| json/theme-materia | json | theme top-level `node { BackgroundColor $PRIMARY-$PRIMARY_DARK }` gradient (`puml-theme-materia.puml:104`) | b0: 23 diffs → b3: clean, appended |
| yaml/highlight-stereotype | yaml | `yamlDiagram { highlight; .warn }` + `#highlight "a" <<warn>>` (`TextBlockJson.java:113,145-146`) | b0: 2 diffs → b3: clean, appended |
| yaml/style-highlight-block | yaml | `yamlDiagram { highlight { BackGroundColor; FontColor; FontStyle } }` (`TextBlockJson.java:113,145`) | b0: 7 diffs → b3: clean, appended |
| yaml/style-header-fontcolor | yaml | `yamlDiagram { header { FontColor red } }` (`TextBlockJson.java:113,148`) | b0: 2 diffs → b3: clean, appended |
| hcl/style-with-theme | hcl | `!theme cerulean` + `<style>` on a block body, both ignored (`HclDiagramFactory.java:86-92`) | b0: clean, appended |
