# T10 — hspace, delay, empty divider, `hide` variant, participant-multilines

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. Five small unported commands account
for **~9 corpus fixtures**, each pinned with its `file:line`. None needs new
AST surface beyond what T6 declared.

## Task

- **`CommandHSpace`** `\|\|(\d+)?\|+` — explicit vertical spacing
  (`SequenceDiagramFactory.java:143`). This port's pattern is `^\|\|(\d+)?\|$`:
  it accepts exactly one trailing pipe where upstream accepts **one or more**.
  ~3 fixtures.
- **`CommandDelay`** — the `...` / `…` delay row (`:152`). Note the Unicode
  ellipsis alternative. ~2 fixtures.
- **`CommandDivider`** `==(.*)==` — which accepts an **empty** label
  (`CommandDivider.java:57-62`). This port requires `(.+?)`. ~1 fixture.
- **A `hide` variant beyond `CommandHideUnlinked`** (`:101`). Read which one
  the pinned fixture uses before implementing. ~1 fixture.
- **`CommandParticipantMultilines`** — the `participant X [ ... ]` block form,
  whose body is creole (one pinned fixture carries a `=heading`) (`:110`).
  ~2 fixtures.

`CommandParticipantMultilines` is the one with real body semantics. Note that
sequence creole is **not** ported: `creole-exposant-port` covered description,
class and state only, and `<sup>` stays literal in sequence by design. Parse
the block form and store its lines; do not build a creole pipeline here. If the
pinned fixtures need more than that, journal it for D6's census.

## Write-set

- `src/diagrams/sequence/command-misc.ts`
- `src/diagrams/sequence/command-participant.ts`
- `tests/unit/sequence/` — one test file per module

Not `ast.ts`, not `parser.ts` (T11 owns it this batch), not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandHSpace.java`, `CommandDelay.java`,
  `CommandDivider.java:57-62`, `CommandParticipantMultilines.java`
- `.../sequencediagram/SequenceDiagramFactory.java:99-155`
- `src/diagrams/sequence/sequence-commands.ts:312-356` — the current divider,
  delay and hspace patterns being widened
- The pinned `reason` strings for these fixtures in
  `oracle/goldens/svg-conformance/refusal-baseline.json`

## Prior observation

The pins came from a prior mission's classification and one has already been
found wrong elsewhere in this corpus. If a fixture's actual refusing line does
not match its pinned reason, **re-classify it, log the correction, and
continue** — this is a push-forward, not a stop.

## Architecture decisions in force

D2 (registration order frozen). Locked.

## Interface contracts

Consumes T6's existing `DividerEvent`, `DelayEvent`, `SpaceEvent`, `Participant`.
Produces no new interface.

## Acceptance criteria

- Given `||50|||`, then it parses — one or more trailing pipes, not exactly one.
- Given `==  ==` (empty label), then a divider with an empty label parses.
- Given `…` (U+2026) on its own line, then a delay parses.
- Given `participant X [\n =heading\n]`, then the block form parses and its
  lines are stored.
- Given the ~9 pinned fixtures, then none refuses and all route `SEQUENCE`.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** Two command modules.

## Quality bar

All four gates green; 90/90/90.

## Boundaries

- **Always**: read the Java method body; cite `file:line`.
- **Never**: fit a pattern; never edit `ast.ts` or `parser.ts`; never build a
  creole pipeline here.
- **Ask first**: if a widened pattern starts claiming lines another command
  used to own, journal before shipping — that is a routing risk.

## Commit

`feat(T10): widen hspace, delay and divider; port participant-multilines`
