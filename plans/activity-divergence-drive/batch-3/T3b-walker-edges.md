# T3b — walker edges: hasPointOut gate, Snake merge, partition title, note spike

Agent: typescript-pro, worktree `add1-T3b`. Commit per mechanism: `fix(activity): <mechanism>`.

## Context
(1) `tile-coordinates.ts` `gtile-top-down` case pushes the sibling edge with no `hasPointOut()` gate (every other walker has one) — T2b row 28; the jar's `FtileFactoryDelegatorAssembly.assembly` returns without a connection when `geo.hasPointOut() == false` (`FtileFactoryDelegatorAssembly.java` ~70). (2) Touching edges fused by `Snake.merge` (`Snake.java:303-327`) — one polyline, one arrowhead (becaje/jecoxu/bocaga, row 29(d)). (3) partition title not threaded onto the composite node pushed at `tile-coordinates.ts` (~319) — T2f row 31. (4) `node.spikeTip` is set nowhere, so `renderNote`'s Opale spike branches are dead (cubida/vimoxa/norire) — compute it where the note is placed (`FtileWithNoteOpale`).

## Rows (b2)
- **gtile-top-down sibling edge lacks hasPointOut() gate (InstructionList/FtileFactoryDelegatorAssembly hasPointOut)**: `fivama-51-cusa142`, `gevaxi-80-tone223`, `nexitu-74-luga914`, `piruxe-91-zivi081`, `poraji-17-goke817`
- **touching edges not fused (Snake.merge, Snake.java:303-327)**: `becaje-01-vaji284`, `bocaga-53-nale241`, `jecoxu-17-zama003`
- **partition title not threaded onto the composite node**: `caciva-80-kene990`
- **note spike tip never computed (Opale getPolygonLeft/Right dead)**: `cubida-55-meku256`, `norire-15-taka956`, `vimoxa-78-zucu656`

## Write-set
`src/diagrams/activity/layout/{tile-coordinates,edge-point-dedupe,walk-fork-branches}.ts`, the tests exercising them, new tests (names unique to T3b).

## Acceptance
- Each mechanism quoted from the Java (file:line), ported at its origin, applied to every fixture it governs, pinned by a test.
- Assigned rows' diffs from it go to 0, or the row is re-slotted with mechanism + owning file.
- 0 unexplained risers (shown from the diff); 55 pinned goldens byte-equal.

Rules: see `overview.md`.
