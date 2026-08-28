# Batch 2 — database: draw and size

Two tasks, parallel: disjoint write-sets, both depending only on T1.

They are the **two halves of one behavioural change** (D3, D5). T2 replaces
the hand-rolled cylinder; T3 replaces the fitted `DB_MIN_WIDTH` sizing rule.
Landing one without the other leaves the glyph and the column width
disagreeing — the recurring defect `planning/sizer-renderer-parity.md` names.
They are separate tasks only because they touch disjoint files; the shared
batch gate is what keeps them honest.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | Draw the database head through the seam | `typescript-pro` | `src/diagrams/sequence/renderer-participant-shapes.ts`, `src/diagrams/sequence/renderer.ts`, `tests/unit/sequence/renderer.test.ts` | T1 | [ ] |
| T3 | Size the database head from upstream's rule | `typescript-pro` | `src/diagrams/sequence/sequence-layout-participants.ts`, `tests/unit/sequence/layout.test.ts` | T1 | [ ] |

Batch gate: the four per-task gates, then
`npx jiti scripts/sequence-ratchet-adjudicate.ts --base <batch parent>`.

**Two invariants, both hard:**

1. Zero `regression` verdicts.
2. **`junaxa-14-biko373` closes** — its top-level child count reaches the
   golden's 41 with histogram `g 7, rect 6, ellipse 2, path 7, text 13,
   line 3, polygon 3`. If it does not, that is **stop condition 6**: the
   mechanism was wrong, and the answer is to re-derive the plan, not to patch
   the renderer until the number appears.

`fobube-11-nifo424` and `rugeco-70-muro754` must not rise (stop condition 7).
