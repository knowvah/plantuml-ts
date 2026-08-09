## Observation: `single` link style is a link-ADD-time dedup flag, not a render style
- **Context**: A1 P2/i28 diagnosing silito-78-vubi253 (component ratchet, last
  open fixture) — a `!definelong` macro invoked 3x with an identical
  `-[single]->` body emitted 3 identical links in our DOT vs. the oracle's 1.
- **Finding**: i27's prior ruling ("`WithLinkType.isSingle()` is dead code
  upstream — full-tree grep confirmed") was WRONG. `isSingle()` is called
  live at `net.atmp.CucaDiagram.java:880-882` (`addLink`): a link parsed with
  `-[single]->` sets `WithLinkType.single=true`
  (`decoration/WithLinkType.java:151-152`, via `applyOneStyle`'s `"single"`
  token branch — this IS the token grep should have found). When such a link
  is added and the diagram already holds ANY OTHER link connecting the same
  two entities (`Link.sameConnections` — endpoint identity, either
  direction, ignoring style/type), `addLink` silently drops it instead of
  appending. plantuml-ts's `link-grammar.ts` classified `single` alongside
  purely-cosmetic tokens (dotted/dashed/bold/plain/node/thickness/#color) as
  "render-only, out of scope" — that classification was the actual bug, not
  a TIM/preprocessor/macro-scoping issue as i27's next-probes list assumed.
- **Impact**: Fixed by adding `DescriptiveLink.single?: boolean`
  (`src/diagrams/description/ast.ts`), threading it through
  `parseStyleFlags`/`buildLinkFromArgs` (`link-grammar.ts`), and adding an
  `addLink()` wrapper in `parser.ts` that replicates
  `CucaDiagram.addLink`'s dedup check at the `state.ast.links.push` call
  site. No preprocessor/TIM change was needed — the macro expansion was
  already correct (3 distinct link statements); the diagram-level add-time
  dedup was the missing piece. Any future "N identical link declarations
  collapse to fewer in the oracle" symptom should check `-[single]->` usage
  FIRST before suspecting macro/TIM expansion.
- **Confidence**: High — verified via oracle jar (`dot-sync-report.ts
  --slug silito-78-vubi253 component`: structurally EQUAL after fix) and
  cross-referenced against `net.atmp.CucaDiagram.java`,
  `decoration/WithLinkType.java` in `~/git/plantuml`.
