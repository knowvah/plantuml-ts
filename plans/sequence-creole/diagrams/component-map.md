# What this mission touches

The creole engine is read-only here. Every arrow into it already exists for
`class` and `state`; this mission adds the sequence one.

```plantuml
@startuml
title sequence-creole — the wiring, and what already exists

package "creole engine (READ-ONLY)" #LightGray {
  [CreoleStripeSimpleParser\nclassifyStripeLine] as CLS
  [StripeSimple\nbuildLineAtoms] as BLD
  [creole-atoms-measure.ts] as MEAS
  [DisplayNewlines.ts] as NL
  [DisplayCreole.ts\ncreate0] as C0 #LightCoral
}

package "existing consumers" {
  [class-member-creole.ts] as CMC
  [annotations/blocks.ts] as CHROME
}

package "sequence engine" {
  [sequence-creole.ts] as SC #LightYellow
  [text-block-geo.ts\nTextRun] as TR
  [sequence-text.ts] as ST
  [scale-geo.ts] as SG
  [layout-participants.ts] as LP
  [layout-events.ts] as LE
  [renderer-message.ts] as RM
  [renderer-participant-\nshapes.ts] as RP
  [renderer-frame-header.ts] as RF
  [renderer.ts] as RR
}

CMC ..> CLS : reuses
CMC ..> BLD : reuses
CMC ..> MEAS : reuses

SC ..> CLS : C1 adds
SC ..> BLD : C1 adds
SC ..> MEAS : C1 adds

LP ..> NL : C2 adds
LE ..> NL : C2 adds
TR ..> NL : C2 adds

SC --> TR : produces runs
TR --> SG : scaled by k
LP --> SC : C4
LE --> SC : C5 C6
TR --> RM : C3
TR --> RP : C4
TR --> RF : C5
TR --> RR : C6
RM ..> ST : emits through
RP ..> ST : emits through
RF ..> ST : emits through
RR ..> ST : emits through

note bottom of C0
  Ported in full and called
  by nobody. NOT used here:
  its TextBlock needs UGraphic,
  which sequence does not use.
  See decisions.md D1.
end note

note bottom of SC
  C1 creates this and changes
  no call site. Its gate is
  that nothing moves.
end note

note right of CHROME
  Already renders creole, which
  is why a sequence TITLE does
  and a sequence LABEL does not.
end note
@enduml
```

## Not touched

`renderer-lifeline.ts`, `renderer-arrowhead*.ts`, `sequence-page.ts`,
`sequence-layout-message.ts` and the parser. Creole is a text concern; none of
these draw text.
