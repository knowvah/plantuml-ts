# T6 — Re-measure, re-pin, close out

**Agent:** orchestrator · **Depends on:** T5

## Task

1. Re-measure the corpus. Report Σ`weightedScore` against **48291** with a
   percentage, and the four named families against 821 / 1253 / 1288 / 846.
2. Re-pin the five baselines from ONE measurement (extend the previous
   mission's scratch `repin-activity.ts` with the text census).
   **Diff every re-pinned baseline and name every pin that ROSE.**
3. Confirm sequence, state, class, description, json unmoved, with counts
   (run each suite at HEAD and at `8aad71eb` in a worktree with
   `node_modules` and `assets/stdlib` linked in).
4. Resolve `activity-min-box-width` in `planning/next-missions.md`; file
   whatever T2's riser diagnosis found; re-scope anything measured false.
5. Append a Close-out to the brief README: scored exit bar, premises
   measured false, follow-ons with measured weight.

## Acceptance criteria

- Given the re-measured corpus, then Σ is stated before → after against 48291
- Given each re-pinned baseline, then every risen pin is named with a
  mechanism, or the report states that none rose
- Given the five sibling suites, then each is reported unmoved with a count
- Given all four gates at HEAD, then all four are green

## Boundaries

**Ask first (halt and journal):** if Σ`weightedScore` did not fall.

## Observability / Rollback

N/A / **Reversible** (baseline JSON and docs only).

## Commit

`test(amb-T6): re-pin the activity baselines and close out`
