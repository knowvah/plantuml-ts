# T1 — `ActivityRepeat.entry` and the repeat `is`/`not` labels

**Agent:** typescript-pro · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java is the spec (quote
`file:line`; JSDoc `@see`). Read [`../README.md`](../README.md) and
[`../decisions.md`](../decisions.md) D1–D2.

**The jar.** `repeat :label;` — `CommandRepeat3.java:126` passes the label to
`ActivityDiagram3#startRepeat` (`:351-357`), stored as
`InstructionRepeat.startLabel` (`InstructionRepeat.java:51`) and handed to
`factory.repeat(…, startLabel, …)` (`:166-167`) as the ENTRY tile that
replaces the entry diamond (`vcompact/FtileRepeat.java:77-80`). `repeat
while (test) is (yes) not (out)` — `repeatWhile(label, yes, out, …)`
(`ActivityDiagram3.java:359-371`) -> `setTest` (`InstructionRepeat.java:
193-200`) -> `yesTb`/`outTb` on the condition hexagon
(`FtileRepeat.java:150-151`).

**Ours.** `node-dispatch.ts:207-253` parses the inline action into
`inlineNodes` and prepends it to `body`; `RE_REPEATWHILE`
(`dispatch-support.ts:44-45`) matches `is (…)` and `not (…)` as groups 2
and 3 and the node keeps only `condition`. `ast.ts:90-102` is
`ActivityRepeat`.

## Fix

1. `ast.ts`: `entry?: ActivityAction`, `yesLabel?: string`, `outLabel?:
   string` on `ActivityRepeat`, each with its `@see`.
2. `node-dispatch.ts`: the inline action becomes `entry` (not a body
   node); groups 2/3 become `yesLabel`/`outLabel` (omit when empty, the
   `ActivityWhile` convention at `:182-183`).
3. `tile-layout.ts#tileRepeat`: for now `tileNodes([entry, ...body])` so
   every rendered SVG stays byte-identical until T5 builds the entry tile.

## Read-set

`node-dispatch.ts:200-260`, `dispatch-support.ts:41-46`, `ast.ts:70-102`,
`tile-layout.ts:146-176`; Java ranges above.

## Write-set

`src/diagrams/activity/ast.ts`, `src/diagrams/activity/node-dispatch.ts`,
`src/diagrams/activity/layout/tile-layout.ts` (`tileRepeat` only),
`tests/unit/activity/parser.test.ts`,
`tests/diagrams/activity/layout/tile-layout.test.ts`; `docs/catalog.md`
on drift.

## Interface contract (consumed by T2, T5)

```ts
interface ActivityRepeat {
  kind: 'repeat';
  entry?: ActivityAction;   // `repeat :label;` — absent for a bare `repeat`
  body: ActivityNode[];     // never contains the entry
  condition: string;
  yesLabel?: string;        // `is (…)` — absent when not written or empty
  outLabel?: string;        // `not (…)`
  swimlane?: string; swimlaneOut?: string;
}
```

## Acceptance criteria

- Given `repeat :R1;\n:a;\nrepeat while (c)`, when parsed, then
  `entry.label === 'R1'` and `body` is `[a]`
- Given `repeat while (c) is (y) not (n)`, when parsed, then `yesLabel ===
  'y'` and `outLabel === 'n'`; given `repeat while (c)`, then both absent
- Given render-all before and after, when `cmp` runs, then 0 fixtures differ

## Observability / Rollback

N/A / **Reversible.**

## Quality bar

Targeted tests green; typecheck, lint, build exit 0; the orchestrator runs
`npm test`, the probe (must equal `base.json`) and render-all + `cmp` (0
movers), then resumes you to commit. Stage explicit paths.

## Commit

`feat(altp-T1): model a repeat's entry action and is/not labels in the AST`
