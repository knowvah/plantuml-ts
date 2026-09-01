## Observation: `repin-sequence-baselines.ts` silently clears a PRE-EXISTING red row

- **Context**: Closing out `sequence-newpage-pagination` (2026-09-01). The
  adjudicator reported `regression=0`, so re-pinning was correct for the 34
  fixtures the mission improved.
- **Finding**: the script re-pins every fixture "whose measured state actually
  changed" — measured against the PIN, not against the mission's base ref. A
  fixture that was ALREADY red before the mission (live above its pin, and
  untouched by the work) therefore gets its pin RAISED to the red value, and
  the ratchet goes green on a regression nobody fixed. It did exactly that to
  `rugeco-70-muro754` (433 -> 543); the mission's own README named that row as
  one that must not move, which is the only reason it was caught. Reverted by
  hand; the row is still red, as it was on `main`.
- **Impact**: after any mission, diff the re-pinned file and check that EVERY
  changed entry moved DOWN. A single raised pin is a silently-adopted
  regression, and the ratchet cannot report it afterwards — the evidence is
  gone. A fix would be to have the script take the base ref's snapshot too and
  refuse to raise a pin.
- **Confidence**: High — measured at both refs, `rugeco` scores 543 in the
  working tree and 543 at `a7d78afd`, so the mission did not touch it.

## Observation: a detached worktree used as a measurement baseline lacks `assets/stdlib`

- **Context**: Same mission. `git worktree add /tmp/npbase <ref>` for a
  hand-rolled base measurement.
- **Finding**: `assets/stdlib` is generated (`scripts/vendor-stdlib.ts`), not
  committed, so a fresh worktree has none. Every fixture with an
  `!include <tupadr3/...>` then throws "Fatal parsing error" THERE and renders
  fine in the real tree — which reads as "the change fixed two fixtures". It
  did not: `nereka-67-deco609` and `tuzaga-87-gene496` were the two, and both
  render at both refs once `assets/stdlib` is symlinked in.
- **Impact**: symlink `assets/stdlib` (and `node_modules`) into any worktree
  used for a baseline measurement, or use
  `scripts/sequence-ratchet-adjudicate.ts --base <ref>`, which sets its own
  worktree up correctly.
- **Confidence**: High — error census 19 -> 17 purely from adding the symlink.

## Observation: a regex character class silently hid a fixture from a ratchet triage

- **Context**: `sequence-activation-level` (2026-09-01), triaging ratchet
  failures with
  `grep -oE "sequence/[a-zA-Z0-9-]+: weighted score ROSE"`.
- **Finding**: several corpus slugs carry UNDERSCORES
  (`SequenceArrows_0002_Test`, `TeozTimelineIssues_0003_Test`, …). The class
  above excludes `_`, so those rows were dropped from every triage listing
  while the test output and the adjudicator both reported them. The count
  read 38 when it was 39.
- **Impact**: use `[\w-]` (or the vitest `×` lines verbatim) when filtering
  fixture slugs; and treat the ADJUDICATOR's own totals as the count, never a
  hand-rolled grep of the console.
- **Confidence**: High — the missing row was found by re-reading the
  adjudicator JSON, which had it all along.
