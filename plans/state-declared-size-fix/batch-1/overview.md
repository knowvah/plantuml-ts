# Batch 1 — Core seam, leaf sizing, line continuation, note-on-link, parse guards (parallel)

All five depend only on T0. Write-sets are disjoint. T1 produces the seam T6/T7
consume in Batch 2 (interface below). Agents run no git; orchestrator commits
each task by pathspec.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | Core creole-text seam `creoleTextLines` (D1) + tests | typescript-pro | `src/core/svek/image/creole-text-lines.ts`, `src/core/svek/image/creole-text-lines.test.ts` (or `tests/unit/core/…`) | T0 | [ ] |
| T2 | F3 — G7 EXPANSION_* rankdir sizes + G9 `hide empty description` threading | typescript-pro | `src/diagrams/state/state-leaf-node.ts`, `state-composite-pass.ts`, `state-entity-position.ts`, `tests/unit/state/state-leaf-node.test.ts`, ratchet entries | T0 | [ ] |
| T3 | F4 — G3 `ReadFilterMergeLines` port (D3), pipeline-wide | typescript-pro | `src/core/tim/ReadLineReader.ts` and/or the chain owner mirroring `preproc2/Preprocessor.java:50-54`, `src/core/BlockUmlBuilder.ts`, `src/core/tim/TContext.ts` (include path), `tests/unit/core/read-filter-merge-lines.test.ts`, ratchet entries | T0 | [ ] |
| T4 | F5 — G12 `note on link` reaches `transitionLabelText`; note drawn | typescript-pro | `src/diagrams/state/state-dot-graph.ts`, `state-transition-label.ts`, the note-on-link renderer file (agent names it — `renderer-note.ts` or `state-renderer-transitions.ts`), `tests/unit/state/state-note-attached-dot.test.ts`, ratchet entries | T0 | [ ] |
| T5 | F6 — G10 dotted-id display + G24 guards via `DiagramRefusal` (D2) | typescript-pro | `src/diagrams/state/state-parse-resolve.ts`, `state-parse-helpers.ts`, `tests/unit/state/state-dotted-id.test.ts`, `tests/unit/state/state-guards.test.ts`, ratchet entries | T0 | [ ] |

**Interface contract (T1 → T6, T7)** — locked shape, names may be refined by T1
and echoed in its report:
```ts
export interface CreoleTextRun { text: string; style: FontStyleFlags /* bold/italic/underline/strike */; color?: string; url?: string; }
export interface CreoleTextLine { runs: readonly CreoleTextRun[]; width: number; height: number; kind: 'text' | 'hr' | 'table-row'; }
export function creoleTextLines(display: string, font: FontSpec, measurer: StringMeasurer,
  opts?: { wrapWidth?: number; tabSize?: number; sprites?: SpriteDimsLookup }): readonly CreoleTextLine[];
```

**Expected manifest moves** (`render-manifest --diff`): T2 → state
`bujuta-44-rovo666`, `mimaga-15-doze740`, `nijugi-19-jazi166`,
`rinisi-79-peko570`, `bitaxo-18-tamo974`. T3 → the six trailing-`\` fixtures:
class `fokudo-49-xiki231`, `mocoda-55-take697`, `vubofi-17-dedi529`; state
`duzazu-41-telu529`, `vixobo-14-jole910`, `fibudu-53-bode309` — anything else
is README stop 4. T4 → `tumaba-64-tosu281`. T5 → `fovafu-44-mifu394`,
`tubojo-49-tudu915`, `cagego-53-vemo516`, `xacona-99-peze211`,
`zecivu-62-pagu681`, `fugedo-34-fice721`. T1 → none (no caller yet).
