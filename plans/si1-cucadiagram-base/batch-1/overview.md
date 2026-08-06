# Batch 1 — Leaf foundations (parallel; no cross-deps)

Every task: faithful port, upstream names, @see provenance per member,
TDD with jar-derivable expectations where numeric, colocated tests under
tests/unit/core/. Trace the two-level closure BEFORE writing; journal any
extra file pulled (ADR-2). No engine files touched.

| ID | Description | Writes | Depends On | Done |
|----|-------------|--------|------------|------|
| T1 | Quark<DATA> + Plasma (plasma/Quark.java:48-94 tree: parent/name/children/qualifiedName/data; root/navigation semantics) | src/core/plasma/ + tests | — | [ ] |
| T2 | abel enums + small types: LeafType (ALL 51 values + isLikeClass :85-96), GroupType (8), LinkType/LinkDecor essentials, EntityPosition | src/core/abel/ (enum files) + tests | — | [ ] |
| T3 | VisibilityModifier (skin/, 355 — full incl. icon geometry accessors), CharHidder (utils/, 127 — the '~' tile escape), Url (url/, 131) | src/core/skin/VisibilityModifier.ts, src/core/utils/CharHidder.ts, src/core/url/Url.ts + tests | — | [ ] |
| T4 | PlacementStrategy + Visibility/Y1Y2*/X1Y2Y3/X1X2 variants + ULayoutGroup + TextBlockWithUrl (klimt/geom, ~600) | src/core/klimt/geom/ + tests | — | [ ] |

Interface outputs: T1 → `Quark<D>` {parent, name, qualifiedName, children,
data, isRoot()}; T2 → the enums (string-literal-union or enum per repo
convention — match existing LeafType-like types if any); T3 →
VisibilityModifier with isVisibilityCharacter/getVisibilityModifier
(Member.java:133-134 callers) + CharHidder.addTileAtBegin/unhide.
