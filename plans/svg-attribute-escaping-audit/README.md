# Mission: `svg-attribute-escaping-audit`

**Branch:** `feat/svg-attribute-escaping-audit` · **Planned:** 2026-09-19 ·
**Baseline commit:** `0e618b71` (main, clean; all four gates green; 726 test
files / 19,897 tests; 39 template attribute sinks in `src/`) ·
**Task prefix:** `saea` · Filed by the CodeQL pass (PR #58); evidence in
`.agent-notes/codeql-2026-09-19.md`.

## Objective

Make every user-derived string that reaches an SVG attribute escaped exactly
once, at one seam, with the jar's own character set, and add a lint gate so
no new unescaped attribute sink can land. Today two emission paths coexist:
the faithful `XmlWriter` port (`src/core/klimt/drawing/svg/xml-writer.ts`)
escapes correctly; the template-string path (`svg.ts`, `svg-shapes.ts`,
`svg-markers.ts`, `paint.ts`, `diagrams/*`) never escapes, and its shared
helper `formatAttrValue` is documented as "the single point where an
attribute value becomes text" without being one. One live defect falls out
of this: `skinparam defaultFontName a&b<c` emits `font-family="a&b<c"`,
malformed XML. Decisions, with the Java quoted, are in
[`decisions.md`](decisions.md).

## Exit bar

- Template attribute sinks in `src/`: **39 → 0**, enforced by an ESLint
  `no-restricted-syntax` selector with zero `eslint-disable` under `src/`
- Every probe in `tests/unit/core/attribute-injection.test.ts` parses with
  `@xmldom/xmldom`; one probe per path in
  [`findings/audit-table.md`](findings/audit-table.md)
- **Zero diffs** in every oracle golden and pinned baseline
  (`npx vitest run svg-conformance` unmoved: 27 files / 3427 passed | 1
  skipped at `0e618b71` and at HEAD), except diffs explained by a
  previously invalid `& < "` value, each named in the audit table
- `escapeXml` matches jar `XmlWriter.escapeAttribute` (`& < "`), pinned by
  the `>`-in-tooltip oracle fixture, not by reading the Java
- All four gates green; `npm run catalog` no drift

## What this mission does NOT do (file, never build)

- Migrate template emitters onto `XmlWriter` (D2 records it as direction)
- Change DOT emission (`svek-dot-emit*.ts`): one audit row, no code
- Fix `sequence-participant-background-cascade` (filed separately)
- Audit `RegexConcat`-built command patterns for ReDoS (needs tooling)
- Wire `sanitizeSvg` anywhere (D6: no inlining site exists until D3-prime)

## Stop conditions

1. A task needs a file outside its write-set AND outside every other
   task's. Likeliest trigger: a pre-escaping call site not yet found; log
   it, do not widen the seam to skip it
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts [`decisions.md`](decisions.md) D1–D8; amend there
   and halt
4. T1's `>`-in-tooltip oracle shows the jar emitting `&gt;` in an
   attribute (D3 flips; T3a must not proceed on the approved text)
5. A comparator diff not explained by a previously invalid `& < "` value.
   Re-baselining is forbidden
6. A sink that cannot route through `attrs()` without a logic change
   (T4/T5a/T5b are "route, nothing else")
7. The ESLint selector needs an allowlist or more than two
   `eslint-disable` comments under `src/` to go green
8. Any corpus `.puml` that rendered at `0e618b71` throws at a batch boundary

## Push-forward conditions

- `attrs([...])` vs `attrsFromRecord({...})` at a sink: stylistic
- A numeric sink routes through `attrs()` byte-identically: no journal row
- A probe path that is unported: row `n/a` with the reason
- `svg-primitives.test.ts` pins of the old four-character `escapeXml`:
  update to three, citing `XmlWriter.java:264-275`, once T1's oracle agrees
- Fixture placement: follow the harness layout
- Small `npm test` wall-clock change: note the number, do not optimise
- Promoting a T1 oracle from `findings/oracles/` into
  `oracle/goldens/svg-class/` if the ratchet accepts it without a pin change

## Quality gates (after every batch)

```
npm test                       # full suite (never tests/unit alone); 90/90/90
npm run typecheck
npm run lint
npm run build
npm run catalog && git diff --exit-code docs/catalog.md
npx vitest run svg-conformance # 27 files / 3427 passed | 1 skipped, unmoved
git diff --name-only <batch-base>..HEAD   # matches the batch write-set only
```

`npm test` may silently under-collect (see memory note
`coverage-tmp-silent-undercollect`): compare the JSON reporter's collected
file count with the on-disk count (726 at baseline).

## Batches

| Batch | Tasks | Status |
|---|---|---|
| [1](batch-1/overview.md) | T1 audit + oracles · T2 escaper consolidation · T6 sanitizeSvg disposition | [x] 2026-09-19 (03d916cb / 74259771 / c340f196) |
| [2](batch-2/overview.md) | T3b paint + shell · T3a attribute seam · T3c comment defang (D8) | [x] 2026-09-19 (350e5182 / dddd0510 / 827c0805) |
| [3](batch-3/overview.md) | T4 shapes/markers · T5a diagram sinks · T5b coord-shift/latex | [ ] |
| [4](batch-4/overview.md) | T7 lint gate + close-out | [ ] |

## Documents

- [`decisions.md`](decisions.md) — D1–D8, Java quoted (D8 amended 2026-09-19 after stop 1)
- [`findings/audit-table.md`](findings/audit-table.md) — written by T1
- [`diagrams/data-flow.md`](diagrams/data-flow.md) — how a value reaches an attribute, before and after
- [`diagrams/component-map.md`](diagrams/component-map.md) — the two emission paths and the seam
- [`decision-journal.md`](decision-journal.md) — appended during execution
