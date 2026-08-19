# T4 — Class engine consumers

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch `feat/creole-exposant-port`.
Class measures member text via `class-member-creole.ts` (`:210` builds the
FontConfiguration, `:239`, `:318` read `font.size`) and `leaf-sizing-text.ts`
(T3 now returns per-atom `{size, dy}` + Sea line height — read T3's journal
row for the shape); it draws members per atom in `renderer-classifier-rows.ts:
236-270` (`fontSize: atom.font.size`) and notes in `renderer-note.ts:250-280`
(`y = lineTop + lineHeight − atom.font.size/4.5`), sized by
`note-layout-measure-rows.ts`. Read `decisions.md` D1/D3/D7,
`planning/sizer-renderer-parity.md`, CLAUDE.md.

## Task
1. Members: measure with `getFont(atom.font).size` and T3's `dy`; draw each
   atom with `fontSize = getFont(...).size` and `y += dy` (the SAME numbers
   the sizer used).
2. Notes: same via `note-layout-measure-rows.ts` / `renderer-note.ts` (keep
   the existing descent formula where the port already uses `size/4.5` — but
   with the muted size; cite `AtomText.java:213-215`).
3. Ratchets/goldens for T0's class fixture; DOT-parity class count unchanged
   or better; run the parity audit checklist and answer it in the report.
TDD: paired measure/render tests with the class fixture's `in.puml`.

## Write-set
As in the batch overview. If `class-body-enhanced-*.ts` also needs the change
(a second class text path), STOP and report which file before editing.

## Read-set
T3 journal row; the four files above (cited ranges + whole where < 300
lines); `oracle/goldens/class/<slug>/`; Java `AtomText.java:197-233`.

## Acceptance
- Given a member `x<sup>2</sup>`, then measured width uses size 9 (font 12) and the drawn `<text>` has `font-size="9"` and the Sea `dy` (paired test).
- Given the class fixture, then declared sizes match `svek-N.dot`; DOT-parity class ≥ 720; backlog pin removed.
- Given a class note with `<sub>`, then measure and render use the same runs (paired test).
- Given `render-manifest`, then only the class fixture moves; `harness-diff.py` clean.

## Observability / Rollback
Class parity + svg goldens. Reversible.

## Report (≤400 tokens)
Files, rows, parity-audit answers, manifest moves.
