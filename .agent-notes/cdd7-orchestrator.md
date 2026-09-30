## Observation: a "+N" draw offset that only one geo field shows is a frame mismatch, not a draw constant
- **Context**: cdd7 T1b (kexaba): the lone-sprite edge-label image sat 7 px left/up of the jar; the agent traced the Java to a (1,1) margin and shipped `+8` as a constant.
- **Finding**: `class-layout-shift.ts#shiftEdgeExtras` / `class-scale-geo-edge.ts` enumerate the `EdgeGeo` fields they translate into document coordinates; a field added later (`labelImage`, cdd6 T2d) that is not in that list stays in dot-engine's raw frame while its siblings move by the canvas margin (7 px here). Text labels on the same edge matched the jar because they ARE in the list.
- **Impact**: when one geo field on an element is off by a uniform (dx,dy) while sibling fields match, check the shift/scale passes' field lists before reading draw code; the jar's `+margin` will be exactly what the Java says once the frame is right.
- **Confidence**: High (oracle probes of a text variant and a self-loop variant both matched after the fix; no constant remains).

## Observation: `computeDotEqual` count check can fail on byte-identical DOTs
- **Context**: cdd7 T1g (rojida): conformant but `dotEqual: false`.
- **Finding**: the jar dumps svek DOT for graphviz-routed nested `{{ }}` embeds (once per pass, so twice), while the survey compared only `nestedDepth === 0` inputs and failed on `dots.length !== inputs.length` before any structural compare ran. Only json/yaml/hcl embeds are Smetana-routed and undumped. Fixed in 60139c55e (structural-identity set match); the dedup ignores node sizes because `compareStructural` does.
- **Impact**: a `dotEqual: false` on a fixture with `{{ }}` embeds of a graphviz type was an instrument artefact before that commit; any remaining false on such a fixture is now a real structural mismatch.
- **Confidence**: High.

## Observation: subagents report "verified" for measurements taken in the wrong frame
- **Context**: cdd7 T1b's first report ("fully Java-traced", "cross-validated twice") compared a dot-frame box origin (from `dot -Tsvg`) with a document-frame image position (from the jar's SVG).
- **Finding**: both numbers were correct; the comparison was not. The tell was a constant no Java line produced.
- **Impact**: before accepting any agent constant, demand the Java line that produces it; if none exists, look for a coordinate-frame or instrument mismatch (memory: measurement artefacts outnumber defects).
- **Confidence**: High.
