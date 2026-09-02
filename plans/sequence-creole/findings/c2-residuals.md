# C2 residuals — measured, not estimated

Written at C2 close (`e9d1b4df` + the census regeneration). Every number here
was produced by `scripts/sequence-geometry-distance.ts` or by rendering the
named fixture; none is carried forward from planning.

## What C2 bought

```
before  fixtures=1141 measured=1124 errored=17 descended=797 shortCircuited=327
after   fixtures=1141 measured=1124 errored=17 descended=860 shortCircuited=264
```

`descended` **797 → 860, +63 net**: 64 fixtures gained descent, one lost it.

Total distance rose 3 855 017 → 6 670 453. That is not a regression and is not
quotable as one: the 64 newly-descending fixtures previously contributed
**zero** numeric diffs because `compareSvg` short-circuited above them. They now
contribute their real geometry. This is the cohort hazard
`sequence-geometry-distance.ts` was written to expose, and it is why the mission
gates on `descended` rather than on distance.

## Residual 1 — `gucare-93-petu502`, the one descent loss

**Mechanism.** `sequence-parse-helpers.ts#parseParticipantName` builds all three
`as` alternatives with `new RegExp(..., 'u')` — no `i` flag. Upstream's
`CommandParticipantA3:57` is a bare `new RegexLeaf("as")` inside a `Pattern2`,
and `Pattern2.compileInternal` compiles **every** command regex with
`Pattern.CASE_INSENSITIVE` (`Pattern2.java:113`). Verified in both trees.

**Causal chain.** Line 14 of the fixture is
`participant "Provider Global Settings" AS PROVIDERSETTINGS`. The uppercase `AS`
does not match, so the whole string becomes one participant's display name and
the later `PROVIDERSETTINGS ->` messages auto-create a second participant — a
surplus of exactly 5 root-group children. The fixture also has 5 escaped-newline
message labels, so before C2 the 5 missing text runs and the 5 surplus elements
cancelled at 124 = the jar's count, and the fixture descended **by coincidence**.
Supplying the runs exposed the surplus at 129 vs 124.

**Ruled out.** The split producing wrong lines — its text multiset now equals the
jar's for every split label. A new error — `errors []` at both refs.

**Not fixed here.** The fix is one character in `sequence-parse-helpers.ts`, a
file no task in this mission owns (stop condition 1). It is a parser-correctness
fix unrelated to creole and its blast radius is every sequence command literal,
not just `as`.

**Follow-on.** Audit this port's sequence command regexes against
`Pattern2.CASE_INSENSITIVE` and make the keyword literals case-insensitive as a
set, with a corpus measurement. One-off-ing `as` alone would leave the same
class of bug in every sibling command.

## Residual 2 — `kenilu-88-javu563` and `xiceso-64-pelu456` are now text-exact

Both were read during planning as C2 "overshooting" — child count went 30 → 32
against the jar's 31. They are not overshoots. After C2 our `<text>` multiset is
**identical to the jar's, in order**, on both. The entire remaining surplus is
one element:

```
ours: <rect x="0" y="0" width="423" height="215" fill="#FFF" stroke="none"/>
jar:  (no such element)
```

a full-canvas background `<rect>` this engine emits and the jar does not — 12
rects against 11, every other rect paired. Pre-existing root chrome, present
before C2 and unrelated to it; before C2 it was masked because the two missing
text runs happened to cancel it.

**Follow-on.** Two fixtures are one background `<rect>` away from a matching root
child count. Whoever owns root chrome should measure how many more of the 264
short-circuiting fixtures are in the same position.

## Residual 3 — `<title>` tooltips are not split

`renderer-lifeline.ts#toTooltipText` does `display.split('\n')[0]`, so
`butali-53-kige134`'s lifeline `<title>` reads `Bob\non 2 lines` where the jar
reads `Bob`. `<title>` is not a root child, so descent is unaffected and no
instrument in this mission sees it. The file is outside C2's write-set.

## Residual 4 — `else` conditions do not split

`branchConditionRun` returns a single `TextRun` on `FrameGeo.branchSeparators`,
whose type lives in `ast.ts` — outside C2's write-set. `else cond\ncond2` still
emits one run. The frame header title and comment DO split
(`ComponentRoseGroupingHeader.java:76-77,89`, jar-verified on `pigifu-13-kele137`
and `zedepi-36-come743`).

## Not a residual — participant stereotypes deliberately do not split

`CommandParticipant.java:174-180` hands the raw stereotype run to
`Stereotype.build`, which constructs no `Display` and therefore never reaches
`getWithNewlines`. The task text asked for "participant names and stereotypes";
the Java is authoritative and the stereotype half is upstream behaviour, not a
gap.
