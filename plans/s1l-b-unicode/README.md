# Mission: S1L-b-unicode — codepoint / quoted-title / emoji display sizing

The `$var`/emoji/unicode follow-on to S1L-b (display-text expansion, merged
`311053f`). Make description leaf boxes size correctly when their display
carries **unicode codepoint escapes** (`<U+XXXX>`, `&#NNN;`), a **literal
quoted title**, or **emoji/wide glyphs** — flipping what is portable and
naming (pinning) what is not.

## Objective

Three "emoji-unicode" fixtures are mis-sized: `gafico-37-cuma657` (Δ5.68in),
`nujito-06-neca370` (Δ3.35in), `lurupu-11-fubo915` (Δ2.05in). The dominant
errors split into one clean fix and two risky/residual factors — this is a
**"clean decode-ordering fix + scoped quoted-title investigation + documented
residuals"** mission, NOT "flip all 3 conformant" (see `decisions.md`).

## Realistic outcome (agreed at planning)

- **Heights** fixed by the decode-ordering fix (T1) — solid.
- **Widths** (quoted-title literalness, emoji glyph width) are risky or
  residual — expect some to be **pinned + named**, not conformant. That is a
  success per this mission's scope, not a failure.

## Status

- [x] Batch 1 — Decode-ordering: codepoint escapes decode per-line (T1)
- [ ] Batch 2 — Quoted-title literalness: scoped fix or document (T2)
- [ ] Batch 3 — Emoji width (T3) + accounting close (T4)

## Startup (read in this order)

1. This README.
2. `decision-journal.md` (may hold entries from before a compaction).
3. `decisions.md` — the 4 ADRs + the RESOLVED upstream rules (locked).
4. The current batch's `batch-N/overview.md`, then each `TN-*.md` on demand.
5. `diagrams/data-flow.md` — the decode/split pipeline, before/after.

## Prior context to reuse

The just-merged **S1L-b-display** mission (`plans/s1l-b-display/`, its
`decision-journal.md`) touched every file this mission touches:
`leaf-sizing.ts` (creole-aware width + HR height), `finalizeDisplay`
(`parse-helpers-strings.ts`), `EntityImageDescriptionSupport.ts#buildTextBlock`.
Read its decision journal for the T1 root-cause pattern (a dropped upstream
line) and the sizer↔renderer sync invariant.

## Quality gates (run between batches; all must pass)

```
- command: npx tsx scripts/measure-description-size-deltas.ts
  pass: exit 0 (zero `widened`); prints conformant %
  on_fail: fix_and_rerun
- command: npx tsx scripts/dot-sync-report.ts component usecase
  pass: structural EQUAL stays 262/262 and 90/90
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

- T1 lands the decode-ordering fix, output-neutral for every existing golden
  (structure EQUAL, zero widened); `<U+000A>` sizes inline, `\n` still splits;
  the 3 fixtures' HEIGHT components improve (pins shrink).
- T2 either narrowly fixes the quoted-title literal behavior (with regression
  guards) or documents it as a named residual — no other quoted-label fixture
  regresses.
- T3 either closes lurupu's emoji width cheaply or documents it as a residual.
- Every remaining non-conformant fixture is a named `size-backlog.json` entry;
  `ledger.md` + `planning/mission-index.md` reflect the new conformant % and
  residuals. Full gate green.

## Constraints (stop / push-forward)

**STOP and ask when:** a change to `finalizeDisplay`/`resolveTextEscapes` moves
any class-diagram or non-target golden (shared-decoder blast radius); the
quoted-title fix would touch >3 files or risk other quoted-label fixtures; 2
consecutive gate failures on the same check; structure moves off 262/262+90/90;
an ADR is contradicted.
**PUSH FORWARD when:** a fixture lands as a documented residual (expected per
scope); a purely-mechanical per-line decode refactor; choosing exact pin values.

## Standing constraints (this repo)

- Faithful Java→TS port — mirror upstream architecture and names; no
  refactor-while-porting (see root `CLAUDE.md`).
- Complexity hook: files ≤500 lines; fns ≤30 NLOC / ≤10 CCN / ≤5 params.
- Every non-conformant fixture must be a named `size-backlog.json` entry
  ("100% minus known divergences").
- Out of scope: S1L-e container/cluster, S1L-f sprite/stdlib-macro, LaTeX
  divergence, and the class-diagram note path (`class/note-layout-measure.ts`
  shares the same latent decode-before-split bug — a SEPARATE follow-on).
