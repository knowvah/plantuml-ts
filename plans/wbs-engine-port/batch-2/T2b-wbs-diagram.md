# T2b: `WBSDiagram` + `wbs-skin-param.ts`

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
1. `wbs-skin-param.ts`: mirror `src/diagrams/mindmap/mindmap-skin-param.ts` (the `SkinParam`
   slice a `TitledDiagram` reaches: `ISkinSimple` members, `getIHtmlColorSet`, the current
   style builder from `mindmap-style-builder.ts`, `params`), renamed for wbs; no rankdir (WBS
   has no direction command, D12).
2. `WBSDiagram.ts` (`wbs/WBSDiagram.java`, extends `TitledDiagram`, D5):
   - fields `root`, `last`, `first: string | undefined`, `codes: Map<string, WElement>`
     (insertion-ordered, java:5), `links: WBSLink[]`; `getDescription()` = "Work Breakdown
     Structure"; `getTextBlock()` returns the diagram itself (java:14-16).
   - `drawU(ug)` = `drawMe(ug.apply(new UTranslate(10, 10)))`; `calculateDimension` =
     `new Fork(skinParam, root).calculateDimension(b).delta(20)` (java:18-24); `drawMe`
     (java:33-44): capture `getTranslate()` from an `AbstractCommonUGraphic`, draw the fork,
     then the links under `ug.apply(translate.reverse())`; `getDrawingElement()` builds a NEW
     `Fork` each call, as the Java does.
   - `patternStereotype` (java:48, `Pattern2.cmpile` is case-insensitive) and the string
     `addIdea` overload (java:49-59: split label/stereotype, `Display.getWithNewlines(pragma,
     label)`, `Stereotype.build`); the Display overload (java:60-73): level 0 → one-root rule
     ("WBS diagram only accepts one root first declared."), else `add`; `NoStyleAvailableException`
     → "General failure: no style available.".
   - `initRoot`, `getParentOfLast(nb)`, `getSmartLevel(type)` (java:84-101: tabs → spaces; no
     space → `length - 1`; endsWith(first) / trim length 1 / startsWith(first) arms; else throw
     `UnsupportedOperationException` → `Error`), `add` (java:102-126: `level == last+1` →
     child of `last`; `level <= last` → walk up `last.level - level + 1` parents; else "Bad tree
     structure"; `codes.set(code, idea)` when a code is given), `link` (java:127-142: "No such
     node x"; colour from `colors.getColor(LINE)` else the `root.element.wbsDiagram.arrow`
     style's `LineColor` with the stereotype).
3. Tests: the one-root error, "Bad tree structure", parent walking at `level <= last` (3 cases),
   `getSmartLevel` on `*`, `**`, ` **`, `+-`, `--+` after first `+` (5 cases incl. the throw),
   stereotype split, link errors + default colour, and `drawU` ordering with a recording
   UGraphic and a Fork double (fork first at (10,10), links after the reverse translate).

## Write-set
`src/diagrams/wbs/{WBSDiagram,wbs-skin-param}.ts`, `tests/unit/wbs/{WBSDiagram,wbs-skin-param}.test.ts`,
`docs/catalog.md`, `.agent-notes/wep-T2b.md`. Any OTHER file is a stop.

## Interface contract (→ T3a–T3c, T4a)
See `overview.md`. `addIdea(code, backColor, level, label: string, direction, shape)` (string
form) and `addIdeaDisplay(code, backColor, level, display, stereotype, direction, shape)`.

## Acceptance
- Given a second level-0 item, then the Java's one-root message; given a jump of 2 levels,
  then "Bad tree structure"; given `level <= last`, then the new node hangs off the right ancestor.
- Given the five `getSmartLevel` inputs, then the Java's levels (and the throw).
- Given `drawU`, then the fork is drawn at (10,10), the dimension is the fork's +20, and each
  link draws after the translate is reversed.
- Given `link` without a colour, then the arrow style's `LineColor` is used.

**Observability:** N/A. **Rollback:** Reversible.
