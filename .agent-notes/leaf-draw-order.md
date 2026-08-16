# leaf-draw-order — observations

## Observation: `--check-order`'s uid-sequence signature is blind to unwrapped leaves
- **Context**: T4 diagnosing 5 "sha changed, sequence did not" offenders
  (cajicu-52, delasa-80, mujopi-30, rojoxi-79, xitobu-41).
- **Finding**: TIPS leaves and collapsed-empty-package leaves draw
  UNWRAPPED — no `<g class="entity">`, no id (`renderer-note.ts:418`,
  `renderer.ts:360`, jar-verified on `gatula-10-bifu561`) — so their
  document position is invisible to a signature built only from entity ids
  in order. The fix (`2f233a23`) adds `ink=<12 hex>` = sha1 over the SORTED
  multiset of the SVG's top-level child serialisations (order-independent
  by construction) and flattens jar's single root `<g font-family=…>`
  wrapper one level first — the first cut hashed the `<svg>`'s direct
  children without flattening, and EVERY reorder then changed the wrapper
  `<g>`'s own serialisation, producing 81 false offenders out of 81 movers.
  New rule: sha unchanged → nothing; sha changed & ink unchanged → MOVED
  (pure sibling reorder, strictly stronger than the old uid-sequence rule);
  sha changed & ink changed, or seq changed & sha unchanged → OFFENDER.
- **Impact**: Any future instrument comparing rendered SVGs for "did only
  order change" needs to hash at the right nesting level and account for
  elements that never carry an id. Reusable pattern for other diagram types
  that also flatten leaves into one wrapper `<g>`.
- **Confidence**: High (jar-verified; two measured cuts, before/after).

## Observation: an empty package prints at its GROUP slot, not the unpackaged tail — and a subagent's "verified against jar" claim was wrong
- **Context**: T5 diagnosing the daxeno-00 regression and the general
  empty-package ordering bug T4 left uncleared.
- **Finding**: jar's `printGroups` mutes an empty package to
  `LeafType.EMPTY_PACKAGE` and prints it AT ITS SLOT AMONG SIBLING GROUPS
  (`GraphvizImageBuilder.java:408-425`), never among unpackaged leaves. The
  port's pre-T5 `class-leaf-order.ts` bucketed every collapsed-empty
  namespace as a plain leaf (root-level ones fell into the trailing
  "unpackaged" bucket — wrong slot). T4's own journal row claims it
  "verified per fixture... direct SVG diff: rojoxi/xitobu now draw the
  empty package... exactly as jar" — but T5's structural fix moved
  rojoxi-79 a SECOND time, landing it back on the ORIGINAL baseline sha,
  and jar confirms that baseline order (cluster, empty package, cluster
  leaves) IS correct. So T4's claimed jar-verification on rojoxi was wrong;
  the T4-era order it called "matches jar" did not.
- **Impact**: **Verify agent claims against the actual `in.svg` bytes, not
  against a subagent's prose assertion of having done so.** A stated
  "jar-verified" is not evidence until re-checked; this mission's own
  journal shows the same agent class (T4, typescript-pro) getting it wrong
  once and right the next task on the same fixture.
- **Confidence**: High (journal cross-reference: T4's claim vs B2's
  post-T5 sha comparison to baseline).

## Observation: a `<<Database>>`-stereotyped empty package is structurally identical to a declared `database` leaf
- **Context**: T5 root-causing why daxeno-00-kasu166 alone stayed
  ORDER-ONLY after the general empty-package fix.
- **Finding**: `class-container.ts#setNamespaceStereotype` (mirroring
  `CommandPackage.java:178-191`'s `USymbols.fromString`) sets
  `classifier.usymbol = 'database'` on a stereotyped empty package at PARSE
  time, via the same `closeContainer` collapse path used for a genuinely
  declared `database Foo {}` leaf. Both end up with identical `kind`
  (`'descriptive'`) and a non-empty `usymbol` — the two fields
  `isCollapsedGroup` (`class-magma.ts`) uses to decide "is this a
  group-in-disguise". Jar itself still treats the stereotyped PACKAGE as
  `GroupType.PACKAGE` (the stereotype only selects the icon, not the
  GroupType) — so jar's answer and the port's available data diverge:
  correct discrimination needs a NEW marker stamped at the collapse call
  sites (`class-container.ts`, `class-namespace.ts`), not a smarter
  predicate over existing fields.
- **Impact**: This is the one open regression (daxeno, SAME→ORDER-ONLY)
  blocking merge. A follow-on needs write access to
  `class-container.ts`/`class-namespace.ts`/`ast.ts` to add e.g.
  `Classifier.collapsedFromNamespace: true`, distinguishing "collapsed FROM
  an empty namespace" from "declared as a descriptive container" —
  currently indistinguishable by design of the existing AST shape.
- **Confidence**: High (Java read + AST field inspection, T5's journal row).

## Observation: `class-assoc-couple.ts:251` skips namespace registration for an auto-created endpoint
- **Context**: T2 scoping `computeLeafDrawOrder`'s membership source (D2).
- **Finding**: `class-assoc-couple.ts:251` pushes an auto-created
  association-endpoint circle classifier WITHOUT calling
  `registerInNamespace`, unlike the equivalent path in
  `class-lollipop.ts:141`. Any such stub declared inside a package
  therefore has no entry in `ast.namespaces[].classifiers`, so D2's
  AST-membership source places it in the UNPACKAGED bucket regardless of
  where it was actually declared.
- **Impact**: A membership-data gap upstream of `computeLeafDrawOrder`, not
  a fix inside it (would violate D2's purity). Zero corpus fixtures hit it
  today (T2's probe over all 802). Worth fixing at the source
  (`class-assoc-couple.ts`) whenever a fixture surfaces it, rather than
  patched into the ordering function.
- **Confidence**: High (source read, corpus probe by T2).

## Observation: jar's edge (relationship) document order is NOT creation order
- **Context**: T5 diagnosing the 6 remaining EDGE-order fixtures after
  classifier/note order matched jar on all of them.
- **Finding**: jar reorders relationships BEFORE DOT emission via
  `CucaDiagramFileMakerSvek#getOrderedLinks()` (`svek/
  CucaDiagramFileMakerSvek.java:90-114`): it walks `diagram.getLinks()` in
  creation order and, for each link, inserts it immediately after the LAST
  already-placed link sharing the SAME unordered entity pair
  (`Link#sameConnections`, `abel/Link.java:462-470`) — grouping every
  relationship between the same two entities adjacent to each other
  regardless of how far apart they were declared. The port's
  `class-edge-geo.ts#buildEdgeGeos` (`:287-291`) iterates
  `ast.relationships` in pure declaration order with no such pass.
  Confirmed on 2 fixtures by full mechanism trace (tedeba-19, momoba-92 —
  the latter via cross-namespace bare-name reuse resolving two distinct
  source relationships to the same two entities), pattern-matched on 4
  more.
- **Impact**: A separable follow-on mission (leaf order was this mission's
  scope, not edge order). The fix likely needs BOTH
  `class-edge-geo.ts` (render/draw order) and `class-dot-graph.ts`
  (DOT edge-emission order, since jar's grouping happens before DOT
  construction and could perturb dot-engine's rank/crossing-minimization
  geometry) — a different gate (shape-match/dot-sync) than a pure document-
  order change.
- **Confidence**: High (2 fixtures fully traced with Java citations; 4
  pattern-matched, not independently re-traced).

## Observation: shared-worktree `git stash` boundary breaches (harmless, but a real risk)
- **Context**: Both T4 and T5 subagents, working in the same shared
  worktree under "no agent runs any git command."
- **Finding**: T4's subagent self-reported one `git stash`/`git stash pop`
  mid-task; T5's subagent later did the same (`git stash push -u` on its
  two write-set files only, to compare pre/post-edit `--check-order`
  output), also self-reported and reverted within the same tool-call
  sequence, `git status --porcelain` checked immediately after both times.
  Both breaches were disclosed by the agent itself, not caught externally.
- **Impact**: No damage this run — reverted before any other agent could
  observe an inconsistent working tree, and both were on files each agent
  owned exclusively. But a `git stash` in a worktree another agent is
  concurrently reading/writing is a real race: a second agent could read
  the stashed-away state as "current" mid-stash. The instruction ("no git
  commands") exists specifically to prevent this class of race in shared
  worktrees; two independent agent runs violated it anyway when tempted by
  a diffing workflow. Worth reinforcing in future mission briefs with a
  concrete non-git alternative (e.g., "copy the file to /tmp before
  editing, diff against that") rather than relying on the prohibition
  alone.
- **Confidence**: High (both self-reported in the journal, T4 and T5 rows).
