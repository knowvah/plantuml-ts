# Proposed mission: name the transcribed oracle numbers in tests

## Observation: bare oracle literals read as fitted values
- **Context**: object-close T0. A new test asserted
  `expect(n.width).toBeCloseTo(0.997917 * 72, 2)` — a jar-measured inch value,
  the `72` DOT-inches-to-px factor, and a tolerance digit, all inline.
- **Finding**: the maintainer flagged it on sight, and correctly: an unnamed
  numeric literal in an assertion is indistinguishable from a value tuned until
  the test passed. The information that makes it legitimate — *which* golden
  file, *which* `shNNNN` node, and that the tolerance is set by the golden's own
  6-decimal rounding rather than by taste — lived only in the author's head.
  Fixed in `tests/unit/core/element-font-size-by-stereo.test.ts` by extracting
  `DOT_PX_PER_INCH`, `PX_DIGITS`, and an `ORACLE_IN` table whose every entry
  names its source file and node.
- **Impact**: the same shape is widespread. `tests/unit/core/
  stereotype-font-size-cascade.test.ts` carries `1.268924 * 72`, `92`, `64`,
  `62`, `83` inline (its file header does cite the goldens, so the provenance
  exists — it is just not attached to the numbers). A repo-wide sweep is
  warranted: every oracle-derived literal in an assertion should be a named
  constant carrying its `<golden-file>` + node id, and the bare `72` should be
  one shared named factor. This is exactly the discipline CLAUDE.md already
  demands of production constants ("every constant carries its upstream
  `file:line`; no citation means unfinished") — the test tree never had it
  applied.
- **Scope note**: mechanical and separable from any diagram behavior, so it is
  a good standalone mission rather than in-flight work. It must NOT change a
  single asserted value; a diff where any number moves is a red flag, not a
  cleanup. Candidate gate: a lint rule or fitness test banning bare numeric
  literals in `toBeCloseTo`/`toBe` dimension assertions under `tests/`.
- **Confidence**: High (observed directly; the `stereotype-font-size-cascade`
  examples were read, not assumed).
