# T2 — per-run URL wrap in the description text drawers (Family B, core)

Prepend [../task-preamble.md](../task-preamble.md). Worktree `dur/T2`. Core edit under D7: run the guards.

## Context
The jar wraps each creole text run and inline atom that carries a url in its own `<a>`
(`AtomText.java:197-198` `ug.startUrl(url)`, `:235-236` `closeUrl()`; `UGraphicSvg.java:160-162`). The port's
creole layer already stamps the url on text atoms (`StripeSimple.ts:135-140,159-163,262-270`;
`Atom.ts:49-55`) but not on inline atoms (`StripeSimple.ts:230`; `Atom.ts:57-70`), and the two description
drawers never call `startUrl`: `EntityImageDescriptionDelegates.ts:174-189,247-250` (entity desc, note
bodies, cluster titles) and `EntityImageDescriptionTextBlock.ts:90-169` (edge labels via `SvekEdge.ts:330-336`,
port labels, stereotype labels). The legend drawer does it right (`annotations/blocks-creole-atoms.ts:164-196`,
`urlCapable` `:172-182`). Read `measurements/T0b-anchors.md` first: it lists the class/state rows this
change reaches and any nesting the jar does or does not do.

## Task
1. `Atom.ts`: `url?: CreoleAtomUrl` on the `'inline'` variant; `StripeSimple.ts`: stamp `activeUrl` on inline
   atoms (`:230`, and any other inline push reachable inside a url command).
2. Export `urlCapable` from `blocks-creole-atoms.ts` (no behaviour change) and use it.
3. Wrap text and inline atoms with a url in both drawers (D2). Match the jar's element order from T0b.
4. If T0b names a class/state row where the wrap would add an `<a>` the jar lacks (e.g. nested inside a
   member's block-level `<a>`), mirror the jar (D3): find the Java reason and reproduce it. If that needs a
   file outside your write-set, stop and report.

## Write-set
`src/core/klimt/creole/atom/Atom.ts`, `src/core/klimt/creole/legacy/StripeSimple.ts`,
`src/core/svek/image/EntityImageDescriptionDelegates.ts`, `src/core/svek/image/EntityImageDescriptionTextBlock.ts`,
`src/core/annotations/blocks-creole-atoms.ts` (export only); `tests/unit/core/**`, `tests/unit/description/**`.
Not yours: `SvekEdge.ts` (if its un-tabled `UText.build` path at `:305-321` matters, report it).

## Acceptance
- Given unknown/gubexu-05-dufu787, when rendered, then the jar's `<a … title="Transparency">` wraps the
  `<text>` "Transparency" and render-diff is 0/0.
- Given nevuzi and malumi (link labels), xufexu, tuliba and jobuje (notes/rectangle), jajeve (archimate),
  bivira and vivido (sprites inside urls): their `<a>` diffs are 0, residuals named with mechanisms.
- Given the D7 guards, then all green; given class, object, state, component, usecase, unknown and c4
  surveys before → after, then 0 conformant losses and every mover matches T0b's prediction or carries a
  mechanism.
- Given a fixture without `[[`, then output is byte-identical (unit test).

**Observability:** N/A. **Rollback:** Reversible.
