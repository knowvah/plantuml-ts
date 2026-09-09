# T7 — Re-measure, re-pin, close out

**Agent:** orchestrator (baseline JSON writes are reserved)
**Depends on:** T6

## Task

1. Re-measure the corpus. Report Σ`weightedScore` against **52563** with a
   percentage, and `svg/g[][childCount]` against **24911 (47.4%)**.
2. Re-run T0's swimlane census; report divider and title counts, ours
   beside the jar's.
3. **Diff every re-pinned baseline and name every pin that ROSE.** A re-pin
   silently adopts a regression otherwise — this has happened in this repo
   and is why the step is written out. If none rose, say so explicitly.
4. Confirm the sequence, state, class, description and json suites unmoved,
   with counts.
5. Resolve `activity-swimlane-line-thickness` in `planning/next-missions.md`
   (T6 closes it) and re-scope anything this mission measured false.
6. Append a Close-out to the brief README: scored exit bar, any premise
   measured FALSE, and follow-ons with measured weight.

## Acceptance criteria

- Given the re-measured corpus, then Σ`weightedScore` is stated as a
  before → after pair against 52563 with a percentage
- Given each re-pinned baseline, then every risen pin is named with a
  mechanism, or the report states that none rose
- Given the five sibling suites, then each is reported unmoved with a count
- Given all four gates at HEAD, then all four are green

## Boundaries

**Always:** state a measured number, never an estimate.
**Never:** flip a checkbox on vibes.
**Ask first (halt and journal):** if Σ`weightedScore` did not fall.

## Observability

N/A — no new observable operations. This task RE-PINS the instruments; the
oracle corpus is the project's only SLI and it is not extended here.

## Rollback

**Reversible.** Baseline JSON and docs only. A revert restores instrument
and behaviour together, because the source changes and their re-pins are on
the same branch.

## Commit

`test(asr-T7): re-pin the swimlane baselines and close out`
