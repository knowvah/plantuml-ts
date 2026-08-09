# Observation: class `::member` ports reuse the wrong upstream mechanism

- **Context**: T8 (class-dot-sync) audit of shielded/qualifier `:h` edge
  ports against `svek/SvekNode.java` / `svek/Bibliotekon.java`.
- **Finding**: Class-diagram named ports (`A::member --> B`,
  `rel.fromPort`/`toPort`) are modeled by reusing the `isPort`/`:P`/
  `portTable()` mechanism (`SvekNode.appendLabelHtmlSpecialForPortHtml` /
  `ShapeType.RECTANGLE_PORT`) — upstream uses that ONLY for
  `EntityPosition.PORTIN/PORTOUT` entry/exit points (state/description;
  our description engine uses it correctly at
  `src/diagrams/description/layout.ts:191-205`). Upstream's real class
  `::member` mechanism is unrelated to Kal/isShielded:
  `Link.getEntityPort` → `EntityPort.create(uid, port)`
  (`abel/Link.java:219-227`, `EntityPort.java:50-51`) appends
  `:<hash(memberName)>` to the edge endpoint, and the node's own HTML
  label is a per-member-row table (one TD per member row, `PORT=<hash>`
  on the member's row — `Ports.encodePortNameToId`). Verified via oracle
  DOT for `dekaba-54-fafi485` (`A::ID -- B`): oracle emits a 3-row member
  table with `PORT="pb718adec73e04ce3ec720dd11a06a308"`; we emit a
  bordered-rect `PORT="P"` padding table.
- **Impact**: Currently passes `structurallyEqual` ONLY because the
  comparator (`tests/oracle/svek-dot.ts`) strips port suffixes and never
  reads inside `label=<...>`. Any future comparator tightening (or SVG
  conformance work) will surface this. Fix requires a per-member-row
  table renderer + porting the port-name hash; detection code lives in
  `src/diagrams/class/class-layout-helpers.ts`;
  `tests/unit/class/layout.test.ts:166-177` asserts the current
  (wrong-but-intentional) behavior and would need updating.
- **Confidence**: High — traced through Java source and verified against
  oracle DOT for a live fixture.
