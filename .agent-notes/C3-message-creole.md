## Observation: the sequence creole seam does NOT apply `CharHidder`, so `~` escapes reach the commands

- **Context**: `plans/sequence-creole` C3, routing message labels through
  `sequence-creole.ts#sequenceCreoleRuns`. `mufomi-43-vaso140` is the one
  fixture the ratchet adjudicator classified `regression` (392 -> 490,
  top-level child-count distance 2 -> 5).
- **Finding**: upstream hides the `~` escape INSIDE the engine —
  `StripeSimple.java:150` (`line = CharHidder.hide(line)`) and
  `CreoleStripeSimpleParser.java:140-143` — and `AtomText.java:79` unhides
  (`String s = CharHidder.unhide(text)`) in the ATOM CONSTRUCTOR, i.e. before
  the atom is measured. This port declares both to be the CALLER's job
  (`src/core/klimt/creole/legacy/StripeSimple.ts:16`), and
  `class-object-member-creole.ts:100,122` is the caller that complies.
  `sequenceCreoleRuns` does not, so `A -> B : Action ~[[Double]]` reaches
  `CommandCreoleUrl` with a live `[[` and draws a link the jar does not.
- **Impact**: any caller of the shared `classifyStripeLine`/`buildLineAtoms`
  pair must `CharHidder.hide` the line before and `CharHidder.unhide` each
  atom's text before measuring it. C4-C6 will hit this identically. Measured
  fix (applied, verified, reverted as out of write-set): four edits in
  `sequence-creole.ts` — hide at `buildLineAtoms`, hide in the
  HORIZONTAL_LINE fallback atom, unhide in `textAtomRun` before
  `measurer.measure`. With it, all four of `mufomi-43-vaso140`'s labels match
  the jar exactly (`textLength` 189.15 / 281.369 / 43.387 / 36.156).
- **Confidence**: High — traced to `file:line` on both sides and confirmed by
  a reverted experiment.

## Observation: routing a label through creole can LOSE an element, not only gain one

- **Context**: same task. Four fixtures went from "top-level child counts
  MATCH" to "off by one" — `ralegi-94-fure352`, `sodovo-72-kudu756`,
  `vibaru-39-gebo741`, `zimoci-54-sedi066`.
- **Finding**: each is `Alice -> Bob : <$sprite>` and nothing else. A sprite
  is an `'inline'` atom, which C1's seam deliberately turns into an x-advance
  and NO run (`.agent-notes/C1-sequence-creole-seam.md`). Before the cutover
  the port emitted one `<text>` holding the literal `<$sprite>` — wrong
  content, but a child count that accidentally equalled the jar's, which
  draws one element for the sprite itself.
- **Impact**: the "non-text atoms have no sequence geometry" remainder is not
  cost-free at the comparator; a label made ONLY of such atoms now emits
  nothing. Any mission that reads a rise on one of these four should read it
  as that remainder, not as a placement defect.
- **Confidence**: High — all four sources inspected, all four are sprite-only
  labels.

## Observation: `messageLabelBlock` has no line or NLOC headroom at all

- **Context**: same task. `text-block-geo.ts` sat at 499 of the 500-line cap
  and `messageLabelBlock` at 26 NLOC / 7 CCN / 6 PARAM — the PARAM is a
  PRE-EXISTING violation, so `hooks/check-complexity.py` compares every
  metric against HEAD and blocks any that WORSENS.
- **Finding**: a function already in the hook's violating set cannot grow its
  NLOC or CCN by even one, however far under the 30/10 thresholds it is. C3
  had to land at exactly 26/7 and exactly 500 file lines, which cost three
  rounds of comment-trimming and one deliberate micro-inefficiency (the base
  `FontConfiguration` is rebuilt per line rather than hoisted, because
  hoisting is +1 NLOC).
- **Impact**: C4-C6 touching this file should budget the same way: measure
  with `~/.claude/hooks/.venv/bin/lizard -l typescript <file>` BEFORE writing,
  and treat the current numbers as a hard ceiling rather than the thresholds.
- **Confidence**: High — read the hook source; reproduced both limits.
