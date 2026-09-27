# T9 — namespace identity

**Agent:** typescript-pro (opus — S-1b needs a restructure) · **Depends on:** T0 · wave 1, parallel with T7, T11 (worktrees).
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

sugifi-33-xefe083, sumule-00-pefa744, xumofu-43-fode658, rojoxi-79-vimu822

## Mechanisms

Read `plans/class-divergence-drive-2/.agent-notes/cdd2-T7.md` (S-1, S-1b, S-12) and cdd2 journal row 17.
- **S-1** sugifi, sumule: upstream `AbstractEntityDiagram#packSomePackage`
  (`classdiagram/AbstractEntityDiagram.java:85-106`, gated
  `ClassDiagram.java:84-85`) marks a single-child group `packed` AFTER uids
  are minted (`Entity.java:717-741`); DOT emission skips a packed group's
  subgraph (`ClusterDotString.java:76-82`). We collapse the qualifier at
  resolve time (`class-namespace-resolve.ts:418`), so one tick is never
  minted. Port: create the namespace, mark it packed, skip it in DOT and
  draw, keep the uid (prior D7 dense re-numbering with phantom slots stays).
- **S-1b** xumofu: `CommandLinkClass.java:320-333` resolves BOTH endpoints'
  quark chains (no tick) before creating either missing leaf; we
  resolve+create+sweep per endpoint. Port the two-phase order.
- **S-12** rojoxi: `collapseEmptyNamespace` (`class-namespace.ts`) copies
  the stereotype but never `ns.color`; `renderer.ts#renderEmptyPackageLeaf`
  builds a `NamespaceGeo` without colour. Port the colour carry.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-namespace-resolve.ts`, `class-dot-clusters.ts`, `ast.ts`, `class-ensure-classifier.ts`, `class-command-relationships.ts`, `class-namespace.ts`, `renderer.ts`, `renderer-uid.ts`; tests beside each; `.agent-notes/cdd3-T9.md`.

## Interface contracts

- None consumed by other tasks.

## Acceptance criteria

- Given sugifi, sumule, xumofu, when rendered, then every `@id` equals the jar's, and a unit test asserts the uid sequence citing the Java line that burns each tick
- Given rojoxi, when rendered, then its empty-package fill equals the jar's
- Given class DOT parity, when run, then it stays green (packed groups emit no subgraph, as upstream)

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
