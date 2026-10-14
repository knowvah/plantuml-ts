# T4d — description group header: sprite stereotypes, title sprites, title creole

Added 2026-10-14 (journal row 37, push-forward: a residual fix in description files that no other
task owns). It closes the last six red pins of the TIGHTENED description dot-parity ratchet, which
must be green before T1b can land on the mission branch.

Prepend [../task-preamble.md](../task-preamble.md).

## Worktree base
`dsw/T4d` = the mission branch after T4 (port, kermor and core wrappers) merged, plus a merge of
`dsw/T5`. That merge carries T1b (tightened `dotEqual`, `clusterNestingOk`), T1d (state) and the
T5 dashboard. So `tests/oracle/description-parity.ratchet.test.ts` here IS the real gate.

## The six rows (all `clusterNestingOk` on title-TABLE size; the wrapper chains already equal the jar's)
| fixture (component/) | source shape | jar TABLE | ours | family |
|---|---|---|---|---|
| lesori-32-zeve057 | `<<$sprite>>` stereo on a group | measure | 188×28 vs jar 179×34 class (T1c probe) | sprite stereo |
| ravodu-50-siso430 | same | measure | 49×9 vs 49×29 (T1c probe) | sprite stereo |
| tuliba-37-liza126 | same | measure | | sprite stereo |
| xusuxe-62-guba767 | `node "Cloudogu Ecosystem" <<$cloudogu>>` | 192×62 | 192×14 | sprite stereo |
| ruciga-77-ruja233 | sprite in the group title | measure | 196×11 vs 218×16 (T1c experiment) | title sprite |
| junoxu-15-gori632 | `<U+00B5>` creole in the title | measure | 70 wide vs 95 | title creole |

## Task
1. **Sprite stereotype** (`ClusterHeader.java:187-188`; read the whole method first). When the
   stereotype carries a sprite, the jar replaces the stereotype TEXT block with the sprite block.
   Make the shared header block (`renderer-cluster.ts#buildHeader`, which T1c's
   `descriptionClusterTitleTable` measures: one header, two consumers) build the same block. The DOT
   TABLE and the drawn header then both follow. `ContainerDesc` needs the sprite information
   (`layout-types.ts`, populated where containers are classified). Reuse the sprite-stereotype
   machinery the description LEAF path already uses for `<<$sprite>>` (find it with Serena
   `find_symbol`, read-only; do not re-derive).
2. **Title sprite / title creole** (ruciga, junoxu): the jar builds the title with `Display.create`
   through the creole sheet. Diagnose each before fixing (`~/.claude/rules/diagnosis.md`). Quote the
   Java, and state why our measured width differs. Fix it in the shared header block if the origin is
   in a description file. If the origin is in a core creole/measure file used by other engines, STOP
   (stop 1) and report the artifact.

## Write-set
- `src/diagrams/description/renderer-cluster.ts`, `description-cluster-header.ts`, `layout-types.ts`,
  `layout-classify.ts`, other `src/diagrams/description/**` files only where the stated mechanism
  lives (journal each)
- `tests/unit/description/**`
- `docs/catalog.md`

## Guards
- `tests/oracle/description-parity.ratchet.test.ts`: the six turn green and nothing else turns red.
- Layout-parity ratchet (297 pins), `tests/oracle/svg-conformance/description.golden.ratchet.test.ts`
  (51 pins) and the description diff-baseline ratchet stay green. A pin rise is stop 6: report it, do
  not re-pin.
- class/object/state oracle tests stay green.
- Component/usecase/unknown survey in the worktree (`npm run -s svg:survey -- <tree> --out <scratch>`),
  compared with `plans/description-svek-wrappers/measurements/b2-eng/` in the MAIN checkout: zero
  conformant losses, and every verdict mover listed with its mechanism. This change also moves the
  DRAWN header, so expect movers.

## Acceptance
- The six rows are green in the tightened description-parity ratchet, with the TABLE dims pinned from
  the jar DOT in unit tests.
- Render-diff before → after for the six, with a mechanism for any rise.
- One commit (two if the creole diagnosis needs its own), `fix(description): …`, quoting
  `ClusterHeader.java` lines.

**Observability:** N/A. **Rollback:** Reversible.
