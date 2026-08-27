# T19 — reconciled tally

Produced 2026-08-26 at `c3a24c9d`. Every number below is a **measurement taken
this run**, not a figure carried from the brief. Consumed by T20.

Two measurement seams were mandatory throughout (`prior-observations.md#2`):
`tests/helpers/fixture-include-store.ts` and `DeterministicMeasurer`, both
passed explicitly. Gate output was read with `--reporter=verbose`
(`prior-observations.md#3`).

---

## 1. What "closed" means, and how it was measured

D6: *a bucket closes when its fixtures parse, route to `SEQUENCE`, and carry a
freshly measured diff-baseline score.* The measurable form of that is the
`diff-baseline.json` transition **`status: "error"` → `status: "baseline"`**
between the mission base `c062956a` and HEAD.

- base `c062956a`: 946 renderable / 195 error, of 1141.
- HEAD `c3a24c9d`: 1124 renderable / 17 error, of 1141.
- **closures = 178.**

Attribution to a bucket was done by **bisecting the mission's own history**:
each of 15 refs from `c062956a` to HEAD was measured by
`npx jiti scripts/sequence-ratchet-adjudicate.ts --snapshot <path>` in a
detached worktree with `node_modules` and the gitignored `assets/stdlib`
symlinked in (the hazard `8b06315a` fixed). A fixture is attributed to the
first ref at which `measureFixture` returns a non-null score.

**Caveat on the unit.** A fixture closes when its *last* blocking line is
resolved, not its first. So the attribution answers "which task's landing made
this fixture render", which is the right unit for a mission tally, but the
refusing line a fixture carried at base is illustrative rather than
definitional.

---

## 2. Per-bucket closed counts

| bucket | brief est. | **measured** | Δ | closing ref(s) |
|---|---:|---:|---:|---|
| T7 — `CommandArrow` rebuilt compositionally | ~12 | **40** | +28 | `cdd7d208` |
| T8 — note factory (`of`/VMERGE/`&`/hnote/rnote/stereotype) | ~24 | **26** | +2 | `bb2ed435` |
| T9 — grouping `&`, autonumber inc/stop/resume, activate family | ~20 | **19** | −1 | `8d283f1a` (12), `86459c3f` (7) |
| T10 — hspace, delay, divider, `hide` variant, participant-multilines | ~9 | **8** | −1 | `be686544` (5), `86459c3f` (1), `13576716` (2) |
| T11 — inline sprite, `EmbeddedDiagram` `{{ }}`, `%newline()` | ~6 | **3** | −3 | `fdec3d51` |
| T12 — dressing decorations + ACTIVATION/LIFECOLOR/STEREOTYPE/URL | ~45 | **0** | −45 | — (`c5f5988e` closed none) |
| T13 — exogenous arrows | ~77 | **82** | +5 | `ca2ec736` |
| **total closed** | **193** | **178** | **−15** | |

Two commits carry two task IDs; their fixtures were split **by feature**, since
a bucket is a set of upstream `Command`s rather than a commit:

- `86459c3f feat(T9,T10)` — 7 autonumber/`deactivate` → T9; 1 `hide empty
  description` → T10.
- `13576716 feat(T11)` — 2 fixtures blocked on `=MyTitle` inside
  `participant X [ … ]`, i.e. **participant-multilines**, which is T10's item.
  The commit carries T11's ID only because T11 owned `parser.ts` dispatch
  (batch-3 overview).

Attributed by commit *title* instead, T10 would read 6 and T11 5. The feature
split is the one used above.

### Where each estimate was wrong, and why

**T12 `~45 → 0`, T7 `~12 → 40`.** One cause, two signs. The brief scoped T7 at
"behaviour parity" and put ACTIVATION / LIFECOLOR / STEREOTYPE / URL /
decorated dressing / inclination / multicast in T12. But D1's rebuild composes
`CommandArrow` from named groups, and the groups arrived *with* the rebuild:
`cdd7d208` moved 966 → 1006 renderable, and `c5f5988e` (T12) moved 1042 →
1042. The 40 fixtures T7 closed are dominated by exactly T12's nominal
subject — `bill -> bob ++ #005500`, `Bob -> Alice [[url]] : hello`,
`alice -> bob <<a>> : red`, `Alice -\\o Bob`, `A ->(40) B++`,
`Charlie -> Alice & Bob & Dave`. T12's work is not wasted: it is what makes
those forms *correct*, not what makes them *parse* — the ink lands in T15–T17.

**T13 `~77 → 82`, and the mission's later `73` is also wrong.** Two independent
measurements agree exactly at 82:

1. 82 fixtures first render at `ca2ec736`.
2. 82 fixtures in the whole 1141-fixture corpus parse to an AST holding ≥1
   `kind: 'messageExo'` event.

The two sets are **identical** — no fixture is in one and not the other. The
`73` figure comes from a walk of the top-level `events` array only. Nine
fixtures carry their exo message inside a `frame`, whose children live under
`branches: Event[][]`; a walk that does not recurse into `branches` misses
them: `bifuzu-54-gefo004`, `kuzuco-40-xara309`, `lipuci-81-vovi162`,
`lusigu-71-nipe759`, `luzapi-49-rati107`, `nunuji-27-mosa042`,
`rozavo-21-cavi374`, `zogane-85-raja214`, `zujani-47-femu345`. Each has exo
syntax in its base refusing line (`[-> B`, `?o-> B`, `A->?`, `[<--1:`), so the
attribution is unambiguous.

**T11 `~6 → 3`.** Two of its three legs closed fixtures (inline sprite ×1,
`EmbeddedDiagram` `}}` ×2). The third, `%newline()`, closed none —
`licole-34-vejo527` is still a residual, with a mechanism now measured (§5).

**T8 `~24 → 26`, T9 `~20 → 19`, T10 `~9 → 8`.** Within ±3 of estimate; no
structural cause, just reason-text classification slop at the bucket edges,
which is what the brief said it was.

---

## 3. Reconciliation against 195 — stop condition 8

```
178  closed (diff-baseline error -> baseline)
+ 1  nuvoja-46-dezu541  — in the population, but a HARNESS gap, not a command
                          bucket; T20 files it
+16  residual fixtures the port still refuses (§5)
----
195  the brief's population, exactly
```

The brief's 195 also counted `kokebo-27-vafi688` as an out-of-scope
CLASS misroute alongside `nuvoja`; the identity above reaches 195 without it,
because `kokebo` was never one of the 195 sequence rows — it is a `component/`
fixture in the routing baseline only.

**Divergence from 195: 178 / 195 = 91.3 %, i.e. 8.7 % short — inside ±10 %.
Stop condition 8 is NOT engaged.**

---

## 4. Scoreboard at HEAD

| quantity | mission baseline | target | **at `c3a24c9d`** |
|---|---:|---:|---:|
| `refusal-baseline` `known-gap` pins | 163 | 0 | **9** |
| refusal SLI 2 (the reported number) | 1 | ≤1 | **1** (`nuvoja` only) |
| routing misroutes, sequence | 195 | 0 | **17** |
| routing misroutes, all | 196 | — | **17** |
| `diff-baseline` `status: "error"` | 195 | 0 | **17** |

All three gates green; `npm test` 16876 passed, 0 failed, 2 skipped, 1 todo.
(The count fell by 8 from 16884 because both gates emit one `it()` per pinned
residual: routing 18 → 17, refusal 22 → 15.)

---

## 5. The 17 residuals, each re-probed at HEAD

The `diff-baseline` `error` set, the sequence `routing` `known-misroute` set
and the `refusal` `known-gap` set are **the same 17 fixtures**, minus those
that another engine draws (below). Every reason below was re-probed this run —
seven of the sixteen pinned reasons named a line this port now parses.

| fixture | refusing line (at HEAD) | unported mechanism |
|---|---|---|
| `fojomu-60-cuda302` | L9 `{start} <-> {end} : some time` | `CommandLinkAnchor` — `CommandLinkAnchor.java:55-64`; `SequenceDiagramFactory.java:155` |
| `nizuzi-32-babe798` | L10 `{start} <-> {end} : This is not plotted` | same |
| `zoturo-25-jima978` | L10 `{start} <-> {end} : some time` | same |
| `dolice-60-copi767` | L8 `  test` (body of `note left [[…]]`, L7) | `factorySequenceNoteOnArrowCommand.createMultiLine` — `FactorySequenceNoteOnArrowCommand.java:77-88`; `SequenceDiagramFactory.java:136` |
| `nidozi-08-daxa280` | L6 `  a note with a link` (body of `note left [[…]]`, L5) | same |
| `recani-60-licu962` | L4 `Wrong note shape (r)` (body of `rnote right`, L3) | same; this port's single-line form (`:132`) has an optional `(?::…)?` tail, so it matches the bare opener and orphans the body |
| `ladiro-50-gume805` | L5 `  Note` (body of `note left of Alice [[…]]`, L4) | `UrlBuilder.OPTIONAL` tail of `factorySequenceNoteCommand.createMultiLine` — `FactorySequenceNoteCommand.java:76-90` (the OPTIONAL at `:89`); `SequenceDiagramFactory.java:134` |
| `junide-55-soka558` | L5 `url of APP is [[…]]` | `CommandUrl` — `sequencediagram/command/CommandUrl.java:61-72`; `SequenceDiagramFactory.java:154` |
| `vubato-50-gebu534` | L3 `url of RepoxServer is [[…]]` | same |
| `jiliba-03-lapi286` | L2 `IT++` | `CommandActivate2`, the bare `NAME++`/`NAME--` shorthand — `CommandActivate2.java:29-37`; `SequenceDiagramFactory.java:128`. **Not** a `CommandArrow` gap: that ACTIVATION group needs an arrow |
| `loteba-26-konu854` | L22 `& return Hello44` | `CommandReturn`'s `PARALLEL` group `(&[%s]*)?` — `CommandReturn.java:68`; `SequenceDiagramFactory.java:129` |
| `tegasu-93-fima016` | L3 `hide << new >> stereotype` | `GENDER` group of `CommandHideShowByGender` — `classdiagram/command/CommandHideShowByGender.java:72-83` (the `\<\<.*\>\>` alternative at `:76`); `CommonCommands.java:106`. This port has `^hide\s+stereotype\s*$` (`command-common.ts:71`) |
| `bomino-39-tipo216` | L3 `<style src=strictuml.skin>` | `CommandStyleImport` — `style/CommandStyleImport.java:68-77`; `CommonCommands.java:90` |
| `soxata-16-kafi688` | L2 `skinParam CaptionFontSize 10` | `RE_SKINPARAM_LINE` (`preprocessor.ts:107`) has no `i` flag, so the camel-case spelling survives the strip and reaches a command list that registers only `skinParamMessageAlignCommand`. Upstream matches any case: `CommandSkinParam` is a `SingleLineCommand2` — `command/CommandSkinParam.java:57-63`; `CommonCommands.java:66` |
| `fonudu-70-coma124` | L2 `---` | `ReadLineWithYamlHeader`'s front-matter block, stripped in the PREPROCESSOR — `preproc/ReadLineWithYamlHeader.java:91`. Not a command gap |
| `licole-34-vejo527` | preprocessed L4 ` + XXX` | **not** an unported `%newline()` (`Newline.ts:31` ports it). `%newline()` inside a TIM double-quoted literal yields a real `U+000A` where the same call outside one correctly yields the `U+E100` sentinel; `applyFunctionsAndVariablesInternal` then splits on `\n` (`TContext.ts:362`, mirroring `tim/TContext.java:512-517`, gate hardcoded `true` at `skin/Pragma.java:95-97`), so the label becomes two source lines. Upstream never splits — `tim/builtin/Newline.java:63-67` under `JawsFlags.java:40` returns the sentinel in both positions |
| `nuvoja-46-dezu541` | preprocessor stop | `!includedef macro` is absent from `tests/helpers/fixture-include-store.ts` (`IncludeExecutor.ts:127`). **Harness item, not a command gap** — the single non-gapped defect refusal SLI 2 reports |

### Which of the 17 sit in which gate

- **All 17** are `diff-baseline` `status: "error"` and sequence
  `routing` `known-misroute`.
- **9** are also `refusal` `known-gap` — the sequence engine refuses *and* no
  other engine draws: `jiliba`, `junide`, `licole`, `loteba`, `nidozi`,
  `nizuzi`, `recani`, `tegasu`, `vubato`.
- **7** are routing-only: the sequence engine refuses but STATE or CLASS draws
  them, so `weErrored` is false and they are pinned `ok`: `bomino`, `dolice`,
  `fojomu`, `fonudu` (STATE); `ladiro`, `soxata` (CLASS); `zoturo` (STATE).
- **1**, `nuvoja`, errors under dispatch on a source the jar rendered and is
  pinned `ok` deliberately — SLI 2 = 1.

---

## 6. Verification of the incremental re-pins, and what did not trace

Every batch close re-pinned incrementally. T19 checked each against
`findings/adjudication.json`.

**`diff-baseline` — 192 changed rows, all authorised.**

| transition | rows | T18 verdict |
|---|---:|---|
| `error` → `baseline` | 178 | `inconclusive`, `baseScore: null` — i.e. a closure by construction |
| `baseline` → `baseline`, score down | 7 | `improved` |
| `baseline` → `baseline`, score up | 7 | `artefact` (D5) |

Zero `regression` verdicts; zero rows changed without a verdict. All 178
closures have `baseScore === null` **and** `liveScore !== null`, so none is a
`null`-base ambiguity being passed off as a closure. Independently, a fresh
whole-corpus snapshot at HEAD matches all 1141 pinned entries exactly — 1124
scores equal, 17 still erroring, 0 drift.

**`routing-baseline` — 178 changed rows**, all `known-misroute` → `agree` on
sequence fixtures, each with the same closure verdict. Zero without.

**`refusal-baseline` — 175 changed rows.** 154 `known-gap` → `ok` and 14
`ok` → `ok` (metadata refresh only) trace to closure verdicts. **7 rows do
not**, and this is the finding below.

### FINDING 1 — seven refusal rows were pinned from the wrong measurement

`bomino-39-tipo216`, `dolice-60-copi767`, `fojomu-60-cuda302`,
`fonudu-70-coma124`, `ladiro-50-gume805`, `soxata-16-kafi688`,
`zoturo-25-jima978` were re-pinned `ok` → `known-gap` with
`weErrored: true` at the batch-3 close. A fresh `renderSync` measurement says
`weErrored: false` for all seven — they render, as STATE or CLASS.

**Mechanism.** `scripts/repin-sequence-baselines.ts:112` writes
`const errors = m.score === null;` into `weErrored`. `m` comes from the
adjudicator snapshot, whose `measureFixture`
(`scripts/sequence-ratchet-adjudicate.ts:317`) calls `renderFixtureSequence` —
the **sequence engine directly**. So `score === null` records a *sequence-engine
refusal*. The refusal gate defines `weErrored` as our **dispatched**
`renderSync` output being a `PSystemError` page
(`refusal-coverage.test.ts:106`). For a source the sequence engine refuses but
another engine draws, the two quantities differ, and the script wrote the wrong
one.

**Causal chain.** The pin was never checked against a dispatched render, and no
gate could catch it: `isDefect(now, 'known-gap')` returns `false` regardless of
the live reading, and the `known-gap` shape assertion checks
`g.weErrored` on the **pin**, not on the measurement.

**Ruled out.**
- *Not a HEAD-only behaviour change.* `bomino`'s routing pin has read
  `ourType: STATE` since `c062956a` and still does; measured at the base ref in
  a detached worktree it is `errored=false, dtype=STATE` — identical to HEAD.
- *Not a measurer or include-store artefact.* Every measurement passed
  `fixtureIncludeStore()` and `DeterministicMeasurer` explicitly, exactly as
  `refusal-coverage.test.ts`'s own `measure()` does.
- *Not ambiguity in the source data.* At commit `c7ad13e5` the **same script
  run** wrote `ourType: STATE` (a rendered diagram) and `weErrored: true` (an
  error page) for `bomino`. Those cannot both be true; the inconsistency is
  visible inside one commit.

**Action taken.** All seven re-pinned `status: "ok"`, `weErrored: false`,
`reason` removed, `engine` refreshed from measurement. This closes nothing —
they remain routing misroutes and `diff-baseline` errors. `known-gap` therefore
reads **9**, not 16, and that step is bookkeeping, not coverage.

### FINDING 2 — 222 stale `reason` fields on rows that no longer refuse

178 `routing-baseline` rows pinned `agree` and 44 `diff-baseline` rows pinned
`baseline` still carried a `reason` reading "the SEQUENCE engine refuses this
source at line N…". `scripts/repin-sequence-baselines.ts:93-99` never clears
`reason` when flipping a routing row to `agree` (its refusal arm at `:117`
does). No gate reads a `reason` on a non-residual row, so the debris was
invisible. All 222 cleared.

### FINDING 3 — `class/sadamo-18-siva346` is stale, and predates this mission

Pinned `routing: ourType CLASS / jar-error` and `refusal: weErrored false`; it
measures `ourType NONE / weErrored true`. Measured at the base ref
`c062956a` it **already** errored, so this mission did not cause it; its pins
date to `291dfcfd` / `0315454c`. Both gates exclude it (its golden is one of
the jar's own error pages), so nothing fails. **Deliberately not re-pinned**: no
T18 verdict covers it and it is not a sequence fixture. Handed to T20.

### FINDING 4 — one unreproduced gate failure, mechanism NOT established

One run of the three gates reported 2 failures, both
`corpus completeness > every fixture on disk is pinned, and every pin is on
disk`. At the identical tree state the same three files then passed twice in
combination and once in isolation, and the failing run's own preamble printed
the final pinned counts. Ruled out: stale baseline content (counts printed
correctly in that very run); a stray file under a walked root (`git status` is
clean apart from the write-set); a genuine pin/disk mismatch (four subsequent
passes). **The mechanism is not known** — recorded rather than declared
resolved. Suspected but unproven: contention with a concurrently finishing
`npm test`, the class of hazard `stdlib-run-isolation` and `stdlib-lock-sharing`
document. T20 should treat this as an open flake, not a closed item.

---

## 7. What T20 inherits

1. **Fidelity residuals** — 1124 fixtures carry a measured `weightedScore`;
   getting them low was never this mission's target (D6). The per-bucket
   residual census is T20's filing.
2. **`nuvoja-46-dezu541`** — a fixture-include-store gap (`!includedef macro`),
   not a command gap. File as a harness item.
3. **The 16 command residuals of §5**, each with a named upstream mechanism.
   The three-fixture `CommandLinkAnchor` group and the three-fixture
   `note…OnArrow.createMultiLine` group are the two largest.
4. **`class/sadamo-18-siva346`** — a pre-existing stale pin (Finding 3).
5. **The completeness-gate flake** (Finding 4).
6. **`scripts/repin-sequence-baselines.ts`** measures the wrong quantity for
   `weErrored` (`:112`) and never clears `reason` on a routing fall (`:93-99`).
   Both produced real bad pins this mission; fix before the script is reused.
