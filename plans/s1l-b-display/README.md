# Mission: S1L-b — description display-text expansion

Complete the description leaf-box display pipeline so `[ … ]` element bodies are
**parsed, sized, and rendered** correctly — closing the S1L-b sub-mission and
flipping a batch of description fixtures to size-`conformant`.

## Why

PlantUML's `component c [ multi\nline body ]` puts the `[ … ]` text inside the
box as its label. The port **discarded** that body (a deliberate shortcut from
when node sizes were tolerant), so those boxes size and render as the bare
element code. Now that S1L asserts node sizes, the discard is a bug: ~18
fixtures size wrong; the `dexigu/kenece/zifaji` trio is otherwise pixel-perfect.

Making the body reach the sizer is easy; making it reach the **renderer**
exposes that creole horizontal rules (`====`/`----`) crash `LimitFinder`
(`unsupported shape UHorizontalLine`) — the crux of this mission.

## Status

- [x] Batch 1 — Core (render-HR wiring, parser body, sizer, backlog re-baseline)
- [x] Batch 2 — Last fixtures (scoped-style MinimumWidth, fariba diagnosis)
- [ ] Batch 3 — Close (re-measure, ledger, mission-index)

## Startup (read in this order)

1. This README.
2. `decision-journal.md` (may hold entries from before a compaction).
3. `decisions.md` — the 5 ADRs (locked).
4. The current batch's `batch-N/overview.md`, then each `TN-*.md` on demand.

## Prior work to reuse

Branch **`feat/s1l-b-display-expansion`** holds correct WIP: the parser body
accumulation (T2 is ~done there — reuse it) and a *regex* creole strip in the
sizer (T3 **replaces** that with the creole lexer per ADR-2). Cherry-pick /
port the parser; re-derive the sizer. `git show feat/s1l-b-display-expansion`.

## Quality gates (run between batches; all must pass)

```
- command: npx tsx scripts/measure-description-size-deltas.ts
  pass: exit 0 (zero `widened`); prints conformant %
  on_fail: fix_and_rerun
- command: npx tsx scripts/dot-sync-report.ts component usecase
  pass: structural EQUAL stays 262/262 (+1 oracle-blind) and 90/90
  on_fail: stop        # sizing/rendering must never move structure
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0 (all pass; no error diagrams in the parity ratchet)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
```

## Definition of done

- `dexigu-24`, `kenece-24`, `zifaji-87` size-conformant (maxSizeDeltaIn 0),
  their `size-backlog.json` entries deleted.
- No fixture renders a PlantUML error diagram (the 6 HR-body fixtures render).
- Structure stays 100% EQUAL; full suite + typecheck + lint + build green.
- `zotiru-33` conformant (or pin shrunk, `MinimumWidth` wired); `fariba-82`
  conformant or documented + pinned.
- `plans/s1l-leaf-sizing/ledger.md` + `planning/mission-index.md` updated with
  the new conformant % and any named residual.

## Standing constraints (this repo)

- Faithful Java→TS port — mirror upstream architecture and names; no
  refactor-while-porting (see root `CLAUDE.md`).
- Complexity hook: files ≤500 lines; fns ≤30 NLOC / ≤10 CCN / ≤5 params.
- Every non-conformant fixture must be a named `size-backlog.json` entry (the
  "100% minus known divergences" rule).
- Out of scope: S1L-e container/cluster sizing, S1L-f sprite/stdlib-macro,
  the LaTeX divergence.
