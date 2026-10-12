# T3b: description ELK wiring (conditional, D3)

Prepend [../batch-1/task-preamble.md](../batch-1/task-preamble.md).

## Task (TDD)
Upstream's ELK maker is cuca-level (`net/atmp/CucaDiagram.java:478-479`), so
description diagrams with `!pragma layout elk` take it too. The corpus has three:
c4 ×1, component ×1, unknown ×1. Their slugs are in `fixtures.md`'s last section.

1. Parse `!pragma layout elk` in the description parser (`CommandPragma.java:104-117`),
   and implement `requiresElk` on the description plugin.
2. **`src/diagrams/description/description-elk-adapter.ts`.** `ElkDiagramAdapter` over
   description sizing and leaf drawing (`src/core/svek/image/EntityImageDescription*`).
   Mirror the class adapter's shape: read T3a's spec, not its file, since you run in
   parallel.
3. Route `layoutEngine === 'elk'` through `makeElkLayout` + `MyElkDrawing` in the
   description renderer.
4. Drive the three fixtures. Fix those whose residual shares a mechanism with a class
   row *inside description files*. A needed `src/core/elk/**` change is **stop 1**:
   report it, and the orchestrator re-slots it to T3a or the residual round. Otherwise
   ledger each fixture with its mechanism.

## Write-set
`src/diagrams/description/index.ts`, `src/diagrams/description/parser.ts` (the pragma
line only), `src/diagrams/description/description-elk-adapter.ts` (new),
`src/diagrams/description/renderer.ts`, tests under `tests/unit/description/`.

Note: T1c also wrote `parser.ts`. Its batch-1 changes are merged before this batch.

## Read-set
`src/core/elk/**`; [T3a's spec](T3a-class-elk-wiring.md); the description plugin entry;
the three fixtures' `in.puml`/`in.svg`.

## Acceptance
- Given the three description ELK fixtures, then each is conformant, or ledgered with a
  Java-cited mechanism and an owner.
- Given every non-ELK description fixture, then bytes are unchanged (the description
  ratchets stay green).

## Architecture decisions (locked)
D3, D11, D13.
