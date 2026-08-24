# T1 — the routing-conformance gate

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. This task adds **test
infrastructure**, so there is no behaviour to port and no upstream `file:line`
to cite for the harness itself — but the thing it measures is upstream's own
decision, read from the cached goldens.

86 fixtures route to a different engine than the jar does. They persisted
indefinitely because **every affected fixture still renders** — no throw, no
error card, no failing golden. Nothing in the repo compares our engine choice
to upstream's. This task is that comparison.

Build it first. Every later task is judged by the number it produces.

## Task

Add a conformance test that, for every cached fixture in **both** trees,
renders the source and asserts our `data-diagram-type` equals the jar's,
against a committed baseline that ratchets **down only**.

Write the test first (TDD, `~/.claude/rules/testing.md`).

## Read-set

- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:110-235`
  — the ratchet shape to mirror: manifest load, per-fixture `it()`, the
  `checkNoRise` pure function, and the large-golden budget mechanism
- `oracle/goldens/svg-sequence/diff-baseline.json` — the manifest field
  convention (`type`, `slug`, `status`, `measuredAt`, `measuredAgainstCommit`)
- `src/index.ts:206-250` — `renderSync`; note it **never throws** (it returns
  an error-diagram SVG instead), so absence of a throw proves nothing
- `../decisions.md#d3`

## Where the fixtures and the oracle live

| tree | source | jar's answer | n |
|---|---|---|---|
| `test-results/dot-cache/<type>/<slug>/` | `in.puml` | `in.svg` | 2674 |
| `oracle/goldens/svg-*/<slug>/` | `in.puml` | `golden.svg` | ~484 |

Read the jar's type with `data-diagram-type="([A-Z]+)"` against the **head**
of the golden (the root element carries it; do not read 8 MB of body — one
fixture, `sequence/zudize-61-vomi445`, has an 8.26 MB golden).

A golden with no such attribute is legitimately `NONE` (upstream emits none
for `@startdot` passthrough and for some error pages) — record `NONE`, do not
skip the fixture.

## Interface contract — consumed by T2 through T9

```jsonc
{
  "$comment": "...",
  "fixtures": [
    {
      "tree": "dot-cache",        // or "goldens"
      "type": "sequence",         // directory name; NOT authoritative (D6)
      "slug": "zuvila-56-nuda425",
      "jarType": "CLASS",         // or "NONE"
      "ourType": "SEQUENCE",      // or "NONE"
      "status": "known-misroute", // or "agree"
      "measuredAt": "2026-08-23",
      "measuredAgainstCommit": "f66f6abb"
    }
  ]
}
```

## Write-set

- `tests/oracle/svg-conformance/routing-conformance.test.ts` (new)
- `oracle/goldens/svg-conformance/routing-baseline.json` (new)

Nothing else. If a file outside this set needs changing, **STOP and report it** rather than changing it.

## Acceptance criteria

1. Given every cached fixture in both trees, when the gate runs, then each
   compares `ourType` against `jarType` read from that fixture's own golden
2. Given today's tree, then exactly **86** entries are `known-misroute`, the
   other ~3072 are `agree`, and the gate **passes**
3. Given a fixture that agrees today but disagrees at run time, then the gate
   **FAILS** naming that slug, its `jarType` and its `ourType`
4. Given a fixture pinned `known-misroute` that now agrees, then the gate
   **passes** and its message says the pin is stale and should be re-pinned —
   a fall must never fail
5. Given the bucket totals, then the failure message reproduces the jar→ours
   table so a reader sees which mechanism moved without re-running anything

## Quality bar

All four gates green: `npm test` · `npm run typecheck` · `npm run lint` ·
`npm run build`. The complexity hook blocks writes over 30 NLOC / 10 CCN /
5 params / 500 lines.

**Runtime matters here** — this renders ~3158 fixtures. Measure the suite's
added wall-clock and report it. If any single fixture needs a per-test budget,
derive it from a measurement at the same concurrency condition and cite the
derivation; never raise a budget until the test goes green
(`.agent-notes/ratchet-zudize-timeout.md` records why).

## Observability

This task **is** the mission's observability. SLI: count of fixtures whose
`data-diagram-type` disagrees with the jar's. Today 86; target 0, ratcheting.
No runtime metrics exist or should — this is a pure library.

## Rollback

Reversible and independent. A new test plus a new baseline; no `src/` change,
so no rendered byte moves.

## Boundaries

- **Always:** read the jar's type from the fixture's own golden, never infer
  it from the corpus directory name (D6 — the directories are known wrong)
- **Never:** touch `src/**`; edit any other baseline; make the gate fail on a
  *fall*
- **Ask first:** if the measured count is not 86 — that means the tree moved
  under the brief and the number must be re-established before it is pinned

## Commit

One commit: `test(T1): gate diagram routing against the jar's own type`
