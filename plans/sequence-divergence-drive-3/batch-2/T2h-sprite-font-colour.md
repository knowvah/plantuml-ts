# T2h — a sprite atom takes the stripe's own font colour

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2h`. Commit:
`fix(creole): tint sprite atoms with the stripe font colour`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (stops 4, 13).

## Mechanism (sdd2: `harness-no-emoji-store`; Java re-read)
`StripeSimple#addSprite` builds `new AtomSprite(fontConfiguration.getColor(),
forcedColor, scale, sprite, null, backColor)` (`klimt/creole/legacy/
StripeSimple.java:228-236`; sdd2 cited `:234`), and `AtomSprite#drawU` draws
`sprite.asTextBlock(fontColor, forcedColor, scale, backColor)`
(`creole/atom/AtomSprite.java:73-79`; sdd2 cited `:77`), so the tint is the
colour of the font ACTIVE at that point in the line (`<color:red><$s>`,
`<b>`, hyperlink colour, …). Ours: `fontOfAtom` returns the block's BASE font
for any non-text atom (`annotations/blocks-creole-atoms.ts:206-215`), a
documented approximation. The fix is to carry the stripe's font colour on the
inline atom (`klimt/creole/atom/Atom.ts`, the `'inline'` kind, `:23`) when the
stripe builds it, and read it in `fontOfAtom`'s caller. sdd2 also recorded a
second, already-resolved leg (`to255`, merged with PR #87:
`klimt/sprite/ColorResolver.ts:241` uses it); re-run rapoto first and confirm
only the font-colour leg remains.

## Targets
rapoto-38-neca900 to 0 (2 units; `<$circle>`, `<:rocket:>`, `<&box>` tints).

## Write-set
`src/core/annotations/blocks-creole-atoms.ts`,
`src/core/klimt/creole/atom/Atom.ts` and tests. The producing stripe code
(`legacy/StripeSimple.ts`, `creole-atoms.ts:350`) is read-only unless the
colour cannot be set where the inline atom is created — then stop 1 and name
the line (T2e owns `CommandCreoleUrl.ts`, T2f the command registry).

## Read-set
`blocks-creole-atoms.ts:190-215`; `klimt/creole/atom/Atom.ts:15-100`;
`creole-atoms.ts:340-355`; `creole-atoms-image-resolver.ts:290-340`; Java:
`StripeSimple.java:225-240`, `AtomSprite.java:60-82`.

## Acceptance
- Given `<color:red><$s>` and a plain `<$s>`, when atoms are drawn, then the
  sprite tint is red and the base font colour respectively (unit test citing
  `StripeSimple.java:234`, `AtomSprite.java:77`).
- Given rapoto, then it diffs to 0.
- Given the all-engine survey, then no conformant loss and every non-sequence
  mover explained row by row (the description/class sprite tints are the
  expected movers; each is checked against its golden).
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
