## Observation: `git commit -m ... -- <pathspec>` fails on brand-new untracked files
- **Context**: T9 (shared-seam-extraction), committing new files
  `src/core/command/CommandCreateJson.ts`, `src/core/command/JsonNode.ts`,
  `tests/unit/core/command/CommandCreateJson.test.ts` alongside modified
  files, per the mission's "explicit pathspecs on the commit, no early
  `git add`" rule.
- **Finding**: `git commit -m "..." -- path/to/new/file.ts` (a file that is
  currently untracked, shown as `??` in `git status`) fails with
  `error: pathspec '...' did not match any file(s) known to git`, even
  though the file exists and `git status -- <path>` shows it as `??`.
  `git commit <pathspec>` only stages MODIFICATIONS to already-tracked
  paths matching the pathspec; it does not implicitly `git add` a wholly
  new file the way it can for a tracked one.
- **Impact**: Any batch-2/3 task that creates new files (not just modifies
  existing ones) must run `git add -- <new-file-paths>` immediately before
  the final `git commit -m ... -- <all paths, old and new>` — as one
  atomic end-of-task action, not staged early. Modified/deleted
  already-tracked files do NOT need a separate `git add`; only brand-new
  paths do.
- **Confidence**: High (reproduced directly; fixed by adding the missing
  `git add -- <new files>` step right before commit).
