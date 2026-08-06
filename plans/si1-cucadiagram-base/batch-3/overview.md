# Batch 3 — Link + body layer (parallel)

| ID | Description | Writes | Depends On | Done |
|----|-------------|--------|------------|------|
| T6 | abel/Link.java (580): ctor :123-143, fields :71-95, sameConnections :462-470 VERBATIM semantics, getInv :145-156; LinkArg fluent builders | src/core/abel/Link.ts, LinkArg.ts + tests | T5 | [ ] |
| T7 | Bodier interface (:49-70), BodierSimple, BodierLikeClassOrObject (252; rawBodyWithoutHidden :191-205 — A2s R2d jar-verified blank-row semantics; getFieldsToDisplay/getMethodsToDisplay filters :114-172 — F-A ported these rules in parser.ts, cite-align, don't fork) + ADR-2 skin closure trace | src/core/cucadiagram/Bodier*.ts + tests | T5 | [ ] |
| T8 | TextBlockLineBefore (252) + MethodsOrFieldsArea (442): calculateDimensionOnlyMembers :154-177 (icon = circledCharacterRadius+3 :156-157 — A2s R2f landed this rule in class-member-rows; cite-align), createTextBlock :238-266, asBlockMemberImpl :83-85 (TextBlockLineBefore margin (6,4)), ULayoutGroup placement | src/core/cucadiagram/TextBlockLineBefore.ts, MethodsOrFieldsArea.ts + tests | T3, T4 | [ ] |

NOTE (ADR-5): MethodsOrFieldsArea is ported faithfully for BodyEnhanced1 +
future consumers; class-member-*.ts is NOT rebased. Where A2s already
jar-verified a rule, the port's unit tests may reuse those pinned numbers.
