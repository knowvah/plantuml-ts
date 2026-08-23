# Mission: `sequence-root-chrome`

**Branch:** `feat/sequence-root-chrome` · **Planned:** 2026-08-23 ·
**Baseline commit:** `fc499de2` (clean tree, all gates green)

## Objective

Route the sequence engine's SVG output through the shared klimt document
shell every other engine already uses, and port the inline arrowhead shapes
that routing requires. Sequence is the only engine still emitting a bare
`<svg>` root with SVG `<marker>` arrowhead defs; the jar emits eight root
attributes, a `<?plantuml $version$?>` prolog, an empty `<defs/>`, and draws
every arrowhead as an inline polygon. This closes SI33's ranked item 1 for
all 1140 measurable sequence fixtures.

## Exit bar

**Amended 2026-08-23** — the original bar was written against `diffCount`,
which [D5](decisions.md#d5--the-ratchet-scores-skipped-subtrees-not-diff-records)
shows is not monotonic. The structural half of it was **met exactly** by T3
and is now a recorded result rather than a target:

> 803 of the 1010-fixture plateau fell to an identical 5-diff path set —
> `svg/@width`, `@height`, `@viewBox[2]`, `@viewBox[3]`, `svg/g[1][childCount]`.
> The six absent root attributes and `svg/defs[1][childCount]` are gone from
> every fixture. Measured over 1138 fixtures, 2026-08-23.

The remaining bar:

- `compareSvg` scores skipped subtrees by size, and every fixture whose
  `weightedScore` rises against its pre-T3 value is named with a mechanism
  ([D7](decisions.md#d7--ruled-2026-08-23-the-nine-weighted-risers-are-re-pinned-each-named)
  — there are 9, all our content group growing)
- non-sequence entries moved in `render-manifest`: **only**
  `object/zuvila-56-nuda425`, allowed by
  [D6](decisions.md#d6--ruled-2026-08-23-the-one-non-sequence-manifest-entry-is-allowed)
- no other engine's baseline moved by T6's change to the shared comparator
- all four gates green

## What this mission does NOT do — read before scoring it

**It does not unlock body comparison.** SI33's ratchet message and
`planning/sequence-deepdive.md` both state that closing the root-chrome gap
makes the diagram body comparable for the 88.8% plateau. **That is wrong and
this brief corrects it.** `svg/g[1][childCount]` (measured 94 vs 630 on
`SequenceArrows_0001_Test`, 13 vs 76 on `mebidu-16-ruve297`) short-circuits
at the same `compare.ts:353` and will keep doing so until the body is
substantially correct — rebuild-scale work, not a chrome fix. Expect the
plateau to fall to ~5, not to collapse into body diffs.

Also explicitly out of scope, named rather than assumed:

- the `<g><title>Bob</title>` lifeline grouping (body structure)
- Gap SQ-5's hard-coded 40 px self-loop width (layout, not chrome)
- arrow syntaxes the spike's parser does not recognise (`->x`, `->o`,
  `->>`, `-\`, `\-`) — D2 ports the *model*, not the parser
- multi-page `newpage` (`xobebi-29-jilu859` has no oracle entry at all)

## Quality gates — all four, between every batch

```
- command: npm test
  pass: exit 0
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
- command: git diff --name-only HEAD~1
  pass: output matches the batch's declared write-set only
  on_fail: stop
```

## Batches

| Batch | Tasks | Parallel | Status |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 arrow shape vocabulary · T2 document shell | yes | [x] |
| [2](batch-2/overview.md) | T3 renderer wiring | — | [x] |
| [2b](batch-2b/overview.md) | T6 weighted diff score | — | [x] |
| [3](batch-3/overview.md) | T4 re-pin ratchet · T5 manifest re-baseline | yes | [x] |

Batch 2b was inserted by the [2026-08-23 amendment](decisions.md#amendment--2026-08-23-mid-mission).
T3's code is correct and landed; the batch halted on the *measure*, not the
change. See [D5](decisions.md#d5--the-ratchet-scores-skipped-subtrees-not-diff-records).

## Stop conditions

- A file outside the current task's write-set needs changing, and it is in
  no other task's write-set either
- Two consecutive quality-gate failures on the same check
- A decision in [decisions.md](decisions.md) is contradicted by what the
  code turns out to require
- **Any non-sequence entry moves in `render-manifest`, other than the one
  enumerated slug** — that is an `assemble-svg.ts` leak into
  class/state/json/description, the single highest-consequence failure this
  mission can cause. Triggered 2026-08-23 by `object/zuvila-56-nuda425`,
  diagnosed as a corpus-classification mismatch rather than a leak and
  **allowed by name** — see
  [D6](decisions.md#d6--ruled-2026-08-23-the-one-non-sequence-manifest-entry-is-allowed).
  The routing bug it exposed is filed as
  `sequence-engine-overclaims-nested-diagrams` in `planning/next-missions.md`
- **Any other engine's diff baseline moves** when T6 changes the shared
  `compare.ts`. Added 2026-08-23: seven ratchets and five `scripts/` read
  `diffs.length`, so the weighting must be additive
- **A `weightedScore` rise that is not explained by our own content group
  growing.** Twice amended. The original read "an ISOLATED diff-count rise,
  or a rise on a fixture whose baseline is not 12"; D5 disproved that. The
  first amendment then over-corrected to "every rise is a real regression",
  which [D7](decisions.md#d7--ruled-2026-08-23-the-nine-weighted-risers-are-re-pinned-each-named)
  disproves in turn: `weightedScore` is monotone with respect to *structural
  alignment*, not with respect to *our document growing toward the oracle*,
  because the weight sums both sides. A rise therefore needs its mechanism
  established before it is called a regression. `diffCount` may rise freely
  and is no longer gated
- **A constant is needed that has no upstream `file:line` citation.** Never
  fit a value. No citation means unfinished
- `zudize-61-vomi445`'s measured per-call cost moves materially and no
  *derived* budget exists for the new cost

## Push forward without asking

- Naming inside the new module; formatting; test-helper placement
- Adding test cases beyond the listed acceptance criteria
- A mass diff-count FALL on the 12-cohort — that is the intended outcome;
  re-pin deliberately in T4 and record the measurement
- Splitting a function to stay under the complexity hook's limits
  (30 NLOC / 10 CCN / 5 params / 500 lines)

## Index

- [decisions.md](decisions.md) — D1–D4 from planning, D5–D7 from the
  2026-08-23 mid-mission amendment, with the evidence for each
- [diagrams/component-map.md](diagrams/component-map.md) — what routes where
- [diagrams/data-flow.md](diagrams/data-flow.md) — the assembly call order
- [decision-journal.md](decision-journal.md) — appended during execution

## Before starting: install the autonomous settings

`.claude/settings.autonomous.json` could not be written during planning (the
harness protects settings files). The tailored file is staged here instead —
install it with:

```sh
cp plans/sequence-root-chrome/settings.autonomous.json .claude/settings.autonomous.json
```

It is the standard template minus playwright, web access and the unused
language toolchains, plus `sed`/`awk`/`jq`, `scripts/oracle-render.sh` and
`manifest-diff.py`. Web access is dropped deliberately: the specification for
this mission is the Java on disk at `~/git/plantuml`, not the internet.


---

# Mission summary — completed 2026-08-23

**All 6 tasks done** (5 planned + T6 added by the mid-mission amendment).
Branch `feat/sequence-root-chrome`, 16 commits from `6bb82d1d`.

## Tasks completed vs planned

| | planned | done |
|---|---|---|
| T1 arrow shape vocabulary | yes | `474c06ff` |
| T2 document shell | yes | `21b075c1` |
| T3 renderer wiring | yes | `9aa04d3d` |
| **T6 weighted diff score** | **no — added by amendment** | `667852df` |
| T4 re-pin ratchet + census | yes | `b49553ec` |
| T5 manifest guard | yes | no commit — see below |

## Result

The chrome half landed exactly as briefed. All 803 fixtures of the fallen
plateau now share an **identical** 5-diff path set — `svg/@width`,
`@height`, `@viewBox[2]`, `@viewBox[3]`, `svg/g[1][childCount]` — with the
six absent root attributes and `svg/defs[1][childCount]` gone everywhere.
Sequence now emits the eight-attribute shell, the `<?plantuml $version$?>`
prolog, an empty `<defs/>`, and inline arrowhead polygons; no `<marker>`
token remains in any sequence output.

Aggregate `weightedScore` **1,231,360 → 1,068,757 (−13.2%)** over the 1140
measurable fixtures.

## The mission's real finding

The brief's exit bar was written against `diffCount`, and `diffCount` is
**not monotonic in wrongness**. `compareSvg` short-circuits in three places
and charges 1 for each however large the subtree it skips, so a change that
makes a document *more* structurally aligned can *raise* its score. T3 hit
this on 255 fixtures and halted the mission.

That is now fixed at its origin (D5, T6): each short-circuit carries the
skipped subtree's size and the ratchet gates on the sum. Proof it worked —
**all 256 fixtures whose `diffCount` rose had their `weightedScore` fall,
zero exceptions.**

## Decisions

10 non-trivial judgment calls logged. Three flagged for review:

- **D5/D7 — the metric.** `weightedScore` is monotone under *structural
  alignment* but not under *our document growing toward the oracle*, because
  the weight sums both sides. Nine fixtures rose for that reason and were
  re-pinned with mechanisms, per a maintainer ruling. Of the nine, six moved
  *closer* to the jar's child count; only `pibefe-94-cibu835` is genuinely
  further away.
- **D6 — the manifest exception.** `object/zuvila-56-nuda425` is allowed by
  name. It is a corpus-classification mismatch, not a leak, but the guard now
  carries a named exception.
- **D4 correction — `render-manifest-baseline.json` is gitignored** and has
  never been tracked; nothing reads it. T5 produced no commit because none
  was possible. The evidence is in the journal instead.

## Quality gates

`npm test` **exit 0** — 631 files passed / 1 skipped, **16,184 tests passed**,
0 failures; coverage 95.43 / 90.44 / 96.95 / 96.51.
`npm run typecheck` 0 · `npm run lint` 0 · `npm run build` 0.

**Cross-engine guard passed**, the mission's highest-consequence check:
`1072 fixtures differ`, all modifications (0 added, 0 removed) — 1071
`dot-cache/sequence` plus the one D6-enumerated object slug. **Zero** entries
moved under class, state, component, usecase, json, yaml, hcl, dot or any
`oracle/goldens/svg-*` path.

## Known issues and follow-ups

1. **`sequence-engine-overclaims-nested-diagrams`** — filed in
   `planning/next-missions.md` §4. Corpus classification and actual routing
   disagree in both directions: one `object/` fixture renders as SEQUENCE,
   and 70 fixtures under `sequence/` do not route to the sequence engine at
   all. Nothing catches this, because every affected fixture renders — just
   through the wrong engine.
2. **`weightedScore` can rise on correct growth.** Documented in D7, resolves
   as the body is ported. Worth revisiting if it obscures a real regression.
3. **`gadiva-05-pogi376`'s 8-digit ARGB background** — the jar splits
   `#803D1414` into `fill="#803D14" fill-opacity="0.078"`; `shortenColor`
   returns any non-7-char string unchanged. Affects every engine's background
   rect. Filed in `.agent-notes/si33-T2-document-background-rect.md`.
4. **Black-background exclusion is a latent divergence in STATE/JSON/YAML/HCL**
   — they model white and transparent but not `#000000`. Same note.
5. **Do not run Prettier in this repo** — no config, not a dependency, and it
   rewrites every single-quoted string with no gate catching it.
   `.agent-notes/si33-T1-no-prettier-config.md`.
6. **`docs/catalog.md` belongs in the write-set** of any task adding a `src/`
   module. It is drift-gated and blocked two agents this mission.
7. **The `coverage/.tmp` race** makes a second concurrent `npm test` exit 1
   with no `Test Files` line — indistinguishable from a real failure by exit
   code. Parallel batch tasks must not both run it.

## Out of scope, unchanged

The body is still not comparable: `svg/g[1][childCount]` short-circuits until
child counts match, which is rebuild-scale work. The `<g><title>` lifeline
grouping, Gap SQ-5's 40 px self-loop, the unparsed arrow syntaxes and
multi-page `newpage` are all untouched, as briefed.
