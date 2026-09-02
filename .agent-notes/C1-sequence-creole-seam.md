## Observation: `<img:...>` with an undecodable path is a TEXT atom, not an inline one

- **Context**: `plans/sequence-creole` C1, writing `sequence-creole.ts`'s
  non-text-atom advance and testing it.
- **Finding**: `AtomImg.create`'s cannot-decode path emits a real `'text'`
  `CreoleAtom` reading `(Cannot decode)` at a hardcoded monospace 14
  (`AtomImg.java:106-107`). So `<img:/nope.png>` never reaches the `'inline'`
  branch at all and becomes an ordinary `TextRun`. The atoms that DO reach
  `'inline'`/`'emoji'` are `<&heart>` (openiconic) and `<:smile:>` (emoji).
- **Impact**: any test written to exercise a non-text atom via a bad `<img:>`
  path is vacuous. Use openiconic or emoji.
- **Confidence**: High — observed as a failing-then-passing test.

## Observation: `git diff --name-only HEAD~1` does not verify a write-set

- **Context**: same task, checking the write-set gate every task in this
  mission carries.
- **Finding**: `git diff --name-only HEAD~1` compares HEAD~1 against the
  WORKING TREE, so it lists any unstaged file the orchestrator happens to be
  holding — here `plans/sequence-creole/decision-journal.md`. The form that
  verifies a commit's write-set is `git diff --name-only HEAD~1 HEAD`.
- **Impact**: the two-ref form is the one to write into a task's quality bar;
  the one-ref form produces a false write-set violation.
- **Confidence**: High.

## Observation: sequence has nowhere to put a non-text creole atom

- **Context**: same task. `sequence-creole.ts#nonTextAdvance`.
- **Finding**: a `TextRun` is a `<text>`; an `'inline'`/`'emoji'`/`'latex'`
  atom is an `<image>`/glyph/formula, and sequence geometry has no kind that
  carries one. The seam therefore emits NO run for those atoms and only
  advances x by their measured width, so the text runs around them keep the
  jar's placement. `'latex'` advances 0 — this port resolves no formula
  dimensions on a text path.
- **Impact**: a real follow-on, not a defect: giving those atoms sequence
  geometry needs a new geo kind plus a renderer branch. The mission's own
  non-goal ("atoms with no measured reach") says record rather than build; this
  is that record.
- **Confidence**: High.
