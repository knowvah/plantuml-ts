# T0 — resolve the object header translate and the election input

## Prior observations — established, do NOT re-derive

- SI17 resolved the band frame by measurement:
  `position = headerHeight + margin + Σ(prior member heights in this
  compartment)`, composed through `EntityImageClass.java:247-253` →
  `TextBlockVertical.java:107-118` → `TextBlockLineBefore.java:103-107` →
  `TextBlockMarged.java:100-102` → `MethodsOrFieldsArea.java:194-211`. Full
  derivation in `plans/si17-class-row-ports/decision-journal.md` under "T0".
  **That frame transfers. What does not transfer is the value of its two
  leading terms for an object.**
- The election algorithm and the `Ports` merge are already ported and
  faithful (`src/core/cucadiagram/MethodsOrFieldsArea.ts:215-275`). You are
  not writing them.
- `oracle-render.sh`'s out-dir **must be absolute** — PlantUML resolves a
  relative `-o` against the input file's directory and silently writes
  nowhere useful, exiting 0.

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification (grep `src/main/java/net/`,
not just `net/sourceforge/plantuml/`). Object diagrams have no separate
engine — object/map/json commands are registered alongside the class ones, so
all of this lives in `src/diagrams/class/**`.

**READ THE JAVA FIRST** — open the method body and the constructor that built
its inputs, not a filename or a summary. Every constant carries its upstream
`file:line`. Never fit a value.

## Task

Resolve two ADRs by measurement.

### Part 1 — ADR-1: separate `H` from `margin`

The frame is `position = H + margin + Σ(prior heights)`. The oracle for
`rozuxo-44-fudi093` pins only their **sum**:

| node | members | port on | filler | row | trailer | total |
|---|---|---|---|---|---|---|
| `sh0006` (CC) | 3 | member 2 | 36 | 14 | 18 | 68 |
| `sh0007` (users) | 3 | member 3 | 50 | 14 | 4 | 68 |

`H + m + 14 = 36` and `H + m + 28 = 50` subtract to `14 = 14`. **`H + m = 22`
and nothing more.** Option A (class margin 4 transfers) gives `H = 18`;
option B (no margin) gives `H = 22`. Both fit perfectly.

Do two things:

1. **Read** what `BodierLikeClassOrObject#getBody` returns for a
   non-`isLikeClass()` leaf, and what wraps it. For class it is
   `TextBlockLineBefore(TextBlockUtils.withMargin(area, 6, 4))`
   (`MethodsOrFieldsArea.java:83-86`). Establish whether the object branch
   wraps the same way — read the method body, do not infer from the class
   case.
2. **Author a discriminating control**: a `.puml` with a **stereotyped**
   object (e.g. `object Foo <<thing>> { … }`), where `H` moves and `margin`
   does not. Render a jar oracle via `scripts/oracle-render.sh` with an
   ABSOLUTE out-dir. Two fixtures with different `H` and the same `m` solve
   the system.

Compare against the **`(int)`-truncated** values the jar emits —
`appendLabelHtmlSpecialForLink` truncates filler, row height and trailer
independently (`svek/SvekNode.java:269-296`), and `appendTr` drops any row of
height `<= 0` (`:298-311`).

Then confirm our own `title.height` (`class-object-map-sizing.ts`
`#buildFieldBasedObjectGeo`) equals the `H` you established — for both the
plain and the stereotyped control.

### Part 2 — ADR-2: is the election input `getDisplay(false)`?

`formatObjectMemberText` (`class-object-map-sizing.ts:207`) is a different
function from the class path's `formatMemberText`. Determine whether it
produces upstream's `Member.getDisplay(false)` form — the display form
**without** the visibility character (`MethodsOrFieldsArea.java:213-217`).

**Assert this on a member that HAS a visibility character**, where the two
forms differ. `rozuxo`'s members are bare words, so drift there is silent —
it elects a different row rather than failing.

## Write-set

- `plans/si20-object-row-ports/decision-journal.md` (append under `## Entries`)
- `.agent-notes/si20-*.md` if you find something non-obvious worth persisting

Throwaway probe scripts and authored `.puml` controls go in the session
scratchpad, **not** the repo. **No production code changes in this task.**

## Read-set

- `~/git/plantuml/.../svek/image/EntityImageObject.java:60-120, 245-270` —
  the `fields` construction and `getPorts`. **Method bodies.**
- `~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java` — `getBody`,
  the non-`isLikeClass` branch.
- `~/git/plantuml/.../cucadiagram/MethodsOrFieldsArea.java:83-86, 194-217`
- `~/git/plantuml/.../klimt/shape/TextBlockUtils.java:64-69` — `withMargin`.
- `~/git/plantuml/.../svek/SvekNode.java:269-311`
- `src/diagrams/class/class-object-map-sizing.ts:207, 249-280, 399-438`
- `test-results/dot-cache/object/rozuxo-44-fudi093/svek-1.dot`
- `plans/si17-class-row-ports/decision-journal.md` — the T0 entry, for the
  frame this builds on.

## Architecture decisions in force

[ADR-1](../decisions.md) and [ADR-2](../decisions.md) (this task resolves
both), plus ADR-3, ADR-6. Treat the rest as locked; if the code contradicts
one, STOP and journal it.

## Interface contract — consumed by T1

Return this JSON as the last thing in your final message:

```jsonc
{
  "headerHeight": 0,          // H alone, NOT H+margin
  "margin": 0,                // the body wrapper's top margin
  "howSeparated": "string",   // the control + reading that split them
  "electionInputMatchesGetDisplayFalse": true,
  "electionEvidence": "string", // the visibility-char control used
  "oracleBands": [ { "slug": "string", "portId": "p<md5>", "position": 0, "height": 0 } ]
}
```

## Acceptance criteria

- Given a stereotyped-object control, when `H` and `margin` are computed both
  ways, then **exactly one** pair reproduces the oracle's `(int)`-truncated
  filler/row/trailer on **both** it and `rozuxo`.
- Given `rozuxo` alone, then the journal states explicitly that it **cannot**
  separate `H` from `margin`, and does not claim it did.
- Given a control member with a visibility character, then
  `formatObjectMemberText` is shown equal to — or divergent from —
  `getDisplay(false)`, with the two strings quoted.
- Given neither pair reproduces the discriminating control, then the task
  **STOPS** with both sets of numbers journalled. Picking the closer one is
  forbidden.

## Observability requirements

N/A — no new observable operations. This task *is* a measurement; its output
is the journal entry.

## Rollback

**Reversible.** Documentation only.

## Quality bar

Four gates green — but this task changes no code, so they should be
untouched; do NOT run them, the orchestrator does. Every number in the
journal is reproducible from a command recorded alongside it.

## Boundaries

- **Always:** render oracles via `scripts/oracle-render.sh` with an ABSOLUTE
  out-dir; compare against `(int)`-truncated values; cite upstream
  `file:line`.
- **Ask first:** anything that would change production code.
- **Never:** any state-mutating git command (`checkout/reset/stash/clean/
  add/commit`) — the orchestrator owns git and another agent (S1) is working
  in this same worktree concurrently; fit a value; pick the closer option
  when neither matches.

## Commit format

```
docs(T0): measure the object header translate and election input
```
