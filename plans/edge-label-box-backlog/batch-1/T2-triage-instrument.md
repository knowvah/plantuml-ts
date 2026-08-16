# T2 — Backlog triage instrument

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML. This mission works
a backlog of **50 pinned goldens** across four
`oracle/goldens/*/label-size-backlog.json` files, each failing only the DOT
gate's `labelSizeOk` check.

Today the only way to see a slug's mismatched boxes is
`npx jiti scripts/dot-sync-report.ts --slug <slug> <type>`, which prints two
full DOT graphs and leaves you to diff them by eye. That is fine once. It is
not fine fifty times, and it cannot answer the question the exit bar asks:
*how many slugs per mechanism, and which are now clearable?*

**This is harness, not diagram behavior.** The project's "long tail is the
deliverable" rule explicitly does **not** apply here — YAGNI does. Keep it thin.

## Task

Write `scripts/label-box-triage.ts`: for every slug in the four backlog files,
compare our emitted edge-label boxes against the oracle's and print each
mismatch as one line, grouped by slug and by box kind.

Reuse the existing comparator rather than reimplementing it — `sortedLabelBoxes`
and the structural compare already exist in `tests/oracle/svek-dot.ts`, and
`scripts/dot-sync-report.ts` shows how a slug is located and its oracle DOT
loaded.

Suggested output shape (adjust to what is actually readable):

```
class/camuna-58-veca254
  headlabel  oracle=23x10   ours=31x13
  headlabel  oracle=41x20   ours=71x13
class/lozego-15-coci435
  label      oracle=137x135 ours=33x15
class/bitove-03-sanu160   CLEARABLE
```

End with a per-type count and a total.

## Write-set

- `scripts/label-box-triage.ts`
- `tests/unit/scripts/label-box-triage.test.ts`

## Read-set

- `scripts/dot-sync-report.ts:350-380` — `--slug` drill-down: fixture lookup,
  oracle DOT loading, rebuild handling
- `scripts/dot-sync-drilldown.ts:19-33` — the `CHECKS` list
- `tests/oracle/svek-dot.ts` — `sortedLabelBoxes`, `parseEdges`,
  `compareStructural`
- `tests/oracle/dot-parity-backlogs.ts` — the backlog file contract
- `oracle/goldens/class/label-size-backlog.json` — the `_doc` field explains
  the contract in full

## Acceptance criteria

- **Given** the four backlog files, **when** the script runs, **then** it
  prints every mismatched box per slug as `kind oracle=WxH ours=WxH`.
- **Given** a slug whose boxes now match, **when** the script runs, **then**
  it is reported `CLEARABLE` rather than silently omitted.
- **Given** the run completes, **then** it prints a per-type and total count.
- **Given** the script, **when** the suite runs, **then** its unit test covers
  the mismatch-formatting and clearable-detection paths without shelling out
  to the jar.

## Quality bar

All four gates. The script is a dev instrument — it must not be imported from
`src/`, and it may use Node built-ins (it lives in `scripts/`, not `src/`).

## Observability

This task **is** observability infrastructure. Its output is the signal every
later task reads to decide what cleared.

## Rollback

**Reversible** — additive, no consumers in `src/`.

## Boundaries

- **Always:** reuse `tests/oracle/svek-dot.ts`'s comparator.
- **Never:** modify the comparator, the backlog contract, or any backlog JSON
  from this task. Read-only against all of them.
- **Never:** gold-plate. No flags, filters, or output formats beyond what the
  acceptance criteria name.

## Commit

`test(T2): label-box-triage — per-slug backlog mismatch report`
