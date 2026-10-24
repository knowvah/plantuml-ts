## Observation: textLength under lengthAdjust none is a document-level strip
- **Context**: sdd3-T2c, `skinparam lengthAdjust`.
- **Finding**: the jar's `SvgOption` is document-wide (`TextBlockExporter.java:307`), so `textLength` is dropped for EVERY `<text>` (`SvgGraphics.java:703-705`), chrome included. Our emitters are scattered (sequence-text, svg-shapes-text, class/state rows), so the strip lives once in `klimt/document-shell.ts#withLengthAdjustApplied`, keyed off `RenderFragment.lengthAdjust`. An engine opts in by setting that one fragment field; no emitter edit.
- **Impact**: other engines (class, state, description, activity, json/yaml/hcl, mindmap, wbs, salt) still hard-code `spacing` until they forward `theme.lengthAdjust`. Fragments without `diagramType` go through `svgRoot` and ignore the field.
- **Confidence**: High

## Observation: svg:survey can die silently under load
- **Context**: surveys of class and sequence at load average 115-130 with other worktrees surveying.
- **Finding**: the class run printed `25/723` then exited without writing its `--out` file; the sequence run exited 1 after the "surveying N" line with no error text.
- **Impact**: check the output file exists before diffing; an absent `parity-<engine>.json` makes `verdict-diff.mjs` skip that engine.
- **Confidence**: Medium (cause not isolated)
