# T11 — generic tag cardinality style

**Agent:** typescript-pro (sonnet) · **Depends on:** T0 · wave 1, parallel with T7, T9 (worktrees).
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

camuna-58-veca254, nafiki-56-jixu680 (their flat-edge lines are dot-engine issue 19 — expected to remain)

## Mechanisms

Read `plans/class-divergence-drive-2/.agent-notes/cdd2-T13.md` (Q-4, Q-5).
- **Q-4**: `renderGenericTag` (`renderer-classifier-badge-tag.ts:195-225`)
  hardcodes the fill and border; upstream resolves
  `{root,element,classDiagram,class_,generic}`
  (`svek/image/EntityImageClassHeader.java:138-149`; defaults
  `plantuml.skin:211-213`). cdd2 verified with four authored jar probes
  (`/tmp/cdd2-T13-oracle/gen-{a..d}.puml` — regenerate with
  `scripts/oracle-render.sh` if gone). Needs a `Theme.colors.graph` field
  and a cascade call; a skinparam `classBackgroundColor` must count as
  explicitly set.
- **Q-5**: the drawn cardinality `font-size` is the hard-coded
  `CARDINALITY_FONT_SIZE` (`renderer-edge-extras.ts:222`) and FontStyle has
  no field (`theme.ts`); size/colour already cascade into
  `theme.cardinalityFont*`. Upstream merges
  `{root,element,classDiagram,arrow,cardinality}`
  (`svek/GraphvizImageBuilder.java:124-131,235-241`). Also the ink walk's
  text height (`class-ink-box.ts` `addEdgeTextInk`) uses the same constant.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/core/theme-graph-colors-a.ts`, `src/core/theme.ts`, `src/core/style-cascade-class.ts`, `src/core/style-cascade-class-snames.ts`, `src/core/style-cascade-class-font.ts`, `src/diagrams/class/renderer-classifier-badge-tag.ts`, `renderer-edge-extras.ts`; tests beside each; `.agent-notes/cdd3-T11.md`.

## Interface contracts

- None consumed by other tasks (T10 later reads `renderer-edge-extras.ts` on the merged tree).

## Acceptance criteria

- Given camuna and nafiki, when rendered, then their 8/9 structural fill + font diffs are 0
- Given a `<style>` generic/cardinality override, when its unit test runs, then it asserts the jar's value citing the Java line
- Given every non-class engine using the touched `src/core/` files, when surveyed vs `/tmp/cdd3-b0-eng/`, then movers ≤ 20, each explained

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
