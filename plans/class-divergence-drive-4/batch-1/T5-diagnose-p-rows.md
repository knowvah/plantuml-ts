# T5 — diagnose jakapi, lecelo, gujigi, ririlu (D8)

Read-only on `src/`. For each fixture, write `../diagnosis/<slug>.md` with:
mechanism, Java `file:line` QUOTED, ts `file:line`, causal chain, ruled-out
(with evidence), probe command + output, fix-shape write-set, confidence.
Grep `~/git/plantuml/src/main/java/net/` (not only `net/sourceforge/`).
Start from the cdd3 leads:
- **jakapi-64-tine258** — `together` cluster fixed (E1-6, T18);
  `groupInheritance` HashSet order ported (T32). The residual is a +3.763 px
  ink term with no explanation. Re-measure first: T-D3 changed the 2-dp
  inputs the HashSet keys on (`plans/class-divergence-drive-3/fixtures.md`).
- **lecelo-92-loma110** — `<:label:>` inside a quoted classifier name: the
  jar drops it, we render an emoji. Find the Java call site (Display /
  creole emoji parse / `CommandCreateClass` name handling) that decides this.
  The cdd3 T23 agent did not locate it.
- **gujigi-63-roki030** — after E3-13/E3-14 it is structural-match. The
  residual is `constraint on links` labels placed from a stale pre-shift frame
  (`plans/class-divergence-drive-3/diagnosis/E3.md#gujigi`, journal 53–54).

- **ririlu-13-zipi740** — added by T0d. On 1.6.1 its raw layout
  byte-matches real dot (gvi 19 fixed). The residual is the B-6 Kal stall
  (`LineOfSegments.java:89-111` runs out of passes;
  `src/diagrams/class/class-kal-overlap.ts:73-89`), recorded UNRESOLVED in
  `plans/class-divergence-drive-3/diagnosis/B.md`. Re-measure it on the 2-dp read first: B-6 was
  attributed to 1e-14 float dust, which T-D3 may have removed.

Then write the batch-2 task specs `../batch-2/T8-jakapi.md`,
`T9-lecelo.md`, `T10-gujigi.md` (and `T12-ririlu.md` if a fix is needed) from the fix shapes (same format as
batch-1 specs). Collapse any that share a primary, and update
`../batch-2/overview.md`. A fixture with no mechanism gets no fix task:
`final = open -> <owner>`.

**Acceptance.**
- Given each diagnosis, then it quotes Java and records a probe.
- Given the batch-2 overview, then primaries are disjoint or the tasks are
  collapsed.

**Observability** N/A. **Rollback** Reversible.
