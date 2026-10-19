# T5b — xagonu: edge draw order (item 29)

Prepend [../task-preamble.md](../task-preamble.md). Mission checkout. Depends on T5a.

## Context
After T5a, the remaining xagonu diffs start at `svg/g[1]/g[37]`: the jar draws `lnk39` (`obc-to-mapp`)
where we draw `lnk37` (`obc-to-aep`). The order of links in the jar's SVG comes from the jar's link list
order. Self-loops, ortho links and `left to right direction` inverted links may be re-ordered. Read the
jar's link drawing loop and how link uids are assigned. Re-measure first: T5a may change the residual's
shape.

## Task
Write the diagnosis artifact, then fix the order at its origin, with a test pinning the order on a
reduced fixture.

## Write-set
`src/diagrams/description/{renderer-draw-sequence.ts,layout-geo-post.ts,renderer-uid.ts,layout-dot-tree.ts}`,
`tests/unit/description/**`.

## Acceptance
- Given xagonu, when rendered, then `lnk` order, ids and paths equal the jar's (target 0/0). Report any
  remaining diffs with mechanisms.
- Given a reduced fixture with the same link shapes, then the link order equals the jar's oracle
  (`scripts/oracle-render.sh`).
- Given the component, usecase and unknown surveys, then there are no losses.

**Observability:** N/A. **Rollback:** reversible.
