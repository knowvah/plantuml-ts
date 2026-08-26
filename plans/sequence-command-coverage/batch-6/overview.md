# Batch 6 — Exo render

One task, alone. It writes `renderer-message.ts` and `renderer-arrowhead.ts`,
both of which batch 5 tasks own — so it cannot join that batch, and exo render
is the last link in the strictly-sequential exo chain (T13 parse → T14 layout →
T17 render).

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T17 | Draw exo arrows from border-anchored geometry | `renderer-message.ts`, `renderer-arrowhead.ts`, tests | T14, T15, T16 | [ ] |

## Batch gate

Four standard gates, plus every ratchet rise carrying a T4 verdict.

This is where the mission's largest bucket (~77 fixtures) stops rendering badly
and starts rendering. Expect a large number of falls. Falls are logged
`[IMPROVED]`, need no adjudication, and are re-pinned in T19.

## Batch close

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch 6"
```
