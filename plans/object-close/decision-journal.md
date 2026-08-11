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
