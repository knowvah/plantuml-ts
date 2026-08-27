# Batch 1 — Re-mirror the child sequence under the root `<g>`

**Strictly sequential.** All three tasks write
`src/diagrams/sequence/renderer.ts`; that is one write-set, so they are one
worker, not three (`rules/parallelism.md` — collapse, never collide).

| Task | Title | Done |
|---|---|---|
| [T1](./T1-lifeline-group.md) | Extract the line components, then emit the lifeline `<g><title>` + hover rect | [ ] |
| [T2](./T2-activation-group.md) | Wrap activations and hoist them into the lifeline pass | [ ] |
| [T3](./T3-footbox-order.md) | Draw the footbox before the foreground tiles | [ ] |

## Blocking precondition — read before T1

`src/diagrams/sequence/renderer.ts` is **512 lines**. The complexity hook
(`~/.claude/hooks/check-complexity.py`, `PostToolUse` on Write/Edit) blocks at
500, and this repo is not on `complexity-ignore`. **Every edit to that file is
blocked until content moves out of it.**

T1 therefore begins with an extraction, and the extraction is not a
refactor-of-convenience: it mirrors upstream, where these two components are
their own classes (`skin/rose/ComponentRoseLine.java`,
`skin/rose/ComponentRoseActiveLine.java`) rather than inline drawing code.
Sibling precedent already exists in this engine —
`renderer-participant-shapes.ts`, `renderer-message.ts`,
`renderer-arrowhead.ts`.

Target module: **`src/diagrams/sequence/renderer-lifeline.ts`**, taking
`renderLifeline` and `renderActivation` out of `renderer.ts`.

## Per-task measurement protocol

Each task ends by measuring, and the measurement is read, not summarised:

```
npx vitest run tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts
```

Then, for at least `celego-19-laji937`, **dump the diff records and read the
tag sequence** — Σ weightedScore alone cannot tell you whether alignment
improved or something else moved (D7).

Record in the journal: Σ weightedScore before → after, the count of fixtures
that fell, and any that rose. **A rise halts the batch** (stop condition 1).

## Batch close

1. All four quality gates green.
2. `git diff --name-only` against the batch base lists only:
   - `src/diagrams/sequence/renderer.ts`
   - `src/diagrams/sequence/renderer-lifeline.ts`
   - the batch's own test files
   - `docs/catalog.md` (regenerated — a new module means a new catalog row)
3. Three commits, one per task, `feat(T1):` / `feat(T2):` / `feat(T3):`.
4. Mark the boxes here **and** in the mission `README.md`.
5. Compact before batch 2.
