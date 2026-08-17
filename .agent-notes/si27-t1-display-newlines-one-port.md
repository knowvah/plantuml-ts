# SI27 T1 — one `Display.getWithNewlines` port

## Observation: `state/layout.test.ts`'s multi-line-title cluster tests
hand-build an AST shape the real parser never produces

- **Context**: T1's full manifest run showed 0 unexpected diffs and
  `npm test` (excl. layering.test.ts) showed exactly 2 failing assertions,
  both in `tests/unit/state/layout.test.ts` (NOT in T1's write-set),
  describe block "cluster title table HEIGHT seam (G6 T2...)" —
  `titleTableHeight` expected 23/37, got 9, after swapping
  `state-composite-header.ts#measureClusterTitle` from the old
  `splitCreoleLines` (split on a REAL newline char, in addition to the
  literal `\n` token) to the new `splitDisplayLines` (matches
  `Display.java:262-346` exactly — a real newline is NOT a break, only
  the literal two-char token or a BLOCK_E1 sentinel is).
- **Finding**: the two failing tests construct
  `makeState('A', { display: 'line1\nline2', ... })` — a JS string
  literal where `\n` compiles to a REAL LF character. Direct probe of the
  real state parser (`src/diagrams/state/parser.ts`) against the actual
  corpus fixture these tests cite as their jar ground truth
  (`sosoxe-55-demi451`, `state A as "A on several lines\nwith\na lot of
  text"`) confirms the parser stores `state.display` with the LITERAL
  2-char `\n` sequence (backslash + `n`) intact, never a real newline
  character — `JSON.stringify(a.display)` returned
  `"A on several lines\\nwith\\na lot of text"` (i.e. `\\n` in the JSON
  escaping, meaning two literal source characters). The unit test's
  hand-built `'line1\nline2'` does not match what the parser emits for
  the fixture it claims to represent; it should be `'line1\\nline2'`.
  This only ever worked because the OLD `splitCreoleLines` incorrectly
  treated a real newline as a break too (an upstream divergence T1 exists
  to close).
- **Impact**: `tests/unit/state/layout.test.ts:982` and `:1008` need their
  `display` values changed from `'line1\nline2'` /
  `'line1\nline2\nline3'` to `'line1\\nline2'` / `'line1\\nline2\\nline3'`
  (2-line, mechanical fix, restores the tests' own stated intent — no
  other change needed). `state/layout.ts`/`layout.test.ts` is outside
  T1's write-set and not claimed by any other batch-1a/1b task per
  `overview.md`, so left unfixed per the write-set hard-boundary rule
  (README stop 1) — flagged here rather than silently edited.
  **Not a T1 regression against any real fixture or the manifest**: the
  real corpus fixture this test cites (`sosoxe-55-demi451`) parses to
  literal-`\n` text, which `splitDisplayLines` splits correctly (verified
  by direct parser probe above); only the test's own hand-built AST input
  was inaccurate.
- **Confidence**: High — verified via a direct `parseState()` probe
  against the real fixture text, plus the manifest/dot-sync/full-suite
  runs all showing zero other casualties of this class.

## Observation: full-corpus manifest's 4 differing fixtures are all
`\t`-escape fixes, jar-verified jar-ward

- **Context**: T1's mandatory full manifest diff (write-set includes
  `core/edge-label-box.ts`, shared by every engine) — expected empty per
  D6, but T1 is uniquely allowed jar-ward diffs (README exit bar 3, push
  forward list) if journaled with golden evidence.
- **Finding**: exactly 4 of 2014 fixtures differ, all `state`:
  `duzazu-41-telu529`, `juvagu-33-dupa212`, `lokija-02-dipe348`,
  `vixobo-14-jole910` — every one carries a literal `\t` escape in a
  `State : text` body line (`lokija`: `s1 : \tline2`; `duzazu`/`vixobo`:
  `... HAL_CAN_Init(...) \n\t HAL_CAN_Start(...)`; `juvagu`:
  `one: \t<sup>1</sup>`). The retired `splitCreoleLines`/
  `splitEdgeLabelLines` never expanded `\t` to a real tab (Java:
  `current.append('\t')`) — it left the literal 2-char `\t` sequence
  untouched, so the OLD rendered `<text>` content showed a visibly wrong
  backslash+`t` glyph pair inline with the label. The NEW
  `splitDisplayLines` expands it to a real (invisible) tab character,
  matching Java exactly — jar-verified: `lokija-02-dipe348`'s NEW
  `<text>` content for "line2"/"line3" is now byte-identical to jar's own
  glyphs AND `textLength` (29.662), differing from jar ONLY in
  x-position (12 vs jar's tab-stop-shifted 68/124 — jar implements
  `skinparam tabSize N`-driven visual indentation, a separate,
  unimplemented layout feature, not a `Display.getWithNewlines` scanning
  concern). `duzazu-41-telu529`/`vixobo-14-jole910` additionally surface
  a pre-existing, UNRELATED parser gap: PlantUML's trailing-backslash
  line-continuation convention (`SEND_MSG (msg, mailbox) / \` continuing
  onto the next source line) is not implemented by this port's state
  parser at all — confirmed unaffected by T1 (a lone trailing backslash,
  with nothing after it, never matches either the old or new escape-pair
  branch in `Display.java:284-309`'s `i < s.length - 1` guard, so this
  text is byte-identical old vs new; the DOT hash for these two fixtures
  is in fact UNCHANGED per the manifest, confirming the SVG-only diff is
  isolated to the `\t` fix).
- **Impact**: none of the 4 need a `DIVERGENCES.md`/follow-up entry
  beyond what's already true upstream (tab-stop indentation and
  line-continuation are both pre-existing, separately-scoped gaps, not
  newly introduced or newly regressed here).
- **Confidence**: High — verified via direct SVG rendering (both the
  jar's cached `in.svg` and a live render through
  `src/index.ts#renderSync`) and DOT-hash comparison in the manifest
  JSON, not inference.
