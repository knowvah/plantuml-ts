# Mission: `sequence-engine-overclaims-nested-diagrams`

**Branch:** `feat/routing-conformance` · **Planned:** 2026-08-23 ·
**Baseline commit:** `f66f6abb` (main, clean tree, all gates green)

## Objective

Make every diagram source reach the engine that upstream gives it to.
**86 of 2674 cached fixtures route to a different engine than the jar does**,
and nothing catches it: every affected fixture still renders, just wrongly, so
no gate, golden or ratchet fails. This mission builds the missing gate first,
then closes the gap — the largest single cause being that our plugin
registration order is *inverted* from upstream's.

## The measured defect — verify, do not re-derive

Measured 2026-08-23 by rendering all 2674 `test-results/dot-cache` fixtures
and comparing our `data-diagram-type` against **the jar's own**, read from
each cached `in.svg`. That is the oracle; corpus directory names are not
(`populate-corpus.py` over-selects, and its own notes say so).

**2588 agree · 86 disagree.**

| jar says | we route to | n |
|---|---|---|
| SEQUENCE | DESCRIPTION | 34 |
| SEQUENCE | NONE | 12 |
| SEQUENCE | JSON | 12 |
| SEQUENCE | CLASS | 10 |
| SEQUENCE | YAML | 2 |
| DESCRIPTION | NONE | 6 |
| CLASS | NONE | 4 |
| NONE | CLASS | 3 |
| CLASS | DESCRIPTION | 2 |
| **CLASS** | **SEQUENCE** | **1** |

**Two corrections to this mission's own filed title.** Sequence
**under**claims 70 and overclaims exactly 1 — the ratio is inverted from what
"overclaims" implies. And the jar calls the one overclaimed fixture
(`zuvila-56-nuda425`) **CLASS**, not OBJECT, so `classPlugin` should own it.
The title is kept because it is the filed name in `planning/next-missions.md`.

## Root cause, established before planning

`PSystemBuilder.java:133-141` runs its factories
`Sequence → Class → Activity → Description → State`.
`src/index.ts:70-87` runs `Class → State → Description → Activity → … →
Sequence` **last**. Sequence is FIRST upstream and LAST here, so class,
description, json and yaml get first refusal on sequence diagrams. That
single inversion accounts for the entire 70-fixture underclaim bucket.

Three confirmed per-bucket mechanisms, each from source:

1. `butofu-60-kene642` — plain sequence (`participant`, `queue bar as q`,
   `f -> q`) routes to DESCRIPTION because sequence's own
   `hasDescriptiveSignal` guard **over-declines**: `queue` is both a sequence
   participant type and a description keyword.
2. `debufa-67-poma789` — sequence claimed by **JSON** on the prose text
   `struct timespec initialTimeout={1,0}`.
3. `zuvila-56-nuda425` — `SEQUENCE_PATTERNS[0]` is `/->>?|-->>?/`,
   **unanchored**, matching `-->` inside the string literal `$arrow("-->")`.

## Exit bar

- The routing gate exists, covers **both** fixture trees, and ratchets down
- The 86 known misroutes fall; **zero** fixtures newly misroute
- **Zero** of the 482 promoted zero-diff fixtures are de-promoted
- All four gates green

## Quality gates — all four, between every batch

```
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only HEAD~1
  pass: output matches the batch's declared write-set only
  on_fail: stop
```

## Batches

| Batch | Tasks | Parallel | Status |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 routing-conformance gate | — | [x] |
| [2](batch-2/overview.md) | T2 registration order | — | **HALTED** |
| [3](batch-3/overview.md) | T3 candidate-type filter | — | blocked by T2 |
| [4](batch-4/overview.md) | T4 · T5 · T6 · T7 heuristic repair | yes | blocked by T2 |
| [5](batch-5/overview.md) | T8 re-pin · T9 integrity guard | yes | blocked by T2 |

**T2 and T3 are deliberately sequential** though their write-sets are
disjoint: both change routing corpus-wide, and landing them together makes a
moved fixture unattributable — which defeats building T1 first.

## Stop conditions

- A file outside the current task's write-set needs changing, and it is in no
  other task's write-set either
- Two consecutive quality-gate failures on the same check
- A decision in [decisions.md](decisions.md) is contradicted by what the code
  turns out to require
- **Any fixture NEWLY misroutes.** The gate ratchets down only. A fall is the
  goal; a rise means a reorder or heuristic took a currently-correct fixture
- **Any of the 482 promoted zero-diff fixtures is de-promoted** across the 10
  `ratchet.json` files. Highest-consequence failure here: it means a routing
  change moved a fixture that was byte-exact against the jar
- **A heuristic repair would WIDEN a pattern rather than narrow it.** Widening
  is how the over-claim class arose; if closing a bucket seems to need a
  broader match, the mechanism has been misread
- **The residual can only be closed by parse-attempt** — that is
  [D2](decisions.md#d2)'s deferred mission. Stop and record; do not start it
- A constant is needed that has no upstream `file:line` citation
- A baseline outside the measured moved set shifts

## Push forward without asking

- Naming inside new modules; formatting; test-helper placement
- Adding test cases beyond the listed acceptance criteria
- **A batch-4 task whose bucket is already empty after T3** — close it as a
  measured no-op and record the measurement; do not invent work for it
- A mass FALL in the misroute count — the intended outcome; record and continue
- Splitting a function to stay under the hook's limits (30 NLOC / 10 CCN /
  5 params / 500 lines)
- Regenerating `docs/catalog.md` when a `src/` module is added — it is
  drift-gated and in no task's write-set by default

## Repo conventions this mission must honour

- **Diagrams are PlantUML**, in ```` ```plantuml ```` fences — overrides any
  skill default. The source must actually parse; render and check it
- **Never run Prettier.** No config, not a dependency; it rewrites every
  single-quoted string and **no gate catches it**
  (`.agent-notes/si33-T1-no-prettier-config.md`)
- Every constant carries its upstream `file:line`. Never fit a value

## Index

- [decisions.md](decisions.md) — D1–D6, with the evidence for each
- [diagrams/component-map.md](diagrams/component-map.md) — what decides what
- [diagrams/data-flow.md](diagrams/data-flow.md) — dispatch, ours vs upstream
- [decision-journal.md](decision-journal.md) — appended during execution

## Before starting: install the autonomous settings

`.claude/settings.autonomous.json` cannot be written from a session — the
harness blocks writes to settings files, which is also why the previous
mission's copy was staged rather than installed. The tailored file is staged
here instead:

```sh
cp plans/sequence-engine-overclaims-nested-diagrams/settings.autonomous.json \
   .claude/settings.autonomous.json
```

It is the standard template minus playwright, web access and the unused
language toolchains, plus `sed`/`awk`/`jq`/`shasum`/`cmp`,
`scripts/oracle-render.sh` and `manifest-diff.py`. Web access is dropped
deliberately: this mission's specification is the Java on disk at
`~/git/plantuml` and the cached goldens, not the internet.

Execution is not gated on this — it only shapes permission prompts.

## Mission halted at T2 — 2026-08-23

**Batch 1 landed. Batch 2 was implemented, measured, and reverted.** Three of
the README's own stop conditions fired at once, and the mechanism is fully
diagnosed in [`.agent-notes/T2-registration-order-halt.md`](../../.agent-notes/T2-registration-order-halt.md).

Mirroring `PSystemBuilder.java`'s order exactly moves the gate **79 → 469**:
it fixes 25 fixtures and **newly misroutes 415**.

| jar → ours | n | mechanism |
|---|---|---|
| STATE → DESCRIPTION | 152 | B |
| CLASS → SEQUENCE | 151 | A |
| STATE → SEQUENCE | 96 | A |
| DESCRIPTION → SEQUENCE | 12 | A |
| NONE → SEQUENCE | 3 | A |
| NONE → DESCRIPTION | 1 | B |

**Mechanism A (262).** `SEQUENCE_PATTERNS[0]` (`src/diagrams/sequence/index.ts:20`)
is `/->>?|-->>?/` — unanchored and context-free. `sequencePlugin.accepts()` is
true for **1351** of 3158 fixtures, **270 of which are not sequence diagrams**.
Registering sequence first hands that 20% false-positive rate first refusal on
the whole corpus.

**Mechanism B (153).** Upstream has description (`:138`) before state (`:139`);
this port had state first. **153** fixtures are accepted by *both* engines and
the jar calls **152 of them STATE**. Only registration order was hiding
description's over-claim.

**The premise D1 rests on is wrong.** The brief reads the order as an
independent variable — "Sequence is FIRST upstream and LAST here, so class,
description, json and yaml get first refusal". It is not independent: upstream's
order is safe *because* upstream breaks ties by attempting the parse
(`PSystemBuilder.java:257-266`, `isOk(f.createSystem(...))`), and we break them
with per-line regexes. **The current order is load-bearing** — it is
compensating for heuristic over-claim, not merely inverted.

**No later task rescues it**, which is why the halt is the whole mission and
not just T2:

- **T3 (D4's candidate-type filter) has no reach.** `DiagramType.java:197-201`
  maps `@startuml` to `{SEQUENCE, STATE, CLASS, OBJECT, ACTIVITY, DESCRIPTION,
  …}` — all candidates at once. **3039 of 3158 fixtures (96.2%) are
  `@startuml`**; the other 119 already route correctly through the existing
  typed fast path. The filter can only separate what is already separate.
- **T4's arrow anchoring does not reach it.** **217 of the 262 (82.8%)**
  fixtures mechanism A breaks carry a real arrow in real arrow position
  (`Sally --> Bob`, `ClassA --> ClassB : -var1`). A class relation and a
  sequence message are the same string.

That leaves exactly **D2's deferred option B**, which this README already names
as a stop: *"The residual can only be closed by parse-attempt — that is D2's
deferred mission. Stop and record; do not start it."*

**What survives.** T1's gate (`ef62ef74`) is the mission's durable deliverable
and it works — it caught a 415-fixture regression on its first real use, named
every fixture, and reproduced the bucket table. The routing baseline stands at
**79**. The plugin↔factory↔line derivation T2 produced is correct and is
preserved in the agent note for the deferred mission; only its consequence is
unsafe.

**Recommended next step**, for the maintainer to decide: re-file the parse-attempt
mission (D2 option B) as the prerequisite, with this measurement as its
justification, and re-scope batch 4's heuristic repairs — which do *not* depend
on T2 — as a separate, independently landable mission.
