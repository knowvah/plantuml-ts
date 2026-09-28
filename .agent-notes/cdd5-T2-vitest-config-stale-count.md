## Observation: `tools/vitest.config.mts`'s own doc comment says "three" test files
- **Context**: cdd5-T2 (ratchet `tree` field + `pin-goldens --tree`) fixed the
  identical stale count in `tools/README.md` ("exactly the three `*.test.mts`
  files" -> four), which was in T2's declared write-set.
  `plans/class-divergence-drive/tools/vitest.config.mts` carries the same
  claim in its own header comment ("collects exactly the three files here")
  and is NOT in T2's write-set, so it was left untouched.
- **Finding**: `ls plans/class-divergence-drive/tools/*.test.mts` returns
  four files (`pin-diff`, `pin-goldens`, `render-all`, `render-diff` — T4
  added the latter two), not three.
- **Impact**: cosmetic only (the `include: ['**/*.test.mts']` glob itself is
  unaffected by the count in the comment), but the next task touching this
  file should bump "three" to "four" in the same edit.
- **Confidence**: High.
