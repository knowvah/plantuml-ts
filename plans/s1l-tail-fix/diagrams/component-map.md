# Component map — modules under change

Which components this mission touches, and which batch owns each. Component
diagram: the question is "what are the parts and their interfaces", not
ordering.

```plantuml
@startuml
title S1L Tail Fix — components by owning batch

package "description engine" {
  component [parser.ts\nparse-state.ts\nparse-helpers.ts] as Parser
  component [element-grammar.ts\ncommand-table-*.ts] as Grammar
  component [parse-helpers-strings.ts] as Strings
  component [leaf-sizing.ts] as LeafSizing
  component [leaf-sizing-entity.ts\nleaf-sizing-consts.ts] as LeafEntity
  component [layout.ts\nlayout-dot-tree.ts] as Layout
}

package "creole" {
  component [StripeSimple.ts\ncreole-atoms*.ts] as Stripe
  component [AtomEmoji.ts\nEmoji.ts] as Emoji
  component [openiconic-glyphs.ts] as OpenIcon
}

package "shared model" {
  component [BodyFactory.create3\nBodyEnhanced2] as Body
  component [EntityImage\nDescriptionDelegates.ts] as Delegates
}

package "assets" {
  component [sprite-commands.ts] as Sprites
  component [asset store seam\n(RenderOptions)] as Seam
}

package "oracle" {
  component [size-backlog.json] as Backlog
  component [measure-description\n-size-deltas.ts] as Harness
}

LeafSizing --> Body : F1-a routes note\nbody through
Parser --> Grammar : F1-b hands over\nstillUnknown contract
Strings --> Delegates : F2-b builds\nsprite stereotype
Stripe --> LeafEntity : F2-c supplies\nurl-label atom scale
Layout --> LeafEntity : F3 threads\nBoxSizingOpts
LeafEntity --> LeafSizing : F3 shares\nfont + thickness
Seam --> Sprites : F4-a resolves\ninternal bundle
Seam --> Emoji : F4-b loads\nTwemoji artwork
OpenIcon --> Stripe : F1-c emits\nglyph atoms
Harness --> Backlog : reads pins\n(orchestrator writes)

note right of Backlog
  ADR-1: no task writes this.
  Tasks report closed pins;
  the orchestrator deletes them
  after batch gates pass.
end note

note right of LeafEntity
  Hub: owned by F2-b, F3
  and read by F2-c.
  Serialised across batches.
end note
@enduml
```

## Ownership hubs

Three files serialise the plan. They are why the batches are ordered as they
are:

| File | Wanted by | Resolution |
|---|---|---|
| `oracle/goldens/description/size-backlog.json` | every group | ADR-1 — orchestrator owns it |
| `src/diagrams/description/leaf-sizing-entity.ts` | G3, G4, G5, G10 | F2-b then F3; F2-c reads only |
| `src/diagrams/description/parse-state.ts` | G1, G6, G8 | F1-b then F2-a |
