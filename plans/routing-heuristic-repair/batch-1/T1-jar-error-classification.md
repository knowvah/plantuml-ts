# T1 — classify the fixtures where the JAR errored

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. This task changes **test
classification only** — no `src/` file is touched and no rendered byte moves.

`oracle/goldens/svg-conformance/routing-baseline.json` pins 79
`known-misroute` fixtures. **Four of them are not misroutes.** Their goldens
are PlantUML's own error images, so `data-diagram-type` is legitimately absent
on the jar's side because the jar never got as far as exporting a diagram:

| fixture | what the golden actually is |
|---|---|
| `class/luzive-62-zote562` | version-banner error image (black ground, green text) |
| `class/sadamo-18-siva346` | version-banner error image |
| `class/zuduxu-90-kosi876` | `An error has occurred : java.lang.NullPointerException: Cannot invoke "…XPoint2D.getX()" because "pt4" is null` |
| `svg-class/class-actor-bare-no-allowmixing` | deliberate `allowmixing` rejection |

The fourth is decisive on its own: that fixture's `in.puml` carries a long
header stating that the jar rejects the input, that the rejection *is* what
the fixture pins on the upstream side, and that this port reaching its class
engine is correct. Read it before writing anything.

Pinning a jar crash as `known-misroute` floors this mission's SLI above zero
for a reason no repair can move — the same error the parent mission's T1
corrected when it chose to pass an include store.

## Task

Teach the gate to distinguish "the jar routed this source somewhere else"
from "the jar produced an error page", and count them separately.

Write the test first (TDD, `~/.claude/rules/testing.md`).

## Read-set

- `tests/oracle/svg-conformance/routing-conformance.test.ts` — the whole
  file; you are extending its classification, not replacing its shape
- `oracle/goldens/svg-conformance/routing-baseline.json` — the manifest
- `oracle/goldens/svg-class/class-actor-bare-no-allowmixing/in.puml` — the
  header described above, in full
- `test-results/dot-cache/class/zuduxu-90-kosi876/in.svg` — head only; it is
  the clearest of the three crash goldens
- `../decisions.md#d4`

## How to recognise an upstream error page

Derive the discriminator from the goldens, and state in a comment which
marker you keyed on and why it cannot fire on a real diagram. Both shapes
upstream emits are present in the corpus:

- the **version banner** page — the `PlantUML version $version$ …` text
  element on a black ground
- the **error text** page — a text element opening `An error has occurred :`

Do not key on the slug, and do not key on the mere absence of
`data-diagram-type`: that absence is a legitimate `NONE` for `@startdot`
passthrough and must keep comparing as a real value.

## Interface contract — consumed by T2 through T9

One added field. Everything else in the manifest is unchanged.

```jsonc
{
  "tree": "dot-cache",
  "type": "class",
  "slug": "zuduxu-90-kosi876",
  "jarType": "NONE",
  "ourType": "CLASS",
  "jarErrored": true,          // NEW — the golden is an upstream error page
  "status": "jar-error",       // NEW status, alongside "agree" | "known-misroute"
  "measuredAt": "2026-08-23",
  "measuredAgainstCommit": "95cd89ab"
}
```

## Write-set

- `tests/oracle/svg-conformance/routing-conformance.test.ts`
- `oracle/goldens/svg-conformance/routing-baseline.json`

Nothing else. If a file outside this set needs changing, **STOP and report
it** rather than changing it.

## Acceptance criteria

1. Given the four fixtures above, when the gate runs, then each is
   `status: "jar-error"` and none is counted in the misroute total
2. Given today's tree, then exactly **75** entries are `known-misroute`,
   **4** are `jar-error`, **3079** are `agree`, and the gate **passes**
3. Given a fixture pinned `jar-error` whose golden stops being an error page,
   then the gate **FAILS** — a jar upgrade that fixes a crash is a real
   change and must not pass silently as if nothing happened
4. Given a fixture pinned `agree` or `known-misroute` whose golden IS an
   error page, then the gate fails naming it — the classification is derived
   from the golden, never from the pin
5. Given the `[ROUTING SLI]` report, then it states both numbers: the
   misroute count that is the mission's target, and the jar-error count that
   is deliberately excluded from it

## Quality bar

All four gates green: `npm test` · `npm run typecheck` · `npm run lint` ·
`npm run build`.

The gate already measures **15,492 ms** in situ under a full `npm test`;
`CORPUS_BUDGET_MS` is derived from that and documented in the file. If this
task changes that number materially, re-derive the budget from a fresh
measurement at the same load condition and update the derivation comment —
never raise a budget to make a red test go green
(`.agent-notes/ratchet-zudize-timeout.md`).

## Observability

This task refines the mission's SLI. Before: 79 fixtures disagree. After:
**75 misroutes** (target 0, ratcheting) plus **4 jar-errors** (expected,
excluded, but watched by AC3).

## Rollback

Fully reversible and independent. A test change plus a manifest change; no
`src/` change, so no rendered byte moves.

## Boundaries

- **Always:** derive the classification from the golden's own content
- **Never:** touch `src/**`; key on a slug; treat a missing
  `data-diagram-type` as an error marker; make the gate fail on a *fall*
- **Ask first:** if a fifth fixture turns out to have an error-page golden —
  that means the corpus moved and the 75 must be re-established before the
  later batches are scored against it

## Commit

One commit: `test(T1): classify jar-error goldens out of the misroute count`
