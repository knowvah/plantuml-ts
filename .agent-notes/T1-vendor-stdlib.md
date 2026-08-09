## Observation: manifest split required (root index + per-bundle files)
- **Context**: T1 (mission SI5b batch-1) — vendoring 34 plantuml-stdlib
  bundles (34,587 files, 313MB total) into assets/stdlib/ with a committed
  sha256 manifest.
- **Finding**: A single combined manifest embedding every file's sha256
  inline would be ~4-5MB (34,587 entries x ~90-130 bytes each), over the
  ~2MB single-file budget the T1 spec calls out. Split into
  assets/stdlib.manifest.json (root index: sourceRepo, sourceSha,
  generatedBy, and per-bundle metadata + fileCount + a manifestPath
  pointer) and assets/manifests/<bundle>.json (per-bundle fileCount +
  files: {relPath: sha256}). Largest per-bundle file is
  material7.4.47.json at ~969KB (9,116 files) — well under 2MB. Total
  assets/manifests/ is 3.5MB across 34 files, all committed.
- **Impact**: T3/T8/T9 (or anything reading the manifest) must resolve
  `assets/stdlib.manifest.json`'s `bundles[<name>].manifestPath` and read
  that file for the per-file hash map — the root manifest does NOT embed
  `files` inline, only `fileCount`.
- **Confidence**: High (implemented, --verify passes clean; documented per
  batch-1/overview.md T1's own contingency instruction to journal the
  choice if the ~2MB threshold is exceeded).

## Observation: 4-file discrepancy vs raw `find` count is expected (agent artifacts)
- **Context**: Verifying capture completeness against `find
  ~/git/plantuml-stdlib/stdlib -type f | wc -l` (34,591).
- **Finding**: The vendor pipeline captured 34,587 files — 4 fewer. The
  difference is two dotfiles directly under `stdlib/` root
  (`.mcp.json`, `.gitignore`) plus two files under `stdlib/.agent-notes/`
  and `stdlib/.serena/` — all agent-session tooling artifacts from prior
  work on that repo (confirmed via `git -C ~/git/plantuml-stdlib status
  --short`, all listed `??`/untracked), not real stdlib bundle content.
  `listBundleDirs()` only enumerates non-dotfile child directories of
  `stdlib/`, so these were correctly never candidates; bundle-internal
  dotfiles (e.g. `bootstrap1.12.1/.gitignore`,
  `material7.4.47/.gitignore`) WERE captured normally (no dotfile filter
  inside `walkFiles`).
- **Impact**: 34,587 is the correct, complete count for all 34 real
  bundles. No files were silently dropped from any bundle.
- **Confidence**: High (verified per-bundle file counts and spot-checked
  byte/hash identity of both a text .puml and a binary .png file).

## Observation: no CI workflow exists to wire assets into
- **Context**: T1 step 8 — check whether assets need CI wiring.
- **Finding**: `.github/workflows/` contains only `docs.yml` (VitePress
  docs build/deploy on push to main). There is no `ci.yml` or any
  workflow running `npm test`/`npm run typecheck`/`npm run lint` in this
  repo currently.
- **Impact**: Nothing to wire — T1 does not touch `.github/workflows/`.
  When T9 (or a future task) adds tests that consume `assets/stdlib/`, a
  CI workflow will need to be created from scratch (not just extended)
  with a step that runs the vendor pipeline (or fetches a cached copy)
  before the test step, keyed on `sourceSha` per decisions.md
  "Operational readiness".
- **Confidence**: High (directory listing).
