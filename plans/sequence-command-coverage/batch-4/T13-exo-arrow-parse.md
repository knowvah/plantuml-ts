# T13 — `CommandExoArrowLeft` / `Right`: parse

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. An **exogenous** message has one
endpoint on a participant and the other on the diagram border: `[-> Bob`,
`Bob ->]`, `[<-> Bob`. Upstream models it as `MessageExo extends
AbstractMessage` with a `MessageExoType` of `FROM_LEFT` / `TO_LEFT` /
`FROM_RIGHT` / `TO_RIGHT`.

This is the mission's largest bucket — **~77 fixtures** — and its only feature
crossing parse, layout and render. It is **strictly sequential**: this task
parses (batch 4), T14 lays out (batch 5), T17 renders (batch 6). Do not
implement layout or render here.

## Task

Create `command-exo-arrow.ts`: `CommandExoArrowLeft` and `CommandExoArrowRight`
over a shared `CommandExoArrowAny` base, mirroring upstream's class structure.

Port, from the method bodies:
- both regexes (`CommandExoArrowLeft.java:56-92`,
  `CommandExoArrowRight.java:60-100`), built from T3's fragments
- `getMessageExoType(arg)` (`CommandExoArrowLeft.java:186-206`) — the `]`
  in `ARROW_SUPPCIRCLE2` selects the right border; `ARROW_DRESSING1` vs
  `ARROW_DRESSING2` selects the direction. Upstream throws
  `IllegalArgumentException` when neither dressing matched; this port must
  refuse rather than throw.
- the short-arrow rule: a `?` in `ARROW_SUPPCIRCLE2` means a short arrow
  (`isShortArrow()`)
- `ARROW_BOTHDRESSING` — a leading `<` before the body means an arrow in both
  directions
- the `o`/`x` decorations on **both** sides: `ARROW_SUPPCIRCLE2` is the border
  side, `ARROW_SUPPCIRCLE1` the participant side
- ACTIVATION, LIFECOLOR, URL, PARALLEL, ANCHOR, LABEL

Emit `MessageExoEvent` per T6's contract. Per D4, `parallel` and `anchor` are
stored and not drawn.

Register both commands in `sequence-command-registry.ts` at their
`initCommandsList` positions (`SequenceDiagramFactory.java:113-114`) —
**after** `CommandArrow`. That order is why they get the line at all:
`CommandArrow`'s `PART1` group is absent entirely for a leading bare arrow, so
it declines `[-> Bob`. **The order is frozen; a reorder is stop condition 2.**

## Write-set

- `src/diagrams/sequence/command-exo-arrow.ts` (new)
- `src/diagrams/sequence/sequence-command-registry.ts` — two insertions at
  their upstream positions; **no reordering**
- `tests/unit/sequence/command-exo-arrow.test.ts` (new)

Not `ast.ts`, not `command-arrow.ts` (T12 owns it this batch), not
`docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandExoArrowLeft.java:50-206` — **whole
  class**, including `explainArg`, which enumerates every group's meaning in
  prose and is the cheapest correct reading of the grammar
- `.../command/CommandExoArrowRight.java:55-140`
- `.../command/CommandExoArrowAny.java:62-220` — the shared base and `executeArg`
- `.../sequencediagram/MessageExo.java:44-110`,
  `.../sequencediagram/MessageExoType.java:38-78`
- `.../sequencediagram/SequenceDiagramFactory.java:111-114`
- `src/diagrams/sequence/sequence-arrow-regex.ts` (T3)
- `src/diagrams/sequence/ast.ts` — T6's `MessageExoEvent` contract
- `../diagrams/data-flow.md` — the dispatch path this task completes

## Prior observation — bears directly on this write-set

From `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md`, "The exo-arrow
trade": before the endpoint token was tightened to `PART1CODE` =
`([%pLN_.@]+)`, `\S+` let `PART1` swallow the `[` and invent a participant
named `[`. **Fifteen exo fixtures drew a wrong diagram instead of refusing**;
ten then reached an error page and were pinned `known-gap`. Any loosening of
the endpoint class silently reintroduces this. It is on-call risk 3 in the
brief.

## Architecture decisions in force

D3 (locked): exo arrows are their own `SequenceEvent` member, **not** a
`MessageEvent` with `from === to`. `MessageExo.isSelfMessage()` returns false
despite `getParticipant1() == getParticipant2()`, and
`sequence-layout-participants.ts:109` gates on `from !== to` — the separate
`kind` is what prevents a silent skip.
D2 (order frozen), D4 (`parallel`/`anchor` stored, not drawn). Locked.

## Interface contracts

Consumes T6's `MessageExoEvent`. Produces, for T14 and T17: `participant`,
`exoType`, `shortArrow`, `arrow` (an `ArrowConfiguration` with both
decorations), `label`, `lifeColor`, `url`.

## Acceptance criteria

- Given `[-> Bob`, then `exoType` is `FROM_LEFT`; given `Bob ->]`, then
  `TO_RIGHT`; given `[<- Bob`, then `TO_LEFT`; given `Bob <-]`, then
  `FROM_RIGHT`.
- Given `?-> Bob`, then `shortArrow` is true.
- Given `[o-> Bob`, then the border-side decoration is `CIRCLE`; given
  `[->o Bob`, then the participant-side decoration is.
- Given a line where neither dressing matches, then the command **refuses** —
  it does not throw.
- Given the ~77 pinned fixtures, then none refuses and all route `SEQUENCE`.
  They will render badly until T14/T17; that is expected here.

## Observability

N/A beyond the gates. Expect refusal SLI 2 and routing misroutes to fall by
~77 at batch close.

## Rollback

**Reversible.** New module plus two registry insertions.

## Quality bar

All four gates green; 90/90/90. Author `.puml` fixtures with
`scripts/oracle-render.sh <out-dir> <puml>` for any exo form the corpus does
not cover — never a hand-typed `java -jar`.

## Boundaries

- **Always**: read the whole upstream class, `explainArg` included; cite
  `file:line`.
- **Never**: widen the endpoint class toward `\S+`; never reorder the registry
  (STOP); never edit `ast.ts`; never implement layout or render here.
- **Ask first**: if a pinned fixture needs geometry to decide whether it parsed
  correctly, journal it and let T14 settle it — do not guess.

## Commit

`feat(T13): port CommandExoArrowLeft/Right parse into MessageExoEvent`

Body required: note that these fixtures render badly until T14/T17, and why the
registry position after `CommandArrow` is load-bearing.
