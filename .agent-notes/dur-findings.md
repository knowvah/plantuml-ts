# description-url-wrappers (dur) — findings (2026-10-16)

## Observation: zsh does not word-split an unquoted multi-path variable
- **Context**: b1 close, verifying three task branches with `files=$(git diff --name-only …); npx vitest run $files …`.
- **Finding**: the shell is zsh, so `$files` reached vitest as ONE filter string. It matched nothing, and all
  three branches collected only the 11 non-task files (identical 422-test counts). `${=files}` splits it.
- **Impact**: identical collected counts across different branches are the tell; check the collected file list.
- **Confidence**: High

## Observation: a YubiKey `verify-required` key cannot sign from an agent session
- **Context**: user asked to require signed commits mid-mission.
- **Finding**: `ssh-keygen -Y sign` asks for the FIDO PIN on a TTY; through a Homebrew `ssh-agent` it fails
  with "agent refused operation" (no SSH_ASKPASS). With `extensions.worktreeConfig=true`, a per-worktree
  `commit.gpgsign=false` lets the main checkout and agent worktrees commit unsigned while repo-level
  signing stays on; `mkwt.sh` sets it. The user signs once at the end with
  `git rebase -r --force-rebase -S <base>`.
- **Impact**: any future mission on this repo commits unsigned and needs that one interactive rebase
  before a push (GitHub ruleset 25246900 rejects unsigned commits on main).
- **Confidence**: High

## Observation: the LimitFinder ink pass has no `startUrl`
- **Context**: T5, core `Cluster.drawU` opening the group `<a>`.
- **Finding**: the ink-extent `LimitFinder` UGraphic implements `startGroup` but not `startUrl`/`closeUrl`
  (as `UGraphicNo` in Java), so an unconditional call throws "t.startUrl is not a function". Calls must be
  optional (`ug.startUrl?.(url)`), as `EntityImageDescription.ts` already does.
- **Impact**: any new url-drawing site in core needs the optional call.
- **Confidence**: High

## Observation: the corpus does have a description group url
- **Context**: D6 said no corpus fixture has a group url.
- **Finding**: component/tukipe-82-ziva562 sets one with `url for Foo is [[…]]` on a `node Foo {…}`; the jar
  draws the cluster `<a>`. No corpus row has an INLINE group `[[url]]`.
- **Impact**: grep for `url of|for` as well as `[[` when scoping url work.
- **Confidence**: High

## Observation: the tracked census pin can be stale at mission start
- **Context**: T6 census re-pin.
- **Finding**: `tests/oracle/svg-conformance/census-component.json` (measured at `5b4b5c731`) was already
  lower than a fresh b0 census on 5 rows (ravodu 34 vs 94); nothing in the gates compares it to a fresh run.
- **Impact**: diff the tracked pin against b0 before attributing any census rise to the mission.
- **Confidence**: High
