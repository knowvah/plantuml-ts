# T6 — Re-pin post-chrome, name every riser, census the residual

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-oracle-harness`. T5 routed activity through the klimt
document shell. T2's baseline still records the PRE-chrome floor — that
gap is the evidence the fix worked, and this task converts it into a
recorded result.

## Task

### 1. Re-pin, naming every riser
Re-measure all captured fixtures and re-pin
`oracle/goldens/svg-activity/diff-baseline.json`.

**Every fixture whose `weightedScore` ROSE is named with a mechanism.** Not
a count, not a summary — the slug, its old score, its new score, and *why*.
A risen pin is an adopted regression until proven otherwise. If you cannot
explain a rise, that is stop condition 6.

Per [D2], a risen **`diffCount`** beside a fallen **`weightedScore`** is the
expected artefact of collapsing the 12-marker defs short-circuit into real
comparison. Record it as such; it is not a rise for the purposes of the
riser rule, which governs `weightedScore` only.

Report the descent: how many fixtures fell, by how much, and what the new
diff-path set is. The pre-mission floor was a uniform 12 paths; SI34's
equivalent left sequence at 5 (`width`, `height`, `viewBox[2]`,
`viewBox[3]`, `g[1][childCount]`). State activity's actual new set — do not
assume it matches sequence's.

### 2. Re-pin the render manifest ([D10])
`manifest-diff.py:38` computes moves over `set(base) | set(now)`.
**Assert the moved set is exactly the activity slugs.** Any non-activity
entry moving is stop condition 5 — SI34 allowed exactly one such entry, named
and justified; an unnamed one halts the mission.

### 3. Census the residual
Write `oracle/goldens/svg-activity/diff-census.json`: remaining diff paths
ranked by frequency across the population, so the next mission has a work
queue rather than a pile.

For the geometry residual specifically (`width`/`height`/`viewBox`), record
the **direction per fixture**. It is known to go both ways — pre-mission
measurement found `numalo-91-pole243` at 52 vs jar 64 (we are narrower) and
`darote-51-kuta407` at 144 vs jar 129 (we are wider). A census that reports
only magnitude would hide that, and a single-sign assumption would send the
next mission looking for a constant margin that does not exist.

### 4. Report status transitions
A fixture that moved from `status:"error"` to `status:"baseline"` is a
**reportable change** ([D8]) — never silently read as "reached 0 diffs".
List any.

## Write-set
- `oracle/goldens/svg-activity/diff-baseline.json`
- `oracle/goldens/svg-activity/diff-census.json`
- `oracle/goldens/svg-activity/README.md`
- `test-results/render-manifest-baseline.json`

**Nothing under `src/`.** If the re-measurement suggests a source change,
that is a finding for the census, not an edit.

## Read-set
- `plans/activity-oracle-harness/decisions.md` — D2, D5, D8, D10
- `oracle/goldens/svg-activity/diff-baseline.json` — the PRE-chrome pin
- `plans/sequence-root-chrome/decisions.md` — D5 (weighting), D7 (risers)
- `plans/state-declared-size-fix/scripts/manifest-diff.py` — argv contract
- `tests/oracle/svg-conformance/compare.ts:437-480`

## Architecture decisions
[D5] the pre-chrome pin is the evidence · [D2] `diffCount` rises are
expected · [D10] only activity may move · [D8] error transitions are
reportable.

## Interface contracts
Report:
```json
{ "fell": 0, "rose": [{"slug":"","from":0,"to":0,"mechanism":""}],
  "newDiffPathSet": [""], "errorToBaseline": [""],
  "manifestMoved": [""], "manifestNonActivityMoved": [""] }
```
`manifestNonActivityMoved` non-empty ⇒ **stop**.
`rose` with an empty `mechanism` ⇒ **stop**.

## Acceptance criteria
- Given the re-pin, then every fixture whose `weightedScore` rose is named
  with a mechanism — no silent adoption.
- Given a risen `diffCount` beside a fallen `weightedScore`, then it is
  recorded as the expected weighting artefact, not a failure.
- Given the manifest diff, then the moved set is **exactly** the activity
  slugs.
- Given the census, then remaining diff paths are ranked by frequency and the
  geometry residual carries a **direction** per fixture, not just a magnitude.
- Given any `error` → `baseline` transition, then it is listed explicitly.

## Observability
This task produces the mission's headline number: the descent from the
12-path floor. Report it.

## Rollback
**Reversible.** Both JSON files are regenerable by re-running the ratchet
against the current tree.

## Quality bar
All four gates green — including T2's ratchet, which must now be GREEN
against the re-pinned baseline.

## Commit
`test(aoh-T6): re-pin the activity baseline post-chrome and census the residual`

Body: the descent, every named riser, and confirmation that only activity
entries moved in the manifest.
