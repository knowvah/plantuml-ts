# Data flow — color resolution at render time

How a `skinparam database BackgroundColor #FFd8f4\#FF92d1` reaches a rendered
`fill="url(#…)"` on the cylinder. This is the path the mission builds; the DOT/layout
path is untouched.

```plantuml
@startuml
participant "source (skinparam + diagram)" as Src
participant "skinparam.ts (T4)" as Skin
participant "theme.ts buckets (T3)" as Theme
participant "description/class renderer (T7/T8)" as Rend
participant "usymbol-shapes.ts (T6)" as USym
participant "svg.ts primitive (T2)" as Svg
participant "paint.ts (T1)" as Paint
Src -> Skin : database BackgroundColor #FFd8f4\\#FF92d1
Skin -> Paint : parseColor('#FFd8f4\\#FF92d1')
Paint --> Skin : Gradient{c1,c2,policy:'\\'}
Skin -> Theme : set database bucket.background = Gradient
Rend -> Theme : resolveElementPaint(theme,'database','background')
Theme --> Rend : Gradient (element bucket, not class)
Rend -> USym : renderDatabaseIcon(geo, Paint)
USym -> Svg : path(d, { fill: Paint })
Svg -> Paint : paintToSvg(Gradient)
Paint --> Svg : { fill:'url(#ghash)', def:'linearGradient…' }
Svg --> USym : linearGradient…/<path fill='url(#ghash)'/>
@enduml
```

## Solid-color path (the common case — unchanged output)

```plantuml
@startuml
participant "renderer" as Rend
participant "svg.ts (T2)" as Svg
participant "paint.ts (T1)" as Paint
Rend -> Svg : rect(x,y,w,h,{ fill:'#F1F1F1' })
Svg -> Paint : paintToSvg('#F1F1F1')
Paint --> Svg : { fill:'#F1F1F1' }  %% no def
Svg --> Rend : rect fill='#F1F1F1'/  %% byte-identical to today
@enduml
```
