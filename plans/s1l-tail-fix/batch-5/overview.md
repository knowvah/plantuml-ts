# Batch 5 — G13 deterministic golden regen sweep

One task, run **alone**. Closes G13 (`kokebo-27-vafi688`). **+1 → 347.**

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [F5-a](F5-a-golden-regen-sweep.md) | Regen-and-diff sweep of all 351 description goldens under `PLANTUML_DETERMINISTIC_TEXT`; classify each diff; replace bad captures | typescript-pro | `oracle/goldens/description/**` (golden `.dot` files only) | Batch 1, Batch 2, Batch 3, Batch 4 (ALL) | [ ] |

## Why F5-a runs alone

Every prior batch scoped its write-set to a handful of `src/` files plus its
own fixtures' pins. F5-a is structurally different: it re-measures and
potentially rewrites **the entire golden tree** — all 351 fixture
directories, not just the ones a mechanism touches. There is no file-set to
partition against a sibling task, and running it beside any `src/`-writing
task would make its diff classification (§ three-way test in F5-a) meaningless
— a golden could "fail to match our port" for the trivial reason that the
port changed mid-sweep, not because the capture was bad. Batches 1–4 must be
fully landed and gated green before F5-a starts.

## Fixtures closed

| Fixture | Mechanism | Corrected target |
|---|---|---|
| `kokebo-27-vafi688` | golden captured without `PLANTUML_DETERMINISTIC_TEXT` (G13) — not a port defect | delta → 0 once regenerated |

The sweep additionally covers the other 350 goldens on the chance any of
them share the same capture defect (SYNTHESIS §1 row G13; the diagnosis only
checked 9 of 351, of which 8 were clean). Any additional fixture the sweep
closes is a bonus beyond the ledgered +1 — report it, but the mission's
running-total commitment is `kokebo-27-vafi688` only.

**Running total after this batch is `346 or 347`, not always 347** — Batch
4's F4-c gain is conditional on the `fariba-82` residual diagnosis (README,
SYNTHESIS §4). F5-a adds exactly `+1` to whatever count Batch 4 actually
landed at.

## Quality gates (F5-a's own, run before finishing — see task file for why
these differ from every prior batch's set)

```sh
npm test              # vitest — must stay green
npm run typecheck     # tsc --noEmit, both tsconfigs
npm run lint           # eslint src tests demo
npm run build          # vite library build
npx tsx scripts/measure-description-size-deltas.ts     # widened 0; count RISES
npx tsx scripts/audit-size-metric-identity.ts          # falseConformant: 0
```

Never pipe a gate — capture `$?` directly. `widened > 0` is a stop condition,
same as every other batch. F5-a additionally requires
`audit-size-metric-identity.ts`'s `falseConformant` to stay exactly 0 after
the sweep — a regenerated golden that introduced a permutation (identity-free
metric blind spot, SYNTHESIS §6) would show up there and nowhere else.

## Orchestration reminders (see README + decisions.md)

- No task writes `oracle/goldens/description/size-backlog.json` (ADR-1). F5-a
  reports the pins it closed; the orchestrator deletes them after this
  batch's gates pass — same rule as every prior batch, even though F5-a is a
  batch of one.
- No agent runs a state-mutating git command. The orchestrator commits once
  this batch's gates pass.
- One commit: `test(F5-a): regen-sweep description goldens under
  PLANTUML_DETERMINISTIC_TEXT`.
- ADR-8's boundary applies in full: this batch does not touch
  `tests/oracle/svek-dot.ts`'s gate and does not re-base
  `size-backlog.json` pins. See the task file for the full boundary.
