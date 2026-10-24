# T2e — a `[[url label]]` label splits into one text per line

Agent: `typescript-pro` (sonnet), worktree `sdd3-T2e`. Commit:
`fix(creole): split url labels per line as AtomTextUtils does`.
Read [../task-contract.md](../task-contract.md) first. Core task: every
engine is surveyed after the commit (stops 4, 13).

## Mechanism (sdd2: `url-label-newline-split`; Java re-read)
`AtomTextUtils.createUrl` takes `Display.getWithNewlines(pragma,
url.getLabel())`; when it has more than one line it builds one
`createAtomTextForUrl` per line and stacks them in `AtomVerticalTexts`,
otherwise one atom (`klimt/creole/legacy/AtomTextUtils.java:79-92`; sdd2
cited `:79-89`). `StripeSimple#addUrl` reaches it from `CommandCreoleUrl`
(`CommandCreoleUrl.java:58-83`). Ours: `applyHyperlinkStyleAndPush`
(`CommandCreoleUrl.ts:67-76`) hands the whole label to
`stripe.analyzeAndAddInlineWithUrl(url.getLabel(), ...)` as ONE run, so an
escaped `\n` in the label never becomes separate stacked texts. Port
`AtomVerticalTexts` (`klimt/creole/atom/AtomVerticalTexts.java`) as a new atom file next to
`atom/AtomSpace.ts`, wire the multi-line branch, and keep the one-line path
byte-identical. Check how the stripe/atom model (`atom/Atom.ts`) represents
a vertical stack before choosing the seam; a change to `legacy/StripeSimple.ts`
or `Atom.ts` is stop 1 (T2h owns `Atom.ts`) — report the needed signature.

## Targets
ripura-92-vacu541 (62, 29 structural), vopixi-04-lako436 (51, 35 structural).

## Write-set
`src/core/klimt/creole/command/CommandCreoleUrl.ts`, one new
`src/core/klimt/creole/atom/AtomVerticalTexts.ts` (if the seam needs it) and
tests.

## Read-set
`CommandCreoleUrl.ts:40-96`; `klimt/creole/legacy/AtomTextUtils.ts`,
`StripeSimple.ts` (`analyzeAndAddInlineWithUrl`, read-only); Java:
`AtomTextUtils.java:36-100`, `CommandCreoleUrl.java:56-85`,
`klimt/creole/atom/AtomVerticalTexts.java`.

## Acceptance
- Given a url label `a\nb`, when parsed, then two stacked text atoms each
  carry the url/tooltip; a one-line label produces the atom it did before
  (unit test citing `AtomTextUtils.java:79-91`).
- Given ripura and vopixi, then each diffs to 0.
- Given the all-engine survey, then no conformant loss and every non-sequence
  mover is explained row by row.
- Given the 1042 pins, then every pin stays byte-equal.

Observability: N/A — no new observable operations. Rollback: Reversible
(revert the task commit).
