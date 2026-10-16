# Batch 1c — description lane: deroxu (item 28)

Sequential after batch 1b. T6a's census decides how many family tasks follow (D4). Use the T6b template
for each family, in descending count; the orchestrator adds T6f+ rows here. Close-procedure A runs after
each task.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6a | Classify every deroxu diff into mechanism families | general-purpose (read-only on `src/`) | `measurements/deroxu-families.json`, `.agent-notes/gtc-T6a.md` | T5b | [ ] |
| T6b | Family 1 (expected: title / legend placement and order) | typescript-pro | per census | T6a | [ ] |
| T6c | Family 2 (expected: `Shadowing<<package>>` `<defs>` filter) | typescript-pro | per census | T6b | [ ] |
| T6d | Family 3 (expected: stereotype-scoped skinparams under `hide stereotype`) | typescript-pro | per census | T6c | [ ] |
| T6e | Family 4 (expected: `@id` / remaining) | typescript-pro | per census | T6d | [ ] |

The "expected" labels come from planning (the first diffs and the `in.puml` features). The census
replaces them.
