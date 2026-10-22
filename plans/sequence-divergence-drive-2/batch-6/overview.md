# Batch 6 — creole through core (D5)

Upstream sizes and draws every sequence label through one path:
`AbstractTextualComponent.java:84-90` → `Display.create0`
(`Display.java:644-669`) → `getCreole` → `SheetBlock1/2` (`:693-701`). The
port's `sequence-creole.ts` is a separate line parser; research D attributes
~85 structural rows to that (clusters A, B, K, M, R, S, T, V, W, X; MEDIUM).
Core already has the pipeline (`src/core/klimt/creole/DisplayCreole.ts`,
SheetBlock1/2, Fission, AtomTable/Tree/Emoji/OpenIconic,
CreoleHorizontalLine, `core/EmbeddedDiagram.ts`); activity consumes it via
`src/diagrams/activity/activity-creole-sheet.ts` — the template.

6a gates 6b (stop 7). 6c tasks run in parallel after 6b merges.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T6a](T6a-parity-probe.md) | 6a · parity probe: plain labels via core | typescript-pro (opus) | scratch + `$M/b6a-probe.md` | B5 | [ ] |
| [T6b](T6b-creole-seam.md) | 6b · seam + migrate every label; delete `sequence-creole.ts` | typescript-pro (opus) | new `sequence-creole-sheet.ts`, `text-block-geo.ts`, `sequence-text.ts`, `sequence-creole*.ts`, every label call site + tests | T6a | [ ] |
| [T6c](T6c-fission-wrap.md) | 6c · Fission wrap (`maxMessageSize`, `MaximumWidth`, `wrapWidth`) | typescript-pro (sonnet) | `sequence-creole-sheet.ts`, `geo-message.ts`, `geo-annotation.ts`, `sequence-skin-param.ts` + tests | T6b | [ ] |
| [T6d](T6d-note-body-capture.md) | 6c · empty-stripe `" "` atom; embedded `{{ }}` | typescript-pro (sonnet) | `parser.ts`, `sequence-layout-box.ts`, `text-block-geo.ts` + tests | T6b | [ ] |
| [T6e](T6e-svg-data-images.md) | 6c · `data:image/svg+xml` images | typescript-pro (sonnet) | `src/core/creole-atoms*.ts` (split first) + tests | T6b | [ ] |
| close | standard close **with the all-engine survey** + wall-clock check (stop 17), pin round 6 | orchestrator | per close-procedure | T6a–T6e | [ ] |

## Interface contract (T6b → T6c, T6d, T7a, T7g)
```ts
/** A sized label: upstream TextBlock from Display.create0 + SheetBlock. */
export interface LabelBlock {
  readonly width: number;
  readonly height: number;
  /** Primitives in the jar's emission order, relative to the block origin. */
  readonly primitives: readonly SequenceTextPrimitive[];
}
```
T6b names the factory (mirroring `activity-creole-sheet.ts`) and the
primitive union in its hand-back; T6c adds the `maxWidth` argument.
