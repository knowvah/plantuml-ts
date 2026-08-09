## Observation: pre-existing unused-var lint errors outside class-commands split
- **Context**: Splitting `class-commands.ts` (655 lines) into grouped
  sub-tables under the 500-line cap; ran `npx eslint src/diagrams/class`
  after the split to confirm the new/edited files were clean.
- **Finding**: Three pre-existing `@typescript-eslint/no-unused-vars` errors
  in files NOT touched by the split:
  - `class-directives.ts:12` — `ClassNote` imported but unused
  - `class-parse-state.ts:7,9` — `Classifier`, `UmlSource` imported but unused
  - `class-stereotype.ts:42` — `BADGE_LEFT_MARGIN`, `NAME_LEFT_MARGIN` unused
- **Impact**: Not introduced by this change (verified via `git status` —
  these files are untouched). Needs a dedicated small cleanup PR per
  `pr-workflow.md`'s pre-existing-violations rule.
- **Confidence**: High (direct eslint output, cross-checked against git diff).
