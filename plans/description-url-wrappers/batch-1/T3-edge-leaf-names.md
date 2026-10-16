# T3 — edge leaf names for `path/@id` and link comments (Family C)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T3`.

## Context
The jar names an edge by its entities' leaf names: `Link.java:106-120` `idCommentForSvg()` uses
`getEntity1().getName()` (`Entity.java:686-688` → `Quark.java:84-86`, the last segment). Jar output for
component/fidati-41-kofe029: `<!--link ccc03 to ccc05-->`, `<path id="ccc03-ccc05">`. Ours passes
`bareEntityName(edge.from)` (`renderer-edge.ts:115-116`), which strips only the scope key
(`namespace-groups.ts:150,174-177`), so under `set separator .` the id is `aaa.bbb1.ccc03-aaa.bbb1.ccc05`.
`leafDisplayName(id, sep)` (`namespace-groups.ts:54-69`) does the split. Seam map: Family C.

## Task (D5)
1. `DescriptionEdgeGeo.fromName?/toName?: string` (`layout-helpers-types.ts:160-165`).
2. `EdgeMapping.namespaceSeparator` (`layout-geo-post.ts:34-40`); `assembleEdgeGeo` (`:76-88`) sets
   `fromName/toName = leafDisplayName(bareEntityName(link.from|to), separator)`.
3. `layout.ts:255-263` passes `ast.namespaceSeparator` into `rawMapping`.
4. `renderer-edge.ts:115-116`: `from: edge.fromName ?? bareEntityName(edge.from)` (same for `to`).
5. Check `description-elk-adapter.ts` for edge `from` use; if it needs the same change, report it.
Do not change `SvekEdge.ts` or `bareEntityName`; do not add a `drawEdge` parameter.

## Write-set
`src/diagrams/description/{layout-geo-post,layout,renderer-edge}.ts`, `layout-helpers-types.ts` (edge types
only); `tests/unit/description/**`.

## Interface contract
`DescriptionEdgeGeo.fromName?: string`, `toName?: string` — leaf names for SVG id/comment only; layout keys
stay `from`/`to`.

## Acceptance
- Given fidati, kofovu and tojitu, then `path/@id` and the link comment use leaf names and their 88 `@id`
  diffs reach 0 (report each row's residual).
- Given a diagram without `set separator`, then edge ids are byte-identical (unit test).
- Given a self-loop or collision-scoped endpoint (`SCOPE_KEY_SEP`), then the bare name matches the jar.
- Given component/usecase/unknown/c4 surveys before → after, then 0 losses; movers named.

**Observability:** N/A. **Rollback:** Reversible.
