# Batch 1 — instrument and header sizing (all parallel)

Three disjoint write-sets, no inter-task dependencies. Each runs in its own worktree (`dsw/T1a`,
`dsw/T1b`, `dsw/T1c`) off the mission branch after T0. Close per [../close-procedure.md](../close-procedure.md);
at this close the survey diff should show **no** verdict movers, since nothing in `src/` that
renders changes (T1c is a new, unused module).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1a | layoutParity module (D1, D2) | typescript-pro (sonnet) | `tests/oracle/layout-parity.ts`, `tests/unit/oracle/layout-parity.test.ts` | T0 | [x] |
| T1b | Tighten `compareStructural` (D4) | typescript-pro (sonnet) | `tests/oracle/svek-dot.ts`, its unit test file(s) | T0 | [x] |
| T1c | Description DOT-side `ClusterHeader` sizing (D5) | typescript-pro (sonnet) | `src/diagrams/description/description-cluster-header.ts`, `tests/unit/description/description-cluster-header.test.ts`, `docs/catalog.md` | T0 | [x] |
| T1d | State wrappers at any font size; gopudo title width (added by ruling, journal 14) | typescript-pro (sonnet) | `src/diagrams/state/**`, `tests/unit/state/**`, state pins (tighten only) | T1b | [x] |

**Ruling 2026-10-14 (journal 14):** T1b and T1d are held unmerged at the b1 close and merge at the
b2 close, after T3, so the description dot-parity ratchet is measured with wrappers in place.

Interface outputs consumed later:
- T1a → T2, T3, T4, T8: `layoutParity(jarSvekDot: string, ours: DotInputGraph): LayoutParityResult`
- T1b → T5: `StructuralCluster.wrapperChain`, `.titleTable`
- T1c → T3, T4: `descriptionClusterTitleTable(...)`
