# T2 — Split `sequence-layout-events.ts` to make headroom

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This mission adds a `messageExo` arm to
the sequence layout dispatch. `src/diagrams/sequence/sequence-layout-events.ts`
is 491 lines against a 500-line cap — **9 lines of headroom**. The complexity
hook blocks any edit that grows an over-cap file, so a later task adding that
arm would be blocked mid-flight.

## Task

Split into `sequence-layout-events.ts` (the dispatch loop) and a new
`src/diagrams/sequence/sequence-layout-message.ts` carrying `handleMessageEvent`
(reached from `:83`) and the helpers it uses, including the `style: event.style`
copy at `:151`.

**Pure move.** No renames, no simplification, no branch removal.

## Write-set

- `src/diagrams/sequence/sequence-layout-events.ts`
- `src/diagrams/sequence/sequence-layout-message.ts` (new)

Not `docs/catalog.md` — the orchestrator regenerates it at batch close.

## Read-set

- `src/diagrams/sequence/sequence-layout-events.ts` — whole file
- `src/diagrams/sequence/sequence-layout-shared.ts` — the existing shared seam
- `../decisions.md#d1` and `#d3`

## Architecture decisions in force

D1 (locked): `event.style` at `:151` becomes an `ArrowConfiguration` copy in
T6 — put that line in `sequence-layout-message.ts` so T6 edits one file.
D3 (locked): T14 adds a `messageExo` arm to the dispatch in
`sequence-layout-events.ts`; leave that file with room for it.

## Interface contracts

Consumed by T6 and T14. Export `handleMessageEvent` under its current name.

## Acceptance criteria

- Given the corpus, when the ratchet runs, then zero rise and zero fall.
- Given both gates, then SLI counts unchanged (163 refusal, 195 routing).
- Given `wc -l`, then both files under 500, with room left in
  `sequence-layout-events.ts` for a new dispatch arm.

## Observability

N/A — no new observable operations.

## Rollback

**Reversible.** Pure code move.

## Quality bar

All four gates green. Read ratchet output with `--reporter=verbose`.

## Boundaries

- **Never**: change behavior, rename an export, touch `ast.ts` or
  `docs/catalog.md`.

## Commit

`refactor(T2): split sequence-layout-events.ts for the exo dispatch arm`
