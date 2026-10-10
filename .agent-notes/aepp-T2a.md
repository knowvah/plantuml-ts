# aepp-T2a report — STOPPED at rule 7 (write-set), nothing implemented

Commits: none besides this note.

## Blocker 1: scripts/svg-parity-workers.ts is outside the write-set
Mechanism: the frame protocol is parsed by parseFrame
(scripts/svg-parity-workers.ts:100-118) into RenderedFixture
(:32-36 = {svg, dotEqual, oracleBlind}); any other frame field is dropped.
renderFrame (scripts/svg-parity-survey.ts:276-292) can emit `errorPage`, but
rowFor (:342-350) never sees it. Fix needed there: add `errorPage: boolean`
to RenderedFixture and `errorPage: parsed.errorPage === true` in parseFrame.
Owner: orchestrator (add the file to T2a write-set, or apply the 2-line edit).
Related unit tests (tests/unit/scripts/*workers*) may need the field.

## Blocker 2: file size
scripts/svg-parity-survey.ts is 482 lines; the planned change (observer,
record loader, pure verdict fn, FixtureRow field) adds ~30-40 -> >500 hook
limit. Needs a new module, e.g. scripts/lib/survey-error-verdict.ts (pure
`errorPageVerdict(key, record, errorPage)`, record loader), also outside the
write-set. Recommend adding it to the write-set.

## Plan once unblocked (unchanged from the brief)
- survey: renderFrame installs setErrorPageObserver, clears in finally; row
  keyed "<type>/<slug>": in record+errorPage -> conformant/errorPage:true;
  in record+drawn -> diverged/firstDiff 'error-page'; else diffVerdict.
- tallySurvey adds `errorPage` count (existing toEqual at
  parity-dashboard.test.ts:325 must gain errorPage: 0); SurveySummary gets
  optional errorPage; surveyColumn appends ` (N error)` when N>0.
- Expect class/zuduxu-90-kosi876 and unknown/rubebe-45-sura795 diverged
  'error-page' until T1g.

Rows before -> after: not measured. Survey/census movers: none.
