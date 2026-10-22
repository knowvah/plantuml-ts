# T7d — stereotype title, base64 sprite, spot glyph

Agent: `typescript-pro` (sonnet), worktree `sdd2-T7d`. Commit:
`fix(sequence): spot glyphs, base64 sprites, decorated stereotype titles`.
Read [../task-contract.md](../task-contract.md) first. Core edits are
additive (D6); the close's all-engine survey covers them.

## Mechanisms (research D)
- **P** spot glyph: the jar draws the circled character's outline
  `<path>` (`Display.java:676-678` CircledCharacter;
  `klimt/drawing/svg/DriverCenteredCharacterSvg.java:56-81`). The port's
  `renderBadge` (`renderer-participant-shapes.ts:155-170`) draws the
  ellipse only; its comment ("jar draws WITHOUT the character") is
  contradicted by the goldens. Captured-outline tables exist in
  `diagrams/class/class-badge-glyph-data.ts` and
  `diagrams/activity/activity-spot-glyph*.ts`: lift the shared table to a
  new core module (additive; class/activity keep importing their own
  until a later cleanup, or switch to the core one if byte-identical).
- **AA** (MEDIUM) lifeline `<title>` text for `<< ($sprite,#c) >>` must be
  empty: `stereo/Stereotype.java:140-145` (+ StereotypeDecoration for a
  sprite-only spot); port `core/stereo/Stereotype.ts:201-204`.
- **AB** `sprite $x data:image/png;base64` → `<image>`:
  `command/CommandSpriteBase64.java:84-91`. `command-sprite.ts` withholds
  registration; core now has `resolveImageSpriteAtom` (ufp-T3a), so its
  "no PNG sprite kind" premise may be stale — verify, then register.

## Targets
xakuro, fakova, nimoxu (P; jefoke also needs E); kobibu, ridiro (AA);
liguma (AB).

## Write-set
`src/core/stereo/Stereotype.ts`, new `src/core/spot-glyph-data.ts` (name
as you see fit), `src/diagrams/sequence/command-sprite.ts`,
`renderer-participant-shapes.ts`, tests.

## Read-set
`research/research-d-structure.md` P, AA, AB; the two glyph tables;
`renderer-participant-shapes.ts:140-180`; `Stereotype.ts:190-210`;
`command-sprite.ts`; the Java above.

## Acceptance
- Given `participant A << (C,#ADD1B2) >>`, then the C outline `<path>` is
  emitted as in the golden (test).
- Given `<< ($sprite,#c) >>`, then the lifeline title is empty (test) —
  every engine's pins unchanged.
- Given liguma, then an `<image>` is emitted.
