# T1 — diagnose group Q (qualifier / port / role-slash links)

**Agent:** debugger · **Depends on:** T0 · parallel with T2–T5.
Prompt = [`diagnosis-task.md`](diagnosis-task.md) + this file.

## Fixtures (23)

- Single qualifier, `A [Qualifier] <-- B` shape: baneru-00-kuro607,
  comaxe-39-goza236, vorimi-67-gudu296, kadifi-56-bili996,
  kopida-02-vaje995, pumocu-32-fiji248, tikovu-50-gale862,
  vileca-45-melo541, rifuzu-80-nixo780, camuna-58-veca254 (diverged),
  nafiki-56-jixu680 (diverged)
- Two-sided / several qualifiers: rilali-81-gifu188, xoxega-30-vuju324,
  goloxu-09-nero458, ririlu-13-zipi740, coxose-20-nifu136,
  mucoti-34-seve858, sefazi-02-defe499, vuzoro-99-kizi978
- Member ports (`CC::USA --> users::3`, `table1::id`): nenepe-70-keri784,
  pegeso-72-mana305
- Role-slash labels (`User "owner"/"1" -- "0..n"/"items" Item`):
  nenexe-35-zere033, mugobo-34-fede498

## Measured signatures (b-plan, 0 structural diffs unless noted)

- baneru/comaxe/vorimi: 89 numerics, Δ≈0.572 on the class header ellipse
  `cx` and its glyph path — a sub-pixel horizontal offset of a whole node.
  kadifi/kopida 134, pumocu 84: same Δ pair (0.5, 0.57).
- tikovu/vileca: 42 numerics, modal Δ1.07. rilali/xoxega/goloxu: modal
  Δ5.13/4.81 plus a 1 px canvas width. camuna/nafiki/rifuzu: Δ0.93 and Δ31
  (camuna/nafiki add font-size/style + rect fill structural diffs).
- nenepe/pegeso/nenexe/mugobo: canvas width 2–3 px narrow, 2 numerics.
- coxose/ririlu: Δ0.39–0.82 on hundreds of numerics.

## History (read before hypothesising)

The prior mission ported qualifier boxes as `class-kal.ts` (its D6, task
T15: `svek/SvekEdge.java:242-246,540-562,1015-1019,1069-1077`, `svek/Kal.java`)
and verified qualifier node SIZES against `svek-N.dot`. So a residual here
is smaller than "Kal unported": a margin, anchor, label-width or position
term. Check `plans/class-divergence-drive/decision-journal.md` for T15/T16/
T17 rows and `.agent-notes/cdd-T15.md` if present. T36 of that mission
disproved a port-row sizing premise for `Class::member` fixtures — read its
negative result before blaming port rows.

D7 applies to the fix, not to you: name any `class-kal.ts` change your fix
shape would need, and flag it if it is structural.

## Observability · Rollback

N/A (read-only diagnosis) · Reversible — see [`diagnosis-task.md`](diagnosis-task.md).
