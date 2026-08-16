# T12 — M4 fix: single-line width deltas

## Gate — read this first

**Do not start until `.agent-notes/m4-single-line-width.md` exists.**

If that note leaves the mechanism **unestablished**, this task **does not run**.
The four slugs stay in their backlogs and the residue is **named, not fitted** —
record in `decision-journal.md` that M4 is undiagnosed, with T4's ruled-out list
and next instrumentation step. That is a legitimate outcome: the exit bar is
≤ 12 remaining slugs precisely because M4's floor was unknown at planning time.

Skipping this task is not a failure. Fitting a constant to close it is.

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`; no citation means unfinished. **Never fit a value** —
keeping whatever shrank the error is forbidden *especially* when it shrinks.

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

Four backlogged slugs — `berelu-46-namo819` (description),
`canuti-20-jotu614`, `gikipi-69-pepo172`, `xopuku-46-nefa571` (class) — fail
`labelSizeOk` with few-pixel width deltas on **single-line** edge labels. T4
established the mechanism (or did not — see the gate).

### The premise you must not inherit

`class-layout-edge-labels.ts:34` claims the label font is `theme.fontSize` = 14
while `plantuml.skin` has `arrow { FontSize 13 }`. A one-point error would
explain a few-pixel delta, and it is the obvious guess — but `givoli-70-rade072`'s
plain labels match the oracle **exactly** (`22x15`, `44x15`, `80x15`), which a
wrong font would make impossible. T4 was tasked with settling this. Act on T4's
finding, not on the comment.

## Task

Apply the fix T4's mechanism prescribes, at its origin. Add a test that fails
before the fix and passes after.

If the mechanism turns out to be shared with a larger subsystem — creole atom
widths, the measurer itself, a font resolution path used by more than edge
labels — **stop and log it**. A width delta of 3px is not worth destabilising a
shared primitive on, and a broad edit across several sites means the root was
not found.

## Write-set

**Declared from T4's note before you begin.** Unknown at planning time. Likely
candidates: `src/core/edge-label-box.ts`,
`src/diagrams/class/class-layout-edge-labels.ts`,
`src/diagrams/description/link-edge-attrs.ts`, plus tests and the class and
description backlog JSONs.

Write it into the journal before the first edit. If T11 is running in this batch
and its write-set overlaps yours, serialize.

## Read-set

- `.agent-notes/m4-single-line-width.md` — **the mechanism; start here**
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:286-305`
  — how `labelOnly` is built, including `CreoleMode.SIMPLE_LINE`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:500-510`
  — `appendTable`'s `(int)` truncation
- `src/core/edge-label-box.ts` — the whole file, 105 lines; note that
  `stripCreoleMarkup` deliberately does **not** strip `img`, `$` or `&` because
  those are width-bearing atoms
- Whatever files T4's note names as the origin
- `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`

## Architecture decisions

**D4** — no fixture may rise; ratchets only toward jar with the measurement.
**D1** — if the fix belongs in the shared box formula, it goes in
`src/core/edge-label-box.ts`, not in a per-engine patch.

## Acceptance criteria

- **Given** each of the four slugs, **when** the DOT gate runs, **then** it
  either clears and leaves its backlog, or keeps its entry with a named
  mechanism in the journal.
- **Given** every constant introduced or changed, **then** each carries an
  upstream `file:line` in a comment.
- **Given** a new test, **when** run against the pre-fix code, **then** it fails.
- **Given** `shape-match-report`, **then** **no fixture rises**, before/after
  journalled.
- **Given** the mechanism reaches beyond edge labels, **then** the task stopped
  and logged rather than editing a shared primitive.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class
npx jiti scripts/dot-sync-report.ts component
npx jiti scripts/dot-sync-report.ts usecase
npx jiti scripts/shape-match-report.ts
npx jiti scripts/label-box-triage.ts
```

Journal every count.

## Observability

Class, component and usecase DOT EQUAL; class and description backlog counts;
census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** cite an upstream line for every number you touch.
- **Ask first:** if the mechanism lives in a shared primitive (measurer, creole
  atoms, font resolution beyond edge labels).
- **Never:** fit. A constant that closes the delta with no upstream origin is a
  stop condition, not a fix.
- **Never:** remove a slug from a backlog it still fails.
- **Never:** treat "the deltas are only a few pixels" as a reason to fudge one.
  The long tail is the deliverable; a named miss beats a fitted pass.

## Commit

`fix(T12): <mechanism from T4, in the imperative>`
