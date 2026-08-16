# Batch 4 — shared module: note-merge arm

One task, alone, for the same reason Batch 2 was: it owns
`src/core/edge-label-box.ts`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | `mergeLR`/`mergeTB` + shield + half-width | `typescript-pro` | `src/core/edge-label-box.ts`, `tests/unit/core/edge-label-box.test.ts` | — | [ ] |

No dependency on Batches 2–3: the merge arm is independent of the quantifier
arm. It is sequenced after them only because of the shared file.

**Batch exit:** all four gates; `shape-match-report` shows **zero** fixtures
moved — the merge function has no caller until T9/T10. Existing label-arm and
quantifier-arm tests pass unchanged.

## Watch-out — the part most likely to be guessed

D2 requires deriving the merge arithmetic from `TextBlockUtils.mergeLR`/
`mergeTB`'s own `calculateDimension` bodies. "mergeLR sums widths and maxes
heights" is the obvious guess and it may well be right — but a guess that
happens to be correct is still a guess, and this file has already been the
site of one wrong-by-inference constant. Open the Java.

The note side is **not** a text measurement. `EntityImageNoteLink` is a
decorated note image with padding, a border, and on `lozego-15-coci435` a
sprite. Its dimension comes from the existing note sizer.
