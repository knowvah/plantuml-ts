# Component Map — Preprocessor

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

package "Public API (src/index.ts)" {
  [render(source, options?)] as render
  [renderAll(source, options?)] as renderAll
  [renderSync(source, options?)] as renderSync
  [RenderOptions\n+ fetcher?: IncludeFetcher] as RenderOptions
}

package "include-resolver.ts (modified)" {
  [resolveIncludes(source, fetcher?)] as resolveIncludes
  [resolveIncludesInner(..., visited, chain)\n(new internal helper)] as resolveIncludesInner
  [CircularIncludeError (new)] as CircularIncludeError
  [IncludeResolveError (existing)] as IncludeResolveError
  [IncludeFetcher type] as IncludeFetcher
}

package "include-resolver-node.ts (new file)" {
  [makeNodeFsFetcher(basePath)] as makeNodeFsFetcher
}

package "preprocessor.ts (modified)" {
  [preprocess(source)] as preprocess
  [PreprocessorResult\n+ styles: readonly string[] (new)] as PreprocessorResult
  [applyDefines(line)] as applyDefines
  [Define = SimpleDef | ParamDef (new union)] as Define
}

render --> resolveIncludes
renderAll --> resolveIncludes
renderSync ..> renderSync : throws if !include found
render --> preprocess
renderAll --> preprocess
renderSync --> preprocess
resolveIncludes --> resolveIncludesInner
resolveIncludesInner --> CircularIncludeError
resolveIncludesInner --> IncludeResolveError
makeNodeFsFetcher --> IncludeFetcher
makeNodeFsFetcher --> IncludeResolveError
RenderOptions --> IncludeFetcher
preprocess --> PreprocessorResult
applyDefines --> Define
@enduml
```
