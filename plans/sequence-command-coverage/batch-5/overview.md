# Batch 5 — Layout and arrow render

Three parallel tasks, disjoint write-sets. This batch turns the fields parsed
in batches 3–4 into geometry and ink.

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T14 | Exo layout: border-anchored x, diagram-width participation | `sequence-layout-exo.ts`, `layout.ts`, `sequence-layout-events.ts`, tests | T13 | [ ] |
| T15 | Dressing render: `o`/`x` heads, half-heads, inclination | `sequence-arrowhead.ts`, `renderer-arrowhead.ts`, tests | T12 | [ ] |
| T16 | Lifecolor, url, stereotype render | `renderer-message.ts`, `sequence-layout-message.ts`, tests | T12 | [ ] |

Write-sets were checked: T14 is layout-only, T15 owns both arrowhead modules,
T16 owns `renderer-message.ts`. **T17 (batch 6) writes `renderer-message.ts`
AND `renderer-arrowhead.ts`**, which is why exo render cannot join this batch.

## Batch gate

Four standard gates, plus every ratchet rise carrying a T4 verdict, with
`regression` and `inconclusive` diagnosed to a `file:line` mechanism.

Expect **falls** here — this is the first batch that improves ink rather than
only unlocking parse. Falls are logged `[IMPROVED]`, need no adjudication, and
are re-pinned in T19.

## Batch close

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch 5"
```
