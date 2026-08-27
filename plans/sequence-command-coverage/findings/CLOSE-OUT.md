# CLOSE-OUT — `sequence-command-coverage`

Written by T20, the mission's terminal task, on 2026-08-26 at `703c0cc0`
(branch `feat/sequence-command-coverage`). Every figure below is either
measured by this task or carried from `findings/tally.md` (T19) and
`findings/adjudication.json` (T18), both of which measured rather than
reproduced the brief. Where this task re-measured a claim and it did not hold,
§8 says so.

---

## 0. Read this first — the caveat that bounds every number here

**The sequence comparator cannot see arrows on most of the corpus.** T18
measured it by mirroring `compareNodes`' three descent rules
(`compare.ts:191,222,396`) and counting tag-matched pairs:

| quantity | measured |
|---|---:|
| fixtures reaching **ZERO** of their golden's arrowhead polygons | **984 of 1141 (86.2 %)** |
| reaching some (`arrow-PARTIAL`) | 38 |
| reaching all (`arrow-MEASURABLE`) | 4 |
| goldens with no arrowhead to reach | 98 |
| erroring | 17 |
| **median fraction of the golden's elements reached** | **16 %** |
| fixtures where the comparison never enters the diagram body at all | **557** |

Mechanism: the jar wraps each participant in
`<g><title>A</title><rect/><line/></g>` while this port emits the bare
primitives, so child 0 under `svg/g[1]` is a **tag** mismatch and
`compare.ts:222-231` returns — `// structural mismatch — stop here`. The
wrapper also shifts every following child index, so the whole sibling run
mismatches by tag. See `.agent-notes/T15-comparator-blocks-arrow-descent.md`
and the `measurability` block of `findings/adjudication.json`.

**Therefore, plainly: the `weightedScore` figures in this document are real
measurements of the diff instrument, but they are largely insensitive to arrow
correctness, and they are not fidelity evidence.** On an arrow-blocked
fixture, *correct* arrow work produces no movement and *incorrect* arrow work
produces no movement either. A score of 0 movement on a blocked fixture is not
evidence in either direction. Nothing in this mission may be read as "the
arrows are right"; what it may be read as is "these sources now parse, route
and render, and here is what the instrument can currently see".

The single highest-leverage repair is `sequence-participant-g-wrapper`
(§6), which unblocks descent for the whole sequence corpus at once.

---

## 1. Tasks completed vs planned

**20 of 20 tasks, 7 of 7 batches, 45 commits.** No task was dropped, deferred
or merged into another.

| batch | tasks | outcome |
|---|---|---|
| 1 — instruments and headroom | T1–T5 | done, 5 ∥ |
| 2 — AST migration | T6 | done |
| 3 — parse wave | T7–T11 | done, 5 ∥ |
| 4 — dressing + exo parse | T12–T13 | done, 2 ∥ |
| 5 — layout + arrow render | T14–T16 | done, 3 ∥ |
| 6 — exo render | T17 | done |
| 7 — adjudicate, re-pin, close out | T18–T20 | done, sequential |

Two batch-close repairs were done by the orchestrator rather than a task,
each with its own commit and adjudication: the four command registrations T9
and T10 could not write under the single-writer rule (`86459c3f`), and the
doubled-suffix activation defect T12 found and correctly reverted
(`15acd5d9`).

## 2. Decisions

**D1–D7 all held. Two were amended mid-mission, both maintainer-approved:**

- **D2 amended (T5, `6a6b672d`)** — the port's sequence command registration
  order is *not* mirrored from `SequenceDiagramFactory#initCommandsList`. It
  cannot be, and the reason is now measured: the port has no equivalent of
  upstream's `OK_PARTIAL` multi-line dispatch seam, so `endCommand` would pop
  a grouping frame where upstream closes a note. 13 registration-order seams,
  each pinned by `tests/unit/sequence/command-registry-order.test.ts`. Filed
  as `sequence-multiline-command-seam`.
- **D4 amended (batch 5, `129fb3e0`)** — see §8.1. The outcome stands; the
  justification did not survive contact with the Java.

**134 decision-journal rows, 37 flagged for review.** Every flagged row is
either discharged in this document or filed forward in §6.

## 3. Final scoreboard

Verified by T20 directly against the baseline JSONs at `703c0cc0`, not carried
from a gate line.

| quantity | mission baseline | target | **at close** |
|---|---:|---:|---:|
| `refusal-baseline` `known-gap` pins | 163 | 0 | **9** |
| refusal SLI 2 (the *reported* number) | 1 | ≤1 | **1** (`nuvoja` only) |
| `routing-baseline` `known-misroute`, all engines | 196 | — | **17** |
| `routing-baseline` `known-misroute`, sequence | 195 | 0 | **17** |
| `svg-sequence/diff-baseline` `status: "error"` | 195 | 0 | **17** |

Raw counts at HEAD: refusal 3149 `ok` / 9 `known-gap` of 3158; routing 3133
`agree` / 8 `jar-error` / 17 `known-misroute` of 3158; diff 1124 `baseline` /
17 `error` of 1141. `kokebo-27-vafi688` — the one non-sequence row in the
baseline 196 — is now `agree`.

**Closure identity, reconciled exactly (T19):**

```
178  closed (diff-baseline error -> baseline)
+ 1  nuvoja-46-dezu541 — in the population, a HARNESS gap, not a command gap
+16  residual fixtures the port still refuses
----
195  the brief's population, exactly
```

**178 / 195 = 91.3 %.** 8.7 % short, inside the ±10 % band; stop condition 8
did not engage, correctly.

## 4. The residual census — D6's discharge

D6 requires the per-bucket residual distribution, not just totals.

### 4.1 Bucket closures, measured

T19 attributed each closure by **bisecting the mission's own 15 refs** and
taking the first ref at which `measureFixture` returns a non-null score.

| bucket | brief est. | **measured** | Δ |
|---|---:|---:|---:|
| T7 — `CommandArrow` rebuilt compositionally | ~12 | **40** | +28 |
| T8 — note factory (`of`/VMERGE/`&`/hnote/rnote/stereotype) | ~24 | **26** | +2 |
| T9 — grouping `&`, autonumber inc/stop/resume, activate family | ~20 | **19** | −1 |
| T10 — hspace, delay, divider, `hide` variant, participant-multilines | ~9 | **8** | −1 |
| T11 — inline sprite, `EmbeddedDiagram` `{{ }}`, `%newline()` | ~6 | **3** | −3 |
| T12 — dressing decorations + ACTIVATION/LIFECOLOR/STEREOTYPE/URL | ~45 | **0** | −45 |
| T13 — exogenous arrows | ~77 | **82** | +5 |
| **total** | **193** | **178** | **−15** |

**Every bucket estimate was wrong while the total held.** That is the shape
stop condition 8 exists to catch, and it did not fire — correctly, because the
total is what it guards.

The two large divergences share one cause. **T7 absorbed T12's entire
bucket**: D1 composes `CommandArrow` from named groups, and the groups arrived
*with* the rebuild, so `cdd7d208` moved 966 → 1006 renderable while `c5f5988e`
(T12) moved 1042 → 1042. The 40 fixtures T7 closed are dominated by T12's
nominal subject — `bill -> bob ++ #005500`, `Bob -> Alice [[url]] : hello`,
`alice -> bob <<a>> : red`, `Alice -\\o Bob`, `A ->(40) B++`,
`Charlie -> Alice & Bob & Dave`. T12's work is not wasted: it is what makes
those forms *correct*, not what makes them *parse*.

### 4.2 Remaining `weightedScore` distribution, per family

T20 measured this from `adjudication.json`, partitioning the 178 closures by
the **base refusing line** each carried at `c062956a`. **This is a different
partition from §4.1** — that one answers "whose landing made this render",
this one answers "what first blocked it" — so the counts differ by design and
neither is wrong. Use §4.1 for attribution and this for sizing.

| family (first blocking syntax) | n | min | p25 | median | p75 | max |
|---|---:|---:|---:|---:|---:|---:|
| exo (`[->`, `?o->`, `->]`, `A->?`) | 72 | 181 | 189 | 298 | 537 | 799811 |
| arrow / dressing | 49 | 157 | 300 | 387 | 712 | 8068 |
| note factory | 25 | 209 | 251 | 464 | 940 | 7321 |
| grouping `&` | 10 | 433 | 466 | 923 | 1062 | 1083 |
| autonumber / activate | 8 | 274 | 393 | 430 | 519 | 1361 |
| spacing / divider / hide | 6 | 161 | 161 | 284 | 385 | 1534 |
| sprite / embedded / `%newline()` | 6 | 180 | 180 | 208 | 287 | 291 |
| no participants (no refusing line) | 2 | 101 | 101 | 114 | 127 | 127 |
| **all 178 closures** | **178** | **101** | **223** | **384** | **668** | **799811** |
| *(context)* all 1124 renderable | 1124 | 57 | 221 | 297 | 435 | 799811 |

**Sizing facts a follow-on should not have to re-derive:**

- 28 closures score ≥1000; 115 score <500; 67 score <300.
- **One fixture is 86 % of the total.** `zudize-61-vomi445` scores 799 811;
  the other 177 sum to 127 043. Any "total score" over this population is a
  statement about `zudize` unless it is stated excluding it.
- The closures' median (384) sits **above** the whole-corpus median (297), as
  expected for sources that previously rendered nothing.

### 4.3 The same 178, cross-tabbed by what the comparator can see

| arrow measurability at HEAD | n |
|---|---:|
| `arrow-BLOCKED` | 134 |
| `arrow-PARTIAL` | 18 |
| `arrow-MEASURABLE` | 1 |
| `golden-has-no-arrowhead` | 19 |
| carries an ink-overshoot residual instead of a measurability tag | 6 |

T18 reported this as 139 blocked / 18 partial / 1 full / 20 nothing-to-measure
by folding the 6 overshoot rows into the first and fourth categories; both
readings describe the same 178. **Read together with §4.2 this is the census's
real conclusion: of 178 closures, exactly one is a fixture whose arrows the
instrument can fully compare.**

## 5. The 17 fixtures that did not close

Every reason was **re-probed at HEAD** by T19 rather than read off the pin —
seven of them named a line this port now parses. The `diff-baseline` `error`
set, the sequence `routing` `known-misroute` set and (where no other engine
draws them) the `refusal` `known-gap` set are the same 17.

| fixture | refusing line at HEAD | unported mechanism |
|---|---|---|
| `fojomu-60-cuda302` | L9 `{start} <-> {end} : some time` | `CommandLinkAnchor` — `CommandLinkAnchor.java:55-64`; `SequenceDiagramFactory.java:155` |
| `nizuzi-32-babe798` | L10 `{start} <-> {end} : This is not plotted` | same |
| `zoturo-25-jima978` | L10 `{start} <-> {end} : some time` | same |
| `dolice-60-copi767` | L8 `  test` (body of `note left [[…]]`) | `factorySequenceNoteOnArrowCommand.createMultiLine` — `FactorySequenceNoteOnArrowCommand.java:77-88`; `SequenceDiagramFactory.java:136` |
| `nidozi-08-daxa280` | L6 `  a note with a link` | same |
| `recani-60-licu962` | L4 `Wrong note shape (r)` (body of `rnote right`) | same; this port's single-line form (`:132`) has an optional `(?::…)?` tail, so it matches the bare opener and orphans the body |
| `ladiro-50-gume805` | L5 `  Note` (body of `note left of Alice [[…]]`) | `UrlBuilder.OPTIONAL` tail of `factorySequenceNoteCommand.createMultiLine` — `FactorySequenceNoteCommand.java:76-90` (the OPTIONAL at `:89`); `SequenceDiagramFactory.java:134` |
| `junide-55-soka558` | L5 `url of APP is [[…]]` | `CommandUrl` — `sequencediagram/command/CommandUrl.java:61-72`; `SequenceDiagramFactory.java:154` |
| `vubato-50-gebu534` | L3 `url of RepoxServer is [[…]]` | same |
| `jiliba-03-lapi286` | L2 `IT++` | `CommandActivate2`, the bare `NAME++`/`NAME--` shorthand — `CommandActivate2.java:29-37`; `SequenceDiagramFactory.java:128`. **Not** a `CommandArrow` gap |
| `loteba-26-konu854` | L22 `& return Hello44` | `CommandReturn`'s PARALLEL group `(&[%s]*)?` — `CommandReturn.java:68`; `SequenceDiagramFactory.java:129` |
| `tegasu-93-fima016` | L3 `hide << new >> stereotype` | GENDER group of `CommandHideShowByGender` — `classdiagram/command/CommandHideShowByGender.java:72-83` (the `\<\<.*\>\>` alternative at `:76`); `CommonCommands.java:106`. This port has `^hide\s+stereotype\s*$` (`command-common.ts:71`) |
| `bomino-39-tipo216` | L3 `<style src=strictuml.skin>` | `CommandStyleImport` — `style/CommandStyleImport.java:68-77`; `CommonCommands.java:90` |
| `soxata-16-kafi688` | L2 `skinParam CaptionFontSize 10` | `RE_SKINPARAM_LINE` (`preprocessor.ts:107`) has no `i` flag, so the camel-case spelling survives the strip and reaches a list registering only `skinParamMessageAlignCommand`. Upstream's `CommandSkinParam` is case-insensitive — `command/CommandSkinParam.java:57-63`; `CommonCommands.java:66` |
| `fonudu-70-coma124` | L2 `---` | `ReadLineWithYamlHeader`'s front-matter block, stripped in the PREPROCESSOR — `preproc/ReadLineWithYamlHeader.java:91`. Not a command gap |
| `licole-34-vejo527` | preprocessed L4 ` + XXX` | **not** an unported `%newline()` — see §8.2 for the corrected mechanism |
| `nuvoja-46-dezu541` | preprocessor stop | `!includedef macro` absent from `tests/helpers/fixture-include-store.ts` (`IncludeExecutor.ts:127`). **Harness item, not a command gap** |

**Two clusters carry three fixtures each** and are the cheapest coverage work
left: `CommandLinkAnchor` and `note…OnArrow.createMultiLine`.

## 6. Residuals filed forward

Every entry below is in `planning/next-missions.md` with the same mechanism.
None is filed on an adjective; each carries a `file:line` and a measured cost.

**Blocks everything else:**

1. **`sequence-participant-g-wrapper`** — §0. Highest leverage available to
   sequence fidelity; unblocks measurement corpus-wide.

**Fidelity, sequence-local:**

2. **Global participant sizing** — `Bob -> Carol : hello` is 240×147 here
   against 117×124 in the jar: fixed 80 px boxes at a 30 px margin versus
   text-fitted boxes at 5. **Every remaining exo dimension delta reduces to
   this plus `BORDER1 = 0` hardcoded at `sequence-layout-exo.ts:76`** (upstream
   is `min(xOrigin, dolls.getMinX, every tile.getMinX)`,
   `PlayingSpace.java:75-104,318-320`). Stated explicitly because otherwise
   the exo numbers read as exo defects: the exo arithmetic is correct against
   upstream, and the visual gap is a global sizing divergence that predates
   this mission.
3. **`[hidden]` arrow bodies draw** — 3 fixtures, measured:
   `vogegu-91-mave762` (2 polygons vs 0), `TeozTimelineIssues_0004_Test`
   (5 vs 4), `koneju-77-vode355` (9 vs 8). Upstream sets `ArrowBody.HIDDEN`
   (`CommandArrow.java:495-496`) and **both** `ComponentRoseArrow.drawInternalU`
   (`:85-86`) and `ComponentRoseSelfArrow.drawInternalU` (`:71-73`) return
   before drawing; this port's `applyStyle` (`command-arrow.ts:274`) keeps only
   `dashed`/`dotted`. ~15 lines across three files plus one
   `ArrowConfiguration` field.
4. **Per-message arrow colour is parsed and discarded** — `applyStyle` keeps
   only `dashed`/`dotted`; upstream ends `else { config = config.withColor(…) }`
   (`CommandArrow.java:487-500`), so `-[#red]->` renders `#181818`.
   **`bold` is a genuine no-op upstream — `:492` is an empty branch. Do not
   "fix" it.**
5. **Part-anchored messages draw** — `nivaje-50-tido759` (4 polygons vs 2).
   `teoz/CommunicationTile.java:316-319` returns from `drawU` when
   `PART1ANCHOR`/`PART2ANCHOR` is set; this port has no AST field
   (`command-arrow.ts:455`). The leading `{start}`/`{end}` ANCHOR group is a
   **different** field (`msg.setAnchor`, `CommandArrow.java:420`) that `drawU`
   never tests.
6. **`sequence-parallel-anchor-draw`** — the 13 `&`/anchor fixtures parse and
   route but do not draw. Sequence **after** item 1; until then the difference
   is unmeasurable.
7. **`sequence-newpage-pagination`** — `command-page.ts:26-31` ignores
   `newpage`, so every page renders into one document while the jar emits page
   1. Measured on `dolefo-13-kovu702` and `luzapi-49-rati107`: 8 polygons
   against a 4-polygon golden.
8. **`sequence-arrow-background-colour` — NARROWED.** T17 fixed the `o`
   decoration fill using upstream's own pinned value
   (`src/main/resources/skin/plantuml.skin`, `arrow { … BackGroundColor black }`).
   What remains is only the `<style> arrow { BackGroundColor }` hook.
9. **`**`/`!!` CREATE/DESTROY semantics** — 5 fixtures measured by T12
   (`comelo-49-lefi793`, `nepica-26-pali815`, `nofola-68-nobe068`,
   `pixima-27-nita000`, `telizo-11-pilo439`). All parse, route SEQUENCE and
   render an ordinary activation bar; `ActivationEvent.kind` (`ast.ts:186`)
   has no CREATE/DESTROY variant.
10. **STEREOTYPE is a style-lookup key, not drawn text** — wiring it to the
    arrow's line style is real unported behaviour
    (`AbstractMessage.java:60-65,74-77`). URL is **not**: nothing upstream
    reads `getUrl` on a message, and two goldens confirm plain black text.
11. **`hnote` draws a rectangle where upstream draws a hexagon** — filed by
    T20, overturning this mission's own working assumption. See §8.5.

**Coverage, still refusing (§5):** `CommandLinkAnchor` (3),
`note…OnArrow.createMultiLine` (3), `CommandUrl` (2), `CommandActivate2` (1),
`CommandReturn` PARALLEL (1), `CommandHideShowByGender` GENDER (1),
`CommandStyleImport` (1), `noteCommand.createMultiLine` OPTIONAL tail (1),
`RE_SKINPARAM_LINE` case-sensitivity (1), YAML front matter (1).

**Parser / dispatch structure:** `sequence-multiline-command-seam` (§2);
`sprite-base64-command-to-core` (`command-sprite.ts` is a structural
divergence — upstream's `CommandSpriteBase64` is a `CommonCommands` command
shared by every engine, so class/state/description still lack it; built
move-ready).

**Core, cross-engine:** `sprite-image-raster-kind` (1 fixture;
`SpriteImage.asTextBlock` recolours decoded raster pixels and this port has no
such kind — `getSpriteMonochrome`'s unchecked cast at `sprite-registry.ts:184-190`
throws rather than degrading; needs a PNG *decoder*);
`nested-diagram-renderer` (2 pinned fixtures, corpus reach **47** — 22 class,
12 sequence, 8 activity, 5 component); `preprocessor-newline-literal-passthrough`
(1 pinned fixture, blast radius 18 across 3 engines — see §8.2).

**Grammar branches deliberately left, both journaled by T9:** `&` PARALLEL was
added to `groupingCommand` only, not to `elseCommand`/`endCommand`, though
upstream's one regex covers `else|also|end` too — `loteba-26-konu854` now
attaches a fixture to the `return` leg of the same gap. And
`formatAutonumber`'s pre-existing mismatch with `DottedNumber.format()` (Java
discards the `DecimalFormat` for multi-segment numbers; this port pads the
format string with the full prefixed digit string) is unfixed and unexercised
by any pinned fixture.

**Two divergences from upstream's structure, deliberate and pinned:**
`arrowCommand`/`decoratedArrowCommand` are two registry entries where upstream
has one `CommandArrow` — split on upstream's own `RegexOptional(ARROW_DRESSING1)`,
union exactly upstream's language, merge currently gate-blocked by
`command-registry-order.test.ts`. And `deactivateShortCommand` resolves its
target via `state.lastMessageTo` rather than a real activation stack
(upstream's `CommandDeactivateShort` uses one; this port has none). It matches
its single pinned fixture, `donuli-07-peje262`, and **would diverge wherever
the activating message is not the most recent one.** Recorded because it is
the weakest thing this mission shipped; it must not be presented as a faithful
port.

## 7. Adjudication — the artefact / regression split

T18 adjudicated all 1141 fixtures from base `c062956a` to HEAD.

| verdict | rows |
|---|---:|
| **regression** | **0** |
| artefact (re-pinned under D5) | 7 |
| improved | 7 |
| unchanged | 932 |
| inconclusive | 195 |

All 195 `inconclusive` rows have `baseScore: null` and `liveScore` non-null —
they are this mission's own closures, which produced an error page at the
branch point, so there is no base score to compare against. None shows the
alarming inverse (base number → live `null`). `mechanism` is present on
195/195, every `ruledOut` non-empty. The ratchet's failure list is empty
(1151/1151 pass) and all 1141 live scores equal their pinned entries exactly.

Baseline re-pin verification (T19): `diff-baseline` 192 changed rows, all
authorised; `routing-baseline` 178 changed rows, all `known-misroute → agree`
with a closure verdict; `refusal-baseline` 175 changed rows, of which **7 did
not trace** — see §8.4.

## 8. Corrections this close-out publishes

Six claims this mission held at some point did not survive measurement. They
are recorded because repeating a disproved mechanism is the failure mode this
codebase's instructions name first. Four of the six trace to one root: reading
a call-site list, or a package name, instead of a method body.

### 8.1 `sequencediagram/graphic/` is dead code

Reached independently by three batch-5 tasks and verified leg by leg:
`SequenceDiagram.java:306-309` returns `SequenceDiagramFileMakerTeoz`
**unconditionally** — both the `modeTeoz()` guard and the
`SequenceDiagramFileMakerPuma2` return beside it are commented out;
`Step1MessageExo.java` and `DrawableSet.java` do not exist; and nothing
constructs `MessageExoArrow`, `MessageArrow` or `MessageSelfArrow`.

Sequence pixels come from `net/sourceforge/plantuml/sequencediagram/teoz/`.
Reading `graphic/` to answer "what does upstream draw?" gives confidently
wrong answers: it cost this mission one wrong constant (caught), one throwaway
commit (caught by the ratchet), and one locked decision's premise.

That premise was D4's. **D4's outcome stands and is unchanged — `&` and
`{anchor}` are parsed, stored and not drawn — but the reason is now a
deliberate, filed D6 fidelity residual (`sequence-parallel-anchor-draw`), not
a claim about upstream's behaviour.** The consumers are live code:
`isParallel()` selects `YGauge.createParallel` over `createWithContact`
(`teoz/CommunicationTile.java:113-116`) and a non-null anchor forces an early
`return` from `drawU` (`:316-319`).

**No `DIVERGENCES.md` entry was written for `&`/anchor** — not because
upstream matches this behaviour (it does not) but because the residual is
filed as tracked, planned work rather than as a settled product divergence.
Two doc comments still asserting the disproved premise were corrected at
`c3a24c9d`.

### 8.2 `%newline()` — corrected twice, measured here

T11 recorded the builtin as correctly ported and blamed
`preprocessor.ts:370`. T19 re-measured and reported that the builtin is ported
but that a real `U+000A` is produced inside a TIM double-quoted literal and
split by `TContext.ts:362`. **T20 instrumented both and T19's split site does
not hold.**

- **Mechanism.** `%newline()` inside a TIM double-quoted **string literal** is
  never evaluated: `Eater.eatAndGetQuotedString`
  (`src/core/tim/Eater.ts:142-150`) copies the interior verbatim, so the
  literal text `%newline()` survives substitution into the output line.
  `flatten` then splits that line on `RE_NEWLINE_CALL_ANY_CASE`
  (`src/core/preprocessor.ts:370`, regex at `:184`), turning one label into two
  source lines.
- **Origin.** `src/core/preprocessor.ts:370`, enabled by
  `src/core/tim/Eater.ts:147`.
- **Causal chain.** `!$mixed0 = "XXX + %newline() + XXX"` → quoted literal
  captured verbatim → `TValue` holds `XXX + %newline() + XXX` → substitution
  into `Bob -> Alice : 2 $mixed0` produces **one** `StringLocated` → `flatten`
  splits it → preprocessed L3 `Bob -> Alice : 2 XXX +`, L4 ` + XXX` → ` + XXX`
  matches no sequence command → refusal. L4 ` + XXX` is exactly the refusing
  line `licole-34-vejo527` carries.
- **Ruled out.** *Not an unported builtin* — `Newline.ts:31` returns
  `BLOCK_E1_NEWLINE` under `USE_BLOCK_E1_IN_NEWLINE_FUNCTION = true`
  (`jaws-constants.ts:36`), and a bare `%newline()` measures `U+E100` in the
  output, as does `"XXX" + %newline() + "XXX"` where the call sits outside the
  literal. *Not `TContext.ts:362`* — `context.getResultList()` was dumped
  directly for the repro and holds **one** line reading
  `Bob -> Alice : 2 XXX + %newline() + XXX`, containing the literal text and
  **no `U+000A`**, so that split never fires. *Not a case-folding artefact* —
  the input is all-lowercase, so the `i` flag on `:184` is not what makes it
  match, which also disproves that regex's own doc comment
  (`preprocessor.ts:350-355`, "only the case-folded alias reaches this far").

**Net: T11's site was right, T11's and T19's shared conclusion that the
builtin is ported is right, and T19's `TContext.ts:362` attribution is wrong.**
The follow-on is `preprocessor-newline-literal-passthrough`; it must not go
hunting a builtin that already exists, and it must not go hunting a real
newline that is never produced.

### 8.3 The exo bucket is 82, not 73 — and why the count was wrong

Two independent measurements agree exactly: 82 fixtures first render at
`ca2ec736`, and 82 fixtures in the whole corpus parse to an AST holding ≥1
`kind: 'messageExo'` event. The sets are identical.

The earlier 73 came from a walk of the top-level `events` array only. **Nine
fixtures carry their exo message inside a `frame`, whose children live under
`branches: Event[][]`.** Generalise this: **any corpus census over sequence
events must recurse into `frame.branches`.** Two bucket counts in this mission
were wrong for that one reason.

### 8.4 An orchestrator tooling bug — 7 fixtures mis-pinned

`scripts/repin-sequence-baselines.ts:112` wrote `const errors = m.score === null`
into `weErrored`, where `m` comes from `measureFixture`
(`scripts/sequence-ratchet-adjudicate.ts:317`) calling `renderFixtureSequence` —
the **sequence engine directly**. The refusal gate defines `weErrored` as the
**dispatched** `renderSync` output being a `PSystemError` page
(`refusal-coverage.test.ts:106`). For a source the sequence engine refuses but
another engine draws, the two differ, and the script wrote the wrong one.

Seven rows were flipped `ok → known-gap` at the batch-3 close:
`bomino-39-tipo216`, `dolice-60-copi767`, `fojomu-60-cuda302`,
`fonudu-70-coma124`, `ladiro-50-gume805`, `soxata-16-kafi688`,
`zoturo-25-jima978`. All seven render, as STATE or CLASS. No gate could catch
it: `isDefect(now, 'known-gap')` returns `false` regardless of the live
reading. The proof is visible inside one commit — at `c7ad13e5` the same run
wrote `ourType: STATE` and `weErrored: true` for `bomino`, which cannot both
be true.

Corrected: pins fixed, and the script now reads `weErrored` from the
dispatched `renderSync`. Re-running it against the corrected pins reports
`REPINNED 0`. **So `known-gap` reads 9, not 16, and that step is bookkeeping,
not coverage.** T19 additionally cleared 222 stale `reason` fields left on
rows that no longer refuse (`repin-sequence-baselines.ts:93-99` never cleared
them on a routing flip).

### 8.5 `hnote`/`rnote` — an item this mission decided NOT to file, and should have

This mission concluded that the `hnote`/`rnote` shape distinction was not a
residual, on the ground that `getNoteComponentType()`'s call sites are all
under `teoz/`. **That inference is §8.1's disproved premise wearing different
clothes** — teoz is the only renderer, so a `teoz/` call site is live code, and
"only teoz reads it" means "upstream draws it".

T20 read the method body rather than the call-site list.
`teoz/NoteTile.java:108-115` maps `NoteStyle.HEXAGONAL → ComponentType.NOTE_HEXAGONAL`
and `NoteStyle.BOX → ComponentType.NOTE_BOX`, and `:103` passes that straight
into `skin.createComponentNote`. Four further live call sites do the same
(`teoz/NotesTile.java:109,114`, `teoz/GroupingTile.java:750`,
`teoz/CommunicationTileNoteLeft.java:106`,
`teoz/CommunicationTileNoteRight.java:113`). Upstream draws all three shapes.

Half of it is already correct here: `rnote` → BOX → plain rectangle matches
what `renderer.ts:226-232` draws for `NoteEvent.shape === 'rect'`. **`hnote` is
the gap**: it maps to the same `'rect'` (`ast.ts:126-139`, an explicitly
documented T13 scope cut) rather than a hexagon path. Measured cost: **23
corpus fixtures use `hnote`**, 20 use `rnote`, 29 use either. Filed.

**The general lesson, which cost this mission four separate corrections:** a
call-site *census* under `teoz/` is not evidence about what upstream draws.
Only the method body is.

### 8.6 The D5 instrument's signal disappears as fixtures converge

`childDistanceFrom` returns `null` when no diff record exists at
`svg/g[1][childCount]`, and a record exists only when the counts *disagree*.
So an `inconclusive` verdict whose base distance is a number and live distance
is `None` means **convergence, not ignorance** — confirmed three times this
mission (`nadode-16-budi136`, `bexoce-95-vibe195`, and the 8 batch-5 rows).
It must still be checked by confirming descended child paths appear, since the
same signature would arise if the comparison stopped higher up. Separately,
the instrument cannot see a per-child **tag** mismatch one level down, which is
exactly the blindness §0 quantifies.

## 9. `@knowvah/dot-engine` findings

**None. Checked, not assumed.** The sequence engine emits no DOT: `src/diagrams/sequence/`
contains zero references to `dot-engine`, `dotEngine` or `svek`, and neither the
decision journal, `findings/tally.md`, `findings/adjudication.json` nor any
`.agent-notes/` file written by this mission mentions a graphviz or dot-engine
behaviour. No `docs/graphviz-issues/` entry and no `TRACKER.md` line were
required.

## 10. Known issues and harness constraints

- **`class/sadamo-18-siva346` is a stale pin that predates this mission.**
  Pinned `routing: ourType CLASS / jar-error` and `refusal: weErrored false`;
  it measures `ourType NONE / weErrored true`, and it already errored at base
  `c062956a`. Both gates exclude it (its golden is one of the jar's own error
  pages), so nothing fails. Deliberately not re-pinned: no T18 verdict covers
  it and it is not a sequence fixture.
- **Do not run `npm test` concurrently with another vitest invocation in this
  repo.** Two runs during T19 reported failure with **zero** failing
  assertions; the mechanism is worker-pool starvation
  (`[vitest-pool]: Failed to start forks worker … Timeout waiting for worker to
  respond`), the hazard `stdlib-run-isolation` and `stdlib-lock-sharing`
  already document. Treat a non-zero exit with `0 failed` and a file count
  below the full set as this, not as a regression.
- **`runDispatchLoop` is at 29 NLOC against the hook's 30-line limit.** One
  more interception tier requires a split.
- **Pinned `reason` strings drift.** Four separate confirmations this mission.
  Re-probe at HEAD; never repeat a pinned reason.
