# Data flow — whole-file vs per-sprite

## Today: the whole file arrives through the include seam

```plantuml
@startuml
participant "Consumer" as C
participant "render()" as R
participant "prefetchInner" as P
participant "stdlib source" as S
participant "plugin.parse()" as Pa
C -> R : render(source, {stdlibRegistry})
R -> P : prefetchIncludes(source)
P -> S : bootstrap/bootstrap
S --> P : 1,085,342 B (2,078 sprites)
P --> R : store
R -> Pa : parse(preprocessed)
note over Pa : matchSpriteCommand registers\nALL 2,078 sprites
Pa --> R : AST + SpriteRegistry
note over R : getSprite() is a SYNC Map.get —\nno await is available here
@enduml
```

## After: only the referenced sprites are fetched

```plantuml
@startuml
participant "Consumer" as C
participant "render()" as R
participant "prefetchInner" as P
participant "scanSpriteNames" as Sc
participant "split manifest" as M
participant "fragments" as F
participant "plugin.parse()" as Pa
C -> R : render(source, {stdlibRegistry, sprites?})
R -> P : prefetchIncludes(source)
P -> Sc : scan source for sprite name
Sc --> P : {bi-globe, bi-alarm, bi-house}
P -> P : union options.sprites (ADR-5b)
P -> M : manifest (7,289 B gzip)
M --> P : name list
P -> F : sprites/bi-globe.puml … (3 fetches, concurrent)
F --> P : ~1.3 KB total
P --> R : payload assembled in SORTED name order
R -> Pa : parse(preprocessed)
note over Pa : registers only the 3 sprites present
Pa --> R : AST + SpriteRegistry
@enduml
```

**The lever is the include PAYLOAD, not the sprite registry.** Parsing is
untouched — it simply sees fewer `sprite` blocks, which is what keeps
`renderSync` synchronous (ADR-4).

## A name the scan cannot see

```plantuml
@startuml
skinparam componentStyle rectangle
skinparam shadowing false

[sprite name in raw source] as A
[fetched] as B
[sprite name produced by a !define expansion] as C
[in options.sprites?] as D
[named error identifying the sprite\n— never a silent missing icon] as E

A --> B : scan finds it
C --> D : invisible: prefetch\nruns BEFORE macro expansion
D --> B : yes, ADR-5b
D --> E : no, ADR-5a
@enduml
```
