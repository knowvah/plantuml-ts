# T13 — member ports and role-slash labels

**Agent:** typescript-pro (sonnet, effort high) · **Depends on:** T10

## Fixtures

nenepe-70-keri784 (`CC::USA --> users::3`), pegeso-72-mana305
(`table1::id`-style ports), nenexe-35-zere033 and mugobo-34-fede498
(`"owner"/"1" -- "0..n"/"items"`) — as re-grouped by T6.

## Mechanisms · Write-set

T6 fills from `diagnosis/Q.md`.

## Read-set

`diagnosis/Q.md` (T13 sections); prior mission T36's negative result on
port-row sizing (`plans/class-divergence-drive/batch-10/T36-port-row-sizing.md`,
its journal row) — do not re-derive a disproved premise.

## Acceptance criteria

- Given each fixture, when it renders, then the canvas width and every
  coordinate match the jar
- Given the role-slash syntax, when parsed, then the label split matches
  the Java regex it is ported from (cited in the test)
- Given the port-row fixtures already conformant, when render-all runs,
  then they stay conformant

## Observability · Rollback

N/A. Reversible.
