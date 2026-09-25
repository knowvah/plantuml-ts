# cdd3-T14 — creation-order DOT emission (E1-1, E1-4, C-14 = E3-7)

## Observation: `git stash` is shared across worktrees; concurrent stashes swap work
- **Context**: Surveying object/unknown on the pre-change tree with `git stash -u` / `git stash pop`, while T17 ran the same pattern in its sibling worktree.
- **Finding**: `refs/stash` lives in the common git dir, so all worktrees share one stash stack. Order of events: T17 stash `9d491796` was pushed on top of T14's `a8597ca2`. T14's `pop` then took T17's stash, and T17's `pop` took T14's. Each worktree ended up with the other's changes. Both stash commits still exist as dangling commits: T14 `a8597ca2`, T17 `9d491796` (also `39b8bdf1`).
- **Impact**: Parallel worktree tasks must never use `git stash` for a baseline. Use `git worktree add <tmp> HEAD` (or `git diff > patch; git checkout .; ...; git apply patch`) instead. To recover, run `git stash apply <sha>` against the dangling commit.
- **Confidence**: High (reflog-free `git fsck` timestamps and diff contents match the swap exactly).

## Observation: the jar's DOT root order is `computeLeafDrawOrder`, notes included
- **Context**: E1-1 (xitobu, nuxoni).
- **Finding**: `GraphvizImageBuilder.java:226-227` prints the muted root EMPTY_PACKAGE inside `printGroups` (`:416-418`), before the unpackaged leaves. It then prints the unpackaged leaves in `getLeafs()` creation order (`:399-405`). `class-leaf-order.ts#computeLeafDrawOrder` already produced that order for drawing. Sorting the DOT nodes by it makes xadado's DOT byte-identical to the jar's `svek-1.dot`, cluster names aside.
- **Impact**: DOT node order and leaf draw order now share one source.
- **Confidence**: High.

## Observation: note links belong to the one `getLinks()` list
- **Context**: C-14 / E1-4 (puvono, dibinu, vudepo).
- **Finding**: `CommandFactoryNoteOnEntity.java:360` adds the note link at the time the note is created. Magma links are added last (`ClassDiagram.java:87`). `getOrderedLinks` (`CucaDiagramFileMakerSvek.java:90-96`) runs over the whole list. The same list sets both DOT edge order and draw order (`GraphvizImageBuilder.java:229`, `Bibliotekon#allLines`). `class-link-order.ts` computes this list once. Each note group carries its slot (`NoteGroup.linkSlot` → `NoteGeo.linkSlot`), and one `interleaveNoteLinks` helper serves both the DOT side and the renderer.
- **Impact**: I probed the rest with C-15 (Opale guard) simulated: vudepo and lejoga reach 0/0 with no link re-sorting. Adding C-16 (TOP order) brings pejone and xonamo to 0/0.
- **Confidence**: High (probe-order.mts with NOSORT=1).

## Observation: an existing unit test had pinned the pre-T14 (non-jar) position
- **Context**: running full `npm test`
- **Finding**: `tests/unit/class/class-empty-package-no-cluster-box.test.ts` pinned the Empty folder icon at x=97..157 (to the right of `B`). I ran the same source through `scripts/oracle-render.sh`: the jar's svek-1.dot has sh0011 = Empty and sh0012 = B, and its in.svg draws `<text x="10" ...>Empty`. The new output puts the icon at x=6..66 with its text at x=10, which matches the jar. I re-pinned the test to that and cited the jar evidence in its comment. My local render of this source compares against the jar output at S 0 / N 0.
- **Impact**: the test had been checking this port's own old output, not the jar's.
- **Confidence**: High

## Observation: timeouts under a host load average of about 200 are not failures
- **Context**: two full `npm test` runs while sibling worktrees were busy
- **Finding**: the second run added three oracle tests that failed by timeout (description-parity ratchet at 5 s, and refusal/routing corpus completeness at 120 s). Each passed when re-run on its own: 357/357, and 1726 passing together with the other two.
- **Confidence**: High

## Final report (cdd3-T14)

Commit: the single commit on `wt/cdd3-T14` (`git log -1 wt/cdd3-T14`), subject `fix(cdd3-T14): creation-order dot nodes, note links, magma last`.

### Gates
- `npm test` (full run): the only failures left are the 5 known stdlib/sprite worktree files (stdlib-packages, stdlib-all-exports, stdlib-package-files, sprite-package-files, stdlib-remote-e2e). The three timeouts described above passed on re-run. `catalog.test` failed until I ran `npm run catalog`; `docs/catalog.md` is regenerated and in this commit. `class-empty-package-no-cluster-box` is re-pinned to the jar (see above).
- `npm run typecheck`: pass. `npm run lint`: pass. `npm run build`: pass. Prettier: clean.
- `tests/oracle/class-dot-parity.test.ts`: 721/721. `declaration-order-parity`: pass (991 together with class-dot-parity).

### Fixtures (S/N, render-diff, before -> after)
- Closed to 0/0: xitobu 0/58, nuxoni 0/130, dibinu 0/345.
- Improved:
  - puvono and sekame: 2/918 -> 0/1. The remaining N1 is C-13 (D3, Δ0.017).
  - xoteci: 7/69 -> 7/0. The remaining S is E3-8 (note LineColor/LineThickness).
  - temise: 40/337 -> 40/40. The remainder is E3-21, the scope guard that makes us draw an extra lnk25.
  - xonamo: 220/1066 -> 219/1057.
- Unmoved: vudepo 84/402 and lejoga 90/410 need C-15 (T15). With C-15 simulated by probe, both reach 0/0.
- pejone: 220/1028 -> 219/1057, a numeric rise. The layout fix is only partial until C-15 and C-16 land. With both simulated by probe, pejone and xonamo reach 0/0.
- ziparo (not a T14 fixture): 0/58, unchanged (E1-8).

### Movers (render-all, 723 rows, every change)
- dibinu, nuxoni, xitobu: to conformant (E1-4 / E1-1).
- puvono, sekame: to structural-match (C-14).
- temise and xoteci: numeric fell (C-14).
- pejone and xonamo: see above.
- xadado-92-lazo250: 0/352 -> 0/185 (C-14). Our DOT now matches the jar's; the remaining Δ1 y and 34 px width are not attributed yet, and the likely cause is the unwired `{{ }}` embedded note.
- No row left conformant.

### Other engines (survey pre vs post)
- object: no change.
- unknown:
  - judelo-10-teca860: diverged -> structural-match (E1-1).
  - bijufi-98-xafa015: maxΔ 140.5 -> 78 (E1-1).
  - cejegu-93-kobo234: maxΔ 237 -> 0 (C-14).
  - rilere-84-seba785: maxΔ 81 -> 0 (C-14).

### Write-set
- Primaries: class-dot-graph.ts, class-magma.ts, core/svek-dot-sequence.ts, and the link draw site, class/renderer.ts.
- renderer.ts is also a T21 primary, so I kept that edit to the edge loop only.
- class-namespace.ts is not edited.
- D4 extensions: core/graph-layout.types.ts (`printGroupsOrder`), class-leaf-order.ts, class-dot-edge-order.ts, class-dot-edges.ts, class-edge-geo.ts, note-layout-groups.ts, note-layout-types.ts, note-layout-tip.ts, and tests/unit/class/class-empty-package-no-cluster-box.test.ts.
- New files: class-link-order.ts, class-creation-order.ts, and the tests class-creation-order-dot.test.ts and svek-dot-sequence-print-groups.test.ts.
