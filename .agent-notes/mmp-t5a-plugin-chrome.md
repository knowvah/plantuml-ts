## Observation: the preprocessor strips `<style>` blocks out of nested `{{ }}` diagrams
- **Context**: re-measuring `unknown/semutu-45-zeno907` (class title embedding `{{mindmap … <style> … }}`) after registering the mindmap plugin.
- **Finding**: the OUTER block's preprocessor (`preprocessor-collector.ts#collectStyleLine`) collects every `<style>` block in the source, including one inside a `{{ }}` embed, and removes its lines. The nested mindmap therefore renders with no style (default `#F1F1F1`/`#181818`), while the jar's nested image is styled (`fill="none"`, `#2FA4E7`). `compareSvg` exempts image href bytes, so the survey cannot see this.
- **Impact**: any engine embedded via `{{ }}` loses its own `<style>`/`skinparam`; the host diagram also receives the nested style. Fix belongs to the preprocessor (skip collection inside `{{`…`}}`), not to an engine.
- **Confidence**: High (preprocess() output shows the style in the outer `styles`, absent from `lines`).

## Observation: `index.ts` and `assemble-svg.ts` are over the 500-line cap; they can only stay the same length
- **Context**: registering the plugin and adding the MINDMAP finalize case.
- **Finding**: the complexity hook allows edits to an oversized file only when it does not grow (baseline = git HEAD). Additions had to be paid for by compressing a doc comment in the same file. Python/sed edits bypass the hook, so run `~/.claude/hooks/.venv/bin/lizard` and `wc -l` by hand.
- **Impact**: the next engine registration in `src/index.ts` needs a pure file-cap move first.
- **Confidence**: High

## Observation: chrome composes around the RAW text block for TitledDiagram engines with margin 10
- **Context**: `mindmap/dezuza-88-gige110` chrome was off by exactly the 10 px margin (title y -10, caption +11, header x +10.975).
- **Finding**: upstream decorates the raw `getTextBlock` (`TitledDiagram#addChrome`) and `TextBlockExporter` applies the `same(10)` margin afterwards. A fragment with the margin baked in (json's shape) puts chrome outside the margin. Mindmap hands `applyChrome` the raw block and `core/TextBlockExporter.ts#finalizeTitledDiagramFragment` shifts by the margin after chrome; all 11 chrome fixtures then match except the one with `scale` (scale cannot be applied after fragment-level chrome).
- **Impact**: json/yaml/hcl use the baked-margin shape and probably carry the same 10 px chrome offset; worth measuring.
- **Confidence**: High for mindmap; Low for json (not measured).
