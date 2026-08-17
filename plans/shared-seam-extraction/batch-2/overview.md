# Batch 2 — leaf-sizing family → core ∥ CommandCreateJson

Two independent tasks (disjoint write-sets), each depending on a batch-1
task: T3 needs T2's core paths; T9 needs T7's `Command<S>`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T3 | leaf-sizing family (7 files, 1,870 lines) → `core/svek/image/`; `LeafSizingSubject`; class imports nothing from description | typescript-pro | `core/svek/image/leaf-sizing*.ts` + `LeafSizingSubject.ts`, description `leaf-sizing*.ts`(del) + 4 callers, class 4 callers | T2 | [x] |
| T9 | ONE `CommandCreateJson`/`JsonNode` in `core/command/`, class + state call it | typescript-pro | `core/command/{CommandCreateJson,JsonNode}.ts`, class 6 files, state 7 files | T7 | [x] |
