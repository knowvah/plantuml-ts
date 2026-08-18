# T11 — precision (sub-pixel rows, ADR-7)

## Context
As T1–T10 (read `README.md`, `decisions.md`, `findings/SCHEMA.md`,
`findings/PARTITION.md#precision`, `~/.claude/rules/diagnosis.md`). ADR-2:
no source edits.

## Slice (27 fixtures, 53 rows, all |Δ| < 0.05 px; preview)
`beguxu-19-tize774`, `bemena-23-zebu249`, `domoru-86-coki670`, `dulixa-11-kufe247`, `fadupe-90-koti079`, `fajegu-17-joba577`, `fojisi-40-zogo372`, `fomusu-59-fupe538`, `gifasa-23-zile558`, `jaxebo-54-nifi592`, `jelusa-98-nexa591`, `jorere-75-peja265`, `ketibo-84-juzo029`, `kujaju-47-neku764`, `lalava-26-zosi801`, `lasasi-13-nona547`, `leloja-87-tebi184`, `lonuti-97-voko521`, `mifuti-36-jine785`, `nuboca-13-xape657`, `pajefo-95-neri955`, `pexiku-77-japi217`, `soxene-95-domu248`, `sumiri-68-suvo696`, `tegali-39-molu382`, `xepafa-33-lazi826`, `zitifa-97-bizo337`
Distinct |Δpx|: 7.2e-5 (last digit, e.g. ours 2.777777 vs jar 2.777778), 1.4e-4,
1.08e-3, 1.87e-3, 2.45e-3, 2.52e-3, 3.74e-3, 4.97e-3.

## Task
Find the ONE (or few) mechanism(s): where do we and the jar convert px→inches
and format the number? Java: `svek/DotStringFactory.java`/`SvekNode` `width`/`height`
emission (`String.format`/`toString` of `/72`), ours `src/core/svek/**`/`state-dot-graph.ts`
formatting (`toFixed(6)`? truncation vs rounding? float accumulation order?).
Group records by mechanism; a single `sharedCauseWith` cluster is the expected
outcome. State whether the fix is a formatting change (zero-risk, all engines)
or a real sizing difference hiding under rounding (then it belongs to a bucket).

## Write-set
`findings/precision.md` ONLY.

## Acceptance
- Given the 27 fixtures, then each has a record; the mechanism cluster(s) are named with `originFileLine` (ours) + `javaRef` (jar's formatter).
- Given a row whose Δ is NOT explained by formatting, then it is `unresolved` with a `nextStep` naming the bucket it likely belongs to.

## Observability / Rollback
N/A. Reversible.
