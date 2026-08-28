# T8 — Divergences and filings

## Context

The mission's code is done and adjudicated. This task records what was
deliberately NOT done, so the next mission does not rediscover it.

Read `../README.md` (the non-goals), `../decisions.md` (D4, D6) and
`../findings/adjudication.md` (T7's results) first.

## Task

**`DIVERGENCES.md`** — add:
- Shadowing is not ported on the grouping header
  (`ComponentRoseGroupingHeader.java:132`, `rect.setDeltaShadow`). Default
  shadowing is 0, so no corpus fixture shows it. D4.
- Anything T7's adjudication left standing as a deliberate, understood
  difference. Each needs the mechanism, not just the symptom.

**`planning/next-missions.md`** — close the
`sequence-frame-background-pass` entry with what actually happened (verdict
split, Σ `weightedScore`, the fate of the 10), and **correct its mechanism
claim**: the outline does not duplicate because `comp.drawU` sits outside the
`isBackground()` guard, but because `AbstractComponent#drawU:140-147`
dispatches to exactly one of two halves per pass and
`ComponentRoseGroupingHeader` draws the same `URectangle` in both.

Then file the spin-offs, each with the mechanism and its `file:line`:
- **`sequence-partition-keyword`** — `partition` is in upstream's
  `CommandGrouping` TYPE alternation (`CommandGrouping.java:68`) and absent
  from this port's grouping regex.
- **`sequence-partition-tile`** — `PartitionTile extends GroupingTile`
  overrides `getComponent()` with a component whose `drawU(ug, area, context)`
  IGNORES the context, so a partition draws in BOTH passes
  (`PartitionTile.java:95-113`), and overrides `drawCompBackground`
  (`:205-209`).
- **`sequence-group-style-cascade`** — `sequenceDiagram.group` /
  `groupHeader` have no SName style bucket in this port, so `skinparam` and
  style blocks cannot override the constants D3 hard-codes.
- **`sequence-frame-geometry`** — frame `x`/`width` derive from participant
  centres plus a flat 20/40; our heads are 80 wide against the jar's 38.9.
- Whatever T7 surfaced that belongs to none of the above.

Do NOT file a spin-off you have not verified against the Java. "Hard" and
"out of scope" are triggers to VERIFY, not to skip.

## Read-set

- `DIVERGENCES.md` (existing entries, for house style)
- `planning/next-missions.md` — the `sequence-frame-background-pass` entry
- `../findings/adjudication.md`

## Acceptance criteria

- Given `DIVERGENCES.md`, then the shadowing omission is recorded with its
  `file:line` and the reason it is invisible today.
- Given `planning/next-missions.md`, then this mission's entry is CLOSED with
  measured numbers, not estimates.
- Given the corrected mechanism, then it names
  `AbstractComponent.java:140-147` explicitly, so the next reader cannot
  inherit the wrong one.
- Given each filed spin-off, then it carries a mechanism and a `file:line`,
  never just a symptom.

## Observability

N/A — documentation only.

## Rollback

Reversible. Docs only.

## Quality bar

Lines wrapped at 80. Conventional Commits. No attribution footers.

## Commit

`docs(T8): record frame-pass divergences and file the spin-offs`
