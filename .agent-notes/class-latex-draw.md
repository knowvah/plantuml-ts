## Observation: lizard silently loses `resolveOneAtom` in class-member-creole.ts
- **Context**: Sizing a change to `resolveOneAtom` against the hook's
  directional complexity ratchet before editing.
- **Finding**: `lizard src/diagrams/class/class-member-creole.ts` reports NO
  function for lines ~332-398, where `resolveOneAtom` lives. It reports
  `resolveMemberAtoms` and `buildMemberRow` on either side. The function's own
  `#lizard forgives -- pre-existing 5 PARAM/35 NLOC` comment therefore
  describes a measurement lizard no longer produces. The file already
  documents this class of trap for regex literals and inline object return
  types desyncing lizard's brace-depth tracker.
- **Impact**: The complexity hook cannot see growth in that function, so it
  will not block an edit that pushes it further over cap. Do not read "the
  hook passed" as "this function is within cap" anywhere in this file.
- **Confidence**: High (reproduced directly against hooks/.venv/bin/lizard).

## Observation: `<math>` and `<latex>` reach AtomMath with DIFFERENT expressions
- **Context**: A test asserted the two tags produce byte-identical images.
- **Finding**: They do not, by design. `CommandCreoleMath.java:79` calls
  `stripe.addMath(ScientificEquationSafe.fromAsciiMath(math))`;
  `CommandCreoleLatex.java:78` calls `fromLatex(latex)`. So `<math>x=1</math>`
  reaches the renderer as ASCIIMath-converted LaTeX (`{x}={1}` in this port)
  while `<latex>x=1</latex>` passes through verbatim.
- **Impact**: Any test deriving an expected latex image from the SOURCE string
  is wrong for `<math>`. Derive it from the built atom's own `expr` field.
- **Confidence**: High (read both Java command bodies; reproduced).

## Observation: the class engine has ONE creole seam for member rows and notes
- **Context**: The brief warned a member row and a note might take different
  paths.
- **Finding**: They do not. `note-layout-measure.ts:392` and
  `class-member-rows.ts` both call `class-member-creole.ts#resolveMemberAtoms`
  over `buildMemberAtoms`. Only the RENDERERS differ
  (`renderer-classifier-rows.ts#renderRowAtoms` bottom-aligns an `'image'`
  atom to the line bottom; `renderer-note.ts#renderNoteLineAtoms` puts it at
  the line top). Both reduce to `Sea#doAlign`'s `-height + 0` for the atom
  that sets the line's own height.
- **Impact**: One resolver branch fixes both consumers. Object diagrams share
  the same renderer, so they are covered too.
- **Confidence**: High (grep-verified single drop site; full-render repro
  emits both images).
