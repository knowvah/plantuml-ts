# Architecture decisions: cdd7 (approved 2026-09-30, "approve all eleven")

Scope answers (planning Phase 2, "go with your recommendations on all three"):
lubicu is handed to `salt-engine-port`; gubeca/jixibu are accepted under the
Smetana ruling; tefeco (b) and josebu (a) stay in as description/sequence fixes
measured by D7.

## D1: no verification batch; nine fix rows, one pin decision, eight acceptances, one hand-off
Every row's mechanism is journaled in cdd6 with a Java cite (rows 13, 47, 50, 63,
67, 71, 73). Batch 0 is branch + ledger + acceptances + b0. A row whose journaled
mechanism proves wrong on contact is `open -> cdd8` with the corrected mechanism
(stop 13 lets the maintainer see it first); it is not re-diagnosed inside the task.

## D2: `arrowLollipopColor` reaches the edge renderer through the skinparam accumulator → Theme
New accumulator field + Theme field keyed by upstream `ColorParam.arrowLollipop`
(`SvekEdge.java:266-268`), read at the middle-decor call site
(`class/renderer-edge.ts:401-411` → `MiddleCircleCircled.java:74-75`). Fallback is
the diagram background, as upstream. No second style path (cdd6 D2).

## D3: `acc.arrow` becomes `Paint`, mirroring upstream's `HColor`
`skinparam-key-handlers-table-a.ts:110-113` stores `resolveColorPaint(value)`
instead of the flattened `color`. Consumers that need a flat string call the
existing flatten helper in `core/paint.ts`; the consumer list is journaled, not
pre-enumerated (push-forward: type move). The class edge renderer emits the
`<linearGradient>` def through the ported `HColorGradient` and the klimt svg driver
gradient path (mindmap-engine-port T6a) — never a hand-built def.

## D4: bonaco — wire `core/svek/FrontierCalculator.ts` into `buildNamespaceGeos`; the port leaf draws via a new `class/renderer-entity-port.ts`
`class-geo-builders.ts` is at 499 lines: the port branch is a helper module, not an
in-place edit. Port `EntityImagePort.java:100-146` 1:1; placement per
`Cluster.java:344-345,410-436`. `state-composite-frontier.ts` is the in-repo
precedent for consuming `FrontierCalculator`.

## D5: kexaba — real `dot` first, draw-side fix only if `lp` agrees
First step: `dot -Tdot` on the cached `svek-1.dot` and on our DOT; journal both
`lp` values before any edit. Row 50 already measured them equal, so the expected fix
is the label-box origin +8,+8 (`SvekEdge.java:808-814`) in `renderer-edge-label.ts`.
If `lp` differs, the row is a dot-engine finding: `docs/graphviz-issues/` + TRACKER
line, `final = open -> dot-engine`.

## D6: rojida — pin under an explicit `dotEqualExempt` reason only when the DOT delta is the oracle 42×42 seam
Diff the two DOTs first. If the only delta is the embedded-label node size (the
deterministic-text seam, memory `oracle-seam-embedded-42x42`), the ratchet entry
gains `dotEqualExempt: "oracle-seam-42x42"`, `pin-goldens.mts` accepts it and
`class.golden.ratchet.test.ts` honours it for that entry only. The exemption is
visible and is retired when the seam is fixed in the fork. Any other delta is a
port defect: fix or `open -> cdd8`. Stop 14 guards the boundary.

## D7: cross-engine fixes are measured by the all-engine close and re-pin only rows they moved
tefeco (b): description notes become opale (`GraphvizImageBuilder.java:245-257`,
`EntityImageNote.java:235-243`). josebu (a): sequence labels keep sprite atoms
(`AbstractTextualComponent.java:80-92`, `StripeSimple.java:228-235`). Expect
description/sequence movers, each journaled with a mechanism; those engines'
ratchets/diff-baselines are updated in the fix task's commit, Java-quoted. A loss
in any engine is stop 4; > 30 non-class movers at a close is stop 8.

## D8: acceptances are signed by this approval
Batch 0 writes eight entries into `oracle/accepted-divergences.json` with
`acceptedBy: "maintainer"`, `acceptedAt: "2026-09-30"`, `reason` citing this D8 and
the cdd6 journal row:
- smetana-pragma-ignored ×4 — fakone-16-boro774, japode-92-famo984,
  tikiti-02-bagu049, xagomi-49-caki729: structural-match reached (cdd6 T3c
  c5426277d); numeric residue is `!pragma layout smetana` geometry (2026-08-09
  ruling, cdd6 D8).
- gubeca-19-lemu434, jixibu-01-xave465: nested yaml image Δ1 is the Smetana path
  (cdd6 row 73).
- kokofa-47-deni140: the jar crashes on a duplicate JSON state; we refuse it
  (cdd6 T1c 11d12ed60). Same identity class as rubebe (cdd4 D6).
- semutu-45-zeno907: the embedded mindmap renders; the 16×26 canvas gap is the
  oracle deterministic-text seam reserving 42×42 for `{{ }}` images (mmp journal
  row 36). **Revocable**: the entry carries `until: "oracle seam fixed in fork;
  re-render goldens with embedded {{ }} diagrams"`.
Stop 11 is amended to: signing any acceptance not enumerated here. cdd5's four
unsigned candidates (vakovo, rubebe, sapofa, petiku) stay unsigned.

## D9: lubicu → `salt-engine-port`
`final = open -> salt-engine-port`. T0a files a `planning/next-missions.md` stub with
the measurement: 62 Java files / 5,669 lines under `salt/`, `salt/element/`,
`salt/factory/`; harness shape = mindmap-engine-port (golden ratchet +
diff-baseline). Genuinely large and separable — a tracked mission, not a deferral.

## D10: exit bar
- Every in-scope row has a `final` ∈ `fixed (<commit>)`, `accepted (D8)`,
  `open -> cdd8`, `open -> salt-engine-port`, `open -> dot-engine TRACKER <n>`.
- 0 conformant losses in any engine; 0 unexplained rises.
- Four gates green, collected = on-disk, class DOT parity green.
- Target: **984 CLASS conformant** (974 + 9 fixes + rojida), ratchet 984. A miss
  is acceptable when every short row has a journaled mechanism (xuloxo is the likely
  miss: a C4 diagram with several residual channels).

## D11: execution rules carried from cdd6 verbatim
Worktree per parallel task; agents run targeted tests only; no Serena edit tools and
no `git stash` in agents; orchestrator checks `git diff HEAD` on main before every
merge; catalog regen after a new module; full gates with `--maxWorkers=6`; never
push; dot-engine and the plantuml fork are read-only; no public API change.
