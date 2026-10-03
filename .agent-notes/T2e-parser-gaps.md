## Observation: 34 D6 error rows all resolved; two collateral findings
- **Context**: T2e (add2-T2e), porting the Java `Command*3` grammar for
  the 34 activity fixtures stuck at `status: "error"` in
  `oracle/goldens/svg-activity/diff-baseline.json`.
- **Finding**: All 34 rows now parse and render (0 crashes among the 34
  themselves). Mechanisms, grouped: (1) fork/split separator keywords
  use `RegexLeaf.spaceZeroOrMore()` upstream, not single-space-only
  literals (11 rows); (2) `if`/`elseif`/`if4`/`if-legacy` condition and
  label groups are lazily-quantified `(.*?)` upstream, not `[^)]*` —
  the old greedy-exclude form stops at the first `)`, which breaks on
  any condition containing a method call like `isForward()` (6 rows);
  (3) `CommandElseIf2` has a leading optional `(incoming)` decoration
  group before `else if` (2 rows); (4) swimlane headers are
  pipe-delimited `|#color|name|`, never bracket `|[#color]name|` (2
  rows); (5) `floating note`/`#color` on notes, and `endnote` (zero
  space) as a valid closer (4 rows); (6) `backward:` has leading
  `(incoming)`/trailing `(outcoming)` decoration groups (1 row); (7)
  `{{ }}` embedded-diagram spans inside a multiline action must be
  treated as opaque text, not re-entering the action's own close check
  (2 rows); (8) `label NAME`/`goto NAME`/`(X)` circled-spot connector
  were never ported at all — consumed with no AST node, matching
  `trySwimlane`'s existing no-node shape (5 rows); (9) `end if` is
  zero-or-more-space too, same as `endif` (1 row).
- **Impact**: Two collateral, NON-write-set findings surfaced by the
  `endnote`-closer fix (mechanism 5), both from the SAME root cause —
  before this task, `tryNoteMulti`'s closer check was the literal
  string `'end note'`, which never matched a one-word `endnote`, so
  the note body silently swallowed every following line as note text
  until end of input:
  - `vimoxa-78-zucu656` (baseline, Σ 80→84): its note's own `endnote`
    closer was being swallowed as a literal 4th text line; fixing the
    closer removes that bogus line, which raises `weightedScore` by 4
    (an EXPLAINED rise, matching `decisions.md#D7`'s documented "a
    corrected order re-pairing elements" reveal class — confirmed via
    `--dump`: before/after both already diverge from the jar's own
    creole rendering of `""example1""`/`~""example1""`, a pre-existing,
    unrelated gap).
  - `jupoxe-15-sugo110` (baseline, Σ 1822→CRASH): its "note right"
    (opened at source line 32) was swallowing 56 lines (1358 chars) —
    everything through EOF — into one giant note, confirmed by
    instrumenting the AST before the fix (`note.text.split('\n').length
    === 56`, `result.nodes.length === 1`). After the fix the note
    closes at its real `endnote` (line 39) and the diagram's actual
    content (three more `if`s and two `repeat`/`repeat while` loops)
    is built and laid out for the first time. That newly-reachable
    geometry hits a PRE-EXISTING latent bug in
    `src/diagrams/activity/layout/snake-merge-worm.ts:38`
    (`directionOf`, a faithful port of `Direction.fromVector`'s EXACT
    `x1 == x2` equality, `utils/Direction.java:102-130`): two points
    whose x-coordinates differ by 2.84e-13
    (`1421.58125` vs `1421.5812500000002`) fail BOTH the horizontal and
    vertical exact-equality branch and throw. Ruled out as caused by
    any OTHER mechanism in this task (fork/split, if/elseif, swimlane,
    backward, label/goto/circle-spot) — jupoxe's source contains none
    of those constructs; isolated to the note-closer fix by the AST
    swallow-length measurement above. `snake-merge-worm.ts` is outside
    this task's write-set (owned by the T1b/snake-merge mission per
    `.agent-notes`); the float-equality bug itself is pre-existing and
    was simply unreachable while the note bug hid the real geometry.
    Breaks `activity.diff-baseline.ratchet.test.ts`'s
    `jupoxe-15-sugo110` baseline-ratchet check AND
    `tests/diagrams/activity/layout/compress/invariant.test.ts`'s two
    "no baseline fixture throws"/"no new shape overlap" checks (3 test
    failures, 1 root cause).
- **Confidence**: High (root cause confirmed via before/after AST
  instrumentation and a pinned-at-46fd243c5 comparison worktree,
  isolating from three sibling agents who had already advanced
  `feat/activity-divergence-drive-2`'s tip during this session).
