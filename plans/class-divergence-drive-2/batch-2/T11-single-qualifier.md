# T11 — single-qualifier residual

**Agent:** typescript-pro (opus, effort high — multi-term geometry) ·
**Depends on:** T10

## Fixtures

baneru-00-kuro607, comaxe-39-goza236, vorimi-67-gudu296,
kadifi-56-bili996, kopida-02-vaje995, pumocu-32-fiji248,
tikovu-50-gale862, vileca-45-melo541, rifuzu-80-nixo780,
camuna-58-veca254, nafiki-56-jixu680 (as re-grouped by T6)

## Mechanisms · Write-set

T6 fills from `diagnosis/Q.md`.

## Read-set

`diagnosis/Q.md` (T11 sections), `decisions.md` D4, D7;
`src/diagrams/class/class-kal.ts` module doc; `svek/Kal.java`,
`svek/SvekEdge.java` at the lines the diagnosis cites.

## Acceptance criteria

- Given each fixture, when it renders, then its diff is 0 or its residual
  has a new diagnosis artifact in the task report
- Given a `class-kal.ts` edit, when reviewed, then each changed statement
  cites its `Kal`/`SvekEdge` line, and the file's structure is unchanged
  (stop 11 otherwise)
- Given the qualifier fixtures already conformant, when render-all runs,
  then they stay conformant, and DOT parity stays 711/712

## Observability · Rollback

N/A. Reversible; layout moves are confined to qualifier fixtures and proven
by the close's pin-diff.
