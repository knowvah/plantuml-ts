# T9 report (orchestrator transcription; the worktree file was a stub)

Commits on codd/T9 (base ecdaea5b2): 867ba1fd7 `fix(description): emit self-loop edges to the dot graph`
(layout-dot-tree.ts: removed `if (fromRes.dotNodeId === toRes.dotNodeId) continue;` at :422; new
codd-t9-self-loop.test.ts; xagonu pin in description-svek-wrappers.test.ts now asserts layoutParity equal),
c533b52cd `fix(description): carry quantifier text to taillabel/headlabel` (link-edge-attrs.ts
applyQualifierLabels; codd-t9-port-labels.test.ts). Core untouched. Typecheck/eslint/prettier clean.

- Self-loop drop is GENERAL: any description link whose endpoints resolve to one DOT node (leaf self-loop,
  group auto-link via `clusterN-anchor`) was skipped. lufano/pavuso conform because their sources route through
  the class-family builder. Java: `SvekEdge.java:1291-1293` (isAutolink), `abel/Link.java:341-352`
  (isAutoLinkOfAGroup), `SvekEdge.java:863` (group auto-link draw shift), marginLabel 6 `:372-373`.
- xagonu: jar 24 edges, ours 22; missing `sh0050->sh0050` (tapp ==> tapp, minlen=2, xlabel 139x38, jar
  svek-1.dot:74) and `zaent0019->zaent0019` (mapp --> mapp, minlen=1, xlabel 142x25, :77). Native == dot-engine on
  the jar DOT; builder with the skip removed == native (bb 1044x1316). dotEqual/layoutParity → equal.
  render-diff 191/586 → 45/887. Residuals: (a) `\r` alignment-escape prefix kept in label text (g[26..29]);
  (b) edge draw order (obc-to-mapp before obc-to-aep/aep-to-obc); (c) canvas width 1004 vs 1049.
- #12 port labels: Java `SvekEdge.java:447-468`; core `graph-layout-build-edges.ts:214,217` needs the text;
  fetefi/nofunu/purevo builder == native incl. tail_lp/head_lp, layoutParity equal, dotEqual true. misube:
  tail_lp present but node order differs (jar B,C,A; ours A,B,C; `GraphvizImageBuilder.java:226-227` printGroups
  before unpackaged entities) → T8. After render-diff: purevo 1/0, fetefi 3/2, nofunu 23/4, misube 1/19.
  Quantifier text ("1", "*") not drawn yet (renderer-edge/SvekEdge).
- Surveys (/private/tmp/claude-501/codd-T9/): component 127/53/86 unchanged; usecase 37→38 (bootstrap-0 timeout →
  conformant, load flake); unknown 450/40/335 unchanged (xagonu dotEqual/layoutEqual true; jafexe maxDelta
  383.7 → 273.2); c4 unchanged. 0 losses. New layout-equal row: unknown/xagonu-36-sudi116.
- Tests: 64 files, 1631 passed; layout-parity ratchet green. Stretch #11 not attempted.
