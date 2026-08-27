# T6 — AST migration: `ArrowConfiguration`, `MessageExoEvent`, and the rest

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. The sequence AST models an arrow as
`MessageEvent.style: MessageStyle` — a flat 6-value enum (`sync`/`async`/
`reply`/`replyAsync`/`lost`/`found`) plus four booleans (`headCircle`,
`tailCircle`, `headCross`, `tailCross`).

Upstream models it as an `ArrowConfiguration`: orthogonal `ArrowHead ×
ArrowPart × ArrowDecoration` per side, plus body dashed and inclination, built
by `CommandArrow.executeArg` and handed to `new Message(...)`. **This port
already has a faithful `ArrowConfiguration`** at `sequence-arrowhead.ts:84` —
it is simply unreachable, because the only bridge to it,
`arrowConfigurationFor` (`:489`), hard-codes `dressing1: NONE, decoration1: NONE,
decoration2: NONE`.

Seven of this mission's buckets are named groups of one upstream regex feeding
that one object. They cannot be closed through a widening enum.

## Task

Land the whole data-model change in one commit, designed from the measured
bucket list so no later task edits `ast.ts`.

**Add:**
- `ArrowConfiguration` on `MessageEvent` and `MessageGeo` (replacing `style` and
  the four booleans).
- `MessageExoEvent` (`kind: 'messageExo'`) and a shared `AbstractMessageEvent`
  interface mirroring `AbstractMessage`, with `MessageEvent` and
  `MessageExoEvent` both extending it. Add `MessageExoEvent` to the
  `SequenceEvent` union.
- On messages: `url`, `stereotype`, `lifeColor`, `multicast`, `anchor`,
  `parallel`.
- On `NoteEvent`: VMERGE, `parallel`, `style` (`note`/`hnote`/`rnote`),
  `stereotype`.
- On `FrameEvent`: `parallel`.

**Delete:** `MessageStyle`, `ARROW_STYLE_MAP`, `REVERSE_ARROW_STYLE_MAP`,
`arrowConfigurationFor`. Also delete — do not amend — the comments at
`renderer-arrowhead.ts:426,445` asserting no `MessageStyle` can carry a CIRCLE;
they become false.

Every existing arrow form must produce the `ArrowConfiguration` that
`arrowConfigurationFor` produced for it. New fields land **declared and
unread**.

Adding a `kind` to the union will make all five `kind === 'message'` walkers
fail to compile until handled. That is intended (D3). Handle each deliberately;
do not add a catch-all.

## Write-set

- `src/diagrams/sequence/ast.ts` — **sole owner for the whole mission**
- `src/diagrams/sequence/sequence-parse-helpers.ts`
- `src/diagrams/sequence/sequence-arrowhead.ts`
- `src/diagrams/sequence/renderer-message.ts` (from T1)
- `src/diagrams/sequence/sequence-layout-message.ts` (from T2)
- `src/diagrams/sequence/command-arrow.ts` (from T5)
- `src/diagrams/sequence/renderer-arrowhead.ts` — comment deletion only
- `tests/unit/sequence/sequence-arrowhead.test.ts`
- `tests/unit/sequence/renderer.test.ts`

Not `docs/catalog.md`.

## Read-set

- `~/git/plantuml/.../command/CommandArrow.java:340-430` — `executeArg`, where
  the config is built. **Read the method body**, not a summary.
- `~/git/plantuml/.../skin/ArrowConfiguration.java:45-61,198-200`
- `~/git/plantuml/.../sequencediagram/MessageExo.java:44-110`
- `~/git/plantuml/.../sequencediagram/AbstractMessage.java:86-121`
- `src/diagrams/sequence/ast.ts:39-74,140-148,290-319`
- `src/diagrams/sequence/sequence-arrowhead.ts:16-30,429-495`
- `src/diagrams/sequence/sequence-parse-helpers.ts:158-195`
- The five walkers: `renderer.ts:489`, `sequence-layout-events.ts:83`,
  `scale-geo.ts:163`, `sequence-parse-helpers.ts:338`,
  `sequence-layout-participants.ts:109`
- `../decisions.md#d1` and `#d3`

## Prior observation — bears directly on this write-set

`sequence-layout-participants.ts:109` gates label-width scanning on
`ev.kind === 'message' && ev.from !== ev.to`. Upstream's
`MessageExo.isSelfMessage()` returns **false** even though
`getParticipant1() == getParticipant2()`. Modelling exo as a `MessageEvent`
with `from === to` would make that guard silently skip every exo label — the
quiet bug D3 exists to prevent. The separate `kind` is the guard.

## Architecture decisions in force

D1 and D3, both locked. If some arrow token has no faithful
`ArrowConfiguration`, **D1's premise is wrong** — that is stop condition 6.
Stop and journal; do not add a compensating flag.

## Interface contracts — consumed by T7–T17

```
ArrowConfiguration {
  dressing1: ArrowDressing; dressing2: ArrowDressing;
  decoration1: ArrowDecoration; decoration2: ArrowDecoration;
  dashed: boolean; inclination?: number;
}
AbstractMessageEvent {
  label: string; arrow: ArrowConfiguration;
  sequenceNumber?: number; sequenceLabel?: string;
  url?: string; stereotype?: string; lifeColor?: string;
  parallel?: boolean; anchor?: string;
}
MessageEvent extends AbstractMessageEvent {
  kind: 'message'; from: string; to: string;
  activates?: string; deactivates?: string; multicast?: readonly string[];
}
MessageExoEvent extends AbstractMessageEvent {
  kind: 'messageExo'; participant: string;
  exoType: 'FROM_LEFT' | 'TO_LEFT' | 'FROM_RIGHT' | 'TO_RIGHT';
  shortArrow: boolean;
}
```

Field names mirror upstream. `MessageGeo` carries the same `arrow` field.

## Acceptance criteria

- Given every arrow token the enumerated table parsed, when re-parsed, then the
  built `ArrowConfiguration` **equals** what `arrowConfigurationFor` produced
  for that token. Assert this exhaustively over all six old enum values, not by
  sampling.
- Given the corpus, when the ratchet runs, then zero rise and zero fall.
- Given both conformance gates, then SLI counts unchanged (163, 195).
- Given `grep -rn "MessageStyle" src/`, then no hits remain.
- Given `renderer-arrowhead.ts:420-460`, then the two false comments are gone,
  not reworded.
- Given each of the five walkers, then each handles `messageExo` explicitly —
  no catch-all, no `default:` that swallows it.

## Observability

N/A — no new observable operations. The zero-movement assertion is the gate.

## Rollback

**Reversible.** Internal types only; `src/index.ts` imports just
`sequencePlugin`, so nothing public changes.

## Quality bar

All four gates green. 90/90/90 coverage. Read ratchet output with
`--reporter=verbose`.

## Boundaries

- **Always**: read `CommandArrow.executeArg`'s body before encoding the
  config-building order; cite `file:line` on every ported constant.
- **Never**: fit a value; never add a flag to compensate for a token that will
  not model (STOP instead); never let a later task edit `ast.ts`.
- **Ask first**: if a walker's `messageExo` behavior is genuinely ambiguous
  from upstream, journal the reading before encoding it.

## Commit

`refactor(T6): model arrows as ArrowConfiguration and add MessageExoEvent`

Body required: state that this is a representation change gated on zero
movement, and why the flat enum could not carry the dressing grammar.
