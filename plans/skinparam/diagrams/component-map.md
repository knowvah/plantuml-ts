# Component Map — Skinparam

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Public API (src/index.ts)" {
  [render()] as render
  [renderAll()] as renderAll
  [renderSync()] as renderSync
  [buildTheme(preprocessed, options)\n(module-private helper)] as buildTheme
}

package "preprocessor.ts (modified)" {
  [preprocess(source)] as preprocess
  [PreprocessorResult\n+ skinparam: ReadonlyMapstring,string (new)] as PreprocessorResult
}

package "theme.ts (modified)" {
  [resolveTheme(name) — unchanged] as resolveTheme
  [deepMergeTheme(base, partial) (new export)] as deepMergeTheme
}

package "skinparam.ts (new file)" {
  [resolveSkinparam(skinparams, base)\n→ { theme, unknown[] }] as resolveSkinparam
  [parseStyleBlock(raw)\n→ Mapstring,string] as parseStyleBlock
}

render --> buildTheme
renderAll --> buildTheme
renderSync --> buildTheme
buildTheme --> preprocess
preprocess --> PreprocessorResult
buildTheme --> resolveTheme
buildTheme --> resolveSkinparam
buildTheme --> parseStyleBlock
buildTheme --> deepMergeTheme
resolveSkinparam --> deepMergeTheme
@enduml
```
