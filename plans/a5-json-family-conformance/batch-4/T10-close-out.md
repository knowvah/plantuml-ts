# T10 — divergence records and mission close-out

## Context

T9 attributed every remaining non-conformant fixture. This task writes those
attributions into the places a future reader will actually look: `DIVERGENCES.md`,
the goldens READMEs, and the mission index.

## Task

1. Add a `DIVERGENCES.md` entry for every mechanism T9 classed **DELIBERATE
   DIVERGENCE**, in the file's existing format (Upstream / This port / Reason /
   Affects), under the existing `## JSON diagrams` section or new `## YAML` /
   `## HCL` sections as appropriate.
2. Reconcile the two pre-existing json entries (array index keys, primitive
   root) against measurement. If either no longer describes what this port
   does, correct it in place and mark it — **follow the D14 precedent: a
   superseded entry is struck through and explained, never silently deleted.**
3. Write each `oracle/goldens/svg-{json,yaml,hcl}/README.md` to its final state:
   current conformance, why this family has no `parity-*.json` (ADR-3), the add
   rule, and the re-capture command.
4. Flip mission-index **A5** to `done` with its measured outcome.

## Read-set

- `plans/a5-json-family-conformance/ledger.md` — T9's output, the source for all
  of the above
- `DIVERGENCES.md` — the format, and its `## JSON diagrams` section
- `DIVERGENCES.md` `## DOT diagrams` — the D14 precedent for retiring a
  superseded entry with an explanation rather than deleting it
- `oracle/goldens/svg-dot/README.md` — the precedent for documenting a
  structural omission (no `parity-*.json`, no AC3)
- `planning/mission-index.md` rows A5, S2, D14 — the house style for a closed
  row: what was measured, what the premise got wrong, what carries forward

## Write-set

- `DIVERGENCES.md`
- `planning/mission-index.md`
- `oracle/goldens/svg-json/README.md`
- `oracle/goldens/svg-yaml/README.md`
- `oracle/goldens/svg-hcl/README.md`

## Architecture decisions (locked)

- **ADR-2:** if any divergence entry concerns geometry, it must state the
  measured delta and the mechanism. "Smetana differs from modern graphviz" is
  not an acceptable entry for this family.
- **ADR-3:** the goldens READMEs must explain the missing `parity-*.json`
  positively — the reason it cannot exist — rather than leaving its absence to
  be noticed.

## Interface contracts

Each new `DIVERGENCES.md` entry:

```markdown
### <short title> (<deliberate|limitation>)

**Upstream:** <what the jar does, with the Java file:line or a jar-verified
observation>

**This port:** <what we do>

**Reason:** <product reason — never effort>

**Affects:** <which inputs>
```

The A5 mission-index row states: before/after per type, pinned counts, the
ADR-1 verdict, and where the ledger lives.

## Acceptance criteria

1. **Given** every DELIBERATE DIVERGENCE mechanism in `ledger.md`, **then** each
   has a matching `DIVERGENCES.md` entry — counts match exactly.
2. **Given** the two pre-existing json entries, **then** each is either
   confirmed still accurate or corrected with its supersession explained.
3. **Given** each goldens README, **then** it states current conformance and why
   no `parity-*.json` exists.
4. **Given** mission-index A5, **then** it reads `done` with measured numbers,
   matching the house style of the D14 and S2 rows.
5. **Given** the whole repo, **then** cold-tree ×2 and all four gates are green.

## Observability requirements

N/A — documentation.

## Rollback

**Reversible.** Documentation only.

## Quality bar

- **The orchestrator must verify this task's output directly.** The
  `technical-writer` agent has no `Edit` or `Bash` tool and rewrites whole
  files: run `git diff --numstat` to confirm nothing outside the write-set moved
  and no file was truncated, then run the gates yourself. Do not accept the
  completion report as verification.
- Do not overstate the outcome. If a type did not reach the bar, the row says
  so, with the remaining count and where it is attributed.

## Boundaries

- **Always:** strike through and explain a superseded entry; never delete it.
- **Never:** claim a conformance number `ledger.md` does not support.
- **Never:** run `git commit` or any state-mutating git command.
