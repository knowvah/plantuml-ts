# Decision journal — object-close

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Numbers recorded here are the source of truth after compaction — **re-read
this file from disk, never trust a remembered number.**

| Date | Task/Iter | Decision or measurement | Rationale | Evidence |
|---|---|---|---|---|
| 2026-08-11 | plan | Baseline is 23/80, not the census's 0/80 | The committed cache predates the 0.2.0 SVG-reduction port | Fresh jar render of `beruju-17-jigi548` is byte-identical to its pinned golden |
| 2026-08-11 | plan | G3's 46-fixture `gvts-blocked` attribution rejected | 0 fixtures under 0.5px; 19 carry non-numeric diffs | Per-fixture max-delta measurement across all 57 non-conformant |
| 2026-08-11 | pre-flight | Baseline is RED: 6 failures, one cause, owned by T0 | The uncommitted `applyElementFontSizeByStereo` runs before the matcher loop and swallows `statefontsize<<X>>` (`state` ∈ `ELEMENT_BUCKET_SNAMES`) | 3 unit + class DOT `tabaxa-70-pomu341` 0.083in + state DOT `laferu-31-tice836` 0.604in + state SVG ratchet viewBox 80≠123; typecheck and lint clean |
| 2026-08-11 | T0 | Branch `feat/object-close` cut from `fix/object-member-row-height` HEAD, not from `main` | The brief says "off main", but HEAD is main + `3f26bbba fix(object): sum per-row member heights` — object work that belongs to this closure. Branching off main would strand it | `git log main..HEAD` = exactly that one commit |
| 2026-08-11 | T0 | The pre-flight diagnosis was RIGHT about the state cause but INCOMPLETE: `tabaxa-70-pomu341` is a SECOND, independent cause | Moving `applyElementFontSizeByStereo` after the matcher table fixed 5 of 6. tabaxa is driven by the preprocessor's nested-`<<x>>` scope, not by the matcher order | 6 → 1 failure after the ordering fix alone; tabaxa still 0.0833in |
| 2026-08-11 | T0 | Ported the CLASS arm of the mechanism (`classFontSizeByStereo`) rather than let the class DOT gate move | tabaxa was EQUAL only because the OLD preprocessor bug flattened `<<Foo1>> { FontSize 8 }` onto `classfontsize`, applying 8 globally — accidental, not faithful. Upstream `FromSkinparamToStyle` (`:292-302`, `:396-410`) re-signs the key's ordinary `element.class.header` style with `.addStereotype(label)` at +1000 priority (`StyleLoader.java:178-186`) | Port now A=B=0.997917x0.861111in, byte-equal to the jar's own sh0006/sh0007; SVG emits font-size 8 once (A's header) and 16 once (B's) |
| 2026-08-11 | T0 | `tenalu-53-meri239`'s `A` stays 2px short (40 vs 42) — recorded, NOT fixed here | Residue is a header-height term (`EntityImageObject.java:240-247` stacks name + stereo, the stereo row sized by the separate `FontParam.OBJECT_STEREOTYPE` lookup, `SkinParam.java:432-449`), not this mechanism. tenalu is already in batch-2's queue | Width is EXACT for both A and B, and B is exact in both dimensions — so the 8/16 reaches the name row correctly |
| 2026-08-11 | T0 | Maintainer intervention: bare oracle literals in assertions are indistinguishable from fitted values | Named `DOT_PX_PER_INCH`/`PX_DIGITS`/`ORACLE_IN` (each entry citing its golden file + `shNNNN`). Repo-wide sweep proposed as a separate mission | `.agent-notes/oracle-number-constants-sweep.md` |
| 2026-08-11 | T0 | `git -C .` is NOT protection against cwd drift — `checkout -b feat/object-close` landed in the JAVA reference repo | A prior `cd ~/git/plantuml` persisted in the shell; `.` resolved there. Restored `~/git/plantuml` to `dot-output` and deleted the stray branch (it held no commits — a duplicate pointer). Rule tightened to: absolute `-C <path>`, never `.` | `git -C ~/git/plantuml reflog`: `checkout: moving from dot-output to feat/object-close`, no commits on it |
| 2026-08-11 | T0 | The class SVG census is ALSO reporting the stale-oracle artifact — 0 zero-diff of 721 | `test-results/dot-cache/class` was last written 2026-08-08 by `9b54513f`, which PREDATES the SVG-reduction merge `7c30f8ae`; same mechanism as the object finding. So the brief's "class SVG census: zero-diff set intact" gate is currently vacuous (0 → 0) | `git merge-base --is-ancestor 7c30f8ae 9b54513f` → false; census run: 0 diffs = 0 |
| 2026-08-11 | T1 | Filed the stale-cache follow-up in `planning/mission-index.md` (SI16), NOT in `docs/graphviz-issues/TRACKER.md` as T1's text says | That tracker's own header restricts it to "one checklist item per issue file in this folder — nothing else", and a stale committed cache is not a `@knowvah/dot-engine` finding. Following T1 literally would have broken the tracker's stated invariant | `TRACKER.md:1-6`; the follow-up is cross-type infrastructure, which is what Phase C indexes |
| 2026-08-11 | B4 | Landed M5. All four fixtures improved: `nulixu` 66→62, `sibika` 66→62, `sorisi` 59→49, `vocute` 66→62 | Threaded `classAttributeIconSize` into the glyph geometry. Real reductions, not floor artefacts — every one of the four already had ZERO non-numeric diffs, so no `childCount` barrier existed to lift | all five frozen counts unmoved; census 23/80, buckets unchanged 23/7/10/16/24 |
| 2026-08-11 | B4 | Split the size into TWO resolvers because upstream uses it two ways | `iconSizeOf` evens first (`ensureEven`, `skin/VisibilityModifier.java:135,186-190`) and feeds every draw* helper; `iconBlockHeight` uses the RAW value because `calculateDimension` is `size + 1` (`:100-102`). An ODD override therefore shifts the glyph WITHIN a block one pixel taller than the glyph implies. Collapsing them into one number is the trap | unit test asserts 15 draws exactly as 14 |
| 2026-08-11 | B4 | Also threaded the theme into `visibilityIconOriginY`, which the ledger did not name | The centring divides by the BLOCK height, so leaving it at the hardcoded 11 would have centred an overridden glyph against the default block. Upstream centres against `size + 1`, so the override must reach it. Two call sites updated | `iconBlockHeight` would otherwise have been dead code — lint caught it, which is how the omission surfaced |
| 2026-08-11 | B3 | Landed M3's three sub-parts. Census 23/80 held; **the bucket distribution got marginally WORSE while fidelity improved** | 1-3 bucket 8→7, 31+ 23→24, because `bepafe-03-teda035` went 3→37 diffs. Verified decisively rather than accepted: those 37 are **35 identical 7.8px offsets + 2 identical 8.0px**, i.e. ONE uniform displacement of one entity, with non-numeric 1→0. Before, 3 diffs included a `childCount` saying "the DOM shape is wrong, I cannot compare below here". Now the DOM matches element-for-element | re-measured every riser myself; delta-value histogram per fixture |
| 2026-08-11 | B3 | **The headline metric is actively misleading — second demonstration in two iterations** | Diff COUNT rises when a fix removes a `childCount` barrier and the comparator can finally descend. B1 showed it on `fusopu`/`vimavu`; B3 shows it on `bepafe` (3→37), `guzojo` (25→45) and `lisepi` (192→265). In every case the non-numeric count FELL or the risers resolved to one repeated delta. Ordering or reporting work by diff count would invert the truth | `satuco`'s two map entities are now byte-identical to the jar; `bepafe`'s json entity is element-for-element identical |
| 2026-08-11 | B3 | `lisepi-64-mudo307` rose 192→265 and non-numeric 67→95 — NOT caused by B3 | Its newly-visible diffs are `@font-family`/`@font-size`/`@font-weight`/`@font-style`/`@textLength`/`@stroke` — i.e. its OWN already-audited mechanism (T3: `<style> object { FontSize 12 }` never reaches member rows), previously hidden behind the childCount block. Max delta unchanged at 17.306 | grouped the non-numeric paths; none is a map/json cell construct |
| 2026-08-11 | B3 | Two upstream mechanisms landed that the B3 diagnosis did NOT name | `TextBlockMap`'s CONSTRUCTOR strips a leading visibility char from the key before `getTextBlock` (`:82-83`), and `BodierMap.map` is a `LinkedHashMap` so a repeated key keeps its position and takes the last value (`BodierMap.java:55,74,79`). Both sit inside the same seam, both were required by fixtures on M3's own list, both carry their `file:line`. Found by opening the constructor — which is exactly what the standing rule asks for and what a filename-level reading would have missed | ledger M3 entry to be corrected |
| 2026-08-11 | B3 | `maxosa-84-juci042` and `sivapa-41-sebu112` did not move — reported, not papered over | maxosa is the `wordWrap` argument to the SAME `create0` call, but that is a `LineBreakStrategy` line-breaking engine (childCount 33 vs 70), a separable sub-feature. Split rather than half-landed. sivapa's residue is sub-pixel node placement plus a 5px total width that nothing in `TextBlockMap`/`TextBlockCucaJSon` explains | agent stopped and reported instead of forcing them |
| 2026-08-11 | B2 | **The 15-vs-16 conflict is resolved by measurement: it is 11.** | A corpus scan of every object fixture whose ORACLE emits a main `label=<<TABLE>>` finds **11**, not the 15 the ledger lists or the 16 `audit-geometry-a.md` claimed. The 15-slug list conflated fixtures carrying only tail/head labels — which upstream builds WITHOUT `addVisibilityModifier` and which therefore never had this defect | scan output: 11 with a main label table, 10 now byte-matching the oracle |
| 2026-08-11 | B2 | M34 could NOT be applied globally — upstream has TWO `appendTable` overloads and only one truncates | `appendTable(sb, XDimension2D, col, gv)` (`svek/SvekEdge.java:504-508`) truncates and serves every EDGE label; `appendTable(sb, int, int, col)` (`:510`) does nothing, and its only caller is the CLUSTER title (`svek/ClusterDotString.java:124`), already integral because `Cluster#getTitleAndAttributeWidth` returns `int` and ceils internally (`svek/Cluster.java:261-264`). Ours is not integral by construction, so truncating cluster titles would have moved geometry on every type that draws a package frame | split into `edgeLabelTable` (truncates) / `labelTable` (unchanged); component 262/262 and usecase 93/93 held |
| 2026-08-11 | B2 | The jar confirms the margin EXACTLY, so the failing unit expectations were pre-margin, not evidence against the fix | `bejusa-95-gafo325`'s own `svek-1.dot` emits `label=<<TABLE … WIDTH="50" HEIGHT="15"` for a 48.425×13 block — `trunc(48.425+2)=50`, `13+2=15` — while its taillabel/headlabel stay `7x13`, unmargined, exactly as upstream's single `addVisibilityModifier` call site (`SvekEdge.java:302`) predicts. Checked the oracle BEFORE editing any expectation | 6 tests updated, each citing that golden |
| 2026-08-11 | B2 | **Landed, correct, and moved NOTHING** — stated plainly rather than dressed up | 10 of 11 main label tables are now oracle-exact (were `21x13` where the jar says `22x15`). Object census 23/80 with an IDENTICAL bucket distribution; all five frozen counts unmoved. These fixtures' residues are other mechanisms — M2 was one layer of several | census before/after identical: 23 / 8 / 10 / 16 / 23 |
| 2026-08-11 | B2 | `lecali-51-funo316` is NOT M2 — a note-on-link mechanism, newly isolated | Its labels are ours `20x15,20x15` vs jar `75x48,174x46`. That magnitude is `EntityImageNoteLink` merged into `labelText` (`SvekEdge.java:308-326`), not a 1px margin. Recorded as its own row rather than left inside M2's count | the label scan, which is why the reach correction surfaced it |
| 2026-08-11 | B1 | **object DOT 58→74 (+16)**, all four siblings unmoved, census 23/80 held | M1+M4 landed together per the ledger ruling. Exactly the 16 deleted `port-backlog` slugs; no new failures. 5 fixtures left the 31+ diff bucket (`sigado` 114→15, `sivime` 81→15, `ruloso` 45→9) | verified by the orchestrator independently of the agent's report: all four gates, five `dot-sync-report` runs, census |
| 2026-08-11 | B1 | The layout engine was NOT at fault — the diagnosis held | `@knowvah/dot-engine` ports `poly_init`'s GAP=4 padding faithfully; our adapter handed it `fixedsize` + an empty label so there was nothing to pad. M4 turned out to be a call-site change, no adapter seam: `GvNode.setHtmlAttr` is public and `headport` needed one symmetric line | real graphviz 15.1.1 reproduced first (49×18 label → 65×36 node), then all four audited pairs matched exactly |
| 2026-08-11 | B1 | `fusopu`/`vimavu` read **+2 diffs and are NOT regressions** — checked, not assumed | Their baseline lumped a whole spline `@d` as ONE non-numeric diff because the component count was wrong; it now matches the jar, so the comparator itemises it. Max delta FELL 48.473→32.003, non-numeric 3→2 | re-measured both fixtures directly; this is the `childCount`-stops-recursion floor effect appearing in the direction that LOOKS like a regression |
| 2026-08-11 | B1 | **B1 held a separable mechanism; only one side landed, deliberately** | `TextBlockMap#getPorts` (maps — every row a port, score 100) covers 17 of 18 M1 fixtures plus the M4 isolate. `MethodsOrFieldsArea#getPorts` is a genuinely different routine (score-gated `getElected`/`getPortShortNames`) and needs member row geometry `MeasuredClassifier` does not expose; the class engine's live path does not use the ported `MethodsOrFieldsArea` at all. JSON is a third, smaller piece | remainder: object `guzojo`/`kavako`/`rozuxo`/`style-stereotype-on-arrow-7` + class's 22 (SI17) |
| 2026-08-11 | B1 | Accepted three write-set deviations | `graph-layout-build-edges.ts` (one `headport` line — the cap-split sibling of write-set file `graph-layout-build.ts`, which re-exports from it); new `svek-dot-emit-labels.ts` (forced pure move, `svek-dot-emit.ts` hit the 500-line cap); `port-backlog.json` (mandated by the iteration's own rule 5). Without the one-liner M1's layout half is inert | flagged by the implementer rather than taken silently |
| 2026-08-11 | B0 | **Authorized re-baseline: object 78→58, class 711→689.** The DOT gate is now port-aware | Maintainer ruled "fix the gate globally, file the class fallout as its own mission" after being shown the blast radius. `parseEdges` discarded both endpoint ports (`(?::\w+)?`, non-capturing); now captured and compared as a sorted multiset (`portOk`). Predicted −20/−22 from a scratch measurement; the real report returned exactly −20/−22 | `dot-sync-report.ts`: object 58, class 689, component 262, usecase 93, state 267 |
| 2026-08-11 | B0 | The port-backlog is an ALLOWANCE, not an exemption — and it was demonstrated to bite | A listed slug must fail `portOk` and **nothing else**; `sizeConformantOk` is excluded because it is not a structural check and has its own `sizeBacklog` gate. Proved by injecting a spurious node into `diveje-52-xefe514`'s oracle: the suite failed with `['nodeCountOk','degreeOk',…]`, not a pass. Golden restored byte-identical | `oracle/goldens/{object,class}/port-backlog.json`, 20 + 22 slugs |
| 2026-08-11 | B0 | Comparing the port id VERBATIM is the right bar, not over-specification | Upstream builds it as `"p" + SignatureUtils.getMD5Hex(portName)` (`svek/Ports.java:53-55`) — a pure function of the member text, so a faithful port reproduces the same hash. Read before writing the comparison | — |
| 2026-08-11 | T4b | **The object DOT gate CANNOT SEE the largest mechanism in the corpus** — a third instrument reporting false comfort | `tests/oracle/svek-dot.ts` compares node count, shape multiset (`plaintext` either way) and edge topology with PORTS STRIPPED. Upstream emits map/json/port-bearing classifiers as `RECTANGLE_HTML_FOR_PORTS`, one `<TR PORT="p<md5>">` per member row (`svek/SvekNode.java:132-135`, `:268-296`), edges anchored to those ports; we emit a 3×3 shield table with one `PORT="h"` (`src/core/svek-dot-emit.ts:92-107`) and every edge `:h->:h`. That scores EQUAL. **"78/80 structurally EQUAL" is therefore NOT evidence that the DOT inputs match** | verified by emitting our DOT through `toSvekDot` and diffing against the cached oracle for 4 fixtures |
| 2026-08-11 | batch-1 | **ZERO of the 57 non-conformant fixtures is `gvts-blocked`** — the mission's central premise is confirmed and then some | G3 filed 46/80 as sub-pixel graphviz noise. Five independent audits, disjoint fixture sets, produced not one engine-blocked row: 45 fixable, 2 fixable-but-large, 10 needs-maintainer-scoping, every row carrying a `file:line` on BOTH sides | `grep gvts-blocked plans/object-close/audit-*.md` returns only negations |
| 2026-08-11 | batch-1 | Maintainer re-ruled D3 (→ **D3a**) and approved deferrals (→ **D7**) | Stop condition 4 was raised on T3's falsification and answered: order batch-2 by measured reach, not by size-backlog membership; defer the USymbol and `{{ }}` subsystems as tracked missions carried by named ledger rows | `decisions.md` D3a, D7 |
| 2026-08-11 | T5b | **Read-set correction, affects every remaining task: `test-results/dot-cache/object/<slug>/svek-1.dot` is a COPY OF THE ORACLE, not our emission** | It is byte-identical to the golden even for `beleso-08-ruca459`, whose real emitted DOT has the edge REVERSED. Diffing it against the golden proves nothing about this port. To see our DOT, capture the `DotInputGraph` via `setLayoutInputObserver` and run `toSvekDot`. (T1's use of it was still valid — comparing a fresh oracle render against a cached oracle render is exactly how it proved the jar had not moved) | `audit-geometry-b.md`, method section |
| 2026-08-11 | T5a+T5b | `classAttributeIconSize` found INDEPENDENTLY by two agents that never communicated (T5a "M4", T5b "C4") | Same mechanism, same `file:line` on both sides (`class-visibility-icon.ts:67-71` hardcodes 10; upstream draws `size-4`, `VisibilityModifier.java:178-180`). Independent rediscovery is the strongest reach signal available for T6's queue ordering | two audit files, disjoint fixture sets |
| 2026-08-11 | T3 | **STOP CONDITION 4 — D3's stated premise is FALSIFIED.** The three identical `0.055556` pins are NOT one mechanism | D3 reads "The three identical `0.055556` pins are the signature of one shared mechanism, not three bugs." Measured: `tenalu-53` is not at 4px at all any more (0.027778 since `babcfa94`; the pin was never lowered). The other two reach 4px by unrelated arithmetic — fonulu's is 2×(badge radius 11−9) on width AND height, lisepi's is 2 rows×(14−12) on height only. Fixing either leaves the other at exactly 0.055556. The real shared cause pairs fonulu with **lunike**, whose pins are NOT equal | T3's audit, `plans/object-close/audit-size.md`, with two confirming jar experiments |
| 2026-08-11 | T3 | **My own T0 attribution of `tenalu-53`'s 2px residue was WRONG** — corrected | T0 recorded it as a header-height term from the stereo row's separate `FontParam.OBJECT_STEREOTYPE` lookup. Refuted by decomposition: the jar's stereo run is `font-size="12" font-style="italic"`, ours measures 12, and the stereo baseline offset is 9.333 on BOTH sides. The real cause is the `AtomText` 10px line-height clamp (`AtomText.java:179-181`) missing from the NAME row — jar 14, ours 12. `B` at 16pt being byte-exact is exactly what a `<10` clamp predicts | `audit-size.md` → `tenalu-53-meri239` |
| 2026-08-11 | T3 | The size-backlog PIN METRIC itself is misleading, independent of any fixture | `maxSizeDeltaIn` pairs nodes by sorted pool, so it has no notion of which node or property moved: it reported 3.362px for `togixe-65` where the true single-node error is 12px. Equal pins are the wrong grouping key — which is exactly how D3's premise came to be believed | `audit-size.md` → `togixe-65-bepo490` |
| 2026-08-11 | T3 | `<<Foo1>> { BackgroundColor LightBlue }` still does not land on `tenalu-53` (ours `#F08080`, jar `#ADD8E6`) — a SECOND defect T0 did not cover | T0 built the `<<stereo>>`-qualified FontSize arm only; the colour arm of the same cascade is unbuilt | `audit-size.md` |
| 2026-08-11 | batch-1 | Cluster sizes are NOT what the brief estimated — **T4 is the oversized one, not T5** | Measured from T1's baseline: T3=8 (as planned), T4=29 (planned 19), T5=20 (planned ~30). The brief pre-authorized splitting T5; the same reasoning applies to whichever cluster is actually oversized | `nonNumericPaths` non-empty on 36 fixtures, 7 of which are T3's |
| 2026-08-11 | batch-1 | Split into FIVE agents, not three: T3(8) · T4a(9) · T4b(20) · T5a(7) · T5b(13) | T4 split at `nonNumericPaths >= 5` — the heavy group is where a shared cascade mechanism plausibly lives, the light group is "one stray non-numeric diff on an otherwise geometric fixture". T5 split at the brief's own band boundary, 10px | each writes its own `audit-*.md`; all read-only on `src/`, so no write conflicts |
| 2026-08-11 | batch-1 | Ran the audits as `general-purpose`, NOT the `Explore` agent the brief names | `Explore` has no Write tool — it cannot produce the audit FILE that is the task's declared deliverable and write-set. Routing the findings back through the orchestrator instead would defeat the split, which exists to keep 57 fixtures of detail out of one context | agent registry: Explore = "All tools except Agent, Artifact, ExitPlanMode, Edit, Write, NotebookEdit" |
| 2026-08-11 | batch-1 | Maintainer authorized subagent use for this batch | The session's harness instruction forbids the Agent tool unless the user requests it; asked, and the answer was "spawn the subagents as the brief specifies" | — |
| 2026-08-11 | T2 | Guard lives in `npm test`, not as a census preflight | CI runs `npm test` unconditionally; the census only runs when someone chooses to. One JVM start costs 2.4s, inside T2's ~5s budget (suite 58.35s, +1 file / +1 test) | `tests/oracle/svg-conformance/oracle-freshness.test.ts`; suite 574 files / 12708 pass |
| 2026-08-11 | T2 | **Failure path DEMONSTRATED, not asserted on faith** — all three branches exercised | (1) fresh cache → passes; (2) sentinel reverted to its pre-0.2.0 committed form (`HEAD~1`, 739 vs 735 bytes) → FAILS naming the slug and telling the reader to re-capture rather than relax the check; (3) jar moved aside → skips with a reason, does not fail. Sentinel and jar both restored, `git status` clean | the staled run's assertion text is quoted verbatim in the commit body |
| 2026-08-11 | T2 | Byte comparison is sound, not flaky — verified before relying on it | Two consecutive jar renders of the sentinel are `cmp`-identical, and identical to the committed cache. Without that check a byte assertion would have been a guess | `cmp det1/in.svg det2/in.svg` → identical |
| 2026-08-11 | T1 | Survey concurrency 6 (the script default) produced 80/80 `timeout` — a silently WRONG file, not an error | Re-ran at `SVG_PARITY_CONCURRENCY=2` (the value my own notes already recorded for committed runs) with a 60s timeout: 23 conformant / 21 structural-match / 36 diverged, zero timeouts | first run wrote `{"timeout":80}`; second `{"conformant":23,...}` |
| 2026-08-11 | T0 | Frozen-count denominators differ from the brief for class (711 vs 708) and usecase (93 vs 90) | Both report 100% EQUAL with zero diverging checks, so nothing regressed — the brief's denominators are stale, not the health. Not treated as stop condition #2 | `dot-sync-report.ts`: class 711/711, usecase 93/93, component 262/262, state 267/267, object 78/80 |

## B1 (M1+M4) — diagnosis, written BEFORE any code change

**Mechanism.** Upstream routes every map, every JSON, and every port-bearing
object/class through `SvekNode#appendShape`'s `RECTANGLE_HTML_FOR_PORTS` branch
(`svek/SvekNode.java:132-135`) into `appendLabelHtmlSpecialForLink`
(`:269-311`). That routine asks the image for its `Ports`
(`((WithPorts) image).getPorts(stringBounder)`), then emits a `shape=plaintext`
node whose HTML `<TABLE>` carries, per port in ascending-position order, a
filler `<TR>` for the gap since the last port and then a
`<TR><TD … PORT="p<md5>" HEIGHT="…">` for the port's own band — closing with a
trailer row for `getHeight() - sum`. **It emits no `width`/`height` attribute at
all**; graphviz sizes the node from the label and pads it.

We emit a 3×3 `shieldTable` with a single `PORT="h"`
(`src/core/svek-dot-emit.ts:92-107`, placeholder constants `SHIELD_MARGIN_X=1`/
`SHIELD_MARGIN_Y=16` at `:89-90`) and anchor every edge as `:h`
(`:169` — `:h` is the only suffix `edgeRef` can produce for a plaintext node).

**Origin, ours.** `src/core/svek-dot-emit.ts:150-152` (no
`appendLabelHtmlSpecialForLink` analogue) and
`src/core/graph-layout-build.ts:47-49` (`layoutShape` folds `plaintext`→`box`)
+ `:160-169` (`fixedsize:'true'`, `label:''`, explicit width/height).

**Causal chain.** No ports emitted ⇒ every edge anchors to the whole node
instead of a member row ⇒ tail/head y is the box centre, not the row band ⇒
splines leave from the wrong place, and the node's own footprint is the raw
measured label with none of graphviz's own padding ⇒ every downstream
coordinate is 16px tight horizontally / 8px tight vertically.

**Ruled out.** Not the layout engine: `@knowvah/dot-engine` ports `poly_init`'s
sizing faithfully, `GAP = 4` included
(`dist/common/poly-sizing.d.ts`) — it pads correctly when given a label
dimension. The padding is missing because our adapter hands it
`fixedsize:'true'` with a pre-measured box and an EMPTY label, so there is no
label for `polySize` to pad. That is our call site, not the engine's arithmetic.

**Already ported, do not rebuild** (checked per CLAUDE.md's catalog rule):
`src/core/svek/Ports.ts` (full, including `encodePortNameToId`),
`src/core/svek/PortGeometry.ts`, `src/core/utils/SignatureUtils.ts#getMD5Hex`,
and `getPorts` implementations on `MethodsOrFieldsArea`/`SheetBlock2`. The
model exists; **what is missing is the wiring** from it into `DotInputNode`/
`DotInputEdge` and the emitter. `getPorts()` currently has no DOT-building
caller anywhere in `src/`.

**Open design question handed to the implementer.** The engine's `polySize`
takes `labelDimen`; our builder's `addNode` takes DOT attrs. Making the engine
pad requires handing it the table's dimensions as a LABEL rather than as
`width`/`height` + `fixedsize`. Whether the builder exposes that today is
unverified — it decides whether M4 is a call-site change or needs an adapter
seam.

## B3 (M3) — diagnosis, written BEFORE any code change

Read at the source, not taken from the ledger. Three sub-parts, ONE seam.

**(a) Cells bypass creole.** `TextBlockMap#getTextBlock`
(`cucadiagram/TextBlockMap.java:172-181`) builds every cell as
`Display.getWithNewlines(...).create0(fontConfiguration, LEFT, skinParam,
wordWrap, CreoleMode.FULL, null, null)` — so `__…__` underlines and
`<font:…>` become real attributes. The `"\0"` key short-circuits to a `Point`
BEFORE that (`:173-174`), which is the linked-row marker. JSON does the
identical thing in its own `getTextBlock`
(`cucadiagram/TextBlockCucaJSon.java:184-190`). Ours measures and renders the
raw string (`src/diagrams/class/class-map-sizing.ts:71-76`, `:147-155`).

**(b) The per-row vertical rule.** `TextBlockMap#drawU` (`:140-153`) draws, for
every value that is NOT a `Point`, the value cell at `dx = widthColA` AND
`ULine.vline(heightOfRow)` at that same x. Empty-string values included —
`Point` is the only exemption. We draw horizontal rules only.

**(c) JSON's full-height rule.** `TextBlockCucaJSon`'s inner `drawU`
(`:163-167`) draws ONE `ULine.vline(height)` at `dx = width1` for the whole
object, before the per-member loop — not per row as in the map case. A
different shape from (b); do not unify them.

**Already ported, do not rebuild.** The `withMargin(result, 5, 2)` both
`getTextBlock`s apply is present as `MAP_CELL_MARGIN_X/Y`
(`class-map-sizing.ts:71-76`), and its doc comment already cites the upstream
contract. The creole commands are ported and wired for other paths
(`core/klimt/creole/command/CommandCreoleFontFamilyChange.ts`,
`CommandCreoleBuilder.ts:110`). This is a missing CALL, not a missing feature.

**Causal chain.** Raw-string cells ⇒ `__x__` measures as 4 characters wider
than the jar's underlined text and `<font:…>` measures as literal markup ⇒
column A is mis-sized ⇒ every downstream x in the row is wrong, and the
missing vline is a straight `childCount` divergence that also stops
`compare.ts` recursion, hiding whatever sits below it.

**Ruled out.** Not the cell margin (ported, correct). Not `getHeightOfRow`
(`:167-170`, a plain `max` of the two cell heights — already what we do). Not
the `Point` path: the jar never draws a Point row's value text at all, and our
`buildOneMapRow` already special-cases it.

## B4 (M5) — diagnosis, written BEFORE any code change

**Mechanism.** `skinparam classAttributeIconSize` (default 10,
`skin/SkinParam.java:554-556`) sizes the member-row visibility glyph. Upstream
uses it in TWO places with DIFFERENT arithmetic, and conflating them is the
trap:

- **Block dimension** — `VisibilityModifier#getUBlock`'s `calculateDimension`
  returns `new XDimension2D(size + 1, size + 1)` (`skin/VisibilityModifier.java
  :100-102`) using the RAW size.
- **Drawn glyph** — `drawU` first does `size = ensureEven(size)`
  (`:135`, helper at `:186-190`: an odd n becomes n−1) and only then dispatches,
  so every shape draws from the EVENED size: square/circle `size - 4` at
  `translate(x+2, y+2)` (`:178-183`), diamond/triangle `size - 2` at
  `translate(x+1, y)` (`:192-209`).

So for 10 → block 11, glyph 6; 20 → 21/16; 14 → 15/10; 12 → 13/8; 16 → 17/12.
That reproduces all four fixture pairs the audit measured, and it is read from
the Java rather than fitted to them.

**Origin, ours.** `src/diagrams/class/class-visibility-icon.ts:68`
(`VISIBILITY_ICON_SIZE = 10`, whose own doc comment already says "skinparam
override not wired"), `:71` (`ICON_BLOCK_HEIGHT`), and the four draw helpers at
`:159-199`, all of which hardcode that constant. We therefore draw a 6px glyph
whatever the user asks for.

**Causal chain.** Wrong glyph size ⇒ wrong `rect`/`ellipse`/`polygon` geometry
in the member row ⇒ the four fixtures' numeric diffs. Render-only: it never
reaches the DOT, which is why all four are already DOT-EQUAL and why no frozen
count should move.

**Ruled out.** Not a parsing gap — `classAttributeIconSize` already reaches
`theme.colors.graph` (`skinparam-key-handlers.ts:151-157` citing
`SkinParam.java:554-556`, wired at `skinparam-theme-builder.ts:40`). Not a
colour or centring issue: `centeringDelta` (`:80-82`) derives from
`ICON_BLOCK_HEIGHT` and will follow the size once it is threaded.

**Found independently by two audits with disjoint fixture sets** —
`audit-geometry-a.md` M4 and `audit-geometry-b.md` C4, same `file:line` on both
sides. That is the strongest reach evidence this mission produced.

## B5 (M6) — diagnosis, written BEFORE any code change

**Mechanism.** `LimitFinder#drawRectangle` (`klimt/drawing/LimitFinder.java
:184-188`) records a plain `URectangle`'s ink corners as `(x-1, y-1)` and
`(x+w-1+2·shadow, y+h-1+2·shadow)` — inset on BOTH corners. Our classifier rule
`addRectInk` deliberately overrides the max corner to `(x+w, y+h)` because a
classifier that draws a body compartment has something else in its own draw
reaching that corner (G2 N5's jar-verified net rule). An object whose field
list is empty draws **no body content at all**, so nothing supplies that extra
pixel and the rect's own symmetric inset governs both axes.

Upstream reaches the empty body through two disjoint branches, and **neither
draws anything**:

- `EntityImageObject` ctor `svek/image/EntityImageObject.java:110-113` —
  `getFieldsToDisplay().size() == 0 && showFields` ⇒ `new TextBlockLineBefore(
  thickness, new TextBlockEmpty(10, 16))`. `TextBlockEmpty#drawU` is literally
  empty (`klimt/shape/TextBlockEmpty.java:63-64`); `TextBlockLineBefore#drawU`
  draws only `UHorizontalLine.infinite(thickness, 1, 1, sep)`
  (`klimt/shape/TextBlockLineBefore.java:84`), whose `ULine` spans
  `[startingX+1, endingX-1]` (`klimt/shape/UHorizontalLine.java:99-108,148-151`)
  and so stops at `x+w-1` — it cannot reach the rect's max corner either.
- `BodierLikeClassOrObject#getBody`'s OBJECT arm
  (`cucadiagram/BodierLikeClassOrObject.java:225-229`) — `showFields == false`
  ⇒ `TextBlockUtils.empty(0, 0)`, whose `drawU` is also empty
  (`klimt/shape/TextBlockUtils.java:85-88`).

The only branch that draws a body is `BodyFactory.create1` at `:231-232`,
reached exactly when the field list is non-empty **and** shown. So the ink rule
is keyed on *"the object's body TextBlock draws nothing"*, which is true in
both empty-list branches; our gate models only the second.

**Origin, ours.**

- `src/diagrams/class/class-ink-box.ts:278` — the gate
  `c.kind === 'object' && c.dividerYs.length === 0` models `showFields == false`
  only. An empty-field object with `showFields` true carries
  `dividerYs: [title.height]` (`class-object-map-sizing.ts:378`) and therefore
  falls through to `addRectInk`.
- `src/diagrams/class/class-ink-box.ts:122-125` — `addRectInkEmptyBody` applies
  the `-1` on X but keeps `y + h`.

**Causal chain.** Ink max corner 1px too large on each axis ⇒
`computeClassDocumentDims`'s `.delta(15,15)` + margins + `floor(v+1)` canvas is
1px too large on each axis. No shape coordinate moves, because the ink **min**
corner is unchanged and the ink shift derives from it.

Closed arithmetically on `jabote-02-rajo672`, both directions, no fitted
constant. Jar rects `(7,7,29.575,34)`, `(72,7,…)`, `(7,101,…)`:

- correct rule ⇒ ink `[6, 100.575] × [6, 134]` ⇒ `(94.575, 128)` `+ (15,15)`
  ⇒ `+ (5,5)` margins ⇒ `(114.575, 148)` ⇒ `floor(v+1)` ⇒ **115 × 149** = jar.
- our rule ⇒ `[6, 101.575] × [6, 135]` ⇒ … ⇒ **116 × 150** = what we emit.

**Evidence.** `jabote-02-rajo672` and `jotaga-99-fatu830` each have exactly 4
diffs — `svg/@width`, `svg/@height`, `viewBox[2]`, `viewBox[3]` — every one
delta `1.0000`, and **no shape diffs at all**.

**Ruled out.**

- Not a sizing defect: every rect/line/text coordinate matches the jar exactly;
  only the document extent differs.
- Not the shadow term — `shadowing` is 0 on all four fixtures.
- Not `showFields`: none of the four carries a hide directive; they reach the
  empty body through the *other* branch, which is precisely the gap.
- Not a `UEmpty` reservation asymmetry: `UEmpty` is never drawn on any
  class/object path (`grep UEmpty src/main/java/net` hits only
  `USymbolNode`/`USymbolDatabase`/`LaneDivider`/activity ftiles), so
  `addRectInk`'s own doc comment attributes its `+1` to a shape that this path
  does not draw. Whatever supplies it for a populated classifier, it is
  downstream of `BodyFactory.create1`, which the empty branches never call.

**Falsifiable prediction, to be checked in the same re-measure.**
`kexica-21-gega428` and `janoma-30-dovo501` are zero-diff **today** under
`addRectInkEmptyBody`'s `y + h`. Upstream draws nothing in either empty branch,
so the Y term must be `y + h - 1` for both, and those two fixtures must stay
zero-diff — i.e. their max-Y must be supplied by something other than the
empty-bodied rect. **If either regresses, this diagnosis is wrong**: the two
branches would have to differ in ink, for which the Java above offers no
mechanism, and B5 stops rather than keeping a two-rule split that nothing
justifies.

**Open candidate, not pre-credited.** `beleso-08-ruca459` carries an
unattributed 1.0px residual on both axes and its two objects are both
empty-field. Expected to shrink by exactly that residual, not to flip (23
diffs, max 94px, dominated by M7).

## B5 (M6) — outcome: the prediction was FALSIFIED, and the gate is narrower

**What happened.** Adding the Y term to `addRectInkEmptyBody` took
`kexica-21-gega428` — pinned and zero-diff — from 0 to 2 diffs (canvas 1px
SHORT on height). The falsification test written above did its job: the
diagnosis's "both empty branches must share one ink rule, because upstream
draws nothing in either" was wrong as a predictor, even though every Java
citation in it is accurate.

**What the evidence actually supports.** I authored three fixtures and rendered
them through the pinned jar — untitled, edge-free, and TWO nodes each (two so
the degenerate-single-leaf sizer path is not taken; untitled so annotation
chrome cannot absorb a pixel). No existing fixture isolates these states:
every `showFields == false` object in the corpus is either titled or a single
leaf.

| body state | upstream source | maxX | maxY | jar canvas |
|---|---|---|---|---|
| populated | `BodyFactory.create1` (`BodierLikeClassOrObject.java:231-232`) | `x+w` | `y+h` | 148 x 62 |
| `showFields == false` | `TextBlockUtils.empty(0,0)` (`:225-229`) | `x+w-1` | `y+h` | 123 x 40 |
| empty list, shown | `TextBlockEmpty(10,16)` (`EntityImageObject.java:110-113`) | `x+w-1` | `y+h-1` | 123 x 55 |

Three states, three max corners. So the B5 ledger row's proposed gate ("field
list is empty") is not merely imprecise — it is **wider than the truth**, and
applying it regresses a pinned fixture. The correct gate is the single upstream
branch at `EntityImageObject.java:110-113`.

**Landed.** A third rule, `class-ink-box.ts#addRectInkEmptyShownBody`
(`addPoint(x-1,y-1)`, `addPoint(x+w-1,y+h-1)` — `LimitFinder.java:184-188`
verbatim), gated on a new `ClassifierGeo.emptyFieldPlaceholder` flag set at
`class-object-map-sizing.ts#buildFieldBasedObjectGeo` when
`showFields && fieldRows.length === 0`. `addRectInkEmptyBody` is untouched.
`addClassifierBoxInk` was extracted from `addClassifierInk` to keep CCN under
the repo cap (pure split, no behavior change).

**What I could not explain, and did not paper over.** The `+1` by which the
other two states exceed `LimitFinder#drawRectangle` has no identified drawing
shape. `addRectInk`'s doc comment attributes it to an invisible full-box
`UEmpty` reservation; `UEmpty` is drawn nowhere on any class/object path
(`grep` finds only `USymbolNode`, `USymbolDatabase`, `LaneDivider`, and the
activity ftiles), so that attribution is wrong. This is pre-existing since G2
N5 and orthogonal to M6 — it is exactly why the new rule is keyed on the
upstream branch rather than derived from geometry. Recorded in the ledger's M6
section as open; NOT filed to `docs/graphviz-issues/` because it is this port's
own model gap, not a `@knowvah/dot-engine` divergence.

**Measured.** Object SVG census **23 → 26/80**. Before/after zero-diff sets
compared element-wise: **zero lost, three gained**, and no fixture anywhere in
the corpus got worse — the two-directional check the amended protocol requires,
not the scalar count. Gains: `jabote-02-rajo672`, `jotaga-99-fatu830`, and
`fafozi-27-reja300` (unpredicted — the queue had its 2 diffs under M33/B30;
they were the M6 canvas pair, so B30 loses its only fixture). Partials on ten
further fixtures, all strictly downward — see the ledger's M6 block.

**Frozen counts — all five DOT gates and every sibling census unmoved.**

| gate | frozen | measured | verdict |
|---|---|---|---|
| object DOT structural | 74/80 | 74 (93%) | unmoved |
| class DOT | 689/711 | 689 (97%) | unmoved |
| component DOT | 262 | 262 (100%) | unmoved |
| usecase DOT | 93 | 93 (100%) | unmoved |
| state DOT | 267 | 267 (100%) | unmoved |
| class SVG goldens | 317 pinned | 317 pass | unmoved |
| description SVG goldens | 48-set | pass | unmoved |
| object SVG ratchet | 22 pinned | 25 pass (+3) | additive |

The class/description/state *censuses* remain stale-cache artifacts (T1; only
`object` was re-captured), so the trustworthy cross-type signal is the golden
ratchets, all of which `npm test` exercised green. Flagging that explicitly
rather than quoting a census number that measures the cache.

**Quality gates.** `npm test` 574 files / 12739 tests, exit 0 · `npm run
typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0. None piped.

**Harness note, cost me a rerun.** `scripts/svg-parity-survey.ts` at its default
`SVG_PARITY_CONCURRENCY=6` timed out **all 80** object fixtures and wrote a
file claiming `{"timeout":80}`. Restored from HEAD and reran with
`SVG_PARITY_CONCURRENCY=2 SVG_PARITY_TIMEOUT_MS=60000`, which reproduces the
census exactly (26 conformant). A committed parity run must not use the
default.

## B6 (M7) — diagnosis, written BEFORE any code change

**Mechanism.** Upstream inverts a link in exactly one place —
`CommandLinkClass.java:362-363`, `if (dir == Direction.LEFT || dir ==
Direction.UP) link = link.getInv();` — and `dir` comes from `getDirection(arg)`
(`:517-527`), which **strips the arrowheads before classifying**:
`s.replaceAll("[^-.=\\w]", "")` deletes `<`, `>`, `|`, `*`, `#`, `+`, and then
a leading/trailing `o`. `StringUtils.getQueueDirection`
(`StringUtils.java:281-314`) then looks for a direction WORD (`left`/`right`/
`up`/`down`, or a bare `l`/`r`/`u`/`d` word char), falling back to `RIGHT` for
a length-1 body and `DOWN` otherwise.

So `A <-- B` reduces to `--` → `DOWN` → **not inverted**. Only an explicit
`-left-`/`-up-` inverts. The arrowhead never participates.

**Origin, ours.** `src/diagrams/class/class-arrow-grammar.ts:248-249`:

```ts
const decorSwap = isDirectionKind(kind1) && !isDirectionKind(kind2);
const swapDirection = decorSwap !== upOrLeft;   // XOR
```

`upOrLeft` alone is upstream's condition; the `decorSwap` term has no upstream
counterpart. It fires on every arrow whose head decor sits on the LEFT end and
not the right — `<--`, `<|--`, `*--`, `o--` — so those links are inverted where
the jar does not invert them.

**Causal chain.** `swapDirection` picks `from`/`to`
(`class-relationship-parser.ts:380`), so an inverted link emits its dot edge
backwards. Edge direction is what dot ranks on, so the two endpoints swap
ranks, every node below them shifts, and the whole layout moves — hence the
94px deltas on the "94.0 triple" rather than a decoration-level difference.

**Why it has not shown up as total corpus carnage.** The port already
compensates in two places, which is the tell that the model diverged rather
than that one predicate is wrong:

- `class-dot-graph.ts:78-80` `ranksParentFirst` re-reverses the dot edge for
  `extension`/`implementation` only, driven by `parentIsLinkEntity1` (itself
  just `swapDirection`, `class-relationship-parser.ts:446-449`). That was added
  2026-08-08 for `class-inheritance-interface-assoc`, which was 122px short.
- G2 N9/N30 already carry the *upstream* orientation separately as
  `idEntity1FullId`/`idEntity2FullId` — picked by `upOrLeft` alone, exactly
  upstream's rule — because the SVG id pair and the drawn path direction both
  needed the real order.

So the AST already holds upstream's `cl1`/`cl2` under a different name; only
the dot emission fails to use it, and patches around the gap for two of the
seven relationship types.

**Fix, therefore, is not "flip the predicate".** Dropping `decorSwap` from
`swapDirection` would re-orient `from`/`to` for every left-headed arrow and
drag decors, roles, ports, quantifiers and every renderer consumer with it.
The upstream-faithful and far narrower change is at the dot boundary, where
upstream emits `entity1 -> entity2` verbatim (`SvekEdge.java:249-250` takes
`getEntityPort1/2` as-is): emit the dot edge as
`idEntity1FullId -> idEntity2FullId`, which generalizes `ranksParentFirst`
from "hierarchical only" to "every relationship" and makes
`parentIsLinkEntity1` a fallback for relationships built outside the arrow
grammar rather than the rule.

**Ruled out.**

- Not a decoration bug: the arrowhead end is already correct in the rendered
  SVG on all three fixtures; what differs is node placement.
- Not `queue`/rank-length: `getQueueLength` (`:511-515`) is a separate
  computation off the same arrow and is unaffected by the inversion.
- Not object-specific — `decorSwap` lives in the shared class arrow grammar.
- The existing hierarchical patch is not merely incomplete but wrong in one
  case it can already reach: for a hierarchical arrow that ALSO carries
  `-left-`/`-up-`, `swapDirection` is `decorSwap XOR upOrLeft` = false, so
  `ranksParentFirst` declines to reverse and we emit the opposite of upstream.
  The FullId pair gets that case right by construction.

**Blast radius, measured, not estimated.** Left-headed arrows appear in **7 of
80** object fixtures and **116 of 722** class fixtures. This iteration
therefore expects the **class DOT count to move** — the B6 ledger row names
`class/baneru-00-kuro607` and `class/mopesi-01-gapo101` in advance. A gain here
is mechanism-explained, but the frozen-count rule is two-directional, so the
result gets reported for a maintainer call rather than re-baselined in-flight
(the object/class re-baseline at B0 was an explicit maintainer ruling, not a
precedent I may reuse).

## B6 (M7) — outcome, and a gate weakness the outcome exposed

**Landed.** `class-dot-edge-order.ts#dotEdgeRunsReversed` — the dot edge is now
emitted `idEntity1FullId -> idEntity2FullId`, upstream's own `Link` order, for
every relationship type. `parentIsLinkEntity1` survives as the fallback for
edges built outside the arrow grammar. Split into its own module because
`class-dot-graph.ts` crossed the 500-line cap.

**Second half of the same mechanism, required for correctness.** `swappedEdges`
recorded "every HIERARCHICAL index" while emission used `ranksParentFirst`
(hierarchical AND `parentIsLinkEntity1`). The two disagreed for any
child-first inheritance form (`D --|> I`), and `class-edge-geo.ts
#normalizeEdgePoints` derives `matchesFromTo` — which pairs
`sourceDecor`/`targetDecor` with the point array — from that set. Both sides
now call the same predicate. Without this, every newly-reversed association
edge would have had its arrowhead placed at the wrong end.

**Measured.** Object SVG census **26 → 29/80**. The whole "94.0 triple" flipped
together — `beleso-08-ruca459`, `fikojo-87-tine499`, `sarepa-89-cevi460`, all
19 → 0 diffs — which is the confirmation that they were one cause, as the
audit claimed. `tobuka-93-jale775` 146 → 137. Zero lost, nothing worse.

### The prediction I recorded in the diagnosis was wrong, and the reason matters

I predicted the class DOT count would move, because 116 of 722 class fixtures
carry a left-headed arrow. It did not move: class **689/711**, object
**74/80**, both exactly frozen. That is not because the fix was inert — the
object SVG census moved by 3 and the DOT emission changed for every one of
those fixtures.

**The DOT structural comparator cannot see edge direction.**
`tests/oracle/svek-dot.ts#structurallyEqual` is the conjunction of: node count,
edge count, `degreeSequence`, sorted minlens, sorted shapes, label counts,
sorted endpoint ports, sorted cluster sizes, rankdir, nodesep, ranksep.
`degreeSequence` (`:199-208`) increments BOTH endpoints and sorts, so it is an
**undirected** signature; every other member is a sorted multiset or a scalar.
Reversing `a -> b` to `b -> a` leaves all eleven invariant.

So M7 was invisible to the mission's primary structural gate for its whole
life, and 116 class fixtures have been scoring EQUAL while emitting edges the
jar emits the other way. The frozen counts holding is therefore **not**
evidence that the class corpus was unaffected — the class SVG goldens (317,
all passing) are what carries that claim here.

**Not fixed in this iteration, deliberately.** Teaching the comparator
direction is a gate widening that would re-score the class and object
denominators in the same pass that changes the emission, confounding both. It
is also plainly separable. Filed as a queue item (ledger B31) rather than
half-landed here — the batch-2 protocol's own "if an item turns out to hold
several mechanisms, split it" rule, and the same call two earlier iterations
made.

**Frozen counts.**

| gate | frozen | measured | verdict |
|---|---|---|---|
| object DOT structural | 74/80 | 74 (93%) | unmoved |
| class DOT | 689/711 | 689 (97%) | unmoved (see blindness above) |
| component DOT | 262 | 262 (100%) | unmoved |
| usecase DOT | 93 | 93 (100%) | unmoved |
| state DOT | 267 | 267 (100%) | unmoved |
| class SVG goldens | 317 | 317 pass | unmoved — the load-bearing check |
| object SVG ratchet | 25 | 28 pass (+3) | additive |

**Quality gates.** `npm test` 574 files / 12748 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

Recorded rather than swept up: the first post-ratchet `npm test` died at
`EXIT=138` — `Bus error: 10`, a node SIGBUS ~34.5k lines in, immediately after
`tests/unit/description/spline-clip.test.ts` and well AFTER
`class.golden.ratchet.test.ts` had passed all 314. Not a test failure and not
reproducible: the identical tree reran clean end-to-end. Four full suites ran
green on this tree before it and one after, so it is being treated as an
environment crash. Flagged because "the gate crashed once" is not the same
claim as "the gate is green", and a second occurrence would deserve a real
investigation rather than another rerun.

## B10 (M12) — diagnosis and outcome

Small enough that diagnosis and outcome fit together; the mechanism was never
in doubt and the measurement confirmed it without a surprise.

**Mechanism.** Upstream renames PlantUML's own LOGICAL font name `monospaced`
to the CSS generic `monospace` inside `if (fontFamily != null)`, and does it
BEFORE both tests that follow — the `DEFAULT_FONT_FAMILY` comparison that
decides whether to emit `font-family` at all, and the `monospace`/`courier`
test that swaps spaces for NBSP (`klimt/drawing/svg/SvgGraphics.java:716-729`,
which carries its own link to the upstream QA report the rename came from).
The comparison is `equalsIgnoreCase` against the WHOLE family, so a CSS stack
like `Courier, monospaced` does not qualify.

**Origin, ours.** `src/core/svg-shapes.ts` had the rename on the NBSP half
only (`nbspIfMonospace`, inline) and not in `textFontFamily`, so `""monospaced""`
creole NBSP-substituted its text correctly while emitting the raw logical name
as the attribute VALUE. The klimt-drawn engines' copy of the rule
(`svg-graphics-elements.ts#applyTextFontFamily`) already had both halves —
this was the shared-shape-seam copy only.

**Causal chain.** `font-family="monospaced"` vs jar's `font-family="monospace"`
— one non-numeric diff, no geometry, because the rename is emission-only:
upstream applies it in `SvgGraphics#text`, after `DriverTextSvg` has already
measured and passed `textLength` down.

**Ruled out.** Not a measurement or creole-parse difference: both fixtures had
exactly ONE diff each, on the same path, with identical `ours`/`jar` values,
and every coordinate already matched.

**Landed** as `src/core/svg-text-font.ts#renameLogicalMonospace`, called from
`textFontFamily` before the root-family comparison and from `nbspIfMonospace`
in place of its inline copy — one definition, both consumers.

**The one-line fix was not a one-file change.** `svg-shapes.ts` was ALREADY 52
lines over the repo's 500-line cap (552) before this iteration touched it, so
the complexity hook blocked the edit outright. The font-family/NBSP helpers
moved to a new `core/svg-text-font.ts` (pure move plus the fix), leaving
`svg-shapes.ts` at 412. `textLengthOf` was moved back — it is rule 5, unrelated
to the font family. The new module sits inside the `core/svg*.ts` namespace the
SVG-emission-seam fitness test scopes to, so that architectural gate still
covers it.

**Measured.** Object SVG census **29 → 31/80**. `fajafu-44-cuve930` and
`pavizi-27-xupe815` each 1 → 0; **no other fixture in the corpus moved at all**,
which is the expected signature for an emission-only rename. Zero lost.

**Frozen counts — all unmoved.** object DOT 74/80 · class DOT 689/711 ·
component 262 · usecase 93 · state 267 · class SVG goldens 317 pass ·
description 48-set pass. This edit is on the SHARED shape seam, so class,
state, json and every other engine emitting through it were in the blast
radius; the golden ratchets are what confirm they were untouched.

**Quality gates.** `npm test` 574 files / 12753 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped. No repeat of B6's SIGBUS.

## B25 (M27) — diagnosis, written BEFORE any code change

**Mechanism.** `skinparam minClassWidth` is registered as
`addConvert("MinClassWidth", PName.MinimumWidth)`
(`style/FromSkinparamToStyle.java:241`) — with **no `SName` varargs at all**.
`addConvert` (`:414-422`) stores `new Data(styleNames, propertyName)` with an
EMPTY name array, and an empty style signature is a subset of every element's
signature, so the value matches **every element**, not just classes. The name
is a historical misnomer.

Every one of the four `EntityImage*` classes that draws a boxed
class-family leaf therefore reads it and floors its own width, with
character-identical arithmetic:

| class | line | code |
|---|---|---|
| `EntityImageClass` | `:103-105` | `width = max(dimBody.w, dimHeader.w)`, then floor |
| `EntityImageObject` | `:150-153` | `width = max(dimFields.w, dimTitle.w + 2*xMarginCircle)`, then floor |
| `EntityImageMap` | `:127-130` | identical to object |
| `EntityImageJson` | `:127-132` | identical to object |

In all four the floor is applied to the **box** width, after the
content/title max and before the height computation, so the floored width is
what `drawU` then hands to the header layout as `dimTotal.getWidth()`.

**Origin, ours.** `class-layout-helpers.ts:414-416`:

```ts
function resolveMinClassWidth(theme: Theme, kind: ClassifierKind): number {
  return LIKE_CLASS_KINDS.has(kind) ? resolveElementMinimumWidth(theme, 'class') ?? 0 : 0;
}
```

The gate is `LIKE_CLASS_KINDS`, and `object`/`map`/`json` are not in it — so
those three kinds get `0` and no floor is ever applied. The resolver itself is
fine and already does the right cascade (element bucket over the bare global,
`theme-element-resolve.ts:143-145`); it is simply never consulted on the
object/map/json paths, which compute their width in four separate places:
`class-object-map-sizing.ts:340` (enhanced body) and `:367` (plain fields),
`class-map-sizing.ts:269`, `class-json-sizing.ts:348`.

The `LIKE_CLASS_KINDS` gate is itself correct for what its own doc comment
claims — `EntityImageClass` is only built for `isLikeClass` leaves — but that
reasoning covers `sameClassWidth` and the `groupInheritance` wrap, which
genuinely are `EntityImageClass`-only. `MinimumWidth` is not, and got swept in
with them.

**Causal chain.** `tobuka-93-jale775` sets `skinparam minClassWidth 400` over
seven objects. Each box is measured at its natural width (66.9px for
`Verbund`) instead of 400, so every node is ~333px too narrow; dot then packs
them into a 390px canvas where the jar needs 1544 — a 1154px delta on
`@width`/`viewBox[2]`, the largest single numeric delta in the corpus, from
one missing clamp.

**Scope is wider than the ledger row, and the row is not wrong — it is
fixture-limited.** M27 is filed as "objects" because `tobuka-93` is the only
fixture. But map and json carry the same clamp on the same line of their own
`calculateDimensionSlow`, so porting only the object arm would leave a known
divergence behind in code I had already read. All three arms land together.
Expected to be inert for map/json in the current corpus (no fixture combines
`minClassWidth` with a map or json leaf), which the measurement will confirm.

**Ruled out.** Not a parse gap — `skinparam minClassWidth` already reaches
`theme.minimumWidth` (`skinparam-key-handlers.ts:166-169`) and the class path
consumes it today. Not `monochrome` (also set by this fixture): the rect
widths are wrong, not the colours, and the colour attributes already match.
Not `sameClassWidth`, which is a separate `getParamSameClassWidth()` floor
applied after this one (`EntityImageClass.java:107-109`) and is already
modelled elsewhere.

## B25 (M27) — outcome

**Landed** as `class-object-map-sizing.ts#floorAtMinimumWidth`, applied on
all THREE missing arms: object (both the enhanced-body and plain-fields
branches), map (`class-map-sizing.ts`) and json (`class-json-sizing.ts`).
Applied after the content-vs-title max and before the height computation, so
the floored width is what `headerRows` receives as `boxWidth` — upstream's own
ordering, and the reason the header centring follows the floor.

`class-layout-helpers.ts#resolveMinClassWidth` is deliberately left alone: its
`LIKE_CLASS_KINDS` gate is still correct for its two other tenants
(`sameClassWidth` and the `groupInheritance` wrap genuinely ARE
`EntityImageClass`-only). Widening it would have re-scoped those two as a side
effect.

**Scope call.** The ledger row said "objects". I ported map and json too,
because `EntityImageMap.java:127-130` and `EntityImageJson.java:127-132` carry
the same clamp on the same line of their own `calculateDimensionSlow` — I had
already read them while confirming the mechanism, and leaving two known
divergences behind would have been a deliberate omission rather than a scope
boundary. As predicted, inert on the current corpus (no fixture combines
`minClassWidth` with a map or json leaf); unit-tested directly instead.

**Measured — the fix worked, and the fixture still does not flip.**
`tobuka-93-jale775` **137 → 41 diffs**. The 1196px error is gone: `@width`,
`@height`, `viewBox` and **every `<rect>`** now match the jar exactly, and
there are zero non-numeric diffs left. Census stays **31/80** — this fixture
does not reach zero, and nothing else in the corpus moved (the clamp is inert
without `minClassWidth`, which only tobuka sets).

**The residue is a different mechanism, filed as M37/B32, not chased here.**
All 41 remaining diffs are edge-label text positions
(`g[N]/text[1..2]/@x,@y`) plus one 13-point spline on `g[15]`. The deltas
cluster — y≈1.784 (×5), y≈11.44–11.49 (×6), scattered x up to 41.2 — so it is
systematic, not routing noise.

I specifically did NOT attribute it to M2/M34, the obvious-looking neighbours:
`tobuka-93` is M2's own named **control**, because it carries only
`taillabel=`/`headlabel=` tables, which upstream builds without
`addVisibilityModifier` and whose DOT this port already emits byte-exact. The
residue was simply invisible underneath a 1196px sizing error until now — the
same "a fix makes a second mechanism measurable" pattern B3 recorded, and the
reason the loop protocol requires a re-measure after every size fix.

**Frozen counts — all unmoved.** object DOT 74/80 · class DOT 689/711 ·
component 262 · usecase 93 · state 267 · class SVG goldens 317 pass ·
description 48-set pass. No ratchet additions: no fixture newly reached zero.

**Quality gates.** `npm test` 574 files / 12760 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## B7 (M8) — diagnosis, written BEFORE any code change

**Mechanism.** A link's `<<stereo>>` is a *style-class selector*, and upstream
routes it into the arrow's style signature:

1. `CommandLinkClass.java:368-371` — `link.setStereotype(Stereotype.build(
   arg.get("STEREOTYPE", 0)))`.
2. `SvekEdge.java:817-822` — the arrow's base signature is
   `{root, element, <diagramType>, arrow}`, then `.withTOBECHANGED(stereotype)`.
3. `StyleSignatureBasic.java:119-132` — `withTOBECHANGED` FANS OUT: for each
   stereotype label it produces `this.addStereotype(name)`, yielding a
   `StyleSignatures` **set**, so `<style> .mystyle { }` matches by the
   stereotype half of the two-subset test at `:213`.
4. `SvekEdge.java:874-876` — `styleLine.getStroke()` and
   `Rainbow.build(styleLine, …)` read the merged style. `Style#getStroke()`
   (`Style.java:261-263`) is `getStroke(PName.LineThickness, PName.LineStyle)`,
   so **thickness comes from the same merged style as the colour**.

**Origin, ours — two independent gaps, both required for the fixture.**

- The stereotype never leaves the parser. `REL_STEREO`
  (`class-relationship-parser.ts:144`) is spliced into `REL_RE` **non-capturing**
  at both `:166` and `:185`, so `<<mystyle>>` is matched and discarded. The
  `Relationship` AST has no field for it.
- The arrow cascade has no stereotype dimension and no thickness reader.
  `style-cascade-class.ts:326` computes ONE global
  `classCascadeArrowColor = cascadeHex(styleMap, ARROW_SNAMES, 'linecolor')`
  for the whole diagram, and nothing anywhere reads `linethickness` for an
  arrow. `renderer-edge.ts:168-170` consumes that single value and `:198`
  hardcodes `strokeWidth: geo.strokeWidth ?? 1`, where `geo.strokeWidth` is
  set only by an explicit `-[...]->` bracket override.

**Causal chain.** `zebufu-01-pevo013` declares
`.mystyle { linecolor: blue; linethickness: 3 }` and applies it as
`n0 -> n1 <<mystyle>>`. We drop the tag, so the edge renders with the default
`#181818` at width 1 where the jar draws `#00F` at width 3 — confirmed on the
`path` and on the arrowhead `polygon` (fill, stroke and stroke-width all three).
The remaining 33 numeric diffs (canvas +3px, `0.389` y-shifts, polygon points)
are downstream of the thicker stroke, not separate causes.

**The primitive already exists.** `style-map-element.ts#resolveStyleCascade`
(`:325-346`) already implements upstream's exact two-subset match INCLUDING
`stereotypeTags`, with the last-registered-wins merge and no specificity
reordering. So the fix is to *call* it per-edge with the arrow SNames and the
link's own tags — not to build new matching machinery. `babcfa94` is precedent
for the shape only: it is skinparam-side, and this is `<style>`-side.

**Scope — this is a three-file change, not a one-liner, and it is one
mechanism.** Capture the tag in the parser + AST; resolve `linecolor` and
`linethickness` per-edge against the arrow signature; consume both in
`renderer-edge.ts`. Splitting it would leave a captured-but-unused field or a
reader with no input, so all three land together. The cascade is shared with
every class-family diagram, so the class goldens are the boundary to watch.

**Ruled out.** Not the `-[#color]->` bracket path — this fixture uses none, and
that override already works (it sits ABOVE the cascade in
`renderer-edge.ts:168-170`). Not a `<style>` parse gap: `parseStyleBlock`
already stores `.mystyle`'s declarations; `parseTagSelector` already recovers
the tag token. Not M2 — `style-stereotype-on-arrow-3` is a byte-identical
duplicate of `zebufu`, so the reach is 2 independent fixtures, not 3.

**Deliberately NOT started in the same turn as the diagnosis.** Two earlier
iterations (B1, B3) committed the diagnosis first and implemented next; the
loop protocol requires the mechanism on disk before code, and a multi-file
change plus a full gate run does not fit the remainder of this turn honestly.

## B31 (M36) — comparator widening, maintainer-approved 2026-08-11

**Landed.** `tests/oracle/svek-dot.ts#degreeSequenceDirected` — a sorted
`in:out` degree multiset, added to `structurallyEqual` as `directionOk`, plus
the matching `CHECKS`/`CHECK_DETAILS` entries so `dot-sync-report --slug`
prints both sides on a mismatch.

Kept id-agnostic on purpose: node ids are synthetic and no other check
compares them, so direction is captured as each node's own (indegree,
outdegree) pair rather than by matching endpoints. A reversal moves one node
from `1:0` to `0:1` and its partner the other way, which no sorting hides. The
honest limit: a graph whose every node has equal in- and out-degree stays
indistinguishable under reversal at this resolution. That is a property of an
id-agnostic comparison, not a gap this closes, and it is stated in the
function's own doc comment rather than left for someone to discover.

**Re-baselined, as approved.** The counts this moves, all in the strict
direction:

| gate | was | now | delta |
|---|---|---|---|
| object DOT | 74/80 | **73/80** | −1 |
| class DOT | 689/711 | **661/711** | −28 |
| state DOT | 267/267 | **264/267** | −3 |
| component DOT | 262/262 | 262/262 | — |
| usecase DOT | 93/93 | 93/93 | — |

**These 32 are pre-existing defects, not regressions.** Nothing about the
emission changed in this iteration; the gate simply stopped being blind to it.
Every one of them still passes `edgeCountOk` and the UNDIRECTED `degreeOk`, so
the multiset of endpoints is right and only the orientation is wrong — which
is exactly what `directionOk` is for.

**Quarantined, not skipped, following B0's own precedent.** When B0 made the
gate port-aware it surfaced 42 fixtures and filed them in
`port-backlog.json`, pinned to fail `portOk` and nothing else. B31 does the
identical thing with `oracle/goldens/<type>/direction-backlog.json` (class 28,
state 3, object 1) and the same assertion shape: a listed fixture must fail
`directionOk` and NOTHING else, so every other structural check stays live and
a real regression in it still fails `npm test`. The list is shrink-only.

**Cause deliberately NOT attributed — filed as B33.** B6 already fixed M7's
decor-driven endpoint swap, so these are something else, and guessing which
mechanism from a count would be exactly the "repeat a scope claim without
checking it" failure this mission keeps catching. One sampled fixture
(`class/befasi-62-vimu310`) has the candidate's out-degrees collapsed into a
hub — `5:0` and `7:0` against an oracle whose maxima are `3:4`/`1:3` — so at
least some are edges emitted from one source that upstream emits per-pair.
Note connectors and inline `extends` are the two builders that carry no
`idEntity1FullId` pair and fall back to `parentIsLinkEntity1`, which makes
them the first place an audit should look. That audit is B33.

**Quality gates.** `npm test` 574 files / 12760 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## D7 — both deferrals rest on claims that are false against the current tree

Asked to "handle the D7 deferred", I checked the two entries against the code
before acting on them, per CLAUDE.md's "'hard' and 'out of scope' are triggers
to VERIFY, not skip". Both scope claims are stale, and D7's authorization
quotes them.

**M9 — "4-of-37 icon coverage", ~33 unported USymbol shapes.** False.
`src/core/decoration/symbol/` holds **30 `USymbol*` classes** and a
`USymbols.ts` registry with **38 registrations**; upstream's `USymbols.java`
has 37 `record(...)` calls. The set is ported, and the DESCRIPTION engine
already consumes it (`diagrams/description/leaf-sizing.ts:63`). The 4-entry
`USYMBOL_ICONS` in `core/usymbol-shapes.ts` is a separate class-engine-only
emitter with exactly one caller (`diagrams/class/renderer.ts:96`). So M9 is
"the class engine does not route through the drawing seam that already
exists", not "33 shapes are unported" — a wiring question of unknown but
plainly smaller size.

**M13 — "There is no `EmbeddedDiagram` equivalent anywhere in `src/`".**
False. `src/core/EmbeddedDiagram.ts` exists with `EMBEDDED_START`/
`EMBEDDED_END`, `getEmbeddedType`, `createAndSkip` and a
`NestedDiagramRenderer` seam; `klimt/creole/Display.ts:49,185` uses it;
`SheetBuilder.ts:84` documents the scan; it has its own unit test. It was
ported after the audit was written. The unverified part is the last mile —
`zicope-62-pica490` still shows 24 diffs and an 84px height shortfall
(`@height` 92 vs 176), the signature of a `{{ }}` block reserving no space.

**What I did and did not do.** I corrected both ledger entries in place, with
the measurements, retaining the original text beneath each so the record of
what was believed is intact. I did **not** un-defer either one: D7 is a
maintainer decision (decisions.md:111-125, "Defer as tracked missions"), and
withdrawing it on my own would be substituting my judgment for an
authorization — the same boundary that made B31 wait for approval. What I can
say is that the authorization was given against measurements that no longer
hold, so it needs re-taking.

I also did not start either port in this turn. Both now look smaller than
filed, but "smaller than a whole subsystem" is not the same as "verified
small", and beginning a re-scoped port at the end of a long turn is how the
scope estimates that caused this got made in the first place.

## B7 (M8) — outcome

**Landed**, both halves, exactly where the diagnosis said. Four seams:

1. `class-relationship-parser.ts` captures the `<<tag>>` — `REL_STEREO` was
   spliced into `REL_RE` non-capturing. Adding the group shifted exactly one
   index (the trailing label, m[10] → m[11]); `REL_DISPATCH_RE` is fully
   non-capturing and unaffected. `<<a,b>>` splits on comma, each token cleaned
   by the same `cleanStereotypeToken` a declaration's tag gets.
2. `Relationship.stereotypeTags` → `EdgeGeo.stereotypeTags`, carried
   regardless of whether the edge has a bracket override.
3. `style-cascade-class.ts#arrowTagCascadeEntry` precomputes per-tag
   `{color, thickness}` over `collectStyleTagNames`, resolved through the
   EXISTING `resolveStyleCascade` two-subset matcher. Precomputed rather than
   resolved at render time for the same reason `classTagCascade` already is:
   the renderer has no `StyleMap`, only the resolved Theme. Colour and
   thickness are ONE entry because upstream reads both off ONE merged style
   (`SvekEdge.java:874-876`).
4. `renderer-edge.ts` consumes it BELOW an explicit `-[#color]->` bracket
   override and ABOVE the diagram-wide arrow cascade — the order that chain
   already used. Multiple tags: last match wins, mirroring
   `StyleStorage#computeMergedStyle`'s last-registered-wins rather than
   inventing a specificity rule upstream lacks.

**One thing the diagnosis did not anticipate.** `buildEdgeArrowheads`
re-derived `edge.strokeWidth ?? 1` independently, so the arrowhead polygon
still drew at width 1 after the line was fixed. It now takes the resolved
width as a parameter. Upstream draws the line and its extremities from one
`styleLine.getStroke()`, so they must agree by construction — and that
function's own G2 N31 comment already said it existed to keep the two in sync.
Re-deriving was the bug; passing it in removes the duplication.

**Measured.** All three fixtures improve and **none flips**: `zebufu-01`
39 → 34, `style-stereotype-on-arrow-3` 39 → 34, `style-stereotype-on-arrow-7`
35 → 30. Census stays **31/80**. Colour and thickness are now correct on every
one — the only non-numeric diff left anywhere in the three was the arrowhead
stroke-width, and that is gone.

**Residue is one mechanism, filed as B34/M39, not chased here.** What remains
is geometry downstream of the thicker stroke: the canvas is short by exactly
3px — the `linethickness` value — plus a 0.389px shift on every element and
the spline/polygon points. `LimitFinder` walks the DRAWN shape, so a 3px line
occupies more ink than its path geometry; our ink box uses the geometry alone.
It was unmeasurable while the thickness itself was being dropped, which is the
fourth time this session a fix has made the next mechanism visible.

**Frozen counts — all at the B31 baselines, unmoved.** object DOT 73/80 ·
class DOT 661/711 · component 262 · usecase 93 · state 264/267 · class SVG
goldens 317 pass · description 48-set pass.

**Quality gates.** `npm test` 574 files / 12760 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## B34 (M39) — diagnosis: my own B7 attribution was wrong, and the measurement says so

**No code changed this iteration.** It went to falsifying a mechanism I had
asserted one iteration earlier.

**What I claimed at B7.** That the residue on the three M8 fixtures was "ink
extent ignores stroke width" — that `LimitFinder` walks the drawn shape so a
3px line occupies more ink than its path geometry, and our ink box uses the
geometry alone. I wrote that into the ledger and into B7's commit message on
the strength of one observation: the canvas shortfall was exactly 3px, and the
fixture sets `linethickness: 3`.

**Why it was wrong, and the tell I ignored.** `LimitFinder` has NO stroke term
in any handler — `drawRectangle`, `drawULine`, `drawUPath`, `drawUPolygon` all
compute from geometry alone (`klimt/drawing/LimitFinder.java:159-225`). I had
read that file twice this session, at B5. A mechanism that requires upstream to
account for stroke width contradicts source I had already quoted.

**Falsified by controlled experiment.** Two probe fixtures identical but for
the `linethickness: 3` declaration, both rendered through the pinned jar:

| | jar | ours |
|---|---|---|
| with `linethickness: 3` | 143x55, x=7/x=100, y=7.389 | 140x55, x=7/x=97, y=7 |
| without it | **143x55, x=7/x=100, y=7.389** | **140x55, x=7/x=97, y=7** |

Byte-identical on both sides with and without. The residue is entirely
thickness-independent; the matching "3" was a coincidence.

**What the residue actually is.** `minlen=0` places both nodes on the SAME
rank with the edge label between them. Box-to-box gap: jar 63.425, ours
60.425 — exactly 3px — plus a 0.389px y offset. And our emitted svek DOT is
**byte-identical** to the oracle's: every structural check passes,
`maxSizeDeltaIn` 0. So the divergence is downstream of the DOT text.

**One confound I have NOT eliminated, so nothing is filed.** The structured
input we hand the layout engine carries `labelWidth: 29.54375`, where the DOT
text says `WIDTH="29"` — upstream truncates to int
(`svek/SvekEdge.java:505-506`, `(int) dim.getWidth()`) and we `Math.round`
(`svek-dot-emit.ts:44`). M2 already named that as a latent defect. It is 0.54px
against a 3px symptom, so it is probably not the whole cause — but "probably
not" is not "ruled out", and D6 requires a VERIFIED finding before anything
goes to `docs/graphviz-issues/`. I did not file an engine issue.

Fixing the truncation is also not a drive-by: M2's own note says it must land
WITH the +2 label margin or it overshoots by 1px on roughly half that set, and
that margin landed at B2. Entangling it with this diagnosis would repeat the
mistake this entry is about.

**The lesson, since this is the second attribution error of the session.** B5
caught the ledger's mechanism being wrong before I wrote code, because I
recorded a falsifiable prediction and checked it. Here I recorded a mechanism
WITHOUT a prediction, in a commit message, and it survived a full gate run
because nothing about the gates tests an explanation. The claim was
load-bearing for whoever picks up B34 next, and it was wrong.

## B21 (M20) — uid tick burned by getInv()

**Mechanism.** `Link`'s constructor takes a tick of the diagram's shared
`cpt1` counter unconditionally — `this.uid = cucaDiagram.getUniqueSequence(
"lnk")` (`abel/Link.java:135`, `net/atmp/CucaDiagram.java:745-746`). `getInv()`
builds a **second** `Link` (`Link.java:145-146`), so a link upstream inverts
(`dir == LEFT || dir == UP`, `CommandLinkClass.java:362-363`) consumes TWO
numbers and renders under the second. The first is never drawn, but every
later link is numbered past it.

`sajege-04-zuce784`'s middle link is `-le->`, so its two later links were each
one low: `lnk6`/`lnk7` against the jar's `lnk7`/`lnk8`. Exactly two diffs, both
`@id`, nothing else.

**Landed by reusing what was already there.** I started to add an
`invertedLinkPhantomIndex` field and a new `Ranked` branch, then found
`Relationship.phantomSlot` already means precisely this — "this relationship's
`creationIndex` was preceded by a discarded phantom counter slot", whose
existing producer is the couple machinery's synthetic default `Link`: also a
real ctor, also burning a real `cpt1` slot, also never `addLink`ed. Same
phenomenon, same position (immediately before the rendered edge). So the fix is
one branch in `class-command-relationships.ts` setting `phantomSlot` when the
parser marks the link inverted, and `renderer-uid.ts` needed **no change** —
the phantom-rank path it already had does the work.

That is the second time this session the right implementation was to call
something that existed (B7 reused `resolveStyleCascade`) rather than build a
parallel mechanism. Worth noting because the ledger's own file:line pointer
sent me at `renderer-uid.ts:145-233`, which is where the symptom is visible,
not where the fix belongs.

**Measured.** `sajege-04` **2 → 0**, census **31 → 32/80**, nothing else in the
corpus moved. Ratcheted (31 pinned).

**Frozen counts — all at the B31 baselines.** object DOT 73/80 · class DOT
661/711 · component 262 · usecase 93 · state 264/267 · 317 class SVG goldens
pass. This changes SVG `lnk` ids, which those goldens pin, so their passing is
the load-bearing check here.

**Quality gates.** `npm test` 574 files / 12760 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## B20 (M19) — entity URL wrapper: the ledger's origin pointer was wrong again

**Mechanism.** Upstream wraps the WHOLE entity image in the declaration's
`[[url]]`: `EntityImageObject.drawU` opens `ug.startUrl(url)` before the rect
and closes it after the body (`:186-187`, `:211-212`), so the jar emits
`<g class="entity"><a …>rect,text,line…</a></g>` — one child. We emitted the
four children bare, and no `<a>` anywhere.

**The ledger pointed at `renderer-group.ts:78`. The bug was in the parser.**
Our render path was already complete: `ClassifierGeo.url` exists (G2 N15),
`class-geo-builders` copies it, and `renderer-url.ts#wrapClassifierBody`
already defaults every primitive's effective url to `geo.url` — which merges
the whole body into one `<a>` run, exactly the jar's shape. It never fired
because `geo.url` was `undefined`.

`class-object-commands.ts`'s `URL` fragment was `(?:\s*\[\[[^\]]*\]\])?`
— non-capturing — under a comment stating "matched and discarded: `Classifier`
has no `url` field". That comment went stale at G2 N15, which added
`Classifier.url` and wired the class-declaration path
(`class-declaration-parser.ts:228`). Nobody revisited the object path, so
`class Foo [[url]]` worked and `object foo [[url]]` silently did not.

The fix is one capture group plus `classifier.url = parseUrlBracket(raw)`.
No renderer change at all.

**That is now three iterations running where the ledger's `Ours:` pointer
named the symptom site rather than the origin** — B21 (`renderer-uid.ts`,
fixed at the counter), B20 (`renderer-group.ts`, fixed in the grammar), and
B34's outright falsification. The audits located where the wrong output is
visible, which is not the same question as where the wrong value is produced.
Worth treating every `Ours:` line as a starting point, not a destination.

**Measured.** `jocamu-71` **3 → 2**: the `childCount` 4-vs-1 is resolved.
Census stays **32/80**; nothing else in the corpus moved (no other object
fixture declares an entity URL).

**Residual, filed as B35/M40, deliberately unattributed.** 1px on
`@width`/`viewBox[2]` only — every rect, text and line matches exactly, zero
non-numeric diffs. Both mechanisms this fixture was filed under are now fixed,
so this is a genuinely new ink-extent max-X question on a fixture whose max-X
comes from the populated sibling `p2` (established at B5). I am not naming a
mechanism for it from the shape of the number; B34 this session is exactly
what that produces.

**Frozen counts — all at the B31 baselines.** object DOT 73/80 · class DOT
661/711 · component 262 · usecase 93 · state 264/267 · 317 class goldens pass.

**Quality gates.** `npm test` 574 files / 12761 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## B13 (M22, BackgroundColor arm) — and a scope call I want on the record

**Mechanism.** Upstream supports `<<stereo>>` on EVERY skinparam key for
free: `FromSkinparamToStyle`'s constructor tokenizes the raw key on `<>` and
splits the stereotype off BEFORE any key lookup (`:292-302`), then `addStyle`
re-signs the resulting signature with `.addStereotype(s)` (splitting on `&`)
and bumps priority via `StyleLoader.addPriorityForStereotype` (`:396-410`,
`StyleLoader.java:178-186`). There is no per-key table anywhere.

This port models it as a per-key allowlist, `STEREO_KEY_MATCHERS`. That IS
the structural divergence M22 names, and `objectBackgroundColor<<azerty>>`
simply had no row, so `majake-62`'s `foo3` drew red where the jar draws green.

**The scope call.** CLAUDE.md says re-mirror rather than patch with special
cases, so I measured the re-mirror before choosing: **7 matcher rows, 13
`*ByStereo` accumulator fields, 63 consumer sites** across `src/`. Generic
support means replacing the flat `<prop>ByStereo` maps with a
signature+stereotype store and rewriting every one of those consumers — a
redesign of the skinparam→Theme shape, and separable from object closure.

So I added the row, mirroring `babcfa94`'s `applyElementFontSizeByStereo`
exactly (same `ELEMENT_BUCKET_SNAMES` gate, same ordering contract: it runs
after the whole matcher table because its `\w+` prefix also matches
`statebackgroundcolor<<X>>`, whose own entry must win). `babcfa94` set that
precedent inside this mission under review, and following it keeps the two
arms symmetrical.

**I want this on the record as a knowing patch, not a fix.** It deepens a
divergence the ledger already names. The difference from a silent patch is
that the generic form is now measured, cited, and tracked in M22's own row
rather than described as "larger" on nobody's evidence — which is exactly the
failure the D7 audit turned up earlier today.

**Measured.** `majake-62-pero492` **1 → 0** (its only diff was `g[3]` `@fill`,
`#F00` vs `#008000`). Census **32 → 33/80**, nothing else moved, ratcheted (32
pinned). Also retired the stale "SEPARATE, larger, deferred mechanism" note in
`renderer-classifier-colors.ts` — it predated `babcfa94`.

**Frozen counts — all at the B31 baselines.** object DOT 73/80 · class DOT
661/711 · component 262 · usecase 93 · state 264/267 · 317 class goldens pass.

**Quality gates.** `npm test` 574 files / 12761 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## B22 (M21) — creole bullet glyph, and a scope correction found by looking

**Scope was narrower than filed, and I only knew that by reading the jar.**
The row implied the object body's `* ABullet list` rows were affected. They
are not: the jar draws them with `<ellipse rx="3" … stroke-width:1>` inside a
`<g data-visibility-modifier="IE_MANDATORY">`, which is the
`VisibilityModifier` glyph (`skin/VisibilityModifier.java:169-171,280-281`),
and our output is byte-identical there. `CreoleMode.SIMPLE_LINE` skips the
bullet pattern entirely (`CreoleStripeSimpleParser.java:119-147`, gated
`if (mode == CreoleMode.FULL)`), which is also why `** ASub item` stays
literal text in both. Only the NOTE's creole bullets — `rx="2.5"`, no stroke —
were missing.

**Mechanism.** `klimt/creole/atom/Bullet.java:58-69` draws a real shape:
order 0 translates `dx(3)` and draws `UEllipse.build(5, 5)`; order ≥ 1
translates `dx(1 + 8*order)` and draws `URectangle.build(3.5, 3.5)`, both
filled with the font colour under `UStroke.withThickness(0)`. Our note layout
reserved the right WIDTH (`BULLET_ORDER0_WIDTH` 12 / `8 + 8*order`, already
matching `calculateDimensionSlow`) but emitted a `{kind:'text', text:''}`
spacer, so an empty `<text>` appeared where the jar draws a shape.

**The vertical placement is derived, not fitted.** With the shapes emitted at
the line top, all three were uniformly 3px high. Rather than encode a 3, I
found the consumer: `klimt/creole/Sea.java:72-79`'s `doAlign` lays every atom
at `y = -height + getStartingAltitude()`, then `translateMinYto` shifts the
line so the tallest atom (the text) sets the top. For a bullet that first term
is **-10 at BOTH orders** — `5 - 5` at order 0 and `3 - 7` at order n
(`Bullet.java:72-83`) — which is exactly why two shapes of different heights
share one top offset. So the top is `lineTop + lineHeight - 10`, and at the
note's 13pt line that evaluates to `lineTop + 3`, reproducing the jar's
`cy=27` against its `y=31.611` baseline. The constant that landed is
`BULLET_SEA_DEPTH = 10` with that citation, not the 3 I measured.

**Three existing tests failed, correctly.** They asserted the placeholder's
shape (`{kind:'text', text:'', width:12}`). The widths — 12 and 16, which is
what those tests actually protect — are unchanged; only the representation is,
so the assertions were updated to the new atom kind rather than the invariant
being weakened.

**Measured.** `donoki-79-riku189` **3 → 0**, census **33 → 34/80**, nothing
else moved, ratcheted (33 pinned). The unreachable `bullet` branch in
`renderer-classifier-rows.ts` is handled anyway (TS exhaustiveness) with that
file's own placement convention and a comment saying why it cannot fire.

**Frozen counts — all at the B31 baselines.** object DOT 73/80 · class DOT
661/711 · component 262 · usecase 93 · state 264/267 · 317 class goldens pass.

**Quality gates.** `npm test` 574 files / 12762 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## T1 (B33 class arm) — the cause was B6's own inference, not a new defect

**Mechanism.** `dotEdgeRunsReversed` decided orientation by comparing
`idEntity1FullId`/`idEntity2FullId` against `rel.from`/`rel.to`. Those agree
only until `class-command-relationships.ts:107-113` rewrites `from`/`to`
through `resolveRelationshipEndpoint` — which the FullId pair never sees. So
inside a `namespace`/`package`, or with an `as "alias"` declaration, the
comparison reported "not reversed" **and returned early**, never reaching the
`parentIsLinkEntity1` fallback.

`class/famizo-04-joxe063` (`namespace net.sourceforge { c1 <|-- d1 }`) emitted
`d1 -> c1` against the oracle's `c1 -> d1`. **28 of the 32** backlog fixtures
contained `namespace`/`package`.

**Fix.** The parser already computes the answer without comparing anything:
`decorSwap = swapDirection !== upOrLeft`, the term `resolveArrow` derives and
folds away. Stored as `Relationship.dotEdgeReversed` and read directly. No id
comparison survives, so no later rename can desynchronise it.

**The first cut of this fix regressed two fixtures, and the two-directional
check caught it.** I initially followed the file's omit-when-false convention
and set the flag only when true. That sends a parsed relationship with
`decorSwap === false` to the `parentIsLinkEntity1` fallback, which keys on
`swapDirection` — a DIFFERENT predicate. For an arrow carrying BOTH a
direction word and a head decor (`HashMap [a1] <|-u-> [e] V1`: `decorSwap`
false, `swapDirection` true) it reversed where upstream does not, breaking
`coxose-20-nifu136` and `ririlu-13-zipi740`, neither of which was in the
backlog. The field is now deliberately **tri-state** — `false` is meaningful,
`undefined` means "not from the arrow grammar" and is the only case allowed to
reach the fallback — with that reasoning in its own doc comment.

Worth naming: B6's comparison and the omit-when-false convention were each
individually reasonable, and both were wrong here for the same underlying
reason — they inferred a fact that was already known at parse time.

**Measured — movement is exactly the backlog emptying, nothing else.**

| gate | before | after | delta |
|---|---|---|---|
| class DOT | 661/711 | **688/711** | +27 |
| object DOT | 73/80 | **74/80** | +1 |
| component / usecase | 262 / 93 | 262 / 93 | — |
| state DOT | 264/267 | 264/267 | — (T2's arm) |
| object SVG census | 34/80 | 34/80 | — |

28 slugs removed from `direction-backlog.json` (27 class + 1 object); the
class/object counts rose by exactly that. `class/besepi-37-rori892` remains —
an `as "alias"` fixture that is NOT explained by this mechanism and needs its
own diagnosis. The 3 state slugs are untouched by design.

**Quality gates.** `npm test` 574 files / 12764 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## T2 (B33 state arm) — the state engine never had the inversion at all

**Mechanism.** Upstream applies the identical rule in the state command:
`statediagram/command/CommandLinkStateCommon.java:205-206`,
`if (dir == Direction.LEFT || dir == Direction.UP) link = link.getInv();` —
the same line as `CommandLinkClass.java:362-363`. Our state engine parsed the
direction word (`state-transitions.ts:52` `ARROW_DIRECTION` →
`TransitionDirection`) and used it ONLY for positioning
(`state-dot-graph.ts:153`); the emitted edge kept source order.

**Both halves were needed, and the jar proved the second one.** After
inverting the edge, state DOT went 264 → **267/267**. But `getInv()`
CONSTRUCTS a second `Link`, and every `Link` ctor burns a `cpt1` tick
(`abel/Link.java:135,145-146`) — B21's mechanism, inherited here because it is
the same constructor. `susena-02-gusa448`'s jar link uids are
`lnk3, lnk5, lnk8, lnk11, lnk13`; the gaps sit exactly at its `-left-` and
`-up-` transitions. We emitted `lnk3, 5, 7, 9, 11`. Burning the tick at
`state-link-add.ts#emitTransition` reproduces the jar's sequence exactly.

Unlike class, state keeps RAW `creationIndex` values with no dense re-packing
(`ast.ts#Transition.creationIndex`), so advancing the counter is the whole
fix — no phantom rank is required.

**The reverse-arrow form is deliberately untouched.** `B <-- A` already swaps
its endpoints at parse time, which is this port's equivalent of
`CommandLinkStateReverse#getDefaultDirection()` returning `Direction.LEFT`
(`CommandLinkStateReverse.java:77-79`). Handling it here too would invert it
twice.

**Measured.** state DOT **264 → 267/267 (100%)**, direction failures 3 → 0,
`direction-backlog.json` emptied for state. All other gates unchanged: object
74/80 · class 688/711 · component 262 · usecase 93 · object census 34/80.

**B33 is now closed except one fixture.** `class/besepi-37-rori892` remains
quarantined — an `as "alias"` class fixture that T1's mechanism does not
explain. Notably `state/sagica-63-godi019`, also alias-bearing, was fixed by
T2, so the two are not one cause.

**Quality gates.** `npm test` 574 files / 12764 tests, exit 0 · `typecheck`
exit 0 · `lint` exit 0 · `build` exit 0. None piped.

## T3 (B34) — experiment only: the confound is eliminated, and it is the engine

**No repo behaviour changed**, per the standing instruction to report before
touching `svek-dot-emit.ts`.

**The label-width confound is gone, by measurement rather than argument.**
Feeding `layoutGraph()` the same graph four times, varying only `labelWidth`:

| `labelWidth` | our box-to-box gap |
|---|---|
| 0 | 60.425 |
| 29 | 60.425 |
| 200 | 60.425 |
| 400 | 60.425 |

The engine ignores a flat (`minlen=0`) edge's label width entirely. So
`svek-dot-emit.ts:44`'s `Math.round` where upstream truncates
(`SvekEdge.java:505-506`) — a 0.54px discrepancy — **cannot** be the cause of a
3px gap. It stays a real faithfulness item on its own merits, and is NOT worth
the frozen-count risk to chase for this symptom.

**And the jar-side control confirms graphviz does the opposite.** Authored
three sources differing only in edge-label text:

| edge label | jar gap |
|---|---|
| `ab` | 50.425 |
| `label` (29 wide) | 63.425 |
| `aVeryMuchLongerEdgeLabelHere` | 232.425 |

jar gap ≈ `labelWidth + 34.4`. Ours is flat. I ran this control rather than
asserting graphviz's behaviour from one data point — the B34 falsification
earlier today came from exactly that shortcut.

**Filed**, now a verified finding as D6 requires:
`docs/graphviz-issues/11-flat-edge-label-width-ignored-in-nodesep.md` plus its
`TRACKER.md` line. The file records both falsified attributions (stroke width,
label rounding) so neither is re-chased, and notes the 0.389px y offset that
reproduces on the same input without claiming it is the same cause.

**No frozen count moved** — nothing executable changed.

## T4/T5 (D7) — both spikes measured; both deferrals survive, on evidence

The instruction was re-scope by measurement, then implement what fits. Neither
fits, but both are now specified in a way they never were.

**M9 — spike applied, measured, reverted.** The bridge is symbol-agnostic
apart from one expression: `renderer-usymbol-entity.ts:80`'s
`symbolKeyword = kind === 'usecase' ? 'usecase' : 'actor'`, plus the dispatch
guard in `renderer.ts`. SI14 T4 had already built the render-side path to
`EntityImageDescription.drawU`, and sizing already routes descriptive leaves
there (`tryMeasureDescriptionLeaf`). So nothing is unported and no seam is
missing.

Widening both expressions moved `gapisu-00-celo011`'s **non-numeric diffs
31 → 21** while total diffs rose 168 → 297. That is the count-inversion B3
recorded: the DOM got structurally closer, so the comparator descended into
numeric differences it previously could not reach. Directionally right, not a
regression — and it also surfaced a type error (`ClassifierGeo.usymbol` is
`string`, the bridge wants the `USymbol` union), so a runtime keyword guard is
required.

Remaining work: per-symbol conformance across ~37 symbols on two fixtures
carrying 165+ diffs each. More than one iteration ⇒ re-filed, and re-labelled
from "port 33 shapes" to "conformance drill over an existing seam". Experiment
reverted; the tree carries no M9 change.

**M13 — read, not guessed.** The plumbing is complete AND invoked:
`CreoleParser.ts:341` and `MethodsOrFieldsArea.ts:139` both call
`EmbeddedDiagram.createAndSkip`. Exactly one thing is missing — **no producer
of a `NestedDiagramRenderer` exists anywhere in `src/`**; every reference is a
type or a pass-through, and `MethodsOrFieldsArea.ts:133-138` throws an explicit
"deferred per SI1/ADR-2" when it meets an embedded block without one. The
remaining work is recursive nested-diagram render-and-measure plus wiring at
the engine entry points. Genuinely large, genuinely separable ⇒ stays deferred.

**`decisions.md`'s D7 is corrected in place** with both measurements, as the
plan required whichever way the spikes went. The deferral now rests on numbers
rather than on two claims that were false against the tree.

**No executable change; no frozen count moved.**

## T7 (B35) — the mechanism found, and it is corpus-wide, so it is not fixed here

**Mechanism.** A classifier's ink max-X is `max(x + w - 1, x + bodyWidth)`,
not a fixed per-state constant.

The rect contributes `x + w - 1` (`LimitFinder#drawRectangle`,
`klimt/drawing/LimitFinder.java:184-188`). The BODY block is drawn at the box's
left edge with its OWN width, so it contributes `x + dimFields.width`. Since
`EntityImageObject.calculateDimensionSlow:150-153` sets
`width = max(dimFields.getWidth(), dimTitle.getWidth() + 2*xMarginCircle)`,
the body reaches the box's right edge **only when the body is what set the
width**. A title-driven box gets no body point out there and falls back to the
rect's own inset.

**Jar-verified with two authored controls differing only in which term wins:**

| control | p2 box | `x+w` predicts | `x+w-1` predicts | jar |
|---|---|---|---|---|
| body-driven | x=74.36, w=180 | **269** | 268 | 269 |
| title-driven | x=74.74, w=201.25 | 290 | **289** | 289 |

`jocamu-71-nuvo330` is title-driven — `"~#1: Person"` is wider than its `tutu`
body — so our fixed `x + w` overshoots by exactly 1. That is its whole
remaining diff.

**This closes a question open since G2 N5.** `addRectInk`'s doc comment
attributed its `+1` to an invisible full-box `UEmpty` reservation. B5 already
showed `UEmpty` is drawn nowhere on any class/object path but could not say
what the real source was. It is the body block, and the rule is conditional,
not constant. `addRectInk`'s comment now carries the correction with the
original text retained beneath it.

**Deliberately not fixed in this iteration.** `addRectInk` is the ink rule for
EVERY class/object/map/json leaf, and the fix needs the measured body width
threaded onto `ClassifierGeo`. That is a corpus-wide change to the class
census and the 317 class goldens — its own iteration with its own measurement,
not a tail-end edit. Tracked as B35 with the mechanism and both controls
recorded.

**B32 not started.** `tobuka-93`'s 41 edge-label-placement diffs remain
undiagnosed; the session ran out of room before it, and starting a fresh
diagnosis at this point would produce exactly the kind of half-measured
attribution B34 already cost.

**No executable change.** Comment-only; `npm test` 574 files / 12764 tests,
exit 0 · typecheck · lint · build all clean.

## Baseline snapshot (planning, 2026-08-11)

- Object SVG census: **23/80** vs fresh oracle (census reads 0/80 vs stale).
- Object DOT structural: **78/80 EQUAL** (2 ledgered).
- Object size backlog: **8 entries**, all also SVG non-conformant.
- Object ratchet: 24 tests, green.
- Frozen siblings: component 262/262 · usecase 90/90 · class 708/708 ·
  state 267/267.

## Measured delta bands (planning, 57 non-conformant)

| Band | Fixtures |
|---|---|
| < 0.5px | 0 |
| exactly 1.0px | 4 |
| 2–10px | 8 |
| ≥ 10px (to 1196px) | 26 |
| ≥1 non-numeric diff | 19 |

## T1 — the authoritative baseline (2026-08-11, fresh cache)

Per-fixture contract rows: **`plans/object-close/baseline-object.json`**, 80
entries, `{slug, diffs, maxNumericDelta, nonNumericPaths}`. Produced with the
DeterministicMeasurer through `renderFixtureClass` — the same metric the
24-test ratchet and `svg-conformance-census.ts` use, cross-checked by both
independently reporting 23.

**`baselineZeroDiff` = 23 / 80.** The planning estimate is confirmed exactly.

| Band | Planning | T1 measured |
|---|---|---|
| < 0.5px | 0 | **0** |
| ≤ 1.0px | 4 | 5 |
| 2–10px | 8 | 11 |
| > 10px (max 1196.619px) | 26 | 36 |
| non-numeric ONLY (no numeric diff at all) | — | 5 |
| carrying ≥1 non-numeric diff | 19 | 36 |

Totals agree (57 non-conformant, max delta 1196.619px) and **D2/D3 survive
unchanged**: still zero fixtures under 0.5px, so G3's sub-pixel `gvts-blocked`
attribution stays rejected. The band composition does not agree, and T1's is
authoritative — planning's "19 non-numeric" counted fixtures whose *worst*
diff was non-numeric; measured properly, 36 carry at least one and only 5 are
non-numeric-only.

### Verdict changes vs the file G3 closed against

`parity-object.json` moved `2026-07-19` → `2026-08-11`; **21 fixtures changed
verdict**, all in the improving direction, none the other way:

- `diverged` → `conformant` (6): `febadi-87-zozu271`, `lalizo-85-paxe277`,
  `lapato-45-neje847`, `linuxu-41-cogo780`, `rotele-89-cuva650`,
  `zagodo-28-ranu153`.
- `diverged` → `structural-match` (15): `diveje-52-xefe514`,
  `fafozi-27-reja300`, `jaxere-74-cole479`, `jotaga-99-fatu830`,
  `lafemo-98-ruri220`, `nukera-08-dige359`, `nulixu-97-nofi684`,
  `rocepa-35-gepo708`, `rozuxo-44-fudi093`, `ruloso-59-nato909`,
  `sibika-09-sipu286`, `sigado-12-rina240`, `sivime-00-gudo607`,
  `sorisi-53-xebi982`, `vocute-12-suxa445`.

Not attributable to T0: the planning-session census already read 23/80 before
T0 existed. These are the fresh oracle plus the 0.2.0 work landed since July.

### A THIRD inconsistency in G3's accounting

G3's README and ledger both close at **22 conformant**. The
`parity-object.json` it left behind records **17**. The ledger itself explains
the gap — three separate entries (`:831`, `:1336`, `:1893`) describe verdicts
"updated to `conformant` (manual, targeted edit — NOT a full
`svg-parity-survey` re-run)". So the file and the prose drifted apart, in
addition to the stale cache and the falsified residue table this mission was
chartered on. Recorded, not litigated: D5 already makes THIS mission's ledger
authoritative.

## Quality-gate log

| Date | Batch/Iter | test | typecheck | lint | build | frozen counts |
|---|---|---|---|---|---|---|
| 2026-08-11 | T0 | 573 files / 12707 pass, 1 todo | clean | clean | clean | object DOT 78/80 · component 262/262 · usecase 93/93 · class 711/711 · state 267/267 — all 100% EQUAL except object's 2 ledgered |
| 2026-08-11 | T1 | 573 files / 12707 pass, 1 todo | clean | clean | clean | identical to T0's row — all five unmoved. Object SVG ratchet 24/24. Object census 23/80 (was 0/80) |
| 2026-08-11 | T2 | 574 files / 12708 pass, 1 todo | clean | clean | clean | unmoved; suite 58.35s (guard adds 2.4s) |
| 2026-08-11 | B0 | 574 files / 12708 pass, 1 todo | clean | clean | clean | **object 58/80 · class 689/711 — authorized re-baseline**; component 262/262 · usecase 93/93 · state 267/267 unmoved |
| 2026-08-11 | B1 | 574 files / 12719 pass, 1 todo | clean | clean | clean | **object 74/80** (+16); class 689/711 · component 262/262 · usecase 93/93 · state 267/267 unmoved; census 23/80 held |
| 2026-08-11 | B2 | 574 files / 12719 pass, 1 todo | clean | clean | clean | ALL FIVE unmoved (object 74/80, class 689/711, component 262/262, usecase 93/93, state 267/267); census 23/80, distribution identical |
| 2026-08-11 | B3 | 574 files / 12726 pass, 1 todo | clean | clean | clean | ALL FIVE unmoved; census 23/80, buckets 23/7/10/16/24 (one fixture moved 1-3 → 31+, verified as a floor effect) |
| 2026-08-11 | B4 | 574 files / 12733 pass, 1 todo | clean | clean | clean | ALL FIVE unmoved; census 23/80, buckets identical |
