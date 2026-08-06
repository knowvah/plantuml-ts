# Batch 2 — Entity

| ID | Description | Writes | Depends On | Done |
|----|-------------|--------|------------|------|
| T5 | abel/Entity.java (775) full port: quark/bodier/leafType/groupType/display/stereotype/symbol/colors/portShortNames/together/visibility/neighborhood/tags/notes/location/uid (fields :89-135) + Together + EntityUtils + EntityGenderUtils consolidation (class engine has a scoped byStereotype copy — CONSOLIDATE by making the class engine's version import the base or note why not; do not fork semantics) | src/core/abel/Entity.ts, Together.ts, EntityUtils.ts, EntityGenderUtils.ts + tests | T1, T2, T3 | [ ] |

Interface output: Entity with the full upstream member surface (port
callerless members per ADR-1/ADR-8); consumed by T6/T7/T10.
