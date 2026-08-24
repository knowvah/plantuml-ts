# T5 — the detection window, and the sequence signals it never looks for

## Context

`plantuml-ts` is a faithful port; the Java at `~/git/plantuml` is canonical.
**Read the Java method body before writing.**

Nine fixtures the jar calls `SEQUENCE` are typed `class` before any plugin's
`accepts()` is consulted. `detectUmlType` (`src/core/block-extractor.ts:202`)
runs `probeState → probeSequence → probeClass`, and falls back to
`UML_FALLBACK_TYPE = 'class'` (`:200`) when all three miss. Two separate
defects put these nine on that path.

### Mechanism 1 — the window is consumed before the diagram starts (6)

`TYPE_DETECTION_WINDOW = 20` (`:78`), applied to the **preprocessed** lines.
Six fixtures spend all twenty on something that is not diagram content:

| fixture | what fills the window |
|---|---|
| `baketu-62-cumu838`, `tumuke-16-xomo243` | `sprite $disk16 { … }` pixel-data rows |
| `bucebo-91-xavo442`, `bugafa-93-duzi514` | `sprite name <svg …>` markup |
| `nereka-67-deco609`, `tuzaga-87-gene496` | `!include <tupadr3/…>` / `<logos/centos>` expansion |

`tuzaga-87-gene496` is the clearest: its source is five non-empty lines and
`Alice->Bob : hello` is one of them, but the include expands ahead of it and
pushes it past line 20.

### Mechanism 2 — real sequence signals are not probed (3)

`probeSequence` (`:158-168`) tests `/->|-->/u` and a `SEQUENCE_ACTOR_KEYWORDS`
first-word set. Three fixtures contain neither:

| fixture | its entire diagram content |
|---|---|
| `fonatu-29-texo854` | `activate C` |
| `todozi-34-jire490` | `activate A` / `note over A: Hello` / `deactivate A` |
| `zicadi-21-koje636` | `activate Test` / `Test <<-- Test : …` / `deactivate Test` |

Two gaps, both readable from the regex: **left-pointing arrows** (`<-`, `<--`,
`<<--`) contain no `->`, and the `activate` / `deactivate` / `note over`
family is not in the keyword set. All three are sequence-only tokens.

## Task

Fix both. Derive every added signal from the commands
`SequenceDiagramFactory` registers, and derive the window's treatment of
`sprite` and include-expanded content from what upstream types on
(`BlockUml#data` — note the comment at `:242-250`, which already records that
this port types on the **preprocessed** lines deliberately).

Write the test first (TDD).

## Read-set

- `src/core/block-extractor.ts:78-262` — the window constant, all three
  probes, `UML_FALLBACK_TYPE`, and `detectUmlType`'s ordering comment
  (`:204-206`, which records why state precedes sequence — do not disturb it)
- `~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java` — the
  command list; every signal you add must correspond to one
- `~/git/plantuml/.../sequencediagram/command/CommandActivate.java` and the
  arrow commands — the real grammar for the tokens in mechanism 2
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/PSystemBuilder.java:238-250`
  — what upstream types on, and when. Upstream does **not** have a detection
  window at all: it takes the candidate set from the `@start` line and lets
  the parse decide. That asymmetry is the thing to understand before choosing
  how to fix the window
- `test-results/dot-cache/sequence/tuzaga-87-gene496/in.puml` (mechanism 1,
  smallest) and `.../fonatu-29-texo854/in.puml` (mechanism 2, smallest)
- `../decisions.md#d1`, `../decisions.md#d3`

## Write-set

- `src/core/block-extractor.ts`
- `tests/unit/block-extractor.test.ts`

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it.

## Acceptance criteria

1. Given a source whose first 20 preprocessed lines are `sprite` data or
   include expansion and whose diagram body follows, then `detectUmlType`
   returns the type of the **body**
2. Given `activate C` as the only content, then `sequence`; same for
   `note over A: Hello` and for a left-pointing arrow (`<-`, `<--`, `<<--`) —
   table-driven over the arrow tokens, citing the upstream command class
3. Given the routing gate, then the `SEQUENCE -> CLASS` bucket holds only the
   3 fixtures T6 owns, and all 9 of this task's report
   `jarType === ourType === 'SEQUENCE'`
4. Given the whole corpus, then **no fixture changes detected type in a way
   that newly misroutes it**. This is the highest-risk task in the mission:
   `detectUmlType` types 3039 of 3158 fixtures, and its result is both the
   dispatcher's fast-path key and its no-plugin-accepted fallback
5. Given the 482 promoted zero-diff fixtures across all 10 `ratchet.json`
   files, then none is de-promoted

## Quality bar

All four gates green. AC4 is the one to design for.

If widening the window is the chosen fix, **measure the cost**: the window
bounds work done for every block in the corpus, and the routing gate's own
runtime (15,492 ms in situ) is a usable canary. Report the before/after.

Do not re-pin any baseline; that is batch 6.

## Observability

N/A — no new observable operations.

## Rollback

Reversible, but not independently: revert the batch range, not the task.

## Boundaries

- **Always:** cite the upstream command class beside each added signal (D3
  permits this widening precisely because it is bounded by that list)
- **Never:** change the `probeState → probeSequence → probeClass` order —
  `:204-206` records a real defect it prevents; change `UML_FALLBACK_TYPE`
  without a separate measurement showing what it moves; touch `src/index.ts`
  (D1)
- **Ask first:** if fixing mechanism 1 requires typing on **raw** rather than
  preprocessed lines — that inverts a documented deliberate choice
  (`:242-250`) and needs its own decision, not an inline judgment call

## Commit

One commit: `fix(T5): type a block on its body, not on its sprite preamble`
