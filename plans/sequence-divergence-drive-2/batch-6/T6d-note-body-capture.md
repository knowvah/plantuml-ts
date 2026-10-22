# T6d — note-body capture: empty-stripe atom; embedded `{{ }}`

Agent: `typescript-pro` (sonnet), worktree `sdd2-T6d`. Commit:
`fix(sequence): keep empty-stripe atoms and embedded diagrams in notes`.
Read [../task-contract.md](../task-contract.md) first. Re-measure after
T6b: part of cluster H may already be fixed by core's `StripeSimple`.

## Mechanisms (research D clusters H, K)
- **H** (probe-verified): an empty stripe becomes a `" "` atom
  (`klimt/creole/legacy/StripeSimple.java:124-126`; `Display.java:703-712`;
  `FactorySequenceNoteCommand.java:146` removes empty columns only — no
  per-line trim). The port: label `''` gives no lines
  (`text-block-geo.ts:378,441,464`, autonumber + empty label rows);
  `parser.ts:256-258,333` (`trimNonBlank` trims note-body lines, losing the
  trailing space after `</size>`); `sequence-layout-box.ts:65` (empty box
  title). The jar keeps a trailing `" "` only for multi-line note bodies.
- **K**: `{{ … }}` in a note renders as one embedded `<image
  data:image/svg+xml>` (`CreoleParser.java:152-154`
  `EmbeddedDiagram.createAndSkip`). The port appends the lines as note
  text (`parser.ts:60-68,103-107` `scanEmbeddedBlock`); core
  `EmbeddedDiagram.ts:304` exists (class/description/state/activity use
  it). Memory `oracle-seam-embedded-42x42` applies.

## Targets
H: tatesu, totebu, kofuti, rudola, nunozo, teoz-ng-001. K: cusete, lezonu,
dasutu, rizove (menoke also needs E).

## Write-set
`src/diagrams/sequence/parser.ts`, `sequence-layout-box.ts`,
`text-block-geo.ts`, tests.

## Read-set
`research/research-d-structure.md` H, K; `parser.ts:50-110,240-340`;
`text-block-geo.ts:370-466`; `core/EmbeddedDiagram.ts`; an activity call
site of `EmbeddedDiagram` for the pattern.

## Acceptance
- Given a multi-line note body whose line ends with `</size> `, then the
  trailing `" "` atom is drawn (test citing `StripeSimple.java:124-126`).
- Given `note over A` with `{{ … }}`, then one embedded `<image>` is
  emitted (test).
- Given H and K targets, then structural sites are gone; no pinned change.
