# Batch 1c — description lane: deroxu (item 28)

Sequential after batch 1b. T6a's census decides how many family tasks follow (D4). Use the T6b template
for each family, in descending count; the orchestrator adds T6f+ rows here. Close-procedure A runs after
each task.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6a | Classify every deroxu diff into mechanism families | general-purpose (read-only on `src/`) | `measurements/deroxu-families.json`, `.agent-notes/gtc-T6a.md` | T5b | [x] |
| T6b | hidden-link-drawn: suppress paint of `-[hidden]-` edges, keep ink extent (cascade of 1814) | typescript-pro | description layout-geo-post/renderer-draw-sequence/renderer-ink-extent (maybe SvekEdge.ts), tests | T6a | [x] |
| T6c | stereo-only-skinparam-block: `skinparam <<X>> {` opener (78 latent) | typescript-pro | core preprocessor-collector.ts, tests | T6b | [x] |
| T6d | hide-stereotype-drops-stereo-style: style from the full stereotype list (48 latent) | typescript-pro | description layout-dot-tree/renderer-entity/renderer-cluster, tests | T6c | [x] |
| T6e | dpi-scale-double-rounding: format scaled numbers once (30 latent) | typescript-pro | description index/renderer (+ core assemble-svg if needed), tests | T6d | [x] |
| T6f | inline-link-colour-dropped: trailing `#color` on a link (18) | typescript-pro | description link-grammar.ts, tests | T6e | [x] |
| T6g | cluster-stereo-shadowing: `Shadowing<<X>>` on clusters (+ canvas-shadow-extent cascade) | typescript-pro | core skinparam-stereo-keys/theme-element-resolve; description renderer-cluster, tests | T6f | [x] |
| T6h | stereo-font-and-interface-border-keys: `ComponentFontColor<<X>>` etc. (16 latent) | typescript-pro | core skinparam-stereo-keys/theme-element-resolve; description renderer-entity/edge, tests | T6g | [x] |
| T6i | port-cluster-title-min-width: two-line port cluster title (5 latent) | typescript-pro | description layout-cluster-boxes/layout, tests | T6h | [x] |
| T6j | multi-stereotype-tie-order: first-defined style wins on ties (4 latent; shared core resolver, all-engine) | typescript-pro | core theme-element-resolve.ts, tests | T6i | [x] |

T6a's census (2026-10-18, `measurements/deroxu-families.json`) replaced the planning labels; rows are ordered by dependency (journal row 47), each instantiated from the T6b template.
