# Batch 1: style values, signatures, packing geometry, parsing

All four tasks run in parallel worktrees; no shared files. T1a and T1b agree on the type-only
contracts in their specs (SName/PName unions, `Value` interface). T1c and T1d need nothing
from the style engine: `Idea` gets its tree only here; styles join in T4a.
Close: [../close-procedure.md](../close-procedure.md) (mindmap still does not render; the
all-engine diff must be empty — the only shared file touched is `StyleSignatureBasic.ts`).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-style-values.md) | PName, SName (widen), MergeStrategy, Value/ValueImpl/ValueNull/ValueColor/ValueAbstract, DarkString | typescript-pro (opus) | `src/core/style/{PName,SName,MergeStrategy,Value,ValueImpl,ValueNull,ValueColor,ValueAbstract,DarkString}.ts` (+tests) | b0 close | [x] |
| [T1b](T1b-style-signature-key.md) | StyleSignatureBasic (widen), StyleKey | typescript-pro (opus) | `src/core/style/{StyleSignatureBasic,StyleKey}.ts` (+tests) | b0 close | [x] |
| [T1c](T1c-packing-geometry.md) | Tetris, Stripe, StripeFrontier, SymetricalTee, SymetricalTeePositioned | typescript-pro (sonnet) | `src/diagrams/mindmap/{Tetris,Stripe,StripeFrontier,SymetricalTee,SymetricalTeePositioned}.ts` (+tests) | b0 close | [x] |
| [T1d](T1d-mindmap-parsing.md) | IdeaShape, Idea tree, MindMap/Branch tree-build, 5 commands, MindMapDiagram parse, factory | typescript-pro (sonnet) | `src/diagrams/mindmap/{IdeaShape,Idea,MindMap,Branch,Finger,MindMapDiagram,MindMapDiagramFactory,CommandMindMap*}.ts` (+tests) | b0 close | [x] |
