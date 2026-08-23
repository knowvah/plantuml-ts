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

- `compareSvg` scores skipped subtrees by size, and **no** fixture's
  `weightedScore` rises against its pre-T3 value
- **zero** non-sequence entries moved in `render-manifest`, or exactly the
  one enumerated in [D6](decisions.md#d6--proposed-not-ruled-the-one-non-sequence-manifest-entry)
  once ruled on
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
| [2b](batch-2b/overview.md) | T6 weighted diff score | — | [ ] |
| [3](batch-3/overview.md) | T4 re-pin ratchet · T5 manifest re-baseline | yes | [ ] |

Batch 2b was inserted by the [2026-08-23 amendment](decisions.md#amendment--2026-08-23-mid-mission).
T3's code is correct and landed; the batch halted on the *measure*, not the
change. See [D5](decisions.md#d5--the-ratchet-scores-skipped-subtrees-not-diff-records).

## Stop conditions

- A file outside the current task's write-set needs changing, and it is in
  no other task's write-set either
- Two consecutive quality-gate failures on the same check
- A decision in [decisions.md](decisions.md) is contradicted by what the
  code turns out to require
- **Any non-sequence entry moves in `render-manifest`** — that is an
  `assemble-svg.ts` leak into class/state/json/description, the single
  highest-consequence failure this mission can cause. **Triggered
  2026-08-23** by one entry, `object/zuvila-56-nuda425`; diagnosed as a
  corpus-classification mismatch rather than a leak, and still awaiting a
  ruling — see [D6](decisions.md#d6--proposed-not-ruled-the-one-non-sequence-manifest-entry)
- **Any other engine's diff baseline moves** when T6 changes the shared
  `compare.ts`. Added 2026-08-23: seven ratchets and five `scripts/` read
  `diffs.length`, so the weighting must be additive
- **Any `weightedScore` rise, on any fixture.** Amended 2026-08-23: the old
  condition read "an ISOLATED diff-count rise, or a rise on a fixture whose
  baseline is not 12", which assumed a mass rise on the 12-cohort meant
  bodies had become reachable. D5 disproves that — a rise could equally be
  the comparator charging more for a *better*-aligned document. Once
  `weightedScore` is monotone (T6) that ambiguity is gone and **every** rise
  is a real regression. `diffCount` may rise freely and is no longer gated
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

- [decisions.md](decisions.md) — D1–D4, with the evidence for each
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
