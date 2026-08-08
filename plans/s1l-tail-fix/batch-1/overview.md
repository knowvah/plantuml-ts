# Batch 1 — F1-a / F1-b / F1-c

Three fully parallel tasks, disjoint write-sets. Closes 9 fixtures outright
(F1-c books 0 alone — see its row). **321 → 330/351.**

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [F1-a](F1-a-measurenote-rebuild.md) | G2 `measureNote` rebuild — route the note body through `BodyFactory.create3`→`BodyEnhanced2` | typescript-pro | `src/diagrams/description/leaf-sizing.ts`, `src/diagrams/description/renderer-entity.ts`, `src/core/klimt/creole/legacy/CreoleParser.ts` | — | [x] |
| [F1-b](F1-b-parser-openers.md) | G1 + G8 + G9-E1 parser — TYPE0 open-quote opener, body-line trim, multiline-open stereotype capture | typescript-pro | `src/diagrams/description/parser.ts`, `src/diagrams/description/parse-helpers.ts`, `src/diagrams/description/parse-state.ts` | — | [x] |
| [F1-c](F1-c-openiconic-table.md) | G11 OpenIconic glyph table — extend `RAW_GLYPHS` toward upstream's full set | typescript-pro | `src/core/openiconic-glyphs.ts`, `src/core/creole-atoms-openicon.ts` | — | [x] |

## Fixtures closed this batch

| Task | Fixtures | Count |
|---|---|---|
| F1-a | `xufexu-38-fola855`, `pivudu-29-pele178`, `tijexo-10-zipo222`, `kovaxi-11-reti348`, `zidebi-71-nocu387` | +5 |
| F1-b | `pecupa-75-zote612`, `tajadu-40-juro990`, `nixura-77-bina738`, `vixeni-34-nici683` | +4 |
| F1-c | none alone — `vivido-49-nisu863` closes in F2-c (batch 2) once its M3 url-label-sprite half also lands | +0 |

`fariba-82-xolu802` gets a **partial** fix in F1-b (E1 only — the stereotype
capture). It does **not** close: E2 (tab-stop advance) is F4-c, and F4-c is
itself conditional on the undiagnosed `sh0006` residual (SYNTHESIS §4) —
do not report `fariba-82` as closed from this batch.

**Running total after this batch: 330/351.**

## Why these three are parallel-safe

Zero write-set overlap: F1-a touches `leaf-sizing.ts` /
`renderer-entity.ts` / `CreoleParser.ts`; F1-b touches `parser.ts` /
`parse-helpers.ts` / `parse-state.ts`; F1-c touches
`openiconic-glyphs.ts` / `creole-atoms-openicon.ts`. No file appears in two
tasks' write-sets. See `../diagrams/component-map.md` for the full-mission
ownership map and `../diagrams/data-flow.md` for F1-a's proposed
`measureNote` call sequence.

## Quality gates (run after all three land, before commit)

```sh
npm test
npm run typecheck
npm run lint
npm run build
npx tsx scripts/measure-description-size-deltas.ts   # expect 321 → 330/351, widened 0
npx tsx scripts/audit-size-metric-identity.ts
```

Never pipe a gate — capture `$?` directly (`../README.md`). `widened > 0` on
any ratchet is a stop condition, not a warning.

## Orchestrator steps after gates pass

1. Delete the 9 closed pins from
   `oracle/goldens/description/size-backlog.json` (ADR-1 — no task itself
   writes this file).
2. Commit the batch (merge or single commit per task per
   `../README.md`'s "One commit per task, referencing the task ID").
3. Append one decision-journal row per task reporting its closed pins.
4. Compact, then proceed to Batch 2 (F2-a/b/c).
