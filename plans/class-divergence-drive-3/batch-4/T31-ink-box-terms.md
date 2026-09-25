# T31 — Ink box: namespace title, cloud UPath, head quantifier, database/node UEmpty

**Agent:** typescript-pro (opus) · **Depends on:** T30 · wave A (worktree, ∥ T33, T34).
Prompt = [`fix-task.md`](../fix-task.md) + this file + the cited `diagnosis/` sections (read them in full).

## Fixtures

cocube-46-tusu692, pixexi-81-sete111, diroxo-41-zezo954, focaci-80-suzu938, givofi-11-xumu978, popesa-39-sobe866

## Mechanisms (leads — re-run each probe before editing; stop 13 if one does not reproduce)

- **E1-2 = E2-8** (`E1.md` § cocube, `E2.md` § pixexi): the ink box never includes the namespace title text (`LimitFinder.java:217-224`); a large title rises above the tab.
- **E1-5** (`E1.md` § diroxo): a `<<cloud>>` namespace's ink uses its plain rect; the jar uses the min/max of the cloud UPath including Bézier control points (`UPath.java:84-92`).
- **B-3** (`B.md` § focaci): the ink walk bounds raw-text `EdgeGeo.headLabel` (`"~* initiators"`, 61.1 px) instead of the drawn quantifier lines (53.46 px). Counterfactual probe: shift −1.7317, width 135 = jar.
- **C-8** (`C.md` § givofi/popesa): database/node leaf ink misses upstream's `UEmpty(10,10)` (canvas −10); node is MEDIUM (only +10 width measured).

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-ink-box.ts`, `class-ink-shapes.ts`, `class-geo-builders.ts`, `class-layout-leaf-shapes.ts`, `class-geo-geometry-types.ts` (NamespaceGeo title geometry); tests beside each; `.agent-notes/cdd3-T31.md` (under `plans/class-divergence-drive-3/`).

## Survey scope

class only (description leaves if C-8 reaches core USymbol ink: then survey component/usecase).

## Acceptance criteria

- Given cocube, pixexi, diroxo, focaci, when rendered, then 0/0
- Given the conformant set at the previous close, when render-all runs, then none leaves conformant
- Given every mover, when reported, then each has a mechanism (structural fall + numeric rise = reveal)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
