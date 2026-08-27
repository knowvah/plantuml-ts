# Batch 2 — AST migration

One task, alone, because it touches every layer at once.

This is the mission's pivot. The data model is designed **once**, from the
measured bucket list, so that no task in batches 3–6 needs to edit `ast.ts` —
which is what lets those batches run in parallel. Fields land declared and
unread; later tasks fill them.

| ID | Description | Writes | Depends On | Done |
|---|---|---|---|---|
| T6 | `ArrowConfiguration` + `MessageExoEvent` + all new fields; `MessageStyle` deleted | `ast.ts`, `sequence-parse-helpers.ts`, `sequence-arrowhead.ts`, `renderer-message.ts`, `sequence-layout-message.ts`, `command-arrow.ts`, 2 test files | T1, T2, T5 | [x] |

## Batch gate

Beyond the four standard gates: **zero ratchet movement**, and refusal/routing
SLI counts unchanged at 163 / 195. This is a representation change, not a
behavior change. Any movement means the translation was not faithful.

## Batch close

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch 2"
```
`ast.ts`'s export list changes, so catalog drift is guaranteed.
