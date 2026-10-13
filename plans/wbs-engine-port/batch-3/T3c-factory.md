# T3c: `WBSDiagramFactory` (D1, D8)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
Port `wbs/WBSDiagramFactory.java` in the shape of `src/diagrams/mindmap/MindMapDiagramFactory.ts`
(read it whole first — the style/skinparam declaration handling, `refuse`, the common
commands, the `@start/@end` lines, warnings):
1. Command order per `WBSDiagramFactory.java:6-15`: `addCommonCommands1` (the port's
   `src/core/common-commands` equivalents the mindmap factory uses: title/caption/legend/
   header/footer, scale, sprite, skinparam, `<style>`, pragma, newpage…), then
   `CommandWBSItemNew(1)`, `CommandWBSItemNew(0)`, `CommandWBSItemMultilineNew`,
   `CommandWBSItemOld(1)`, `CommandWBSItemOld(0)`, `CommandWBSItemMultilineOld`,
   `CommandWBSLink`. First match wins; a line no command matches is a parse refusal with the
   port's standard error so the error page renders ("Syntax Error?" rows, D8).
2. `createEmptyDiagram` → `new WBSDiagram(source, preprocessing, skinParam)` with the
   `createMindmapSkinParam`-built `wbs-skin-param` (D4).
3. Tests: dispatch order (an input matching both New and Old forms reaches New; the
   `"x" as c` form reaches mode 1 before mode 0), a common command (`title`) before an item,
   an unmatched line refuses, and a parse of every cached `in.puml` under
   `test-results/dot-cache/wbs/` (204): all parse without refusal EXCEPT the stock-error rows
   (T0a's list in `fixtures.md`), which refuse or return the Java's error string — pin the two
   sets.

## Write-set
`src/diagrams/wbs/WBSDiagramFactory.ts`, `tests/unit/wbs/WBSDiagramFactory.test.ts`,
`docs/catalog.md`, `.agent-notes/wep-T3c.md`. Any OTHER file is a stop.

## Interface contract (→ T4a)
`parseWbs(source: UmlSource, preprocessing: PreprocessingArtifact): WBSDiagram | ParseRefusal`
(name it as the mindmap factory names its entry point).

## Acceptance
- Given the 204 cached sources, then exactly the T0a-classified error rows refuse/err, with
  the Java's strings, and every other row parses.
- Given an item line matching both forms, then the New command handles it.

**Observability:** N/A. **Rollback:** Reversible.
