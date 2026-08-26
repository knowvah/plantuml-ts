## Observation: the sequence comparator cannot measure arrow fidelity at all

- **Context**: T15 of `sequence-command-coverage` ported inclination rendering
  and expected the ~20 dressing fixtures to move toward their goldens. The
  ratchet reported **zero falls and zero rises** — an observed discrepancy, so
  it was diagnosed rather than reported as a result.

- **Finding**: every sequence corpus fixture short-circuits on a TAG mismatch
  at the first participant child, so **no arrow attribute is ever compared**
  and arrow geometry cannot move `weightedScore` in either direction.

  - **Mechanism**: the jar wraps each participant in
    `<g><title>A</title><rect/><line/></g>`; this port emits the bare
    primitives. Child 0 under `svg/g[1]` is therefore `g` in the golden and
    `line` in ours.
  - **Origin**: `tests/oracle/svg-conformance/compare.ts:222-231` —
    `return; // structural mismatch — stop here`.
  - **Causal chain**: the tag mismatch is charged once and the subtree is
    skipped. Every following child index is shifted by the wrapper, so the
    whole sibling run mismatches by tag too.

- **Verified independently** (orchestrator, not just the agent's claim) by
  dumping every diff for `celego-19-laji937`: 30 records, of which 4 are root
  dimensions (`svg/@width`, `@height`, `@viewBox[2]`, `@viewBox[3]`) and the
  rest are tag mismatches of the form `line vs g`, `rect vs g`, `text vs
  rect`, `polygon vs text`. **Not one `polygon/@points` record exists.** The
  only attribute-level entries are on `text[3]`/`text[4]`, which are
  coincidental index alignments between our text and the golden's — not
  comparisons of the same element.

- **Impact**:
  - The dressing/arrow bucket is **unmeasurable on this comparator** until the
    participant wrapper lands. Correct arrow work produces no ratchet
    movement, and — more dangerously — *incorrect* arrow work produces none
    either.
  - `diff-census.json` bucket counts for sequence fixtures describe the
    unaligned tag cascade, not arrow quality. `celego-19-laji937`'s "8
    geometry" is 4 root dimensions plus 4 text coordinates.
  - Any future task told to "make the dressing fixtures fall" is being given
    an unreachable target, and the pressure that creates is exactly the
    pressure to fit a value.

- **Extends a known note**: `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md:167-172`
  recorded the `<g><title>` wrapper gap but concluded "one child either way,
  so it moves no ratchet". **The new fact is that it does not merely fail to
  move the ratchet — it blocks descent**, so everything below the first
  participant child is invisible to the comparator.

- **Confidence**: High. Whole-fixture diff dump, plus T15's independent check
  of all six inclination-bearing fixtures (`celego-19-laji937`,
  `fenoli-16-peru181`, `jajobi-60-ralo350`, `letagi-90-kome968`,
  `sisele-83-gebe678`, `vativa-83-bisa518`): all `status: baseline`, all with
  zero arrow-attribute diffs, identical scores before and after a change whose
  SVG output demonstrably differs.
