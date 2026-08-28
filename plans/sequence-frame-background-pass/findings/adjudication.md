# T7 — Adjudication of the frame background pass

Measured 2026-08-28. Every number below comes from
`scripts/sequence-ratchet-adjudicate.ts` (three `--base` runs, `--base` and
`--snapshot` never passed together) or from a throwaway diagnostic that went
through `tests/oracle/svg-conformance/render-fixture-sequence.ts` with
`DeterministicMeasurer` and an explicit `fixtureIncludeStore()`, and reported
its own skip count on every run (`prior-observations.md` §§2–3). The
diagnostic is deleted; it is reproducible from the recipe in §6.

`weightedScore` is the gated quantity. `diffCount` is never adjudicated on
(§1). Two instruments independent of the charge are used throughout: **LCP**
(longest common prefix of our top-level tag sequence against the golden's) and
**LCS** (longest common subsequence of the same two lists).

---

## 1. Verdict census

`0c7abcb7` is Batch 3's tip as delivered. `2a…` (this task's `fix(T7)`) is the
same tree with the reference-frame defect of §3 corrected.

### 1a. As delivered (`0c7abcb7`)

| base ref | artefact | substructure | regression | inconclusive | improved | unchanged | Σ base | Σ live | Δ | skipped |
|---|---|---|---|---|---|---|---|---|---|---|
| `0d4afc3b` (T6's parent) | 61 | 16 | **10** | 29 | 77 | 948 | 1 240 508 | 1 223 870 | −16 638 | 17 |
| `1aa15960` (predecessor tip) | 62 | 15 | **10** | 29 | 77 | 948 | 1 241 626 | 1 223 870 | −17 756 | 17 |
| `e10c88e9` (`main`) | 62 | 423 | **10** | 29 | 617 | 0 | 1 291 577 | 1 223 870 | −67 707 | 17 |

### 1b. After `fix(T7)`

| base ref | artefact | substructure | regression | inconclusive | improved | unchanged | Σ base | Σ live | Δ | skipped |
|---|---|---|---|---|---|---|---|---|---|---|
| `0d4afc3b` | 62 | 14 | **2** | 18 | 97 | 948 | 1 240 508 | 1 219 837 | −20 671 | 17 |
| `1aa15960` | 63 | 13 | **2** | 18 | 97 | 948 | 1 241 626 | 1 219 837 | −21 789 | 17 |
| `e10c88e9` | 63 | 425 | **2** | 18 | 633 | 0 | 1 291 577 | 1 219 837 | −71 740 | 17 |

Every run measured all 1141 fixtures. **Skip count 17, identical at every ref
and on both sides of every comparison** (`baseScore === null &&
liveScore === null` for the same 17 slugs in all six runs), so this mission
broke no fixture's rendering and closed none by accident:

`bomino-39-tipo216 dolice-60-copi767 fojomu-60-cuda302 fonudu-70-coma124
jiliba-03-lapi286 junide-55-soka558 ladiro-50-gume805 licole-34-vejo527
loteba-26-konu854 nidozi-08-daxa280 nizuzi-32-babe798 nuvoja-46-dezu541
recani-60-licu962 soxata-16-kafi688 tegasu-93-fima016 vubato-50-gebu534
zoturo-25-jima978`

**Correction to the mission ledger.** These 17 are *not* `!include`
resolution failures. Measured: each is a parser refusal —
`sequence refused this source at line N (syntax): Syntax Error?` — and only
**one** of the 17 (`nuvoja-46-dezu541`) contains an `!include` at all. They
are unported sequence syntax (e.g. `dolice-60-copi767`'s
`Alice -> Bob [[http://www.google.fr]] : ok` inline link on a message), pinned
identically at `main`, at `1aa15960` and here.

Scope measurement of the README (stop condition 6) holds exactly:
`pixopo-04-zitu732` **20/20**, `kejoke-76-curu931` **102/102**, top-level child
counts equal to the golden's, LCP = LCS = length in both.

---

## 2. The predecessor's 10 blocking fixtures

Recovered by measurement, not by name. Joining `main`'s snapshot to
`1aa15960`'s and re-running `classify` gives `improved 557 / rose 567 /
error-at-one-ref 17`, and exactly **10** of the 567 rises have a `null`
top-level child-count record at one ref — which is what
`sequence-participant-g-wrapper`'s close-out reports as
`inconclusive=27 = 17 + 10` and as `567 failing = 557 re-pinnable + the 10`.
The arithmetic closes on both statements, so this is the set.

The close-out's prose names `pixopo-04-zitu732`, `kejoke-76-curu931`,
`luzapi-49-rati107` and `celego-19-laji937`. Only **`pixopo-04-zitu732`** is
a member; the other three are evidence fixtures quoted in the narrative, not
blockers. All ten are now `improved` at every ref:

| slug | vs `main` | vs `1aa15960` | new verdict |
|---|---|---|---|
| `bifuzu-54-gefo004` | 549 → 254 | 580 → 254 | improved |
| `murori-42-pabo946` | 333 → 150 | 335 → 150 | improved |
| `panopa-36-muti317` | 792 → 385 | 874 → 385 | improved |
| `pixopo-04-zitu732` | 305 → 133 | 307 → 133 | improved |
| `rotila-89-juri637` | 256 → 116 | 266 → 116 | improved |
| `tusoga-11-gabe405` | 615 → 292 | 635 → 292 | improved |
| `vesaze-51-ceji187` | 381 → 194 | 406 → 194 | improved |
| `xegufe-25-paji965` | 305 → 133 | 307 → 133 | improved |
| `xujoga-62-lacu610` | 289 → 135 | 300 → 135 | improved |
| `xupozu-13-numi050` | 305 → 133 | 307 → 133 | improved |

**Mechanism that changed them.** Each rose at `1aa15960` because the whole
grouping frame was drawn last, in the foreground, while the golden draws its
outline (and, when coloured, its `Blotter` band) FIRST — so our top-level
child count matched the golden's by coincidence at the predecessor's tip while
every index after the frame was shifted, and the comparison descended into
mismatched siblings. T6's `renderEventPass(events, theme, true)`
(`renderer.ts:448`) restores
`playingSpace.drawBackground(ugBody)` — `PlayingSpaceWithParticipants.java:218`,
the first of the five passes — so the outline now lands at the index the jar
puts it at. `pixopo-04-zitu732` goes from "20/20 but diverging at
`svg/g[1]/g[1]`" to LCP = 20 = the golden's full length.

---

## 3. The 10 `regression`s — diagnosis

All 10 are **entirely T6's own effect**: the counts are identical against
`0d4afc3b` (T6's parent) and against `1aa15960`, so nothing the predecessor
did contributes. They split into two mechanisms.

### 3a. Mechanism A — reference frames were routed through `GroupingTile`

**Applies to 8 of the 10** (`cujoci-19-taxe939`, `cusiro-03-mebe823`,
`dofefe-55-kejo043`, `dozugi-77-tuce071`, `ducodo-45-duge821`,
`mutuve-86-sevi489`, `ramica-82-loku620`, `sojufi-84-bexi933`) **and to 11 of
the 12 score-rising `inconclusive`s in §4.** One mechanism, one origin, many
call sites — the fix is at the origin, not spread across the symptom sites.

**Mechanism.** T6's `renderEvent` dispatches *every* `FrameGeo` — including
`frameType === 'ref'` — into the `ComponentRoseGroupingHeader` two-half port,
so a `ref over` frame drew a background outline the jar never draws, a
`[label]` comment box the jar never draws, and its corner path before its body
rect instead of after. Upstream builds a `ref` as a `ReferenceTile`, not a
`GroupingTile`, and its component is a different class entirely.

**Origin.**
- `src/diagrams/sequence/renderer.ts:357-360` — the frame branch of
  `renderEvent`, which is `frameType`-blind, reaching
  `renderFrameBackground` → `renderer-frame-header.ts:147`
  (`renderGroupingHeaderBackground`) for a `ref`.
- `src/diagrams/sequence/sequence-layout-events.ts:188` — `rawComment =
  event.branchLabels[0]` feeding `groupingHeaderDisplay('ref', label)`, which
  yields `{ tabText: 'ref', tabComment: label }`.
- `src/diagrams/sequence/renderer-frame-header.ts:221` (as delivered) —
  `cornerEl + bodyRectEl + …`, `ComponentRoseGroupingHeader`'s order.

**Upstream, read as method bodies (not filenames):**
- `TileBuilder.java:174-176` — `ev instanceof Reference` builds
  `new ReferenceTile(...)`; `:162` builds `new GroupingTile(...)`. Distinct
  tiles.
- `ReferenceTile.java:117-124` (`getComponent`) —
  `Display("ref") + reference.getStrings()`, `ComponentType.REFERENCE`.
- `ReferenceTile.java:127-136` (`drawU`) — one unguarded
  `comp.drawU(ug, area, (Context2D) ug)`. No `isBackground()` test, no
  `Blotter`.
- `ComponentRoseReference.java:57,83` — the class declares **only**
  `drawInternalU`. `grep -rn drawBackgroundInternalU src/main/java/net/`
  returns exactly four sites: the empty default at
  `AbstractComponent.java:139`, and overrides in
  `ComponentRoseGroupingElse`, `ComponentRoseGroupingHeader` and
  `ComponentRoseEnglober`. `ComponentRoseReference` is not among them.
- `AbstractComponent.java:143-147` — `if (context.isBackground())
  drawBackgroundInternalU(ug, area); else drawInternalU(ug, area);`. For a
  reference the background arm is therefore the empty `:139-140` default.
- `ComponentRoseReference.java:89-136` — `drawInternalU` emits, in order:
  the body `URectangle` (`:99`), the corner `UPath` (`:118`),
  `textHeader` (`:124`, the display's element 0 = `"ref"`), then
  `getTextBlock()` (`:136`, elements 1…n = the BODY lines). No comment box —
  `ComponentRoseReference.java:67-78` splits the display at index 1, so the
  label IS body text.

**Causal chain.** A `ref` frame emitted one surplus `<rect>` in the background
pass and one surplus `<text>` (`[label]`) in the foreground, and swapped
`rect`/`path`. On the 8 regressions our top-level child count was BELOW the
golden's before T6 and crossed above it after, so `|actual − expected|` rose
and `classify` (`sequence-ratchet-adjudicate.ts:183-190`) returned
`regression`. On the 11 `inconclusive`s the count was EQUAL to the golden's
before T6 — no `svg/g[1][childCount]` record, so the comparison descended —
and the surplus introduced a top-level short-circuit that had not existed,
collapsing 100–180 deep diff records into 5 and inflating the score by the
full `units(ours) + units(golden)` charge.

Worked example, `mutuve-86-sevi489` (`alt` containing one
`ref over app, app : v1`), measured index-wise:

| | top-level tags |
|---|---|
| golden (13) | `rect g rect text rect text path rect text` **`rect path text`** `text` |
| `0d4afc3b` (12) | `g rect text rect text` `rect rect text` `rect rect text` `text` |
| `0c7abcb7` (15) | `rect` **`rect`** `g rect text rect text path rect text` **`path rect`** `text` **`text`** `text` |
| after `fix(T7)` (13) | `rect g rect text rect text path rect text` **`rect path text`** `text` |

The three bolded surpluses at `0c7abcb7` are exactly the ref background rect,
the swapped `path`/`rect`, and the `[v1]` comment. Removing them lands the
fixture on the golden's structure exactly: LCP = LCS = 13 = 13, score
229 → 88 (its pre-mission value was 208).

**Ruled out, with the evidence:**
- *"The `Blotter` band is over-emitting."* No. `plantuml.skin:102-103` makes
  `group BackGroundColor` transparent, and `sojufi-84-bexi933` — the worst
  regression, `alt#660000 #blue` plus four `ref`s — emits exactly **2**
  background rects for its coloured `alt` (band + outline), matching the
  golden's 2 at indices 1–2. The surplus was 4, exactly its `ref` count.
- *"Frame geometry drifted (D6)."* No. All five non-structural diffs at every
  affected fixture are `svg/@width`, `svg/@height` and the two `viewBox`
  components; the sixth and only structural record is
  `svg/g[1][childCount]`. Removing the surplus nodes restores an exact count
  match while the size attributes stay wrong — the two are independent.
- *"The predecessor's `<g>`-wrapper or footbox move is implicated."* No. The
  regression set, the scores and the child distances are **identical**
  against `0d4afc3b` and against `1aa15960` (§1a), so the delta is wholly
  inside T6.
- *"`ElseTile`/`NewpageTile` also draw in the background pass."* No.
  `grep -rn "isBackground()" src/main/java/net/` gives ten sites; under
  `sequencediagram/` only `GroupingTile.java:262` and `NewpageTile.java:81`
  consult it, and `NewpageTile`'s is an early `return`.
  `ElseTile.java:125` is commented out.
- *"`diffCount` rose, so fidelity fell."* Not admissible, and here it is
  inverted: `diffCount` FELL from 111–177 to 5 on the §4 fixtures precisely
  because fidelity fell (a short-circuit replaced a full descent).

**Fixed.** Yes — `fix(T7)`, three edits at the origin:
`sequence-layout-events.ts` (a `ref` has no tab comment; its label is body
text), and `renderer-frame-header.ts` (a `ref` draws nothing in the background
half; its foreground half emits rect-then-corner). The `Blotter` is
deliberately NOT guarded: a `ref` never carries a colour out of
`command-misc.ts:198,219`, so a band for one is a state that cannot occur, and
`code-principles.md` forbids the guard.

**Result** (base `1aa15960`): all 8 clear —

| slug | 0c7abcb7 | after fix | verdict |
|---|---|---|---|
| `sojufi-84-bexi933` | 920 → 990 | 920 → **390** | improved |
| `cusiro-03-mebe823` | 897 → 946 | 897 → 901 (dist 2 → 1) | artefact |
| `dofefe-55-kejo043` | 419 → 455 | 419 → 425 (dist 2 → 1) | artefact |
| `dozugi-77-tuce071` | 419 → 455 | 419 → 425 (dist 2 → 1) | artefact |
| `cujoci-19-taxe939` | 392 → 413 | 392 → **161** | improved |
| `ducodo-45-duge821` | 389 → 410 | 389 → **158** | improved |
| `mutuve-86-sevi489` | 208 → 229 | 208 → **88** | improved |
| `ramica-82-loku620` | 208 → 229 | 208 → **88** | improved |

### 3b. Mechanism B — a correct node added to a document already larger than the golden

**Applies to `fobube-11-nifo424` and `junaxa-14-biko373`**, the two
regressions with no `ref` in the source, and to `rugeco-70-muro754` in §4.
These **survive the fix and are not defects**; the artefact below is the
diagnosis, not a deferral.

**Mechanism.** T6 added exactly one node to each: the grouping frame's
background outline `<rect>`, which the golden also has, at the same top-level
index. Because our document was already ABOVE the golden's child count for
reasons that predate this mission, `|actual − expected|` rises when a correct
node is added, and `classify` has no rule that can see this: `artefact`
requires the distance to FALL, and `isSubstructureRise`
(`sequence-ratchet-adjudicate.ts:214-221`) short-circuits on
`live.childDistance > base.childDistance` before its arithmetic ever runs.

**Origin.** `src/diagrams/sequence/renderer.ts:448` —
`children.push(...renderEventPass(scaledGeo.events, scaledTheme, true))`, the
background pass this mission exists to add. The node it adds is correct; the
classifier's proxy is what fails.

**Causal chain, per fixture** (LCP/LCS are independent of the charge):

| slug | ours→gold at `0d4afc3b` | at `0c7abcb7` | LCP | LCS | the one added node |
|---|---|---|---|---|---|
| `fobube-11-nifo424` | 27 → 21 | 28 → 21 | 0 → **17** | 19 → **21** = gold | leading `rect`, golden index 0 |
| `junaxa-14-biko373` | 46 → 41 | 47 → 41 | 1 → **8** | 36 → **38** | `rect` at index 1, golden index 1 |
| `rugeco-70-muro754` | 31 → 31 | 32 → 31 | 0 → **7** | 29 → **31** = gold | leading `rect`, golden index 0 |

For `fobube` and `rugeco` the LCS after T6 equals the golden's **entire**
length: the golden's top-level sequence is now a subsequence of ours, so no
node we emit is out of order — the residual is pure surplus.

The residual surplus is pre-existing and untouched here:
- `fobube-11-nifo424` — the fixture puts `newpage` inside an `opt`. The
  golden's page 1 stops after two message triples and ends with the newpage
  rule (`line`, index 20); we render all four messages plus the `else toto`
  separator. Surplus 6 before T6, 7 after.
- `junaxa-14-biko373` — actor/database head glyphs decompose differently
  (ours `ellipse path text rect line line`, the jar's
  `ellipse path text path path rect text`) and the jar emits the diagram
  title as a top-level `<text>` we place elsewhere. Surplus 5 before, 6 after.
  Independently, T6 also moved this fixture's interior `rect rect text text`
  to `path rect text text`, which is what the golden has — a second
  improvement inside the same rise.
- `rugeco-70-muro754` — we emit **seven** top-level `<g>` for three
  participants where the jar emits six. Identical at `0d4afc3b`; at that ref
  the surplus `<g>` and the missing background `rect` cancelled to a count of
  31 = 31 (see §4).

**Ruled out, with the evidence:**
- *"The added `rect` is spurious."* No. It is present in the golden at the
  identical top-level index in all three, and LCP — which cannot rise unless
  the added node matches the golden position-for-position — jumps 0→17, 1→8
  and 0→7.
- *"It is the same reference-frame defect as 3a."* No.
  `grep -ciE '^\s*ref([#a-z0-9]*)?\s+over'` is 0 for all three, and their
  scores and distances are byte-identical before and after `fix(T7)`.
- *"The surplus is T6's."* No. It is 6/5/(−1 rect +1 `g`) at `0d4afc3b`
  already; T6's delta is exactly +1 node in each.
- *"`weightedScore` rose, therefore fidelity fell."* The rise is +7, +8 and
  +266. For `fobube`/`junaxa` the comparison short-circuits at the root at
  BOTH refs, so the entire charge is `units(ours) + units(golden)`
  (`compare.ts:396-406`) and the +7/+8 is exactly the upper-bound inflation of
  the node we added — nothing below the root was compared at either ref, so
  no comparison can have got worse. For `rugeco` the base comparison
  descended and the live one does not, which is a real loss of *measurement
  resolution*, not of fidelity: see §4.

**Fixed.** No — there is nothing to fix. The mechanism is the classifier's
proxy, not the port. They are adjudicated **benign** here; see §5.

---

## 4. The 12 score-rising `inconclusive`s — why, measured

`classify` returns `inconclusive` on a rise when `baseChildDistance` or
`liveChildDistance` is `null`. In all 12 it is **`baseChildDistance`** that is
`null`, and the script's own header is explicit that this is ambiguous between
"the counts matched" and "it short-circuited higher up".

**Measured, not guessed: it is "the counts matched", in all 12.** At
`0d4afc3b` our top-level child count equals the golden's exactly for every one
of them (17=17, 26=26, 17=17, 23=23, 23=23, 25=25, 26=26, 17=17, 29=29,
31=31, 26=26, 21=21), so `compareNodes` emitted no `svg/g[1][childCount]`
record and **descended** — corroborated by the base diff lists carrying
111–177 records, which is only possible after a descent. At `0c7abcb7` each
count exceeds the golden's, `diffCount` collapses to 5, and the score jumps.

| slug | base ours=gold | `0c7abcb7` ours | rise | cause | benign or real | after `fix(T7)` |
|---|---|---|---|---|---|---|
| `cekora-30-diso384` | 17 = 17 | 19 | 123 → 312 | 1 ref → §3a | **real loss** | 123 → **118** improved |
| `ficiru-65-geda551` | 26 = 26 | 28 | 208 → 411 | 1 ref → §3a | **real loss** | 208 → **203** improved |
| `focaso-89-zaxu091` | 17 = 17 | 19 | 123 → 312 | 1 ref → §3a | **real loss** | 123 → **118** improved |
| `gupuze-37-xelo563` | 23 = 23 | 25 | 189 → 377 | 1 ref → §3a | **real loss** | 189 → **184** improved |
| `jabise-46-luge773` | 23 = 23 | 25 | 189 → 377 | 1 ref → §3a | **real loss** | 189 → **184** improved |
| `menire-56-rase375` | 25 = 25 | 27 | 176 → 452 | 1 ref → §3a | **real loss** | 176 → **171** improved |
| `mupugi-53-xuna043` | 26 = 26 | 28 | 210 → 411 | 1 ref → §3a | **real loss** | 210 → **205** improved |
| `nazuki-76-dave810` | 17 = 17 | 19 | 123 → 312 | 1 ref → §3a | **real loss** | 123 → **118** improved |
| `rezoma-09-vixi307` | 29 = 29 | 31 | 227 → 445 | 1 ref → §3a | **real loss** | 227 → **222** improved |
| `xojavo-26-jezu088` | 26 = 26 | 28 | 208 → 411 | 1 ref → §3a | **real loss** | 208 → **203** improved |
| `xupufa-46-romu811` | 21 = 21 | 25 | 152 → 380 | **2** refs → §3a (+4) | **real loss** | 152 → **142** improved |
| `rugeco-70-muro754` | 31 = 31 | 32 | 277 → 543 | §3b | **benign** | unchanged, still `inconclusive` |

The +2 per `ref` (+4 for `xupufa`'s two) is exactly the surplus background
`rect` and the surplus `[label]` comment of §3a; the `path`/`rect` swap costs
no count. Eleven of the twelve were therefore a **real** fidelity loss and are
now closed by `fix(T7)`, most of them below their pre-mission score.

**`rugeco-70-muro754` is the one benign member, and the one lead in the
mission ledger that measurement disproved.** A prior mission's notes record
`ficiru`/`mupugi`/`xojavo` as `ref over` fixtures "whose body text is parsed
but never rendered". Measured: their body text IS rendered — `cekora`'s
`short` and `mutuve`'s `v1` appear as the trailing `<text>` in our output at
both refs — and all three are ordinary members of the §3a set, closed by the
same fix. The note is stale; do not carry it forward.

`rugeco`'s own base match at 31 = 31 was **coincidental**: we emit one surplus
top-level `<g>` and were missing the background `rect`, and the two cancelled.
Adding the correct `rect` breaks the coincidence. Our LCS is now 31 = the
golden's full length, so the golden's whole top-level sequence is a
subsequence of ours and the only excess is that pre-existing `<g>`. The cost
of the rise is real in one narrow sense — the comparison no longer descends,
so 168 deep diff records are no longer visible — but no comparison got worse;
the descent was only ever reachable because two independent errors cancelled.

---

## 5. Bottom line for T9

**The classifier still reports `regression = 2` and one non-error
`inconclusive` rise, so a literal reading of D8 blocks the re-pin.** All three
are adjudicated **benign** above, with position-wise evidence, and no fourth
rise remains anywhere in the 1141:

- `fobube-11-nifo424` — §3b, benign
- `junaxa-14-biko373` — §3b, benign
- `rugeco-70-muro754` — §4/§3b, benign

D8 is locked and the re-pin is orchestrator-only, so T7 does not decide it.
What T7 can state is the fact D8 needs: **there is no unadjudicated rise
left**, and the only fixtures the instrument cannot clear on its own are three
whose entire delta is one `<rect>` that the golden contains at the same
top-level index. `classify` cannot reach that conclusion because both of its
benign rules require the top-level child-count distance to fall or hold, and
this mission's whole purpose was to add nodes to documents that were already
too large. Clearing them mechanically would mean editing the instrument to fit
the result, which is exactly what the instrument exists to prevent — so it was
not done.

If the orchestrator accepts the three adjudications above, T9 may re-pin. If
it does not, the smallest genuine unblock is to close one of the three
pre-existing surpluses (the surplus top-level `<g>` on `rugeco` is the
narrowest, at one node), which is a separate mission.

---

## 6. Reproducing this

```
npx jiti scripts/sequence-ratchet-adjudicate.ts --base 0d4afc3b   # T6 alone
npx jiti scripts/sequence-ratchet-adjudicate.ts --base 1aa15960   # the landing
npx jiti scripts/sequence-ratchet-adjudicate.ts --base e10c88e9   # vs main
```

`--base` and `--snapshot` are mutually exclusive: `main()` tests `--snapshot`
first and returns, so passing both adjudicates nothing and still exits 0.
Slice the report between `--- BEGIN ADJUDICATION JSON ---` and
`--- END ADJUDICATION JSON ---`; rendering itself writes to stdout.

The index-wise instrument used throughout §3–§4 is a ~60-line script that, per
slug, reads `test-results/dot-cache/sequence/<slug>/{in.puml,in.svg}`, renders
through `renderFixtureSequence(markup, new DeterministicMeasurer(),
{ includeStore: fixtureIncludeStore() })`, normalises both sides with
`normalizeSvg`, takes the children of the first `<g>` under `<svg>`, and
prints their tag sequences plus LCP, LCS and `weightedScore`. It counted and
printed its own skips on every run (0 of 22, 0 of 12, 0 of 10, 3 of 3, …) and
caught one real harness bug doing so — zsh does not word-split an unquoted
`$SLUGS`, which silently passed all ten slugs as a single argument.
