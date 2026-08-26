# T16 — Render lifecolor, url and stereotype

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. T12 parses three trailing modifiers on
a message — `LIFECOLOR` (`#\w+`), a `[[link]]` url, and a `<<stereotype>>` —
into the fields T6 declared. **~25 fixtures** are pinned across them. Nothing
draws them yet.

## Task

- **LIFECOLOR** (`CommandArrow.java:128`, applied at `:430`+) — the color
  applied to the activation bar the message starts. Read how upstream applies
  it to the life event, not to the arrow.
- **URL** (`UrlBuilder.OPTIONAL`, `CommandArrow.java:130`; `CommandUrl` at
  `SequenceDiagramFactory.java:155`) — upstream wraps the target in an anchor.
  Check how other engines in **this port** already emit urls before inventing
  a shape; there is existing precedent and it should not be duplicated.
- **STEREOTYPE** (`StereotypePattern.optional("STEREOTYPE")`, `:129`, applied
  at `:412-414`) — drawn with the message label.

## Write-set

- `src/diagrams/sequence/renderer-message.ts`
- `src/diagrams/sequence/sequence-layout-message.ts` — **ADDED 2026-08-26 by
  the batch-2 close.** T6 declared `url`/`stereotype`/`lifeColor` on
  `MessageGeo` but does NOT copy them through `buildMessageGeo` (a passthrough
  then would have been three always-false branches with no way to exercise
  them). This task must populate them there before it can render them.
- `tests/unit/sequence/renderer.test.ts`

Not `sequence-arrowhead.ts` or `renderer-arrowhead.ts` (T15 owns both this
batch), not `ast.ts`, not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandArrow.java:400-440` — where `executeArg`
  applies url, stereotype and lifecolor. **Read the method body.**
- `~/git/plantuml/.../url/Url.java`, `UrlBuilder.java`
- `~/git/plantuml/.../stereo/Stereotype.java`
- `src/diagrams/sequence/renderer-message.ts` (from T1)
- `docs/catalog.md` — search for an existing url-emitting helper before writing
  one; CLAUDE.md warns that agents routinely rebuild what already exists
- `src/core/svg.ts` — `svgRoot` and the shared emission helpers

## Architecture decisions in force

D1 (arrows are `ArrowConfiguration`), D6 (coverage is the deliverable —
getting these pixel-exact is not required here, but they must draw).

## Interface contracts

Consumes T6's `url`, `stereotype`, `lifeColor` on `MessageEvent`/`MessageGeo`
and T12's population of them. Produces no new interface.

## Acceptance criteria

- Given `A -> B ++ #red`, when rendered, then the activation bar carries the
  color — applied to the life event, per the line you cite.
- Given `A -> B [[http://example.com]]`, then the message is wrapped in an
  anchor, using the port's existing url helper rather than a new one.
- Given `A -> B <<stereo>> : hi`, then the stereotype is drawn with the label.
- Given the corpus, then no already-`baseline` fixture rises without a T4
  verdict.

## Observability

N/A beyond the gates.

## Rollback

**Reversible.** One render module.

## Quality bar

All four gates green; 90/90/90. Verify with `scripts/oracle-render.sh`.

## Boundaries

- **Always**: check `docs/catalog.md` for an existing helper before writing a
  new one; cite `file:line`.
- **Never**: fit a value; never edit the arrowhead modules or `ast.ts`.
- **Ask first**: if url emission would change shared `core/` code, that is stop
  condition 5 — journal and stop.

## Commit

`feat(T16): render message lifecolor, url and stereotype`
