# G2 mechanism registry (diagnosed 2026-08-04, agents G2a+G2b)

All mechanisms carry our file:line + Java file:line + probe evidence in the
agents' JSON reports (decision-journal references). None SI1-blocked.
Fix round 1 (tasks F-A..F-F below); round 2 = the survey singletons + partials.

| ID | Mechanism (short) | Our file | Slugs |
|----|-------------------|----------|-------|
| A1 | annotation '@' literal prepended to header name (upstream: circled char only) | class-stereotype-layout.ts:22-25 | gojatu-01, josazo-53, lilura-67, tepazu-23, xidura-26, murotu-83, sosono-24 |
| A2 | USymbol leaves/empty groups not routed to EntityImageDescription sizing | class-layout-helpers.ts:257,279-285 | givofi-11, popesa-39, rakuci-96, sijisi-94, gujigi-63, lojiga-09, cacoma-43 |
| A3 | parser drops interior blank lines (notes/bodies lose a line/row) | parser.ts:370 | vivifa-42, pejone-71(p), xonamo-50(p) |
| A4 | creole bullet lines in notes measured literally (Bullet atom width 12 missing) | note-layout-measure.ts:141-163 | temise-16, pejone-71(p), xonamo-50(p) |
| A5 | global hide fields/methods leaves empty-compartment chrome (8px) | layout.ts:97-101 | vegubu-29, gabejo-44, zofabi-70(p) |
| A6 | singular 'hide method/field' unrecognized (plural-only map) | class-directives.ts:27-39 | zofabi-70(p) |
| A7 | minClassWidth floor never applied | class-layout-generic-classifier.ts:190 | novaro-13 |
| A8 | empty-package stereotype block omitted from dim merge | class-namespace-shape.ts:478-491 | dojanu-92 |
| A9 | <style> class header FontSize bucket never read by resolveHeaderFont | class-layout-helpers.ts:345-357 | momaku-69 |
| A10/B3 | groupInheritance shared-tail parent missing EntityImageProtected +2*20px | class-dot-graph.ts:235 | jakapi-64, lazeju-60, mefike-75, xifuza-00, zuduxu-90 |
| A11 | creole '--' hline in notes measured as text row (expression NOT closed — probe first) | note-layout-measure.ts:191-199 | sodizo-26, fomofi-36 |
| A12 | creole tables in notes measured literally (AtomTable port) | note-layout-measure.ts:141-163 | jovigo-38 |
| A13 | classAttributeIconSize unwired (VISIBILITY_ICON_SIZE hardcoded) | class-visibility-icon.ts:66-67 | zakufi-53, camiba-14 |
| B1 | member {method}/{field}/{static}/{abstract} tags not stripped everywhere | class-member-parser.ts:80-90 | filoxo-23, rakopi-21, tuguku-78, rusuzi-21, dejuse-14, goceso-49, kugasi-68, vipejo-56, xexido-15, gotefu-91 |
| B2 | hide <<stereotype>> methods (gender form) unparsed | class-directives.ts:156 + class-hideshow-dispatch.ts:92 | jijovu-48, xofumu-51 |
| B4 | skinparam wrapWidth never bridged to MaximumWidth cascade | skinparam-key-handlers.ts:132 + style-cascade-class.ts:221-236 | ponono-25, sumocu-27, zepeki-75 |
| B5 | literal \n in member rows + note lines measured as one line | class-member-creole.ts:32-39 + note-layout-measure.ts | julixi-10(p), rulite-35(p), besepi-37(p), lejoga-79, bumuma-72 |
| B6 | creole style tags with color arg + <back:> unported (raw tag measured) | core/klimt/creole/command/CommandCreoleStyle.ts:42-45 + CommandCreoleBuilder.ts:25-26 | xicipi-57, ziripa-77 |
| B7 | skinparam sameClassWidth ignored (no cross-class width floor) | class-layout-generic-classifier.ts:190 | dorafa-63 |
| B8 | ROUND-2 survey: TIM-in-notes (roputo-88, rozudo-79), EmbeddedDiagram-in-notes (xadado-92), unicode/emoji names (lecelo-92), creole monospace (curupe-50), sprite atom (lozego-15, rotisi-30), theme element font (mizupo-59), stereotyped attr font (sovuxo-25), hide-in-package scoping — probe first (jecopa-66), undiagnosed: cukaze-78, dibinu-95, daxeno-00, pasova-33 | various | 14 slugs |

(p) = partial: mechanism closes part of that fixture's delta; remainder queued.

Fix round-1 file ownership (one writer per file):
- F-A parser/hide: parser.ts, layout.ts, class-directives.ts, class-hideshow-dispatch.ts (A3, A5, A6, B2)
- F-B member path: class-member-parser.ts, class-member-creole.ts (B1, B5-member)
- F-C notes creole: note-layout-measure.ts (A4, B5-note, A11 probe-then-fix, A12 if bounded)
- F-D sizing/dot: class-layout-generic-classifier.ts, class-dot-graph.ts, class-stereotype-layout.ts, class-namespace-shape.ts, class-layout-helpers.ts (A1, A2, A7, A8, A9, A10/B3, B7)
- F-E theme bridge: skinparam-key-handlers.ts, style-cascade-class.ts, class-visibility-icon.ts (B4, A13)
- F-F core creole: core/klimt/creole/command/* (B6)
size-backlog.json: ORCHESTRATOR ONLY, pruned after batch gates.
