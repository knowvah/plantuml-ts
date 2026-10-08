## Observation: sprite tint back colour is the draw-time `Back`, per element
- **Context**: unwind2-S7, monochrome sprite PNG pixels vs the jar.
- **Finding**: `SpriteMonochrome#asTextBlock.drawU` ignores its `backColor`
  argument and uses `ug.getParam().getBackcolor()` (`SpriteMonochrome.java:
  215-217`). Jar-measured backs: note #FEFFDD, class body/header fill, inline
  `#pink`, gradient -> its color1 (`HColorGradient.java:50-51`), transparent ->
  white, description actor label -> actor body #F1F1F1, sequence stickman
  label -> white, participant/collections/queue -> box fill, cluster stereo
  sprite -> cluster fill, title/legend/caption/header -> white.
- **Impact**: `UGraphic` draw sites read `ug.getParam().getBackcolor()`
  through `sprite-tint.ts#spriteHrefOver`; string-emitting engines (class,
  sequence) re-tint at the emission site from the element fill.
- **Confidence**: High (`tests/oracle/svg-conformance/unwind2-s7-sprite-back.test.ts`)

## Observation: sequence head text is #181818, the jar's is black
- **Context**: same; the sequence sprite tint END still differs.
- **Finding**: every sequence `<text>` this port emits uses
  `theme.colors.text` (`#181818`, `theme.ts:263`); the jar's is `#000`
  (`plantuml.skin:9` root FontColor black; 3295 of the first 300 sequence
  cache goldens' text fills). The sprite tint end inherits it.
- **Impact**: a sequence-text-colour fix moves both text fills and sprite
  hrefs; the S7 test pins the residual as the font colour alone.
- **Confidence**: High

## Observation: seven text paths draw no sprite at all
- **Context**: same fixtures.
- **Finding**: the jar draws a `<$sprite>` in activity actions, class edge
  labels, class package titles, sequence messages/notes/groups and state
  names; this port draws none (`tests/fixtures/unwind2-S7/{ac-activity,
  c-edge,c-package-title,s-message,s-note,s-group,st-state}`).
- **Impact**: dropped-element defects, separate from the tint.
- **Confidence**: High
