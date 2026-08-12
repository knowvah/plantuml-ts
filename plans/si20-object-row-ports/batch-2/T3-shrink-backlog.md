# T3 — re-measure, delete the object backlog, diagnose any residue

## Prior observations

- `oracle/goldens/object/port-backlog.json` is **not an exemption list**. The
  suite asserts `portOk` is each listed slug's ONLY failing check, so a listed
  fixture that breaks anything else still fails — **and a fixture that now
  passes everything also fails the pin**. That is why the pin and the fix must
  travel together. The list only ever shrinks.
- SI17's B1 already deleted three slugs from this same file
  (`guzojo-14-muxa584`, `kavako-54-zipa815`, `style-stereotype-on-arrow-7`)
  as a cross-type consequence, leaving `rozuxo-44-fudi093` alone. Its
  `_object_residue_2026_08_12` note explains why.

## Context

T2 landed the mechanism. This task establishes what it actually bought,
retires the pin by exactly that much, and routes anything left.

## Task

1. Re-run the port-aware object DOT gate yourself. Confirm or correct T2's
   numbers.
2. Delete `rozuxo-44-fudi093` from `oracle/goldens/object/port-backlog.json`
   **if it closed**.
3. The file then has **zero** slugs: **delete the file** and remove the
   suite's reference to it in `tests/oracle/object-dot-parity.test.ts` — the
   `portBacklog` const and its branch go dead, exactly as SI17's T3 did for
   the class equivalent.
4. If `rozuxo` did **not** close, name its mechanism in the journal with all
   four diagnosis parts. "Still diverges" is not a disposition.

## Diagnosis bar, if anything remains

Per `~/.claude/rules/diagnosis.md`: **mechanism**, **origin** (`file:line`),
**causal chain**, and **what was ruled out** with the evidence that ruled it
out. An empty "ruled out" means the cause was guessed.

And the SI17-derived rule that this mission puts in its journal header:

> An observation that holds only because of the thing you are about to remove
> is not a ruling-out.

SI17's B2 nearly shipped a wrong fix on exactly that error — its "ruled out"
rested on a node table that matched *because of* the very carry it was about
to delete. Measure a removal in isolation before believing a diagnosis.

## Write-set

- `oracle/goldens/object/port-backlog.json` (shrink, then delete)
- `tests/oracle/object-dot-parity.test.ts` — the reference to that file, only
  if it is being deleted
- `plans/si20-object-row-ports/decision-journal.md` (append under
  `## Entries`; do not touch the Quality-gate log table — the orchestrator
  owns that)

**No production code.**

## Read-set

- `scripts/dot-sync-report.ts` — how the gate reports.
- `oracle/goldens/object/port-backlog.json:1` — the `_doc` and the SI17
  residue note.
- `tests/oracle/object-dot-parity.test.ts` — how the pin is asserted.
- [ADR-6](../decisions.md#adr-6--the-honest-ceiling-is-7880) — read its
  arithmetic before writing any number down.
- `plans/si17-class-row-ports/batch-1/T3-shrink-the-backlog.md` — the same
  task, one corpus over.

## Architecture decisions in force

[ADR-6](../decisions.md). The denominator is 80: today `77 EQUAL + 1 portOk +
2 no-candidate`, with 1 oracle-blind already **inside** the 77. Closing
`rozuxo` reaches **78/80**. The remaining two are `no-candidate` — we feed
nothing — and are a separate mechanism.

## Interface contract — consumed by T4

```jsonc
{
  "flipped": ["slug"],
  "residual": [ { "slug": "string", "mechanism": "string", "javaRef": "file:line" } ],
  "objectDotEqual": 0
}
```

## Acceptance criteria

- Given the gate re-run, then `rozuxo-44-fudi093` is gone from the backlog in
  this same commit if it closed.
- Given the backlog is empty, then the file is **deleted** and no test still
  references it.
- Given a slug that did not flip, then the journal names its mechanism and a
  `file:line`.
- Given the gate reports 78/80, then the journal states plainly that the
  remaining two are `no-candidate` and that `besepi-37-rori892` belongs to
  object-close B33 — **not** that the bar was met beyond 78/80.
- Given the four gates, then all pass — deleting the pin is what makes them
  green after T2.

## Observability requirements

This task *is* the measurement. Record the full gate breakdown, not just the
EQUAL count.

## Rollback

**Reversible.** Data and docs only.

## Quality bar

Four gates green, unpiped. **No slug added to any backlog under any
circumstance** — an addition means T2 caused collateral damage, which is a
stop condition.

## Boundaries

- **Always:** delete a pin in the same commit as the fix that earned it;
  instrument before hypothesizing.
- **Ask first:** anything that would change the gate's own logic.
- **Never:** add a slug; relax `portOk`; report a bar as met when it is not;
  run any state-mutating git command.

## Commit format

```
chore(T3): retire the object port backlog
```
