# T2 halt — upstream's registration order is unsafe without upstream's parse-attempt

Diagnosed 2026-08-23 on `feat/routing-conformance`, mission
`sequence-engine-overclaims-nested-diagrams`, batch 2. The reorder was
implemented, measured, and **reverted**. Nothing from it landed.

## Observation: mirroring PSystemBuilder's factory order costs 415 fixtures to save 25

- **Context**: D1 directs that `src/index.ts`'s registration order be
  re-mirrored to `PSystemBuilder.java:133-200`, on the evidence that sequence
  is upstream's first real diagram factory (`:135`) and this port's last.
  T1's routing gate was built first precisely to measure the result.
- **Finding**: with the order mirrored exactly, the gate moves
  **79 -> 469**. 25 fixtures are fixed; **415 previously-correct fixtures
  newly misroute**.

  | jar -> ours | n | mechanism |
  |---|---|---|
  | STATE -> DESCRIPTION | 152 | B |
  | CLASS -> SEQUENCE | 151 | A |
  | STATE -> SEQUENCE | 96 | A |
  | DESCRIPTION -> SEQUENCE | 12 | A |
  | NONE -> SEQUENCE | 3 | A |
  | NONE -> DESCRIPTION | 1 | B |

- **Impact**: D1 cannot be implemented as written. The order is not the
  independent variable it was taken to be — it is safe upstream only because
  of what upstream uses to break ties.
- **Confidence**: High — measured over all 3158 fixtures, both mechanisms
  independently accounted for with no residual.

### Mechanism A — sequence first + a context-free `accepts()`: 262 fixtures

`src/diagrams/sequence/index.ts:20`, `SEQUENCE_PATTERNS[0]` is
`/->>?|-->>?/` — unanchored and context-free, matched against each of the
first 20 lines. `DiagramRegistry#resolve` (`src/core/dispatcher.ts:249-253`)
returns the FIRST plugin whose `accepts()` is true, so moving
`sequencePlugin` to position 1 gives that regex first refusal on the whole
corpus.

Measured directly: `sequencePlugin.accepts()` returns true for **1351** of
3158 fixtures, of which **270 are not sequence diagrams** (152 CLASS,
96 STATE, 12 DESCRIPTION, 10 NONE per the jar) — a 20% false-positive rate.
262 of those 270 were routing correctly before and broke; the other 8 were
already misrouted.

### Mechanism B — description before state: 153 fixtures

Upstream has `DescriptionDiagramFactory` at `:138` and `StateDiagramFactory`
at `:139`; this port had state first. Mirroring the pair moves every source
both engines accept from state to description.

Measured directly: **153** fixtures are accepted by BOTH `descriptionPlugin`
and `statePlugin`. The jar calls **152 of them STATE** and 1 NONE — exactly
the observed regression, no residual. Description's `accepts()` over-claims
state diagrams by that margin, and only registration order was hiding it.

## Observation: this is decidable only by attempting the parse (D2's option B)

- **Context**: establishing whether any task later in the mission could make
  the reorder safe, before recording the halt.
- **Finding**: no.
  - **T3's candidate-type filter (D4) has no reach.** `DiagramType.getTypes`
    (`DiagramType.java:197-201`) maps `@startuml` to
    `{SEQUENCE, STATE, CLASS, OBJECT, ACTIVITY, DESCRIPTION, COMPOSITE,
    TIMING, HELP, SPRITES}` — sequence, class, state and description are all
    candidates simultaneously — and `createPSystem`
    (`PSystemBuilder.java:257-266`) then takes the first whose parse
    succeeds. **3039 of 3158 fixtures (96.2%) are `@startuml`**; the other
    119 are `@startjson` (60), `@startyaml` (45), `@startdot` (10),
    `@starthcl` (4), which already route correctly through the existing typed
    fast path. The filter can only ever separate sources that are already
    separated.
  - **T4's arrow anchoring does not reach it either.** Of the 262 fixtures
    mechanism A breaks, **217 (82.8%)** contain a real arrow in real arrow
    position — `p1 --> cl2`, `Sally --> Bob`,
    `ClassA --> ClassB : -var1`. Anchoring the pattern (T4's stated task,
    whose AC2 requires `A -> B : msg` to keep matching) removes at most the
    other 17.2%. A class relation and a sequence message are the same string;
    no per-line regex can separate them.
- **Impact**: the discriminator genuinely is "does the whole document parse
  as a sequence diagram" — `PSystemBuilder.java:258-266`'s
  `isOk(f.createSystem(...))`, i.e. **D2's deferred option B**. Recorded as
  the stop the mission's README anticipated: "The residual can only be closed
  by parse-attempt — that is D2's deferred mission. Stop and record; do not
  start it."
- **Confidence**: High — every claim measured or read from the cited Java.

## The order derivation, preserved for the deferred mission

Deriving the mapping was most of T2's work and it is correct; only its
consequence is unsafe. Two entries are not one-to-one, and both were settled
by reading the factories' command lists, not by matching names:

| plugin | upstream factory | `PSystemBuilder.java` |
|---|---|---|
| `sequencePlugin` | `SequenceDiagramFactory` | :135 |
| `classPlugin` | `ClassDiagramFactory` | :136 |
| `descriptionPlugin` | `DescriptionDiagramFactory` | :138 |
| `statePlugin` | `StateDiagramFactory` | :139 |
| `activityPlugin` | **`ActivityDiagramFactory3`** | :140 |
| `dotPlugin` | `PSystemDotFactory` | :154 |
| `chartPlugin` | `ChartDiagramFactory` | :158 |
| `packetdiagPlugin` | `PacketDiagramFactory` | :159 |
| `chronologyPlugin` | `ChronologyDiagramFactory` (**commented out**) | :184 |
| `jsonPlugin` | `JsonDiagramFactory` | :190 |
| `filesPlugin` | `FilesDiagramFactory` | :192 |
| `boardPlugin` | `BoardDiagramFactory` | :193 |
| `yamlPlugin` | `YamlDiagramFactory` | :194 |
| `hclPlugin` | `HclDiagramFactory` | :195 |

- `activityPlugin` mirrors `ActivityDiagramFactory3` (`:140`), **not** the
  same-named `ActivityDiagramFactory` (`:137`). The `:137` factory's commands
  are `CommandLinkActivity` / `CommandLinkLongActivity` — the `(*) --> "step"`
  syntax, for which this port has no `accepts()` pattern at all. Every pattern
  it does have (`start`, `stop`, `:action;`, `if (`, `while (`, `repeat`,
  `fork`, `split`, `|swimlane|`) is a command of
  `ActivityDiagramFactory3.java:105-150`. So activity sorts after state.
- `chronologyPlugin` has no enabled counterpart: `ChronologyDiagramFactory` is
  commented out at `:184`, between `GanttDiagramFactory` (`:183`) and
  `FlowDiagramFactory` (`:185`) — neither ported, both after
  `PacketDiagramFactory` (`:159`) and before `JsonDiagramFactory` (`:190`).
  That fixes its slot without interleaving it among the ported factories.
- `ActivityDiagramFactory` (`:137`) and every `PSystem*Factory` upstream
  carries for its non-diagram pages are simply unported — gaps in the list,
  not placement decisions.

## What would have to be true for the reorder to land

Both `accepts()` seams would have to become as discriminating as upstream's
parse — sequence's against class/state/description relations, and
description's against state. That is strict unrecognised-line handling across
the engines, which D2 already measured as "genuinely large AND separable" and
filed as its own mission. Until then, the current order is load-bearing:
it is compensating for heuristic over-claim, and it should not be described
as merely "inverted from upstream".
