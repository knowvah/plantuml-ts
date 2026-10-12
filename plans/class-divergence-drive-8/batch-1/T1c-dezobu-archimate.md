# T1c: dezobu, the archimate sprite stereotype

Prepend [task-preamble.md](task-preamble.md).

## Mechanism (cdd7 open -> cdd8; Java quoted during planning)
`CommandArchimate.java:144-152`:
```java
final String icon = StereotypePattern.removeChevronBrackets(arg.getLazzy("STEREOTYPE", 0));
...
if (icon != null)
    entity.setStereotype(Stereotype.build("<<$archimate/" + icon + ">>", ...));
```
The archimate leaf's stereotype is **replaced** by a sprite stereotype
`<<$archimate/<icon>>>`. `Stereotype#getLabel`'s archimate special case
(`Stereotype.java:167-175`, already ported in
`src/diagrams/description/parse-helpers-strings.ts:335`) then decides what label,
if any, is drawn. The port's `tryArchimate` (`src/diagrams/description/parser.ts:309-322`)
passes the parsed stereotype through unchanged, so we draw the
«motivation-principle» label instead of the sprite. cdd7's standalone probe
measured the jar at 105.575×54 with the sprite, and ours at 158.238×48 with the
label.

## Task (TDD)
1. Quote `CommandArchimate.java:120-160`, plus `Stereotype.build` and `getLabel`.
2. In `tryArchimate`, mirror the rewrite: when a stereotype is present, the leaf's
   stereotype becomes the sprite stereotype `<<$archimate/<icon>>>`, built from the
   chevron-stripped STEREOTYPE argument. That makes it flow down the existing
   `stereotypeSprite` path. Do not keep the original label.
3. Confirm the description leaf draws the `archimate/<icon>` sprite through the
   existing sprite-stereotype draw (`renderer-entity.ts`). The sprite source is
   `packages/sprites-archimate`. Size the leaf as the jar does.
4. Probe: `archimate #MOTIVATION "Transparency" <<motivation-principle>> as T`,
   rendered with `scripts/oracle-render.sh` and with ours. The result must be
   105.575×54.
5. Measure dezobu, whose embed is nested in a `rectangle [ {{ }} ]`.

## Rows
`unknown/dezobu-62-vuzu421` (0/183).

## Write-set
`src/diagrams/description/parser.ts`, `src/diagrams/description/parse-helpers-strings.ts`,
`src/diagrams/description/renderer-entity.ts`, `src/diagrams/description/layout-helpers.ts`
(only if sizing needs it), tests under `tests/unit/description/`, plus the description
goldens/diff-baseline rows this task moves (journal each).

## Read-set
`~/git/plantuml/src/main/java/net/sourceforge/plantuml/descdiagram/command/CommandArchimate.java`;
`stereo/Stereotype.java` (`build`, `getLabel`, `getSprite*`); `parser.ts:280-325`;
`parse-helpers-strings.ts:320-360`; `grep -n stereotypeSprite renderer-entity.ts`.

## Acceptance
- Given `archimate #X "a" <<motivation-principle>> as A`, when parsed, then the node's
  `stereotypeSprite` is `archimate/motivation-principle` and no «motivation-principle»
  label is kept, per `CommandArchimate.java:150-152`.
- Given the standalone probe, then ours is 105.575×54, equal to the jar's.
- Given dezobu, then render-diff reports 0/0.
- Given the description surveys (component, usecase, c4), then there are 0 conformant
  losses, and each mover is journaled with its mechanism.

## Architecture decisions (locked)
D9 (all-engine movers).
