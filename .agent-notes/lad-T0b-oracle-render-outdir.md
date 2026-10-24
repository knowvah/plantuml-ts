## Observation: oracle-render.sh needs an absolute out-dir
- **Context**: lad T0b rendering 64 authored oracles.
- **Finding**: a relative `<out-dir>` resolves against the `.puml`'s directory, not the cwd; the jar also drops `svek-*.dot` beside the svg. Render into an absolute scratch dir and copy the `.svg` only.
- **Impact**: avoids stray svek files in fixture dirs.
- **Confidence**: Medium (agent-reported, not re-verified).

## Observation: json/yaml/hcl/files ignore every skinparam but handwritten
- **Context**: lad T0b/T0d.
- **Finding**: `StyleExtractor.java:88-96` drops `skinparam` lines; used by JsonDiagramFactory:75, YamlDiagramFactory:75, HclDiagramFactory:69, FilesDiagramFactory:56. Jar oracles keep `lengthAdjust="spacing"` under `none`/`spacingAndGlyphs`.
- **Impact**: never wire a skinparam into these four engines' themes; mirror the drop.
- **Confidence**: High (Java read + 16 oracles).
