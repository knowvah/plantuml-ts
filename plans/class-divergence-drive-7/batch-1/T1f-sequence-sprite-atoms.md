# T1f: sequence labels keep sprite atoms

Prepend [task-preamble.md](task-preamble.md).

## Task (TDD)
**josebu (a) (`desc-embed-ink-missing`, cdd6 rows 12, 13, 63).** The nested
sequence image is 107x87 vs the jar's 92x162 because every sequence label drops
any non-text atom to literal text — `sequence/sequence-creole.ts:347` (`if
(atoms.some((a) => a.kind !== 'text' && a.kind !== 'latex')) return
[textAtomRun(literal)]`) — where the jar's `display.create0(..., CreoleMode.FULL)`
(`AbstractTextualComponent.java:80-92`) yields an `AtomSprite`
(`StripeSimple.java:228-235`) and the participant head grows to the sprite (162
tall). cdd6 T3e stopped because the fix needs `sequence-layout-participants.ts`
(labelRows → sprite runs) beyond its three files; this task owns all four. Port an
image-carrying run (`latexAtomRun` / `TextRun.image` is the in-repo precedent) so
sizing (`sequence-layout-participant-sizing.ts`) and drawing (`sequence-text.ts`)
both see the sprite. Sequence-wide (D7): survey `sequence` before and after; report
every mover with its mechanism; re-pin the sequence golden / diff-baseline rows this
fix moves, Java-quoted in the commit body.

## Rows
- `unknown/josebu-55-seje426` (nested sequence image 107x87 vs 92x162)

## Write-set
- `src/diagrams/sequence/sequence-creole.ts`
- `src/diagrams/sequence/sequence-text.ts`
- `src/diagrams/sequence/sequence-layout-participant-sizing.ts`
- `src/diagrams/sequence/sequence-layout-participants.ts` (667 lines — a helper
  module is a push-forward file-cap move; name it)
- sequence goldens / diff-baseline rows this fix moves
- its unit tests under `tests/unit/sequence/`

## Read-set
cdd6 journal rows 12, 13, 63; `AbstractTextualComponent.java:70-100`;
`StripeSimple.java:220-240`; `AtomSprite.java`; `sequence-creole.ts:330-370`;
the `latexAtomRun` / `TextRun.image` definitions.

## Interface contracts
none.

## Acceptance
- Given a participant label containing `<$sprite>` with the sprite in the asset
  store, when sized and drawn, then the label carries an image run (not literal
  text) and the head height equals the jar's, asserted on specific values.
- Given josebu, when render-diff runs, then the nested image is 92x162 and the row
  is 0/0 or its residual carries a mechanism.
- Given the sequence survey and diff-baseline, then 0 losses; movers journaled.

## Architecture decisions (locked)
D7, D11.
