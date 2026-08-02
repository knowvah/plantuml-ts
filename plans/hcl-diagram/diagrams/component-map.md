# Component Map

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[src/core/block-extractor.ts\nDiagramType + START_SUFFIX_MAP] as BE
[src/core/dispatcher.ts] as DISP
[src/index.ts\nregister + applyStyleMap] as IDX
[src/diagrams/hcl/index.ts\nhclPlugin] as PLUG
[src/diagrams/hcl/parser.ts\nparseHcl] as PARSE
[src/diagrams/json/layout.ts\nlayoutJson — unchanged] as LAYOUT
[src/diagrams/json/renderer.ts\nrenderJson — unchanged] as RENDER
[src/diagrams/json/ast.ts\nJsonDiagramAST] as AST
[src/core/theme.ts\nTheme] as THEME

BE --> DISP : type 'hcl'
IDX --> PLUG : registers
PLUG --> PARSE : parse
PLUG --> LAYOUT : layoutSync
PLUG --> RENDER : render
PARSE --> AST : produces
IDX --> THEME : hcldiagram.* selectors
@enduml
```

## Write-set by batch

| Batch | Files written |
|-------|--------------|
| T1 | `src/diagrams/hcl/parser.ts`, `src/core/block-extractor.ts`, `tests/unit/hcl/parser.test.ts` |
| T2 | `src/diagrams/hcl/index.ts`, `src/index.ts`, `tests/unit/hcl/plugin.test.ts`, `tests/visual/hcl.html`, `DIVERGENCES.md` |
