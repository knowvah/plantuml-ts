# mmp-T3a: style parser, loader, mindmap style assembly

## Observation: a `skin` line after the first skinparam/style is ignored
- **Context**: porting SkinParam.getCurrentStyleBuilder (java:157-161) for buildMindmapStyleBuilder.
- **Finding**: the builder is created lazily on first use; `skin <name>` only calls setDefaultSkin (TitledDiagram.java:180). DumpProbe on `skinparam hyperlinkColor red` / `skin rose` / `* r` dumps plantuml.skin (126 styles), not rose. The port's preprocessor-collector records no declaration position for `skin`, so buildMindmapStyleBuilder applies it first (D2).
- **Impact**: a source with `skin` after a skinparam/`<style>` diverges; no mindmap fixture has one.
- **Confidence**: High

## Observation: jar skin resources vs the port's skins-builtin.ts
- **Context**: StyleLoader.getInputStreamForStyle for `skin <name>`.
- **Finding**: the jar holds skin/{debug,plantuml,rose,sonyxperiadev,strictuml}.skin. `BUILTIN_SKINS.debug` and `.rose` are byte-identical to the jar (unzip -p + cmp); `.sonyxperiadev` is an older text (the jar's starts with a `/* sonyxperiadev skin */` complete stylesheet); `reddress` is not a jar resource (jar: "No .skin file seems to be available").
- **Impact**: StyleLoader serves debug/rose from skins-builtin.ts and nothing for sonyxperiadev (falls back to plantuml.skin). Embedding the jar's sonyxperiadev.skin means extending scripts/extract-jar-skin.ts SKIN_EXPORTS.
- **Confidence**: High
