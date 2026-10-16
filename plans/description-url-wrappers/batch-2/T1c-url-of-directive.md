# T1c — `url of|for X is [[…]]` (Family A)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T1c`.

## Context
`classdiagram/command/CommandUrl.java` (registered for description at `DescriptionDiagramFactory.java:120`):
regex `:62-75` (`url`, optional `of|for`, CODE, optional `is`, `UrlBuilder.MANDATORY`); `executeArg`
`:86-102`: `quarkInContext` (`:91`), error when absent (`:93-94`), `entity.addUrl(url)` (`:100`, replaces).
Port: `command-table-directives.ts:62-76` matches, handler `:268-290` checks `nodesById` but never stores
the url (and its comment at `:263` saying `addUrl` has no observable effect is wrong — fix it).

## Task
Store the raw token on the resolved node (`node.url`, T1a's field; D4). Mirror `quarkInContext` scoping
for a qualified or scoped name, and the jar's error for an unknown name (keep the existing error path if
it already matches; render a jar probe to confirm).

## Write-set
`src/diagrams/description/command-table-directives.ts`; `tests/unit/description/**`.

## Acceptance
- Given component/givape-84-xano421 (`url of APP is [[http://tomcat.apache.org/]]`) and
  component/tukipe-82-ziva562 (`url for Foo is [[…]]`), then the named node carries the token.
- Given a node that already has an inline url, then `url of` replaces it (`addUrl`).
- Given an unknown name, then the jar's behaviour (probe), pinned by a test.

**Observability:** N/A. **Rollback:** Reversible.
