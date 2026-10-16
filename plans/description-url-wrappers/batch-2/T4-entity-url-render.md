# T4 — node URL into the geo; entity `<a>` at render (Family A)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T4`.

## Context
The jar draws an entity URL as one `<a>` around the entity's shapes and text, inside the entity group:
`EntityImageDescription.java:139` (`getUrl99`), `:304-305` (`startUrl`), `:327-328` (`closeUrl`). Core
already does it from `entity.url` (`core/svek/image/EntityImageDescription.ts:138-141,413-419`), but
`renderer-entity.ts:155` passes `url: null`. Ports draw through `EntityImagePort` (no url in Java; keep
`drawPortFallback` without `<a>`). Geo copy pattern: `layout-helpers.ts:228` (`stereotypeSprite`),
`layout-dot-tree.ts:536,577`, `layout-types.ts:27`, `layout-helpers-types.ts:28-44`.

## Task (D4)
1. `DescriptionNodeGeo.url?: { url: string; tooltip: string }`, for leaves AND containers (T5 consumes it).
2. Build it once at the layout seam from `node.url` (T1a) with `new UrlBuilder(theme.topurl ?? null,
   UrlMode.STRICT).getUrl(token)`, copying to a plain object (`Url.ts` has private fields).
3. `renderer-entity.ts:155`: `url: node.url ?? null` (shape matches `EntityUrl`).
4. Check `description-elk-adapter.ts`: if ELK geo needs the url too, report it (not your file).

## Write-set
`src/diagrams/description/{layout-types,layout-helpers,layout-helpers-types,layout-dot-tree,renderer-entity}.ts`
(`layout-helpers-types.ts`: node types only); `tests/unit/description/**`.

## Interface contract (consumed by T5)
`DescriptionNodeGeo.url?: { readonly url: string; readonly tooltip: string }` — set for any node (leaf or
container) whose AST node has `url`.

## Acceptance
- Given gacida, lizutu, sadeja and kolibo (and givape, tukipe, jazabe once T1b/T1c are merged — measure at
  the close), then the entity `<a>` wraps the shapes inside the entity group with the jar's `href`/`title`;
  sadeja's `title="This is Dog"`.
- Given a port with a url, then no `<a>` (mirrors `EntityImagePort`).
- Given `skinparam topurl http://base/` and `component a [[page]]`, then `href` matches a jar probe.
- Given component/usecase/unknown/c4 surveys before → after, then 0 losses; movers named.

**Observability:** N/A. **Rollback:** Reversible.
