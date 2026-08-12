# T1 — Isolation-matrix measurement

## Context

plantuml-ts (`/Users/scottseely/git/plantuml-ts`). graphviz-ts is the
pinned layout library (`file:../graphviz-ts/*.tgz`, source readable at
`/Users/scottseely/git/knowvah/dot-engine` — READ-ONLY, never modify). Real
`dot` 15.1.0 is ground truth. Vitest; probes via `npx tsx`.

## Prior observations (verified — do not re-discover)

- G6 attempt 3 (journal 2026-07-22 "batch-4 retry-3" row): with the
  issue-08 naming fix (rank subgraphs named NOT starting `/^cluster/i`,
  child of the cluster's own builder handle), bitaxo `C` measured
  42×101.72 BYTE-EXACT vs jar. pesita `AA` measured 55×293.61 (target
  126×104.72); kotagu `CompositeState` 248×398 (target 289×358).
  pesita's sink node `aa_ok_ex` landed y=493.25 vs its cluster anchor
  y=301.64 — 191px apart.
- Discriminator: bitaxo's cluster is the ONLY one with no other `ee`
  content, no `${id}i` wrapper, no parent cluster. pesita's `AA` is
  nested inside `nasreq_auth` AND has `groupTouched=true` (i-wrapper
  fires). kotagu's `CompositeState` has a pseudo-node
  (`__init_CompositeState`) + a nested `SubComposite` cluster in `ee`.
- Issue 08 (`docs/graphviz-issues/08-...md`) verified: text path
  matches real dot to the digit on the un-nested repro AND on pesita's
  full cached `svek-3.dot` (cluster15 148×118.72). Builder path
  matches when rank-subgraph names don't start with `cluster`
  (case-insensitive; `isACluster`, graphviz-ts
  `src/layout/dot/rank.ts:87-91`).
- Correct builder sequence (issue 08 Resolution): cluster handle `c`;
  `c.addSubgraph('sink_group_N', {rank:'sink'}).addNode(id)`;
  `c.addNode(id, {...})`; `c.addSubgraph('cluster15ee', {label:''})
  .addNode(anchor)`. Order-independent.
- Jar DOT shape reference: G6 `batch-4/withlabel-derivation.md`
  Rounds 1-2 (rankSpec, iWrapperSpec, `${id}ee` structure).
  Real cached DOT: `test-results/dot-cache/state/pesita-10-dene726/
  svek-3.dot` (nested + i-wrapper), `.../kotagu-43-miza629/` (ee
  content), `.../bitaxo-18-tamo974/` (control).

## Task

Build the D1 matrix. Cells (each a minimal DOT graph + its exact
builder-call equivalent):

- C0 control: cluster + rank group + bare anchor in `ee` (bitaxo
  shape — must reproduce issue 08's known-good agreement).
- C1 = C0 + `${id}i` wrapper inside `ee` around the anchor.
- C2 = C0 + a nested child cluster inside `ee`.
- C3 = C0 wrapped in a parent cluster.
- C4 = C0 + a non-border pseudo-node in `ee`.
- Add compound cells (e.g. C1+C3 mirroring pesita; C2+C4 mirroring
  kotagu) if single-variable cells all agree — push-forward.

For each cell measure THREE ways: (1) real `dot -Txdot` on the DOT
text; (2) graphviz-ts DOT-text path (`parse` → layout → `getLayout`);
(3) graphviz-ts programmatic builder. Record cluster bbox (w×h) and
the ranked node's y. Also re-run the winning/losing variants against
pesita's and kotagu's real cached svek DOT via the text path as
end-anchors.

## Write-set

NONE committed. Probes `scripts/_tmp-g7-t1-*.ts`, deleted before
finishing; `git status` clean of src/tests at finish.

## Interface contract (consumed by T2 and T4)

Matrix table, machine-readable: cell → {realDot: w×h,y | textPath:
w×h,y | builder: w×h,y | agree: yes/no}. Plus: the minimal cell(s)
where builder first diverges from text path, and a one-paragraph
mechanism statement (which graphviz-ts code path, file:line, causal
chain, ruled-out list — diagnosis.md discipline).

## Acceptance criteria

- Given C0, when measured, then all three paths agree (harness valid).
- Given the matrix, when read, then the first-breaking variable is
  identified and a usage-vs-library verdict follows without further
  measurement.
- Given the verdict, then it is demonstrated by cell output, not
  asserted.

## Boundaries

- Never modify ../graphviz-ts, goldens, size-backlog, or src/.
- No git mutations. If no decisive verdict within budget: return
  ruled-out list + next instrumentation, marked NO-MECHANISM (README
  stop cond. 5).
