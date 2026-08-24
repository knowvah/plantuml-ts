# Batch 2 — two clean over-claims

Two tasks, parallel: their write-sets are disjoint and neither consumes the
other's output. Together they close **25** of the 75.

Both are the same shape — an engine claiming a `@startuml` source it has no
business claiming — and in both cases the fixtures land on the right engine
once it declines (measured; see the table in
[../README.md](../README.md#the-lesson-that-shapes-every-task)).

**T3 is in this batch, ahead of its blast-radius position, deliberately.**
Two fixtures in *later* batches fall through to json/yaml when their own
over-claimer is narrowed — `sequence/dugeki-47-celo546` (T2's bucket) and
`sequence/repudi-21-rovo448` (T4's bucket). Landing T3 first means those two
close with their own tasks instead of being scored as failures.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T2 | [Activity's swimlane pattern](T2-activity-swimlane.md) | typescript-pro | `src/diagrams/activity/index.ts`, `tests/unit/activity/accepts.test.ts` | T1 | [x] |
| T3 | [json/yaml brace claims](T3-json-yaml-braces.md) | typescript-pro | `src/diagrams/json/index.ts`, `src/diagrams/yaml/index.ts`, `tests/unit/json/accepts.test.ts` | T1 | [x] |
