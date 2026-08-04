# Mission SI13 — authored-fixture registration for the CLASS corpus

**Objective.** Close the structural hole SI10's T3 named: an authored
fixture under `oracle/goldens/svg-class/<slug>/` cannot obtain a
`parity-class.json` entry, so the class ratchet's DOT-EQUAL eligibility
condition (AC3) is unsatisfiable for it — CLAUDE.md's "author fixtures to
cover gaps" doctrine supports authoring but not registration, exactly the
hole SI9 closed for the description corpus. Deliverable is the
**registration path**; whether any of the five existing authored fixtures
actually ratchets in is measured, not assumed (none is zero-diff today).

**Branch.** `feature/si13-class-authored-registration` from `main`
(`e3ecce12`). Merge back `--no-ff`.

## Batches

| Batch | Tasks | Status |
|-------|-------|--------|
| [batch-1](batch-1/overview.md) | [ ] T1 class golden layout in `dot-sync-fixtures.ts` | pending |
| [batch-2](batch-2/overview.md) | [ ] T2 pipeline run, parity regen, drift report, eligibility | pending |
| [batch-3](batch-3/overview.md) | [ ] T3 docs + close-out | pending |

## Docs

- [decisions.md](decisions.md) — ADR-1..4 (locked)
- [diagrams/data-flow.md](diagrams/data-flow.md) — the registration chain
- [decision-journal.md](decision-journal.md) — append during execution

## Quality Gates (between every batch)

```
- command: npm test
  pass: exit 0 (baseline 478 files / 11,444 tests; check the REAL exit
        code, not a pipe's)
  on_fail: fix_and_rerun
- command: npm run typecheck && npm run lint && npm run build
  pass: exit 0 each
  on_fail: fix_and_rerun
- command: git diff --name-only <batch base>
  pass: only files in the batch's declared write-sets
  on_fail: stop
```

Size-deltas/vendor gates are unaffected by this mission (scripts + test
data only) — run once before final close as a cheap regression guard.
Cold-tree double run before final close per `verify-gates-on-a-cold-tree`.

## Constraints

**Stop conditions (escalate, never self-approve):**
1. A file outside every task's declared write-set needs changes (the
   own-unreviewed-brief precedent from SI15 applies only to mechanical
   test-expectation fallout; anything else stops).
2. Two consecutive failures on the same gate.
3. An implementation step contradicts an ADR.
4. Parity regeneration shows ANY `dotEqual` true→false flip or ANY verdict
   downgrade (conformant → structural-match/diverged, or structural-match
   → diverged) on a pre-existing row (ADR-2).
5. The oracle jar batch behaves unexpectedly (welcome page, errors,
   nondeterminism between two runs).
6. `dot-sync-report class` silently skips any authored slug (the SI9 ADR-2
   hazard reappearing in the class path) and the per-slug freshness fix
   does not cover it.

**Push-forward (decide and journal):**
- Verdict upgrades and delta shrinks on pre-existing parity rows — the
  expected fruit of SI14/SI15; journal the full breakdown (SI9 precedent:
  moved-row counts, flips, transitions), then proceed.
- Whether each authored fixture ratchets in follows measurement.
- Doc-comment corrections adjacent to edited code.

**Orchestration:** agents NEVER run git mutations; probes/scratch in the
session scratchpad, never `tests/`; Serena MCP tools for navigation;
`npm run typecheck` is the type authority. Long jar/survey runs happen in
batch 2 under the orchestrator with `SVG_PARITY_CONCURRENCY=2`.
