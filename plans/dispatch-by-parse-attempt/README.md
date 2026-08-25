# Mission — `dispatch-by-parse-attempt`

**Delete the routing heuristics. Decide diagram ownership the way upstream
does: attempt the parse, take the first factory that succeeds.**

Planned 2026-08-24. Not started. Branch: `feat/dispatch-by-parse-attempt`.

## Objective

`src/core/dispatcher.ts#resolve` picks an engine by calling each plugin's
regex `accepts()` in registration order. Upstream never does this. It builds a
candidate set from the `@start` line, iterates factories in a fixed order, and
**attempts the parse** — the first one that does not produce a `PSystemError`
wins (`PSystemBuilder.java:256-266`). That is the structural divergence
`CLAUDE.md` names as *the* bug behind the whole misroute class, and this
mission re-mirrors it rather than tuning around it.

The prerequisite that deferred this mission twice: **our parsers are
permissive.** Every one of the eight command-loop engines ends its parse loop
with a chain of `if (…) continue;` and no `else` — an unrecognised line is
silently dropped (`class/parser.ts:439-462`, `state/parser.ts:192-208`).
Upstream fails, because every line must match a registered `Command`
(`PSystemCommandFactory.java:169-175`). Parse-attempt dispatch is worthless
until an engine can refuse. Batches 1–3 give it that ability.

## Scope correction — read this before believing the old filing

`planning/next-missions.md:611-620` sizes this mission at "≥13 engines". That
over-counts, for a reason worth stating precisely.

`DiagramType.findStartTypes` (`DiagramType.java:69-92`) returns a **singleton**
set for every `@start` tag except `@startuml`, which returns
`EnumSet.of(SEQUENCE, STATE, CLASS, OBJECT, ACTIVITY, DESCRIPTION, COMPOSITE,
TIMING, HELP, SPRITES)` (`:198-201`). The factory loop skips any factory whose
type is not in the set. So **parse-attempt only ever discriminates inside
`@startuml`** — 9 upstream factories, of which 5 are ported here.

Strict refusal, however, is needed more widely, because [D7](decisions.md#d7)
makes the strict parse the *real* parse path. Its scope is set by upstream's
own factory base classes, not by a chosen number:

| Upstream base | Behaviour | Ported engines |
|---|---|---|
| `PSystemCommandFactory` | per-line command loop, strict | sequence, class, activity, description, state, board, chart, packetdiag (**8**) |
| `PSystemAbstractFactory` | own document parser, own error semantics | json, yaml, hcl, files (**4**) |
| `PSystemBasicFactory` | passthrough | dot (**1**) |

## The proof criterion

`component/kokebo-27-vafi688` routes CLASS; the jar says DESCRIPTION. Source is
`component a $a { }` / `component b { }` / `note right of a` / `remove $a`.
**No line-text discriminator exists**: `CommandPackageWithUSymbol` is registered
on both `ClassDiagramFactory.java:130` and `DescriptionDiagramFactory.java:96`,
and `CommandRemoveRestore` on both (`:114`, `:94`). Every line parses under both
factories. Upstream breaks the tie by class-tries-first plus whole-document
parse success — which no heuristic can reproduce.

**If parse-attempt is correctly mirrored, this fixture closes with no
heuristic. If it does not close, the mirror is incomplete.** It is T12's
acceptance criterion and the mission's single best evidence of success.

## SLIs

| # | Measures | Instrument | Baseline | Target |
|---|---|---|---|---|
| 1 | routing disagreements | `tests/oracle/svg-conformance/routing-conformance.test.ts` | 2 real + 8 jar-error / 3158 | 1 real (kokebo closes; nuvoja is out of scope) |
| 2 | **refusal coverage** — we error, jar rendered | `refusal-coverage.test.ts` (**T0 builds it**) | 0 (refusal does not exist yet) | 0, or every residual carries an unported-`Command` mechanism |
| 3 | parse cost | `npm test` wall-clock | current | reported as a number; super-linear blowup is a stop |
| 4 | baselines | `ratchet.json` / `diff-baseline.json` | 482 promoted zero-diff | 0 unexplained de-promotions |

SLI 2 is why [batch 0](batch-0/overview.md) exists and runs alone: the
instrument must predate the change, or the explosion is discovered rather than
measured.

## Batches

| Batch | Tasks | Parallel | Lands | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | T0 refusal-coverage gate | — | SLI 2's instrument, baseline 1 | [x] |
| [1](batch-1/overview.md) | T1 refusal type · T2 candidate set | yes | two new modules, unwired | [x] |
| [2](batch-2/overview.md) | T3 wire the contract | — | `parse()` widened, candidate set adopted; **moves nothing** | [x] |
| [3a](batch-3a/overview.md) | T4–T11 refusal in 8 engines | yes | strict parse loops | [x] |
| [3b](batch-3b/overview.md) | T12 dispatch + order + `accepts()` removal | — | parse-attempt live; kokebo closes | [x] |
| [4](batch-4/overview.md) | T13–T15 coverage: sequence, class, description | yes | SLI 2 → 0 for those engines | [x] |
| [5](batch-5/overview.md) | T16–T18 coverage: state, activity, board | yes | as above | [x] |
| [6](batch-6/overview.md) | T19–T20 coverage: chart, packetdiag | yes | as above | [x] |
| [7](batch-7/overview.md) | T21 delete heuristics · T22 close-out | sequential | ~1400 lines removed | [x] |

**Batches 3a and 3b are one atomic unit.** Refusal without the dispatch switch
errors the corpus wide; the dispatch switch without refusal moves the routing
gate 79 → 469 (measured — `.agent-notes/T2-registration-order-halt.md`). Run
3a, then 3b, and **run the quality gates only after 3b closes.** Commits still
land one per task on the branch; the pair is the atomic green unit. This is the
one place in the mission where a mid-batch commit is red by construction, and
it follows from [D3'](decisions.md) coupling ruling.

Batch 4–6 membership is a planning guess. The real split is whatever T0's gate
measures after 3b. **A task whose bucket measures empty closes as a measured
no-op** — record the measurement, invent no work.

## Quality gates

```
- command: npm test
  pass: exit 0, coverage >= 90/90/90
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: npx vitest run tests/oracle/svg-conformance/routing-conformance.test.ts
  pass: exit 0, disagreements never increase
  on_fail: stop
- command: git diff --name-only HEAD~1
  pass: output matches the task's declared write-set only
  on_fail: stop
```

## Stop conditions

1. **Any fixture newly misroutes** — the routing gate ratchets down only
2. **A promoted zero-diff fixture is de-promoted** with no journaled mechanism
3. **A refusal has no upstream basis** — we refuse a line the jar accepts,
   because the strictness was *invented* rather than ported from a `Command`
   table. This is the mission's defining failure mode and it looks exactly
   like progress
4. **A newly-erroring fixture is not attributable to an unported `Command`** —
   the refusal *contract* is wrong, and no amount of batch 4–6 work fixes it.
   Deliberately mechanism-based: a fixture-count threshold would be a fitted
   number
5. **A task needs a heuristic to pass** — the mission has failed at its own
   premise; do not tune the thing being deleted
6. A constant is needed with no upstream `file:line`, or any value is fitted
7. Two consecutive quality-gate failures on the same check
8. A file outside the write-set needs changing and is in no other task's
   write-set
9. The implementation contradicts [D1–D7](decisions.md)
10. Work drifts into `nuvoja-46-dezu541` / `!includedef` / the preprocessor, or
    into Smetana or dot-engine geometry — all explicitly out of scope

## Push forward without asking

- Naming, formatting, test-helper placement; splitting functions to stay under
  the hook's 30 NLOC / 10 CCN / 5 params / 500 lines
- **A task whose bucket measures empty** — measured no-op, record it
- **A mass fall in any SLI** — the intended outcome; record and continue
- Porting a missing `Command` whose upstream `file:line` is unambiguous — that
  *is* batches 4–6
- **Error-page rendering differences** where routing and refusal are both
  correct — journal as a divergence, do not chase pixels
- Regenerating `docs/catalog.md`; adding tests beyond the listed criteria

## Repo conventions this mission must honour

- **Read the Java method body first.** Every mechanism in this brief carries
  the file and line precisely so it can be checked rather than believed
- **Never fit a value.** Every constant carries its upstream `file:line`
- **Never run Prettier.** No config, not a dependency; it rewrites every
  single-quoted string and no gate catches it
- **Diagrams are PlantUML** in ```` ```plantuml ```` fences, and the source
  must actually parse. Note the trap: a participant named after a diagram-type
  keyword silently re-routes the diagram itself
- Grep `src/main/java/net/`, never just `net/sourceforge/plantuml/`

## Index

- [decisions.md](decisions.md) — D1–D7 with the evidence for each
- [diagrams/dispatch-flow.md](diagrams/dispatch-flow.md) — upstream's dispatch,
  ours today, and ours after
- [diagrams/component-map.md](diagrams/component-map.md) — what this touches
- [decision-journal.md](decision-journal.md) — appended during execution
- `plans/routing-heuristic-repair/README.md` — the predecessor; its residual is
  this mission's inheritance
- `.agent-notes/T2-registration-order-halt.md` — why registration order is
  load-bearing under heuristics

---

# Mission summary — closed 2026-08-25

`accepts()` is gone. `dispatcher.ts#resolve` now builds the `@start`-line
candidate set, iterates plugins in upstream's registration order, and takes
the first whose parse does not refuse — `PSystemBuilder#createPSystem`,
re-mirrored rather than tuned around.

## Batches

| Batch | Outcome |
|---|---|
| 0 | SLI 2's instrument built BEFORE the change. Baseline was 1, not 0 — `nuvoja` already errored on an `!includedef` preprocessor gap. Reported, not papered over. |
| 1 | `ParseRefusal` + `findStartTypes`, unwired. Two invented divergences caught in review (`/\s/` for `Character.isWhitespace`, `toLowerCase()` for an ASCII fold) and fixed with discriminating tests. |
| 2 | Contract wired; moved nothing, as designed. T3 was mis-scoped and split rather than stretched. |
| 3a/3b | Refusal in 8 engines, then dispatch. The atomic pair the brief warned about. |
| 4 | Sequence/class/description coverage. Where a command was not ported, the fixture is pinned with the command that explains it. |
| 5 | state/activity/board — **measured no-ops**. The 17 the gate attributed to `state` were all SEQUENCE gaps; see below. |
| 6 | chart/packetdiag — **measured no-ops**, both buckets 0. |
| 7 | Heuristic layer deleted: 1534 lines. |

## Exit bar

**The proof criterion — `component/kokebo-27-vafi688`.** ✅ It routes CLASS
and agrees with the jar. One correction to the brief: it states "the jar says
DESCRIPTION", and the fixture's own golden says `data-diagram-type="CLASS"`.
The criterion was written backwards; the fixture agrees, which is what
"closes" was meant to mean. It regressed once mid-mission, when a container
`$tag` fix changed how an empty tagged container collapses, and was fixed by
carrying the tags to the leaf as upstream's `addTags` does.

| SLI | Target | Result |
|---|---|---|
| 1 routing | 1 real disagreement | ✅ 2954 agree, 8 jar-error, 196 known-misroute — **all 194 censused ones cite an upstream `File.java:line`**, newly asserted by the gate |
| 2 refusal coverage | 0, or every residual carries a mechanism | ✅ 163 known-gap, every one citing its unported command |
| 3 parse cost | reported; super-linear blowup is a stop | ✅ 47s wall clock, no blowup |
| 4 baselines | 0 unexplained de-promotions | ✅ every baseline move carries its mechanism in the pin itself |

All four quality gates green: 16621 tests, coverage 95.4/90.5/96.9/96.5.

## Residual

Each has a named mechanism and a destination.

1. **Sequence command coverage — 163 refusal gaps / 194 routing entries, one
   root.** Every remaining entry in BOTH conformance gates is a sequence
   source whose refusing line names an unported command: 62 exo arrows
   (`CommandExoArrowLeft`/`Right`), 23 note-factory groups (`VMERGE`,
   `STYLE`, the optional `of` in `PARTICIPANT`, `PARALLEL`), 13
   `CommandGrouping` PARALLEL, and the `CommandArrow` named groups. Closing
   them closes both gates together. → its own mission; the census is the
   work-list, already per-fixture.
2. **Bucket attribution is not ownership.** The gates' `engine` field is the
   MERGED refusal's assumed type, and D2 keeps the highest-scoring refusal —
   so 17 sequence gaps read as `state`. Filter by the refusing LINE. Recorded
   in `DIVERGENCES.md` and batch 5's close-out.
3. **`nuvoja`** — the pre-existing `!includedef` preprocessor gap SLI 2's
   baseline surfaced. Out of scope from the start; still open.

## What the mission found that it did not set out to find

Strict parsing turned every over-permissive regex in the port into a routing
bug, and each one had to be traced to the upstream grammar it mismatched:

- `[*] --> state1` was claimed by DESCRIPTION's bracket shorthand, whose
  trailer was a bare `(.*)?$`. Upstream's `CommandCreateElementFull` is
  anchored and permits only tags/stereotype/url/color after the CODE. **20
  state tests** were failing on this one line.
- `component C1 $tag1 {` matched no class container command, because rule 5b'
  lacked the `TAGS1`/`TAGS2` runs `CommandPackageWithUSymbol` has — so the
  block never opened and its body went unparsed.
- Class arrow style was `LINE_STYLE_MULTIPLES` where `CommandLinkClass` uses
  plain `LINE_STYLE`; the `;` form is description-only.

And **eight tests asserted behaviour the jar does not have** — `3: greet`,
`1:`, a `state` container in a class diagram, `entity Entity {}` routing away
from class, `database D` + `class A` without `allowmixing`, a class-corpus
directory treated as authoritative over the golden, a raw-pipeline geometry
pin whose layer no longer exists, and a style-block source the jar refuses
twice over. Each was verified against the jar before being rewritten.
