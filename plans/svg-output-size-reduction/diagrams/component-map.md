# Component map

Which components this mission touches, and which task owns each. The
central fact: **two emitters**, and the hand-rolled one carries ~394 of
the 445 pinned goldens.

```plantuml
@startuml
title SVG emission — components touched, with owning task

package "Shared rules (ADR-3)" {
  [svg-format.ts\nT1] as FMT
}

package "Emitter A — klimt port" {
  [svg-graphics-core.ts\nT3] as KCORE
  [svg-graphics-elements.ts\nT4] as KELEM
  [driver-text-svg.ts\nT4] as KTEXT
}

package "Emitter B — hand-rolled" {
  [core/svg.ts\nT5] as CSVG
}

package "Geometry call sites (ADR-1)" {
  [diagrams/class\nT6a-T6e] as CLS
  [diagrams/state\nT7] as ST
  [openiconic-glyphs.ts\nT8] as ICON
}

package "Oracle" {
  [rebaseline script\nT2] as SCRIPT
  database "450 golden.svg\nT9" as GOLD
  [plantuml-oracle.jar\npin 11ed6720] as JAR
}

FMT <-- KCORE : imports rules
FMT <-- KELEM : imports rules
FMT <-- CSVG : imports rules
FMT <-- ICON : imports rules

KCORE --> KELEM : root g sets\ninherited attrs
KTEXT --> KELEM : threads text\nfor rule 5

CSVG <-- CLS : emits through\n(stops pre-rounding)
CSVG <-- ST : emits through\n(stops pre-rounding)

JAR --> SCRIPT : captures
SCRIPT --> GOLD : writes with --write
GOLD --> [ratchet suites\nT13] : byte-compared against
KELEM --> [ratchet suites\nT13] : description output
CSVG --> [ratchet suites\nT13] : class/state/object output

note bottom of CSVG
  Had NO numeric formatting
  (bare String(value)).
  T5 adds it; T6a-T6e and T7
  then delete the compensating
  pre-rounding.
end note
@enduml
```

## Golden ownership by emitter

| Emitter | Engines | Pinned goldens |
|---|---|---|
| `core/svg.ts` | class 313, state 58, object 22 | ~394 |
| klimt `svg-graphics-*` | description 51 | 51 |
| (skin) | 1 | 1 |

Porting only the klimt emitter — the shape the mission prompt originally
implied — would leave roughly 88% of the ratchet red.
