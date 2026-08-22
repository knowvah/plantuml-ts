# T4 — applying T2's `catalog.test.ts` diagnosis (mission: test-budget-invariant)

T2's recommendation (`.agent-notes/tbi-T2.md`): `"no-change"`. Applied exactly
as given — no number invented, none adjusted.

## What was applied

- `tests/architecture/catalog.test.ts` — added a comment above the
  `describe` block's first `it`, stating the mechanism (CPU-bound
  `buildCatalog()` racing vitest's unconfigured 5,000ms default, no lock
  involved), the two operating-limit regimes (single `npm test`: reliable,
  ~12x headroom; concurrent-pair `npm test`: reliable in the large majority
  of cases, intermittent scheduling-collision failure otherwise), and why no
  budget number was set. Cites `.agent-notes/tbi-T2.md` for the full
  artifact.
- No functional/code change. No `testTimeout` added to either test. No
  `vitest.config.ts` edit. No `src/` edit.

## Write-set honored

Only `tests/architecture/catalog.test.ts` (comment) and this note.
`tests/architecture/stdlib-lock-test-budget.test.ts` and
`tests/architecture/stdlib-read-lock.test.ts` not touched. No git write
command run (orchestrator commits).
