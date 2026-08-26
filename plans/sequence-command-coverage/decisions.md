# Architecture decisions — sequence-command-coverage

All seven approved 2026-08-26 before execution. **Locked.** If a task
discovers a conflicting constraint, STOP and journal it — do not silently
override.

## D1 — `MessageStyle` is replaced by a parsed `ArrowConfiguration`

**Context.** `MessageEvent.style` is a flat 6-value enum (`sync`/`async`/
`reply`/`replyAsync`/`lost`/`found`) plus four booleans. Upstream's
`CommandArrow` builds an `ArrowConfiguration` — orthogonal `ArrowHead ×
ArrowPart × ArrowDecoration` per side, plus body dashed and inclination — and
hands it to `new Message(...)`. Seven of this mission's buckets (dressing,
style, activation, lifecolor, stereotype, multicast, url) are named groups of
that one regex feeding that one object.

**Decision.** The parser builds `ArrowConfiguration` directly onto the AST.
Delete `MessageStyle`, `ARROW_STYLE_MAP`, `REVERSE_ARROW_STYLE_MAP`, and the
lossy adapter `arrowConfigurationFor` (`sequence-arrowhead.ts:489`), which
hard-codes `dressing1: NONE, decoration1/2: NONE`.

**Consequences.** Measured blast radius is two read sites — `renderer.ts:279`
and `sequence-layout-events.ts:151` — plus one type and two test files. The
faithful model already exists at `sequence-arrowhead.ts:84`. The comments at
`renderer-arrowhead.ts:426,445` asserting no `MessageStyle` can carry a CIRCLE
become false and must be deleted, not amended.

@see sequencediagram/command/CommandArrow.java:340-430; skin/ArrowConfiguration.java:45-61

## D2 — One module per upstream command family, behind one frozen registry

**Context.** `parser.ts:31` already documents `COMMANDS` + `COMMANDS_2` as "a
file-size accommodation, not a second dispatch tier" against upstream's single
registration-ordered list. That is a known structural divergence.

**Decision.** One module per command *family* as `initCommandsList` groups them
(~9: arrow, exo-arrow, note-factory, participant, grouping, autonumber,
lifeline, page, misc), plus `sequence-command-registry.ts` holding ONE ordered
list mirroring `SequenceDiagramFactory#initCommandsList:99-155`. A test asserts
the order against the Java.

**Consequences.** Re-mirroring, not refactoring — it removes a divergence. It
also dissolves the write-set conflict that would otherwise serialize every
command task onto two files. **Registration order is FROZEN** (see
`constraints.md` stop 2).

## D3 — Exo arrows get their own `SequenceEvent` member

**Context.** `MessageExo.isSelfMessage()` returns `false` even though
`getParticipant1() == getParticipant2()`. This port's
`sequence-layout-participants.ts:109` gates label-width scanning on
`ev.from !== ev.to`.

**Decision.** `MessageExoEvent` (`kind: 'messageExo'`) alongside
`MessageEvent`, both over a shared `AbstractMessageEvent` interface mirroring
`AbstractMessage`. NOT a flag on `MessageEvent` with `from === to`.

**Consequences.** Under the rejected option, exo messages would be silently
skipped by that guard — a quiet layout bug. The discriminant turns all five
`kind === 'message'` walkers into compile errors until each is handled
deliberately: `renderer.ts:489`, `sequence-layout-events.ts:83`,
`scale-geo.ts:163`, `sequence-parse-helpers.ts:338`,
`sequence-layout-participants.ts:109`. Exo x-extent must feed diagram width per
`MessageExoArrow#getRightEndInternal`'s `Math.max(maxX, …)`.

@see sequencediagram/MessageExo.java:44-110; sequencediagram/graphic/MessageExoArrow.java:84-120

## D4 — PARALLEL `&` and ANCHOR `{name}` are parsed, stored, and NOT drawn

**Context.** This looked like it needed a `DIVERGENCES.md` entry.

**Decision.** Parse into the AST; the renderer ignores them — because that is
exactly what upstream does. Every consumer of `isParallel()` and `getAnchor()`
lives under `sequencediagram/teoz/`: `teoz/CommunicationTile.java:114,316-317`,
`teoz/GroupingTile.java:145,864`, `teoz/NoteTile.java:91`,
`teoz/CommunicationExoTile.java:81`, `teoz/AbstractTile.java:72`. The classic
`sequencediagram/graphic/` renderer reads neither.

**Consequences.** 13 fixtures (10 grouping-`&`, 3 anchor) are parse-only, with
no layout or render component. **No divergence to document** — writing one
would misrepresent upstream. If `!pragma teoz` ever lands, the AST already
carries what it needs.

## D5 — Ratchet rises are adjudicated by child-count distance

**Context.** `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md` measured
this exact scenario at whole-population scale: when the port starts emitting
content it previously dropped, `weightedScore` rises even as output moves
*closer* to the golden. 162 of 242 rises were artefacts (98.6% of total rise);
the 35 real regressions were invisible underneath them.

**Decision.** For every rise, measure top-level child count against the golden
before and after. **Closer ⇒ artefact, re-pin. Further or unchanged ⇒ real
regression, diagnose per `rules/diagnosis.md`.** T4 builds the instrument.

**Consequences.** The ratchet header's claim that "a rise has no benign reading
left" is true within one comparison and false across a change that grows our
output. Re-pinning adjudicated artefacts is correct and is not hiding a
regression. Every measurement must pass `tests/helpers/fixture-include-store.ts`
AND `DeterministicMeasurer` — see `prior-observations.md`.

## D6 — Coverage is the deliverable; fidelity residuals are measured and filed

**Decision.** A bucket closes when its fixtures parse, route to `SEQUENCE`, and
carry a freshly measured diff-baseline score. Getting those scores *low* is not
this mission's target.

**Consequences.** CLAUDE.md's bar is pleasing aesthetic alignment and this does
not abandon it — 195 newly-rendering fixtures cannot reach that bar inside one
mission, and pretending otherwise produces an unbounded brief. The honest form
is to measure every one, pin it, and file a per-bucket residual census as a
tracked follow-on (T20). A divergence is a considered product choice, never an
effort excuse — which is why the census is mandatory, not optional.

## D7 — One brief, seven batches

**Decision.** One mission, not two, despite a natural cut between
arrow-grammar-dependent work (134 fixtures) and independent work (59).

**Consequences.** The two halves run as parallel batches. Re-pinning three
baselines plus a full census is the single most expensive step and doing it
twice roughly doubles it. **This brief is larger than the 1–4 hour norm.**
Batches are ordered so each ends at a committable, gate-green boundary, so the
mission can be stopped and resumed between them.
