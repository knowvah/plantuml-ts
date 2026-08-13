# Observation: a "frozen count" carried into a brief can be pre-oracle-recapture, and the cheap way to prove it is an import-closure check

- **Context**: SI17 T3 re-measured every gate the brief froze. The brief lists
  the description SVG census as "48-set intact"
  (`plans/si17-class-row-ports/README.md`, frozen-counts table). The tree
  reported **26 zero-diff of 358** — apparently a 22-fixture drop, which the
  brief classes as a hard stop condition.

- **Finding**: It is **stale, not regressed**. The 48 is a g4-state-svg-era
  figure recorded as `48/355` (`plans/g4-state-svg/ledger.md:346,721,1037`),
  measured against the oracle cache that **SI16 subsequently re-captured**.
  Every census moved when that cache was replaced — `planning/mission-index.md`
  records class going `2 → 343/722` for exactly this reason — and the fixture
  count moving `355 → 358` is the same re-capture showing through. The real
  post-SI16 baseline is **26/358**.

  Three things ruled it out as a real regression, in the order they were tried:

  1. *A pristine-baseline re-measurement.* **Attempted first, and it failed.**
     A `git worktree` at the pre-mission commit returns **358 errors of 358**,
     because the census depends on gitignored generated assets that a fresh
     worktree does not have. This is the cold-tree hazard already filed in
     `.agent-notes/`; it also means a worktree baseline is *not* a valid
     control for any census or asset-dependent gate.
  2. *A transitive import-closure check* — the decisive evidence, and the
     reusable part. None of the mission's changed files appears in the
     **481-module transitive import closure** of the description engine
     (`src/diagrams/description/{index,layout,renderer}.ts`). The description
     census therefore cannot execute a line the mission touched. This is a
     structural proof, cheap to compute, and it does not need a working
     baseline tree.
  3. *A general census/oracle problem on this tree.* Disproven by the two
     counts the brief froze **after** SI16: class reads exactly **343**/722 and
     object exactly **35**/80 on the same tree. A broken oracle would not land
     both on their frozen values.

- **Impact**: Two things for future missions. (a) When a brief freezes a count,
  check whether the figure predates the last oracle-cache re-capture (SI16,
  2026-08-12) before treating movement as a stop condition — a number inherited
  from an older ledger measures the old cache. (b) When you need to prove a
  change *could not* have affected a gate, prefer the import-closure check to a
  baseline re-run: it is faster, and unlike a worktree baseline it is not
  defeated by gitignored generated assets.

- **Confidence**: High — the closure was computed on this tree; the worktree
  failure was observed, not predicted; both surviving frozen counts were
  re-measured.
