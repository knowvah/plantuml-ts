# T3e — core style fields

Agent: typescript-pro, worktree `add2-T3e`. Rules: [overview](overview.md) +
[../batch-1p/common.md](../batch-1p/common.md).

## Context
Families from the b2 cohort census — read the rows tagged with them in
`../measurements/b3-cohort-a.md` and `../measurements/b3-cohort-b.md`
(per-row diffs, Java file:line, owning files). Census B verified several fixes in
an out-of-repo sandbox (`/private/tmp/claude-501/b3b/sandbox`, env-toggled);
re-derive them from the Java, do not copy unverified.
Families: G (`SkinParam.java:1086-1088`, `SvgGraphics.java:815`; T2d threaded ShellFragment.preserveAspectRatio, needs a Theme field + handler + producer; setecu), F (hyperlinkUnderline/svgLinkTarget `SkinParam.java:1057-1061,1081-1083`; pekuxe/gaxezi/nisexe; klimt CommandCreoleUrl is OUT (stop 8)), K (`skinparam activity { FontName }`, `FromSkinparamToStyle.java:144`), DARK (`TitledDiagram.java:291-294`), H (numbered-list 10px floor `AtomText.java:179-181` — the file is under src/core/klimt: re-slot, do not edit). Shared core: survey class/state/sequence/component/usecase/mindmap/object/activity before/after SEQUENTIALLY; any conformant loss = stop.

## Task
Per family: confirm the mechanism against the Java (quote file:line), port it at
the origin, apply to every row the census tags with it, pin with a test. Measure
probe Σ + element census before/after each commit. Report rows that reach 0.

## Write-set
`src/core/{theme*,skinparam-*}.ts`, `src/core/svg.ts`, `src/core/dispatcher.ts`, `activity-{text-style,renderer-text}.ts`, the activity render entry that produces the shell fragment (name it), their tests. Consumption inside `activity-renderer-shapes.ts` is T3d's — re-slot if needed.
Anything else: stop and report (re-slot with mechanism + owner).

## Acceptance
- Each tagged row: that family's diffs gone, or re-slotted with mechanism.
- 0 unexplained risers (D7 reveal classes allowed, each shown from the element census);
  97 pinned goldens byte-equal; harness-parity green.
