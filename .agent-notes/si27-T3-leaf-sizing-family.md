## Observation: sizer-renderer-parity.test.ts glob now silently narrows scope
- **Context**: T3 (shared-seam-extraction) moved `src/diagrams/description/
  leaf-sizing*.ts` (7 files) to `src/core/svek/image/`.
- **Finding**: `tests/architecture/sizer-renderer-parity.test.ts` builds its
  `SIZER_FILES` set via `filesMatching(DESCRIPTION_DIR, /^leaf-sizing.*\.ts$/)`
  (line 123), where `DESCRIPTION_DIR = src/diagrams/description`. After the
  move that glob matches zero files, so `SIZER_FILES` silently shrinks to
  just `layout.ts`. The test still passes (green) because `layout.ts:4xx`'s
  `resolveElementFontSize`/`resolveElementMinimumWidth` references are still
  there — but the fitness function's coverage of the leaf-sizing family
  itself (its stated purpose, per its own module doc comment) is gone. This
  is a real, unaddressed gap: not fixed here because the file is outside
  T3's declared write-set (hard boundary per the mission's shared-tree rules)
  and the mission README's stop-condition-1 language is explicit about not
  editing files outside the write-set without reporting.
- **Impact**: A future task (T10 close-out, or a dedicated follow-up) should
  add `...filesMatching(SVEK_IMAGE_DIR, /^leaf-sizing.*\.ts$/)` to
  `SIZER_FILES` (that constant, `SVEK_IMAGE_DIR = src/core/svek/image`, is
  already declared in the same file for `RENDERER_FILES`, so this is a
  one-line fix). Until then the guard is weaker than its doc comment claims.
- **Confidence**: High (read the file, ran it, confirmed it still passes
  green post-move — a silent scope narrowing, not a hard failure).

## Observation: git rename can split into unstaged-D/staged-A under concurrent index writes
- **Context**: Shared working tree with a second agent (T9) committing
  concurrently. After `git mv`-ing the 7 leaf-sizing files, a later
  `git status` (just before my own commit) showed the renames had split:
  new paths staged as plain `A`, old paths showing as unstaged `D` (not `R`).
- **Finding**: The working-tree content was correct throughout (old files
  genuinely absent from disk, new files present and edited) — only the
  index's rename-pairing view had been perturbed, most likely by the other
  agent's own `git add`/commit cycle touching the same index concurrently.
  Re-running `git add -- <exact write-set paths>` immediately before the
  commit re-paired everything back into clean `R` entries and the commit
  succeeded with `git commit -- <pathspecs>`.
- **Impact**: On a shared tree, do not trust a `git mv`'s staged state to
  survive until commit time without re-verifying via `git status --short`
  immediately before the commit call, even if you never ran `git add`/`git
  mv` again yourself in between. Re-`git add` the exact write-set paths
  right before `git commit -- <pathspecs>` as a matter of course when other
  agents are active on the same index.
- **Confidence**: High (directly observed via `git status --short` before
  and after re-adding; no working-tree content changed, only index pairing).
