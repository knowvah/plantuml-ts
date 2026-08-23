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

The 1012-fixture plateau at 12 diffs falls to **~5**, with the six absent
root-attribute diffs and `svg/defs[1][childCount]` gone from every fixture,
**zero** non-sequence entries moved in `render-manifest`, and all four gates
green.

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
| [1](batch-1/overview.md) | T1 arrow shape vocabulary · T2 document shell | yes | [ ] |
| [2](batch-2/overview.md) | T3 renderer wiring | — | [ ] |
| [3](batch-3/overview.md) | T4 re-pin ratchet · T5 manifest re-baseline | yes | [ ] |

## Stop conditions

- A file outside the current task's write-set needs changing, and it is in
  no other task's write-set either
- Two consecutive quality-gate failures on the same check
- A decision in [decisions.md](decisions.md) is contradicted by what the
  code turns out to require
- **Any non-sequence entry moves in `render-manifest`** — that is an
  `assemble-svg.ts` leak into class/state/json/description, the single
  highest-consequence failure this mission can cause
- **An ISOLATED diff-count rise**, or a rise on a fixture whose baseline is
  not 12. A mass fall is expected; a mass rise on the 12-cohort would mean
  bodies became reachable (report it, do not re-pin silently)
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
