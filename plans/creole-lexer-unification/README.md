# Mission: creole-lexer-unification — one visible-text path for sizer + renderer

The follow-on surfaced by **S1L-b-unicode** (merged `fd071cb`). The description
leaf **sizer** and **renderer** run two different creole lexers that disagree on
which tags are glyphs vs. markup — so a leaf's DOT box is measured wider than the
ink the renderer actually draws.

## Objective

Make the sizer strip exactly the tags the renderer strips, by routing both
through **one shared "line → visible atoms" helper**. Width-focused, spike-first:
prove the corpus is net-positive before editing production, then re-baseline.

## The bug (confirmed, S1L-b-unicode T3)

- SIZER: `leaf-sizing.ts#creoleVisibleText` → `parseCreole` (`core/creole.ts`) —
  leaves an **unclosed `<b>`**, and `<u:blue>` / `<color:green>` / `<font Name>`
  tags **literal** (measured as glyph text).
- RENDERER: `EntityImageDescriptionSupport.ts#buildLine` → `buildStripeAtoms`
  (E2r `StripeSimple`) — **strips** them.
- Result on node `bar` of lurupu-11: sizer measures 53 codepoints (~333px),
  renderer draws 22 (~147px == oracle). (Original brief claimed the same root
  drives gafico/nujito nodes a+b — T1 DISPROVED this; see Realistic outcome.)

## Realistic outcome (REVISED after T1 spike — 2026-07-27)

- lurupu-11 (node bar) **shrinks** −197px toward the oracle — the confirmed win.
- **gafico-37 / nujito-06 are OUT of scope for this mission** (re-scoped after
  T1). The spike proved they measure NEUTRAL under the lexer switch: their
  `<color:green>`/`<u:blue>` tags sit adjacent to a decoded `<U+000A>`/`\n`
  where `buildStripeAtoms`'s command scanner ALSO leaves them literal — both
  lexers AGREE, so the two-lexer-disagreement fix does not touch them. Their
  real divergence (a newline-adjacency command-scan gap and the node-`c`
  `<code>` residual) is a SEPARATE, deferred mission. The brief's original
  premise "same root drives gafico/nujito nodes a+b" was wrong.
- Some non-target fixtures may shift; **net-positive is required** (Task 1 gate,
  now passed: 28 shrink / 319 neutral / 1 widen). The one widen
  (`fepuvo-06-rugi981`, +0.258in, already pinned 2.889in) is verified against
  its oracle pin in Batch 3 — re-STOP only if it exceeds the pin.

## Status

- [x] Batch 1 — Spike: measure corpus impact of the lexer switch (T1, GATE) — DONE; gate = STOP-and-ask (2 deviations, see decision-journal)
- [x] Batch 2 — Unify: shared visible-atoms helper; rewire sizer + renderer (T2) — DONE; lurupu-11 conformant, renderer byte-identical
- [x] Batch 3 — Re-baseline + accounting (T3), SCOPE-EXPANDED (user): faithful URL cannot-decode text (creole-atoms) + fixed pre-existing `component [body] as alias` parser leak; pebace-74 + togeke-15 now conformant. 236→239/351 (68.1%), zero widened, 262/262+90/90

## Startup (read in this order)

1. This README.
2. `decision-journal.md` (may hold entries from before a compaction).
3. `decisions.md` — the 4 ADRs (locked).
4. The current batch's `batch-N/overview.md`, then each `TN-*.md` on demand.
5. `diagrams/component-map.md` — the two-lexer topology, before/after.

## Prior context to reuse

- `plans/s1l-b-unicode/` (its `decision-journal.md` + `plans/s1l-leaf-sizing/
  ledger.md` S1L-b-unicode T3) — the diagnosis that found this bug, incl. the
  exact probes (`parseCreole` vs `buildStripeAtoms` on node `bar`).
- The sizer↔renderer sync invariant (S1L-b-display; S1L-b-unicode T1) — the same
  class of bug this mission closes at its source.

## Quality gates (run between batches; all must pass)

```
- command: npx tsx scripts/measure-description-size-deltas.ts
  pass: exit 0 (zero widened); prints conformant %
  on_fail: fix_and_rerun
- command: npx tsx scripts/dot-sync-report.ts component usecase
  pass: structural EQUAL stays 262/262 and 90/90
  on_fail: stop        # width/stripping must never move structure
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm test
  pass: exit 0 (all pass)
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
```

## Definition of done

- One shared visible-atoms helper; `creoleVisibleText` no longer calls
  `parseCreole`; `buildLine` calls the same helper (no behavior change to the
  renderer's own output).
- `measure` exit 0 (zero widened), structure EQUAL 262/262 + 90/90; lurupu-11
  and gafico/nujito nodes a+b shrink; every moved pin re-baselined.
- `parseCreole`'s OTHER callers (`annotations/blocks.ts`, `error-renderer.ts`)
  untouched and unaffected.
- ledger.md + mission-index.md reflect the new conformant % and retire the
  "sizer↔renderer creole visible-text unification" follow-on note.

## Constraints (stop / push-forward)

**STOP and ask when:** the Task 1 spike shows widespread NET widening (ADR-4);
any change moves structure off 262/262 + 90/90; a fixture that was NOT a target
widens; the fix appears to need changing `parseCreole`'s behavior for its other
callers (means scoped wrong); 2 consecutive gate failures on the same check; an
ADR is contradicted; the write-set must grow beyond the declared files.
**PUSH FORWARD when:** a fixture lands improved/conformant (delete its pin); a
mechanical re-pin; the shared-helper extraction/naming details; choosing exact
pin values.

## Standing constraints (this repo)

- Faithful Java→TS port — mirror upstream architecture/names; no
  refactor-while-porting beyond this scoped unification (see root `CLAUDE.md`).
- Complexity hook: files ≤500 lines; fns ≤30 NLOC / ≤10 CCN / ≤5 params.
  (`EntityImageDescriptionSupport.ts` is at 493 — the shared helper lands in
  `StripeSimple.ts`, not there.)
- Every non-conformant fixture stays a named `size-backlog.json` entry
  ("100% minus known divergences").
- Out of scope: the `<code>` block port (gafico/nujito node c); the deeper
  "sizer calls the renderer's `buildTextBlock.calculateDimension` wholesale"
  width+height unification; per-atom font-SIZE width parity (`<size:N>`,
  `==` heading runs).

## Mission summary (closed 2026-07-27)

**All 3 tasks complete.** Commits (on `feature/creole-lexer-unification`, ready
to merge — mission-branch merge-commit convention): T1 `7ffdd84`, T2 `d8975e1`,
T3 `7ea6e1f`.

- **T1 (spike/GATE):** disproved the brief's premise that gafico-37/nujito-06
  would shrink (both lexers agree on their newline-adjacent tags) → those two
  re-scoped OUT with user approval.
- **T2 (unify):** one shared `StripeSimple#buildLineAtoms`; renderer
  byte-identical; sizer dropped `parseCreole`. lurupu-11 → conformant.
- **T3 (scope-expanded ×2, user-approved):** faithful URL cannot-decode text
  (`creole-atoms.ts`) + fixed a pre-existing `component [body] as alias`
  parser-leak (`command-table-containers.ts`). pebace-74 + togeke-15 →
  conformant.

**Result:** conformant 236 → **239/351 (68.1%)**, zero widened, dot-sync
262/262 + 90/90, all tests green (10380), typecheck/lint/build green. Two
decision-checkpoints surfaced to the human (T1 gate, T2/T3 residuals); 3
scope-expansion decisions taken with approval. **Residuals filed:** nobiza-91
note cannot-decode font 13-vs-14; gafico-37/nujito-06 node-c `<code>` block
(deferred). See `decision-journal.md`.
