# Batch 4 — how a block gets typed at all

One task, alone. `src/core/block-extractor.ts`'s `detectUmlType` types
**every** `@startuml` block in the corpus — 3039 of 3158 fixtures — and its
result is both the input to the dispatcher's fast path and the fallback when
no plugin accepts. Nothing else shares a batch with it.

Two distinct mechanisms, same file, same nine fixtures. They are specified
separately in the task because they are separate defects; whether one change
closes both is for the task to establish, not assume.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T5 | [`detectUmlType` window and signals](T5-detect-uml-type.md) | typescript-pro | `src/core/block-extractor.ts`, `tests/unit/block-extractor.test.ts` | T4 | [x] |
