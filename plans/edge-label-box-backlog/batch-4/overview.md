# Batch 4 — note-merge arm, plus the D3 completion task

Two tasks, parallel, disjoint write-sets. T8 owns `src/core/edge-label-box.ts`
alone, for the same reason Batch 2 did. T14 owns engine wiring and touches
neither that file nor its test.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | `mergeLR`/`mergeTB` + shield + half-width | `typescript-pro` | `src/core/edge-label-box.ts`, `tests/unit/core/edge-label-box.test.ts` | — | [x] |
| T14 | Thread the cardinality cascade to both engines (D3 completion) | `typescript-pro` | `style-map-theme.ts`; class `dot-graph`/`dot-edges`/`layout-edge-labels`; description `layout`/`layout-dot-tree`/`link-edge-attrs`; class backlog | T1, T6, T7 | [x] |

T8 has no dependency on Batches 2–3: the merge arm is independent of the
quantifier arm. It is sequenced after them only because of the shared file.

## T14 — added mid-mission

**Added 2026-08-16 with maintainer approval**, after T6 and T7 both stopped on
the same write-set escape and left D3 half-delivered: T1's
`computeCardinalityFontOverride` had **zero callers**, and
`camuna-58-veca254` — M1's flagship fixture, named in the brief's own evidence
table — still failed on the font-size half of M1. Its `\n`-split half was
already fixed by T6.

It sits in this batch because its write-set is **disjoint from T8's**, and it
needs nothing from T8: T5's `computeQuantifierBox` takes the font as a
parameter, which is exactly what makes the two separable.

Later tasks sharing T14's files (T10 in batch 5; T11 and T12a–c in batch 6)
run strictly after it, so they rebase rather than collide.

**Batch exit:** all four gates. For **T8**, `shape-match-report` shows **zero**
fixtures moved — the merge function has no caller until T9/T10, and existing
label-arm and quantifier-arm tests pass unchanged. For **T14**, no fixture
**rises**; it may legitimately move fixtures, since it is the first task to let
a diagram's own `<style>` override reach a quantifier box.

## Watch-out — the part most likely to be guessed

D2 requires deriving the merge arithmetic from `TextBlockUtils.mergeLR`/
`mergeTB`'s own `calculateDimension` bodies. "mergeLR sums widths and maxes
heights" is the obvious guess and it may well be right — but a guess that
happens to be correct is still a guess, and this file has already been the
site of one wrong-by-inference constant. Open the Java.

The note side is **not** a text measurement. `EntityImageNoteLink` is a
decorated note image with padding, a border, and on `lozego-15-coci435` a
sprite. Its dimension comes from the existing note sizer.
