# Batch 3: commands and the factory

Wave 1: T3a ∥ T3b (parallel worktrees). Wave 2: T3c after both merge.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-item-commands.md) | `CommandWBSItemNew` + `CommandWBSItemOld`, modes 1 and 0 | typescript-pro (sonnet) | `src/diagrams/wbs/{CommandWBSItemNew,CommandWBSItemOld}.ts` + tests | T0c, T2b | [x] |
| [T3b](T3b-multiline-and-link-commands.md) | `CommandWBSItemMultilineNew/Old` + `CommandWBSLink` | typescript-pro (sonnet) | `src/diagrams/wbs/{CommandWBSItemMultilineNew,CommandWBSItemMultilineOld,CommandWBSLink}.ts` + tests | T0c, T2b | [x] |
| [T3c](T3c-factory.md) | `WBSDiagramFactory`: dispatch in the Java's order, common commands, style/skinparam declarations, refusal | typescript-pro (sonnet) | `src/diagrams/wbs/WBSDiagramFactory.ts` + test | T3a, T3b | [x] |

## Interface contracts (T3a/T3b → T3c)
Each command module exports its regex(es) and an apply function in the mindmap shape:
- `WBS_ITEM_NEW_RE_1`, `WBS_ITEM_NEW_RE_0`, `applyWbsItemNew(diagram, match, mode)`;
  `WBS_ITEM_OLD_RE_1`, `WBS_ITEM_OLD_RE_0`, `applyWbsItemOld(diagram, match, mode)`.
- `WBS_MULTILINE_NEW_START_RE`, `WBS_MULTILINE_OLD_START_RE`, `WBS_MULTILINE_END_RE`,
  `collectWbsMultilineBlock(lines, startIndex)`, `applyWbsItemMultilineNew/Old(diagram, block)`.
- `WBS_LINK_RE`, `applyWbsLink(diagram, match)`.
All return `CommandExecutionResult`.

Close with the standard procedure.
