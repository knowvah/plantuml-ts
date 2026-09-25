# T10 — link note paint

**Agent:** typescript-pro (opus — five mechanisms) · **Depends on:** T7, T11 · wave 2.
Prompt = [`fix-task.md`](../fix-task.md) + this file.

## Fixtures

xoxuni-96-fere626, nuvake-96-gofe203, rakuci-96-tuti371, guxode-39-dobi371, lipazi-06-care921, lozego-15-coci435

## Mechanisms

Read cdd2 `.agent-notes/cdd2-T7.md` (S-4t, S-11), `cdd2-T8.md` (S-6),
`cdd2-T19c.md` (note ink walk, gradient stop), journal rows 17, 21, 46.
- **S-4t** xoxuni, nuvake: the `;text:COLOR` half of a link's trailing
  colour (`CommandLinkClass.java:368`, `ColorParser.simpleColor`) needs a
  `Relationship` field (`class-relationship-ast.ts`) set by
  `class-relationship-parser.ts:241-247` and drawn on the link label.
- **S-11** rakuci: a descriptive-container `[[url]]` never calls
  `setNamespaceUrl` (`class-command-containers.ts`); the jar wraps the
  whole container in one `<a>`.
- **S-6** guxode: `class-namespace-folder-outline.ts#renderFolderPolygon`
  (strictuml sharp-corner folder) emits `stroke` via `shortenColor` with no
  colour resolution (unlike its `path()`/`line()` siblings). Also diagnose
  guxode's Δ0.014 on g[14] (not the cluster clip).
- **Note ink** lipazi, nuvake, lozego: `class-ink-box.ts#buildInkBox` never
  walks `EdgeGeo.noteBox` (canvas shortfall; the DOT reservation 174×46
  already equals `svek-1.dot`).
- **Gradient stop** lozego: the jar shortens a gradient stop colour to 3
  hex digits when representable (`klimt/drawing/svg/SvgGraphics.java:545-554`);
  `core/paint.ts` does not.

## Primaries (D4 — extend into any other `src/` file no concurrent task owns; name it in the commit body)

`src/diagrams/class/class-relationship-ast.ts`, `class-relationship-parser.ts`, `class-command-containers.ts`, `class-namespace-folder-outline.ts`, `class-ink-box.ts`, `renderer-edge.ts`, `src/core/paint.ts`; tests beside each; `.agent-notes/cdd3-T10.md`.

## Interface contracts

- None consumed by other tasks.

## Acceptance criteria

- Given the six fixtures, when rendered, then structural diffs are 0 and remaining numerics are attributed
- Given `core/paint.ts`'s gradient change, when every engine is surveyed vs the T0 baseline, then movers are explained (≤ 20)
- Given the 607 conformant fixtures, when render-all runs, then none leaves conformant

## Observability · Rollback

N/A — no new observable operations. Reversible (revert the commit).
