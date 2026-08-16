# Batch 2 — shared module: quantifier arm

One task. It owns `src/core/edge-label-box.ts` alone, because Batch 4 (T8) also
rewrites that file and the two must not interleave.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | `computeQuantifierBox` in the shared module | `typescript-pro` | `src/core/edge-label-box.ts`, `tests/unit/core/edge-label-box.test.ts` | T1 | [ ] |

**Depends on T1** for the resolved cardinality font. Check the journal for the
exact field names T1 settled on rather than guessing them.

**Batch exit:** all four gates green; `shape-match-report` shows **zero**
fixtures moved — the new function has no caller until T6/T7. Every existing
label-arm test still passes unchanged.

## Why this is its own batch

The quantifier arm and the note-merge arm (T8) both extend the same 105-line
file, and D1 makes that file the single home for all three upstream arms.
Serializing them costs one batch boundary and removes the only write conflict
in the mission.
