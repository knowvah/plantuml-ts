# Batch 5 — Composition descriptors (CONDITIONAL — ADR-2)

**Gate: run this batch only if BOTH hold.**

1. T2 found **≥4 distinct composition kinds** across the 36 symbols, and
2. Batch 4 added **≥2 new symbol tables** to `leaf-sizing-consts.ts`.

If either fails: SKIP, and record in `decision-journal.md` why the
descriptor refactor was not justified. ADR-2 exists precisely to stop the
shape being chosen before the cases are counted — five parallel tables is
how that already went once.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T_last | Unify per-symbol geometry into one descriptor | refactoring-specialist | `src/diagrams/description/leaf-sizing-consts.ts`, `leaf-sizing.ts` | Batch 4 | [ ] |

## Task sketch

Replace the parallel tables (`SYMBOL_BOX_MARGIN`, `SYMBOL_ICON_ALLOWANCE`,
`FOLDER_FAMILY_SHOW_TITLE`, `SIMPLE_SYMBOL_DRAWING`,
`INTERFACE_CIRCLE_SIZE`, + whatever Batch 4 added) with ONE descriptor per
symbol:

```ts
{ kind: 'box' | 'stacked' | 'folder' | 'ellipse' | 'hideText',
  margin?: readonly [number, number],
  icon?: readonly [number, number],
  drawing?: readonly [number, number] }
```

mirroring upstream's own class hierarchy, so `measureLeafNode` dispatches
on `kind` instead of on which table a symbol happens to appear in.

## Acceptance criteria

- Given every symbol, then it has exactly ONE descriptor and the parallel
  tables are gone
- Given the full suite, then conformant is UNCHANGED and `widened` is 0 —
  this is a pure refactor, and any movement means it changed behaviour
- Given `dot-sync-report.ts`, then 262 / 90 / 708 EQUAL is unchanged
- Given ADR-1's coverage test, then it still passes against
  `planning/usymbol-composition.md`

## Rollback

Reversible. Behaviour-preserving by construction — if the numbers move,
revert rather than re-baseline.
