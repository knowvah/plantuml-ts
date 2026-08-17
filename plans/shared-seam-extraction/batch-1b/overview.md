# Batch 1b — FrontierCalculator ∥ link-note dim ∥ Command<S> ∥ assemble-svg

Four independent tasks; disjoint write-sets (also disjoint from batch 1a —
may run together as one 7-way batch).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | ONE `FrontierCalculator` port in `core/svek/` (description + state copies merged) | typescript-pro | `core/svek/FrontierCalculator.ts`, description `frontier-calculator.ts`(del) + 2 callers, state `state-composite-frontier.ts`(del/thin) + `state-composite-geo.ts` | T0 | [x] |
| T6 | ONE `measureLinkNoteDim` (`svek/image/EntityImageNoteLink`) in core; 3 engine copies retired | typescript-pro | `core/svek/image/EntityImageNoteLink.ts`, `core/rose-note-dim.ts`, `class/class-note-link-box.ts`, `state/{state-dot-graph,state-composite-edge-label}.ts`, `description/link-note-box.ts` | T0 | [x] |
| T7 | Generic `Command<S>` in `core/command/`; four engine aliases | typescript-pro | `core/command/Command.ts`, `class/class-command-types.ts`, `description/command-table-types.ts`, `sequence/sequence-parse-helpers.ts`, `state/state-commands.ts` | T0 | [x] |
| T8 | `assemble-svg`: `RenderFragment.diagramType`; four shell flags + four core→engine imports removed | typescript-pro | `core/{assemble-svg,dispatcher}.ts`, `class/{renderer,renderer-edge,renderer-shell}.ts`, `description/renderer.ts`, `state/{renderer,renderer-shell}.ts`, `json/{renderer-shell,index}.ts`, `yaml/index.ts`, `hcl/index.ts` | T0 | [x] |
