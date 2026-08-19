# Data flow — one `<sup>` run from source to SVG (post-mission)

```plantuml
@startuml
participant "StripeSimple\n(buildLineAtoms)" as lex
participant "CommandCreoleExposantChange" as cmd
participant "FontConfiguration\n(UText.ts)" as fc
participant "seam / AtomOps\n(creole-text-lines · descAtomOps)" as seam
participant "Sea" as sea
participant "renderer" as r
lex -> cmd : `<sup>1</sup>` at pos
cmd -> fc : save fc; fc' = {...fc, fontPosition: EXPOSANT}
cmd -> lex : analyzeAndAdd("1") under fc'; restore fc
lex --> seam : text atom {text:"1", font: fc'}
seam -> fc : getFont(fc') → size−3 (min 2)
seam -> seam : dim = measurer.measure("1", muted); descent = getDescent(muted)
seam -> fc : getSpace(fc') → −6
seam -> sea : add(atom, dim); doAlign(): y = −h + (−6)
sea --> seam : positions; line height = getHeight()
seam --> r : run {text, size: muted, dy: baseline − normalBaseline}; line.height
r -> r : <tspan font-size=size dy=dy>1</tspan>
@enduml
```

Java lines: `CommandCreoleExposantChange.java:81-95`, `FontConfiguration.java:
98-104,370-372`, `FontPosition.java:41-60`, `Sea.java:60-80`,
`AtomText.java:175-193,213-215,321-323`.
