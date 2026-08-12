# T3 — re-measure, shrink the backlog, delete it if empty

## Prior observations

- `oracle/goldens/class/port-backlog.json` is **not an exemption list**. Its
  own `_doc` records that the suite asserts `portOk` is each listed slug's
  ONLY failing check, so a listed fixture that breaks anything else still
  fails. The list only ever shrinks.
- The 22 slugs are **not homogeneous** — sampled 2026-08-12: `dekaba-54` is
  a clean single port; `kicolo-81` has ports on both ends with
  package-qualified names; `xefeme-77` has two ports per class plus creole
  in a member; `bicabi-42` contains `Gtk::Window`, which may be an entity
  NAME rather than a port on entity `Gtk`. Expect residue, and expect it to
  be interesting.

## Context

T2 landed the mechanism. This task establishes what it actually bought,
shrinks the pin by exactly that much, and routes the rest.

## Task

1. Re-run the port-aware class DOT gate.
2. Delete every flipped slug from `port-backlog.json` **in this commit** —
   the pin and the fix travel together, so a revert restores both.
3. If the file is empty, delete it and remove the suite's reference to it.
4. For every slug that did NOT flip, name its mechanism in the journal and
   file it as a batch-2 B-item. "Still diverges" is not a disposition.

## Write-set

- `oracle/goldens/class/port-backlog.json` (shrink, or delete)
- `tests/oracle/**` — only the reference to that file, and only if it is
  being deleted
- `plans/si17-class-row-ports/decision-journal.md`

## Read-set

- `scripts/dot-sync-report.ts` — how the gate reports.
- `oracle/goldens/class/port-backlog.json:1` — the `_doc`.
- `../decisions.md#adr-6` — the arithmetic of the exit bar, including why
  710/711 is this mission's honest ceiling.

## Architecture decisions in force

[ADR-6](../decisions.md) — and read its consequences paragraph before
writing any number down. `688 EQUAL + 23 non-EQUAL` is the real breakdown;
the 7 oracle-blind are already inside the 688 and are not a debt.

## Interface contract — consumed by batch-2

```jsonc
{
  "flipped": ["slug"],
  "residual": [ { "slug": "string", "mechanism": "string", "javaRef": "file:line" } ],
  "classDotEqual": 0
}
```

## Acceptance criteria

- Given the port-aware gate, when re-run, then every flipped slug is gone
  from the backlog in this same commit.
- Given a slug that did not flip, then the journal names its mechanism and a
  `file:line`, and a batch-2 B-item exists for it.
- Given the backlog is empty, then the file is deleted and no test still
  references it.
- Given the gate reports 710/711, then the journal states plainly that
  `besepi-37-rori892` is the single outstanding cause and that it belongs to
  object-close B33 — **not** that the bar was met.

## Observability requirements

This task *is* the measurement. Record the full gate breakdown, not just the
EQUAL count.

## Rollback

**Reversible.** Data and docs only.

## Quality bar

Four gates green, unpiped. No slug added to the backlog under any
circumstance — an addition means T2 caused collateral damage, which is a
stop condition.

## Boundaries

- **Always:** delete a pin in the same commit as the fix that earned it.
- **Ask first:** anything that would change the gate's own logic.
- **Never:** add a slug; relax `portOk`; report a bar as met when it is not.

## Commit format

```
chore(T3): shrink the class port backlog to what the mechanism closed
```
