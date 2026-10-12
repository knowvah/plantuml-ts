# Batch 2: tree layout and the diagram

Two parallel worktrees. T2b codes against T2a's `Fork` contract (below) with a test double.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-itfcomposed-fork.md) | `ITFComposed` + `Fork`: the tree geometry, auto-width pass, draw order, jar-pinned numbers | typescript-pro (opus) | `src/diagrams/wbs/{ITFComposed,Fork}.ts` + tests | T1a, T1b | [ ] |
| [T2b](T2b-wbs-diagram.md) | `WBSDiagram` (+ `wbs-skin-param.ts`): `addIdea`, `getSmartLevel`, `add`, `link`, `drawU`, dimension | typescript-pro (opus) | `src/diagrams/wbs/{WBSDiagram,wbs-skin-param}.ts` + tests | T1a, T1c (T2a contract) | [ ] |

## Interface contracts
- T2a → T2b: `new Fork(skinParam: ISkinParam, root: WElement): WBSTextBlock` (throws when
  `root.getLevel() !== 0`, `Fork.java:7-8`); `ITFComposed.build2(skinParam, idea): ITF`.
- T2b → T3*, T4a: `class WBSDiagram extends TitledDiagram { addIdea(code: string | undefined,
  backColor: HColor | undefined, level: number, label: string, direction: Direction,
  shape: IdeaShape): CommandExecutionResult; addIdeaDisplay(code, backColor, level,
  display: Display, stereotype: Stereotype | undefined, direction, shape): CommandExecutionResult
  /* the Display overload */; getSmartLevel(type: string): number; link(code1, code2,
  colors: Colors, stereotype?: Stereotype): CommandExecutionResult; getTextBlock(): TextBlock;
  calculateDimension(bounder): XDimension2D; drawU(ug): void; getSkinParam(): SkinParam }`.

Close with the standard procedure.
