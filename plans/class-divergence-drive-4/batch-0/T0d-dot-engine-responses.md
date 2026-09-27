# T0d — review dot-engine responses (D2 gate — may HALT)

**Status at planning (2026-09-26):** responses are in and reviewed (D2 amendment). dot-engine 1.6.1 is published; bump to it. Only nugecu (D6) and T11 remain as adjustments.

**Context.** Before execution, the maintainer works the TRACKER entries for
issues 19, 22, 23, 24, 25, 26 (14 class fixtures: see `../fixtures.md`,
ws G) in dot-engine. The responses must be READ and the plan adjusted
before any batch-1 work starts.

**Task.**
1. Create `feat/class-divergence-drive-4` off main.
2. Read `docs/graphviz-issues/TRACKER.md` and each issue file 19, 22–26
   against their planning state (`git log -p` since 2026-09-26). List every
   response: fixed / declined / partial / reassigned / needs-info.
3. Check the latest dot-engine release (`npm view @knowvah/dot-engine
   version`, its release notes). If newer than 1.6.0: bump the tarball URL
   in `package.json` (same `https://registry.npmjs.org/...tgz` form), `npm
   install`, then run the four gates.
4. Re-run the gvi probe on each of the 14 fixtures (cached `svek-N.dot`:
   real `dot -Tdot` vs `render(parse(src),'dot')`; see the journal-1
   method and `plans/class-divergence-drive-3/diagnosis/scratch/B-engine-raw.mts`).
5. Run the class survey plus EVERY other engine against cdd3's b5 state. Journal
   every mover with its mechanism, then commit
   `chore(deps): bump @knowvah/dot-engine to <v>` with those numbers.
   A mover without a mechanism is stop 4/5.
6. Update `../fixtures.md` G rows: `conformant`, or
   `open -> TRACKER.md#<n> (<response>)`.
7. **HALT for the user** when any response is not a clean fix: declined,
   partial, reassigned to plantuml-ts, or a fix that moves rows the wrong
   way. Before halting, amend `../decisions.md` (D1 numbers, D2, new tasks)
   and state the proposed adjustment. A reassigned item becomes a new
   diagnosis row in batch 1.
   If every response is a clean fix, or there are no responses and no
   release, journal it and proceed.

**Stop 10 stays in force:** no edits under `~/git/knowvah/dot-engine`.

**Acceptance.**
- Given the TRACKER, when reviewed, then the journal lists one response per
  issue.
- Given a new release, when bumped, then the gates are green and every mover
  is journaled with its mechanism.
- Given any non-clean response, then `decisions.md` is amended and the
  mission is halted.

**Observability** N/A. **Rollback** Reversible (revert the bump commit).
