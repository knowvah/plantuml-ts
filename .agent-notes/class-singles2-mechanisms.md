# class-dot-sync singles batch 2 (2026-07-10)

## Observation: direction words up/left invert the WHOLE link
- **Context**: vegubu-29-bomu147 taillabel/headlabel mismatch
- **Finding**: CommandLinkClass.java:363-364 calls `link.getInv()` for
  ARROW_DIRECTION LEFT/UP — swaps endpoints, decors, quantifiers, roles, kal,
  ports. Composes with decor-driven direction by XOR, not override. Ported in
  `resolveArrow` (class-arrow-grammar.ts) as `decorSwap !== upOrLeft`.
- **Impact**: any future sided field must go through pickDirectional with the
  COMBINED swap; testing only `-left->` misses `<-u-` (they cancel).
- **Confidence**: High (oracle probes + fixture)

## Observation: upstream lazy regex groups behave greedily inside full-line grammars
- **Context**: gabejo-44-juki791 stacked stereotypes `<<A>><<B>>`
- **Finding**: `StereotypePattern.mandatory` is `(\<\<.+?\>\>)` (lazy), but as
  part of one anchored full-line regex, backtracking forces it to swallow
  `A>><<B` as ONE capture. Porting the group as a stand-alone lazy regex
  changes behavior; use greedy `.+` to reproduce the composed outcome.
- **Impact**: pattern applies to every upstream RegexConcat group ported as an
  isolated regex — check what backtracking would have done on adversarial
  input before copying laziness.
- **Confidence**: High

## Observation: labels can carry embedded quantifiers
- **Context**: tilipa-86-suxi130
- **Finding**: descdiagram/command/Labels.java:75-104 decomposes `: "1" text
  "0..*"` into quantifier1/label/quantifier2 — ONLY when no explicit quoted
  quantifier matched beside either endpoint. Ported into
  parseRelationshipLine (decomposeLabel).
- **Confidence**: High

## Observation: `constraint on links` emits a 10x10 DOT label spot
- **Context**: gujigi-63-roki030
- **Finding**: CommandConstraintOnLinks marks the two last non-note links;
  SvekEdge.java:430-444 emits label=<10x10 table> (CONSTRAINT_SPOT :122) on a
  constrained edge with no label text. Ported: `Relationship.linkConstraint`
  + spot branch in edgeLabelAttrs.
- **Confidence**: High

## Observation: floating notes are magma standalones
- **Context**: nuxoni-26-xala894
- **Finding**: upstream `g.leafs()` yields notes and classifiers from one
  Quark tree, so floating notes count toward the >=3 standalone magma
  threshold. class-magma.ts rootLeaves now appends root-level `ast.notes`;
  in-namespace notes were already covered via Namespace.classifiers.
- **Impact**: any future "leaves of a group" port must include note leaves.
- **Confidence**: High

## Observation: together{} is structurally invisible but scope-relevant
- **Context**: nadono-22-gidu983
- **Finding**: CommandTogether → gotoTogether pushes onto the same stacks
  list as groups; its `}` must not pop the namespace. svek's `cluster6t0`
  subgraph is ignored by the parity comparator. Ported as
  ParseState.togetherStack + closeBraceScope (class-container.ts) with
  LIFO resolution against activeNamespace.
- **Confidence**: High
