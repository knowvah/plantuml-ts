# T12 — Decorated dressing and the trailing modifiers

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. T7 rebuilt `CommandArrow` from composed
named groups at behavior parity, shipping the basic dressing (`<`, `>`, `<<`,
`>>`). This task adds the rest of the grammar and closes **~45 fixtures** —
the mission's second-largest bucket.

## Task

**Decorated dressing** (~20 fixtures) — `ARROW_DRESSING1`/`ARROW_DRESSING2`
(`CommandArrow.java:99-116`):
- `o` / `x` — the circle and cross heads. Upstream matches them as `[%s][ox]`
  on the left and `[ox][%s]` on the right: **the space is part of the pattern.**
- `/` and `\` (and `//`, `\\`) — the half-heads, which map to `ArrowPart`
  `TOP_PART` / `BOTTOM_PART`.
- inclination `\(\d+\)` (`:101,113`) — the slanted-arrow form (~6 fixtures).

**Trailing modifiers** (~25 fixtures):
- `ACTIVATION` `(\+\+|\*\*|!!|--|--\+\+|\+\+--)?` and `LIFECOLOR` `(#\w+)?`
  (`:126,128`) — ~8 fixtures. Note this port's `ActivationEvent.kind` has no
  CREATE/DESTROY variant, so `**`/`!!` currently only activate/deactivate; if
  the pinned fixtures need more, journal it for D6's census.
- `UrlBuilder.OPTIONAL` / `CommandUrl` (`:130`;
  `SequenceDiagramFactory.java:155`) — a `[[link]]` on a message or participant
  (~13 fixtures).
- `StereotypePattern.optional("STEREOTYPE")` (`:129`) — ~4 fixtures.

Also handle **case-insensitivity**: every upstream command regex is compiled
with `Pattern.CASE_INSENSITIVE` (`Pattern2.java`), and one fixture is pinned on
an `[ox]` matched case-insensitively.

Populate the AST fields T6 declared. This task is **parse only** — T15 and T16
render the results.

## Write-set

- `src/diagrams/sequence/command-arrow.ts`
- `tests/unit/sequence/command-arrow.test.ts`

Not `ast.ts`, not the registry (order unchanged), not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandArrow.java:99-133` (dressing and trailing
  groups), `:229-235` (decoration application), `:296-338` (dressing → config),
  `:340-430` (`executeArg`). **Read the method bodies.**
- `~/git/plantuml/.../skin/ArrowConfiguration.java`, `ArrowPart.java`,
  `ArrowDecoration.java`, `ArrowHead.java`
- `~/git/plantuml/.../url/UrlBuilder.java`, `.../stereo/StereotypePattern.java`
- `src/diagrams/sequence/sequence-arrow-regex.ts` (T3)
- `src/diagrams/sequence/sequence-arrowhead.ts:49-100` — the port's
  `ArrowHeadKind`, `ArrowPart`, `ArrowDecoration`, already faithful

## Prior observation — bears directly on this write-set

Jar-verified: `A ->o B` carries a circle decoration, while `A->oB` declares a
participant named `oB` — because the decoration pattern is `[%s][ox]` and needs
the space. That half was already correct before this mission and must stay
correct. Separately, the endpoint class must remain `([%pLN_.@]+)`; widening it
toward `\S+` reintroduces a bug that made 15 exo fixtures draw a wrong diagram
instead of refusing.

## Architecture decisions in force

D1 (arrows are `ArrowConfiguration` — the dressing grammar is exactly why the
flat enum had to go), D2 (order frozen). Locked.

## Interface contracts

Consumes T6's `ArrowConfiguration`. Produces, for T15/T16: populated
`decoration1`/`decoration2` (`CIRCLE`), `dressing1`/`dressing2` with
`part: TOP_PART | BOTTOM_PART` for half-heads, `inclination`, plus `lifeColor`,
`url`, `stereotype` on the message.

## Acceptance criteria

- Given `A ->o B`, then `decoration2 === 'CIRCLE'`; given `A->oB`, then a
  participant named `oB` is declared.
- Given `A ->x B`, then the head is `CROSSX`.
- Given `A -\ B` and `A -/ B`, then `part` is `BOTTOM_PART` / `TOP_PART` per
  upstream's mapping — cite the line you read it from.
- Given `A -(30)-> B`, then `inclination` is 30.
- Given `A -> B ++ #red [[http://x]] <<s>>`, then activation, `lifeColor`,
  `url` and `stereotype` all land on the message.
- Given the ~45 pinned fixtures, then none refuses and all route `SEQUENCE`.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** Single command module.

## Quality bar

All four gates green; 90/90/90. Author `.puml` fixtures with
`scripts/oracle-render.sh <out-dir> <puml>` where a branch has no corpus
fixture — never a hand-typed `java -jar`.

## Boundaries

- **Always**: read the Java method body first; cite `file:line` on every
  mapping, especially the half-head → `ArrowPart` one.
- **Never**: fit a pattern; never widen the endpoint class; never edit
  `ast.ts`.
- **Ask first**: before deferring `**`/`!!` CREATE/DESTROY semantics — measure
  the fixture cost and journal it.

## Commit

`feat(T12): port arrow dressing decorations and trailing modifiers`
