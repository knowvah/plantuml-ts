# aepp-T2a report — DONE (supersedes the earlier STOPPED note)

Commits: feat(survey): error-page verdict and dashboard error count (code +
tests); this note. Write-set expanded by the user: svg-parity-workers.ts,
new scripts/lib/survey-error-verdict.ts. svg-parity.test.ts needed no change.

Java -> ours: none (harness only). Rule: decisions.md verdict table (D7).
Mechanism: renderFrame installs setErrorPageObserver -> frame.errorPage ->
RenderedFixture.errorPage (workers parseFrame) -> rowFor ->
errorPageVerdict(type, slug, record, errorPage) ?? diffVerdict.
Dashboard: tallySurvey counts errorPage; surveyColumn "c / s / d (N error)"
only when N>0. scripts/parity-dashboard.ts not touched.
svg-parity-survey.ts is exactly 500 lines.

Gates: scripts unit dir 559 pass; typecheck, eslint, prettier clean.
No src/core edit => no all-engine survey required.

## Surveys (temp --out, /private/tmp/claude-501/aepp-T2a/)
activity vs measurements/t1e/parity-activity.json (449 rows): exactly 14
changed, all diverged -> conformant+errorPage: gabeme jokaxi kedozi nakavu
nefume pejima pizuga ticoxo veducu velodu vipixe xesoze xoreni zezaju.
No drawn row changed. Totals 447 conformant / 1 structural / 1 diverged.
class vs committed parity-class.json: record rows 3: luzive, sadamo ->
conformant+errorPage; zuduxu-90-kosi876 -> diverged 'error-page' (expected,
T1g). Four non-record rows moved (bixogo diverged->structural, roxosu
diverged->structural, gadufu & xadado structural->conformant); none is in the
record, none has errorPage, so errorPageVerdict returned undefined for them:
the committed pin is stale vs current code, not caused by this change.
unknown vs committed parity-unknown.json: record rows 38: 24 ->
conformant+errorPage; 14 -> diverged 'error-page' (jar errors, we draw):
dagugu gibapi gujeku jifoke kijaro ligalo lonome lulanu micono nixuje rubebe
(expected, T1g) torazi zeceme zugazo. The other 13 are unexpected beyond the
brief: owner = whichever task makes those engines error. 7 non-record rows
moved (cezeje febuci godixi kakitu nunema nupiko diverged->conformant, semutu
structural->conformant), no errorPage: stale pins as above.
