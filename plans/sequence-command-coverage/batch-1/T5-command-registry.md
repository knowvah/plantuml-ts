# T5 — Per-family command modules behind one frozen registry

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Upstream dispatches sequence commands
from ONE registration-ordered list built by
`SequenceDiagramFactory#initCommandsList` (`:99-155`), consumed by
`PSystemCommandFactory#getCandidate` (`:225-246`), first match wins.

This port has `COMMANDS` + `COMMANDS_2` in two files. `parser.ts:31` already
documents that split as "a file-size accommodation, not a second dispatch tier"
— i.e. a known structural divergence. Upstream architecture is authoritative:
a structural divergence IS the bug, and re-mirroring beats patching around it.

Ten of this mission's tasks add commands. Left as-is, every one collides on the
same two files and the whole mission serializes.

## Task

1. Create `src/diagrams/sequence/sequence-command-registry.ts` holding a single
   ordered array mirroring `initCommandsList:99-155` exactly.
2. Move the existing commands out of `sequence-commands.ts` /
   `sequence-commands-2.ts` into **one module per upstream command family** —
   the granularity at which `initCommandsList` groups them. Expect ~9:
   `command-arrow.ts`, `command-exo-arrow.ts`, `command-note-factory.ts`,
   `command-participant.ts`, `command-grouping.ts`, `command-autonumber.ts`,
   `command-lifeline.ts` (activate/deactivate/destroy), `command-page.ts`
   (newpage/ignorenewpage/autonewpage), `command-misc.ts` (divider/delay/
   hspace/footbox/ref/…).
3. Point `parser.ts`'s dispatch at the single registry; delete the
   `ALL_COMMANDS` two-array concatenation and the comment explaining it.
4. Add a test asserting the registry's order against `initCommandsList`.

**Pure move.** The set of commands and their relative order must not change.
Preserve upstream names, ugly ones included — 16 years of commits reference
them.

## Write-set

- `src/diagrams/sequence/sequence-command-registry.ts` (new)
- `src/diagrams/sequence/command-*.ts` (~9 new)
- `src/diagrams/sequence/sequence-commands.ts`, `sequence-commands-2.ts`
- `src/diagrams/sequence/parser.ts`
- `tests/unit/sequence/command-registry-order.test.ts` (new)

Not `docs/catalog.md` — the orchestrator regenerates it at batch close.

## Read-set

- `~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:99-155`
- `~/git/plantuml/.../command/PSystemCommandFactory.java:225-246`
- `src/diagrams/sequence/parser.ts` — whole file, especially `:20-40` and
  `runDispatchLoop`
- `src/diagrams/sequence/sequence-commands.ts`, `sequence-commands-2.ts`
- `../decisions.md#d2`

## Architecture decisions in force

**D2 (locked), and the order is FROZEN.** If a fixture only routes correctly
after reordering, **STOP** — this is stop condition 2. Precedent:
`sequence-engine-overclaims-nested-diagrams` halted at T2 when mirroring
`PSystemBuilder.java`'s factory order moved the routing gate **79 → 469**,
fixing 25 and newly misrouting 415. Registration order is load-bearing,
compensating for historical over-claim. Mirror `initCommandsList`'s order for
the *sequence* commands; do not touch engine registration in `src/index.ts`.

Note the ordering fact this mission depends on: `CommandArrow` is registered
**before** `CommandExoArrowLeft`/`Right` (`:111-114`), and declines `[-> Bob`
because its `PART1` group is absent entirely. That is why the exo commands get
the line.

## Interface contracts

Consumed by T7–T13. Export from `sequence-command-registry.ts`:

```
readonly SEQUENCE_COMMANDS: readonly SequenceCommand[]
```

where `SequenceCommand` keeps the existing `{ pattern, execute }` shape. A task
adding a command adds it to its family module and inserts one line in the
registry at its `initCommandsList` position.

## Acceptance criteria

- Given the corpus, when all three gates run, then results are **byte-identical
  to HEAD** — 163 refusal, 195 routing, zero ratchet movement.
- Given the registry and `initCommandsList:99-155`, when compared, then the
  order matches, and a test asserts it rather than a comment claiming it.
- Given `parser.ts`, when read, then it dispatches from one array and the
  two-tier comment is gone.
- Given every new module, then each is under 500 lines and every moved command
  keeps its original name.

## Observability

N/A — no new observable operations. The order-assertion test is the guard
against on-call risk 1 (silent registration drift).

## Rollback

**Reversible.** Pure structural move.

## Quality bar

All four gates green. Read gate output with `--reporter=verbose`.

## Boundaries

- **Always**: preserve command names and relative order exactly.
- **Never**: reorder to fix a fixture (STOP instead); never change
  `src/index.ts` engine registration; never edit `docs/catalog.md`.
- **Ask first**: if a command does not fit any family cleanly, journal the
  placement before choosing one.

## Commit

`refactor(T5): mirror initCommandsList with per-family command modules`

Body required (>3 files): explain that this removes the divergence `parser.ts`
already documented, and that the order is frozen.
