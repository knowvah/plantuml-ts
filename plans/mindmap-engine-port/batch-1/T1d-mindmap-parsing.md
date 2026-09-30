# T1d: mindmap parsing

Return only the structured report: commit sha(s), files changed, per-check or per-fixture
before → after, residuals with mechanisms (Java + port `file:line`), write-set extensions,
test counts (collected files). No preamble.

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at `~/git/plantuml`
(`src/main/java/net/sourceforge/plantuml/`) is the specification. Read `CLAUDE.md` first
("READ THE JAVA FIRST", "Never fit a value", "Do not refactor while porting", "Preserve
upstream names"). The oracle is the 1.2026.8beta1 jar (`oracle/dist/plantuml-oracle.jar`);
mindmap goldens are cached at `test-results/dot-cache/mindmap/<slug>/in.svg`. Render new
oracles only via `scripts/oracle-render.sh <out-dir> <puml>`. Jar values for tests come
from the T0c probes (`plans/mindmap-engine-port/tools/probe/`), never from guesses.
Brief: `plans/mindmap-engine-port/` (README, decisions.md D1–D12).

## Task (TDD)
Port the parse side, upstream names and structure:
- `IdeaShape.java` (47): `BOX`, `NONE`, `fromDesc` (`_` → NONE).
- `Idea.java` tree part: constructor, `createIdeaSimple`, `createIdea`, getters
  (`getLevel`, `getLabel`, `getChildren`, `hasChildren`, `getParent`, `getShape`,
  `getBackColor`, `getStereotype1`). NOT `getStyle`/`getStyleArrow` (T4a); leave a typed
  `styleBuilder` field slot.
- `MindMap.java` tree part: `addIdeaInternal`, `isFull` (`:117-152`); `Branch.java` tree
  part (`initRoot`, `add`, `hasRoot`, `hasChildren`). Drawing/geometry stays for T4a.
- `MindMapDiagram.java` parse part: `setDefaultDirection`, the three `addIdea` overloads
  (`:106-134`, stereotype stripped via `Display#getEndingStereotype`), `getSmartLevel`
  (`:136-159`, including its `UnsupportedOperationException` → the jar's error page per D6).
- Commands: `CommandMindMapRoot` (80), `CommandMindMapPlus` (106), `CommandMindMapOrgmode`
  (112), `CommandMindMapOrgmodeMultiline` (132), `CommandMindMapDirection` (83), and
  `MindMapDiagramFactory` (74) with its `CommonCommands` + `CommandRankDir` list, reusing
  the port's existing command/regex infrastructure (grep `CommandMultilines2`,
  `PSystemCommandFactory` users, e.g. `src/diagrams/description/`).
Tests: tree shape per fixture family (probe or jar-visible structure).

## Write-set
`src/diagrams/mindmap/{IdeaShape,Idea,MindMap,Branch,MindMapDiagram,MindMapDiagramFactory,CommandMindMapRoot,CommandMindMapPlus,CommandMindMapOrgmode,CommandMindMapOrgmodeMultiline,CommandMindMapDirection}.ts`
+ `tests/unit/mindmap/parse-*.test.ts`. Not `index.ts` (T5a).

## Read-set
The Java files above; `MindMapDiagram.java:81-159`; `MindMap.java:63-152`; a port command
precedent (`src/diagrams/description/note-grammar.ts`, `command-table-directives.ts`).

## Interface contracts
```ts
export class Idea { getLevel(): number; getLabel(): Display; getChildren(): readonly Idea[]; hasChildren(): boolean;
  getParent(): Idea | undefined; getShape(): IdeaShape; getBackColor(): HColor | undefined; getStereotype1(): Stereotype | undefined }
export class MindMapDiagram { /* parse state */ getMindmaps(): readonly MindMap[]; setDefaultDirection(d: Direction): void }
export function createMindMapDiagram(source, options): MindMapDiagram | Refusal; // factory entry, consumed by T5a
```
T4a adds styles and drawing to `Idea`, `MindMap`, `Branch` (same files, later batch).

## Acceptance
- Given `*`, `+`/`-`, orgmode and multiline sources, then the tree matches the jar's.
- Given a second root, then a new `MindMap` starts (`isFull`).
- Given the input that makes `getSmartLevel` throw, then parsing refuses as the jar does.
- Given `left side` / `top to bottom direction`, then direction and rankdir are set.

## Architecture decisions (locked)
D6, D12.

## Quality bar
TDD (failing test first, specific values). Targeted `npx vitest run` over `tests/unit/mindmap/`
(report the collected file count). `npm run typecheck`; `npx eslint <changed files>`;
`npx prettier --check <changed files>`. No full `npm test`. New src module ⇒ `npm run
catalog` and commit `docs/catalog.md`. Complexity hook: ≤30 NLOC per function, CCN ≤10,
≤5 params, ≤500-line files (split along upstream boundaries). Worktree rules: README
"Execution rules" (absolute worktree paths; no Serena edit tools; no `git stash`).

## Boundaries
- Always: quote the Java before claiming parity; `@see` the Java origin on every ported
  symbol and a `file:line` on every constant; keep upstream names.
- Stop and report (do not edit): a needed file outside the write-set (beyond a pure
  type/file-cap move or a small unported helper on this path that no other task owns),
  or Java that contradicts the stated mechanism or a D-decision.
- Never: fit a value, touch the oracle jar/cache, dot-engine or the fork, push, edit the
  flat `StyleMap` or any existing engine's style resolution.

## Commit
`feat(mindmap): port the commands and idea tree`: conventional, lowercase, ≤72 chars, one per task; body with the Java
cited and what the tests pin. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible (new files; revert the commit).
