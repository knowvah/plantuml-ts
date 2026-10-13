## Observation: vi.mock cannot stand in for a module missing on disk
- **Context**: T2b's `WBSDiagram.ts` imports T2a's `./Fork.js`, built in a parallel worktree; the test doubles it with `vi.mock`.
- **Finding**: vitest 5 resolves the importer's path before applying the mock factory: with no `src/diagrams/wbs/Fork.ts` the suite fails `Cannot find module './Fork.js'` and collects 0 tests; `tsc` fails on the same import. The T2b commit therefore typechecks and tests only once T2a's `Fork.ts` is merged; it was verified with an uncommitted contract stub (`new Fork(ISkinParamWithSimple, WElement, AtomOps)`, `calculateDimension`, `drawU`).
- **Impact**: merge T2a before T2b; a parallel task that must CONSTRUCT a sibling's class cannot use the structural-slice trick T1b/T1c used.
- **Confidence**: High

## Observation: WBSDiagram addIdea contract regrouped for the 5-parameter hook
- **Context**: the T2b contract lists `addIdea(code, backColor, level, label, direction, shape)` (6) and `addIdeaDisplay(...)` (7).
- **Finding**: the complexity hook blocks more than 5 parameters. Landed as `addIdea(code, level, {backColor, label: string, shape}: WBSIdeaLabel, direction)` and `addIdeaDisplay(code, level, {backColor, label: Display, stereotype, shape}: WBSIdeaContent, direction)`. `WBSIdeaContent = Omit<WElementDecoration, 'styleBuilder'>`. This follows the T1a `WElementDecoration` precedent.
- **Impact**: T3a–T3c commands and T4a pass a content object.
- **Confidence**: High

## Observation: jar link colour precedence (authored probe)
- **Context**: `WBSDiagram.link` colour, `oracle-render.sh` probe with `wbsDiagram { arrow { LineColor #0000FF } }` and `.hot { LineColor #FF0000 }`.
- **Finding**: `a -> b <<hot>>` is stroked `#F00`, `b -> a` `#00F`, `a -> b #00FF00` `#0F0`; with no style, `#181818` (WBS-arrow-0). The port matches all four.
- **Impact**: pinned in `tests/unit/wbs/WBSDiagram.test.ts`.
- **Confidence**: High

## Observation: a `\u2028` escape written by the Write tool landed as a raw U+2028
- **Context**: transcribing Java's `.` as `[^\n\r\u0085\u2028\u2029]` in a regex literal.
- **Finding**: the file on disk held raw U+0085/U+2028/U+2029 characters. A raw U+2028 inside a regex literal is a line terminator, so oxc failed with `PARSE_ERROR Unexpected token`. Re-escaping with a script fixed it.
- **Impact**: after writing any `\u20xx` escape, grep the file for the raw bytes (`$'\xe2\x80\xa8'`).
- **Confidence**: High (reproduced: this notes file, written the same way, also landed with raw U+2028 bytes)
