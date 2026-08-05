# A2s ledger — named non-conformant remainder (close-out 2026-08-05)

Final: **687/711 conformant (96.6%), widened 0**; conformant + this ledger
= 711 (ADR-3 reconciled). Every row is a TRACKED follow-up (backlog pin
retained, shrink-only), mechanism-named by the G2 diagnosis
([batch-3/mechanisms.md](batch-3/mechanisms.md) B8 survey + agent reports);
none is a divergence declaration. Queue owner: the A2s round-2 follow-on
mission.

| Slug | Delta (in) | Mechanism | Evidence | Follow-on |
|------|------------|-----------|----------|-----------|
| roputo-88-fuxo199 | 2.791840 | TIM builtins inside single-line notes unexpanded (%retrieve_procedure, %n) | G2b (h)-survey; node-diff: note 4.327083 vs 1.535243 | port tim builtins into note path |
| rozudo-79-zavu288 | 0.347223 | same TIM-in-notes mechanism | G2b survey | same |
| xadado-92-lazo250 | 2.200521 | {{...}} EmbeddedDiagram in notes unported (jar renders sub-diagram) | G2b survey; notes 3.8-4.2in vs 0.875 rendered | wire T10f EmbeddedDiagram into note path |
| lecelo-92-loma110 | 1.923784 | <U+XXXX>/&#NNNN;/<:emoji:> not decoded in entity names | G2b survey; heights match, widths raw | port CommandCreoleEmoji + unicode decode |
| curupe-50-kibu120 | 0.929687 | creole monospace ""text"" unported | G2b survey | port CommandCreoleMonospaced |
| lozego-15-coci435 | 0.845379 | <$sprite> creole atom unported in bodies/stereotypes | G2b survey | port CommandCreoleSprite reach |
| rotisi-30-loge424 | 0.653072 | same sprite-atom mechanism | G2b survey | same |
| mizupo-59-zala765 | 0.442187 | !theme element font not applied to class sizing (aws-orange) | G2b survey | theme element-font cascade |
| sovuxo-25-tepi226 | 0.389236 | skinparam classAttributeFontSize<<Stereo>> stereotyped form not applied | G2b survey | stereo-scoped font cascade |
| jecopa-66-vepe168 | 1.039584 | hide-portion INSIDE a package scopes to that subtree in jar; ours global | G2b survey; outside-pkg Dummy1 keeps methods in golden | PROBE FIRST (scoping semantics), then scope the fold |
| julixi-10-jide878 | 1.119791 | \n inside QUOTED CLASS NAME not split in header measurement (member side fixed by F-B) | F-B report: sh0011 contenty 5.576215 vs 4.456424 width-only | header display split |
| rulite-35-muno361 | 1.119791 | same quoted-name-header mechanism | F-B report | same |
| daxeno-00-kasu166 | 2.142535 | creole size tag + \n in <<Database>> package title; leaf-shape path measures raw | G2b survey (i) | title creole pipeline for USymbol leaves |
| dibinu-95-kavo178 | 0.953298 | quoted "/"-containing names mis-measured (undiagnosed detail) | G2b survey (i) | diagnose then fix |
| cukaze-78-zija070 | 0.527778 | diamond <> classifier sizing (undiagnosed detail) | G2b survey (i) | diagnose then fix |
| pasova-33-toze386 | 0.111112 | multi __ separator geometry (undiagnosed detail) | G2b survey (i) | diagnose then fix |
| ponono-25-fevo574 | 0.180555 | residual after wrapWidth+bullet fixes: bullet/wrap interaction in wrapped note lines | F-C/F-E reports (3.25→0.18) | diagnose wrap-of-bullet-stripe |
| sumocu-27-vubo674 | 0.180555 | same bullet/wrap residual | same | same |
| pejone-71-tige404 | 0.120312 | residual: blank-line-in-enhanced-body (class-body-enhanced-layout.ts:155 drops null-parsed blanks) | F-A report + flatten fix shrank it | enhanced-body blank rows |
| xonamo-50-podo529 | 0.120312 | same enhanced-body mechanism | same | same |
| gujigi-63-roki030 | 0.152778 | package/folder USymbol leaf needs description measureFolderLeaf, itself SI1-narrowed (routing it WIDENED 0.1528→0.1944 — measured) | F-D report | SI1 |
| rakuci-96-tuti371 | 0.128820 | parser drops quoted display for aliased empty rectangle group (`rectangle " YY " as YYY [[link]] {}` → display "YYY") | F-D report (sizing part fixed; parser part remains) | parser display capture |
| puvono-84-doro361 | 0.041667 | 3.00px element-font offset (undiagnosed; element-font bucket) | residual-clusters row | diagnose |
| sekame-22-meze147 | 0.041667 | same 3.00px mechanism | same | same |
