# T3b: `CommandWBSItemMultilineNew/Old` + `CommandWBSLink` (D1)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
1. Multiline items (`wbs/CommandWBSItemMultilineNew.java`, `…Old.java`): start regexes
   (New:7-25 — shape/direction then colour/code; Old:7-25 — colour/code then shape/direction),
   both ending in `:` + `DATA`; the END pattern `^(.*);\s*(\<\<(.+)\>\>)?$` (java:2,
   case-insensitive `Pattern2`). Mirror `src/diagrams/mindmap/CommandMindMapOrgmodeMultiline.ts`'s
   `collectOrgmodeMultilineBlock` exactly (`MultilinesStrategy.REMOVE_STARTING_QUOTE`, `Trim.BOTH`
   on the END probe only, the first line's `DATA` kept, the last line replaced by END group 1
   when a stereotype is present — `executeNow` New:35-49 / Old:35-51); Old adds the same
   warning as T3a. Call `diagram.addIdeaDisplay(code, backColor, getSmartLevel(type),
   lines.toDisplay(), Stereotype.build(stereotype), dir, IdeaShape.fromDesc(shape))`.
2. `CommandWBSLink` (`wbs/CommandWBSLink.java:6-16`): `^(code1)\s*([.-]+>)\s*(code2)\s*` +
   `ColorParser.simpleColor(LINE)`'s regex + `StereotypePattern.optional` + optional
   `: label` (captured, unused by `executeArg`); `executeArg` (java:29-38): colours via the
   port's `ColorParser` (find it), `Stereotype.build` when present, `diagram.link(code1, code2,
   colors, stereotype)`.
3. Tests: a 3-line block with `;<<st>>` on the last line, a block whose END is on the first
   line, a block with a quoted first line (`REMOVE_STARTING_QUOTE`), both start forms; links
   `a -> b`, `a ..> b #blue`, `a --> b <<st>> : text`, and an unknown code (the diagram's
   "No such node" result surfaces unchanged).

## Write-set
`src/diagrams/wbs/{CommandWBSItemMultilineNew,CommandWBSItemMultilineOld,CommandWBSLink}.ts`,
`tests/unit/wbs/{CommandWBSItemMultiline,CommandWBSLink}.test.ts`, `docs/catalog.md`,
`.agent-notes/wep-T3b.md`. Any OTHER file is a stop (a missing `ColorParser`/
`StereotypePattern` port is stop 10 — name its Java).

## Interface contract (→ T3c)
`WBS_MULTILINE_NEW_START_RE`, `WBS_MULTILINE_OLD_START_RE`, `WBS_MULTILINE_END_RE`,
`collectWbsMultilineBlock(lines: readonly string[], startIndex: number): WbsMultilineBlock | undefined`,
`applyWbsItemMultilineNew(diagram, block)`, `applyWbsItemMultilineOld(diagram, block)`;
`WBS_LINK_RE`, `applyWbsLink(diagram, match)`.

## Acceptance
- Given `+:l1\nl2\nl3;<<st>>`, then the display is three lines and the stereotype is `st`.
- Given `+[#red](c):text;` on one line, then one-line display with colour and code.
- Given `a ..> b #blue <<st>>`, then `link` receives LINE blue and stereotype st.

**Observability:** N/A. **Rollback:** Reversible.
