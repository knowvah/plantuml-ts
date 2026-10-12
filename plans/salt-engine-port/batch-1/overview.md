# Batch 1: foundations

After batch 0 closes. Three parallel tasks in worktrees, disjoint write-sets, no
cross-dependencies. Close via [../close-procedure.md](../close-procedure.md) (no salt row
can move yet: gates, all-engine diff, journal). Every prompt = [task-preamble.md](task-preamble.md) + the task file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-data-source.md) | Terminator, Terminated, DataSource, DataSourceImpl, Position, Cell | typescript-pro (opus) | `src/diagrams/salt/{Terminator,Terminated,DataSource,DataSourceImpl,Position,Cell}.ts` | T0b | [x] |
| [T1b](T1b-strategies.md) | TableStrategy, Segment, ListWidth, Skeleton, Skeleton2, Grid2, ScrollStrategy | typescript-pro (opus) | `src/diagrams/salt/element/{TableStrategy,Segment,ListWidth,Skeleton,Skeleton2,Grid2}.ts`, `factory/ScrollStrategy.ts` | T0b | [x] |
| [T1c](T1c-element-base.md) | Element, AbstractElement, AbstractElementText, ElementEmpty, ElementText, WrappedElement, SaltDictionary | typescript-pro (opus) | `src/diagrams/salt/element/{Element,AbstractElement,AbstractElementText,ElementEmpty,ElementText,WrappedElement}.ts`, `SaltDictionary.ts` | T0b | [x] |
