# T11 — M3 fix: tail/head swap

## Gate — read this first

**Do not start until `.agent-notes/m3-tail-head-swap.md` exists.**

If that note records **STOP** — the root cause is in edge *emission order* —
this task **does not run**. D5 is locked. Record the hand-off to the
edge-draw-order mission in `decision-journal.md` and close the task as skipped.

If the note leaves the mechanism unestablished, this task also does not run.

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`. **Never fit a value.**

Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are vitest.

`givoli-70-rade072` exchanges `taillabel` and `headlabel` on its first edge
(oracle `19x13`/`7x13`, ours `7x13`/`19x13`) while the other ~99 edges match
byte-for-byte. Same shape in `nadepi-13-mufu566`, `tekena-28-fobe713`,
`tiguma-69-tovu135`. T3 established the mechanism; this task applies it.

This is a **correctness** fix, not a sizing one — the two values are exchanged,
not mismeasured. That distinction is why it has its own task.

## Task

Apply the fix T3's mechanism prescribes, at the **origin** T3 identified — not
at a downstream site where the symptom happens to be observable. Add a test
that fails before the fix and passes after.

Prefer the change that addresses the mechanism at its origin. If you find
yourself editing several symptom sites, that is a sign the root was not found —
stop and say so.

## Write-set

**Declared from T3's note before you begin.** Suspected but unconfirmed:
`src/diagrams/class/class-edge-geo.ts`, plus a test file and the class backlog
JSON.

Write it into the journal before the first edit. If T12 is running in this batch
and its write-set overlaps yours, serialize — do not both edit a file.

## Read-set

- `.agent-notes/m3-tail-head-swap.md` — **the mechanism; start here**
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:328-340`
  — `startTailText` from `getQuantifier1()`, `endHeadText` from `getQuantifier2()`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java:447-467`
  — emission, including the role fallbacks
- Whatever files T3's note names as the origin
- `decisions.md#d4--backlog-shrink-is-the-bar-no-fixture-may-rise`,
  `decisions.md#d5--m3-is-diagnosis-before-edit-with-a-hard-stop`

## Architecture decisions

**D5** — locked. Emission-order causes are out of scope, full stop.
**D4** — no fixture may rise; ratchets only toward jar with the measurement.

## Acceptance criteria

- **Given** `givoli-70-rade072`, **when** the DOT gate runs, **then**
  `taillabel` is `19x13` and `headlabel` is `7x13` on the affected edge, and the
  slug leaves the class backlog.
- **Given** the other three family fixtures, **when** the gate runs, **then**
  each either clears or has its difference named in the journal — T3 established
  whether all four share the mechanism; honour that finding.
- **Given** a new test, **when** run against the pre-fix code, **then** it
  fails — a test that passes both ways guards nothing.
- **Given** `shape-match-report`, **then** **no fixture rises**, before/after
  journalled.

## Quality bar

All four gates: `npm test` (90/90/90), `npm run typecheck`, `npm run lint`,
`npm run build`. Then:

```
npx jiti scripts/dot-sync-report.ts class
npx jiti scripts/shape-match-report.ts
```

Class DOT EQUAL at or above 680/710. Journal every count.

## Observability

Class DOT EQUAL, class backlog count, census delta.

## Rollback

**Reversible** — one commit.

## Boundaries

- **Always:** fix at the origin, not at a symptom site.
- **Never:** widen into edge emission order — that is the D5 stop.
- **Never:** swap two values at the emission point to make the DOT match if the
  cause is upstream of it. That is symptom suppression, and the census will not
  catch it.
- **Never:** add a slug to any backlog.

## Commit

`fix(T11): <mechanism from T3, in the imperative>`
