# Decision Journal — si11a-per-resource-stdlib-fetch

Append one row per non-trivial judgment call. "Non-trivial" means: a reasonable
developer might have chosen differently.

Also log here: quality-gate results per batch, any brief line-number correction,
every measurement the brief asks you to record, and every STOP with its full
output.

**T4 must record its concurrency primitive and, if bounded, the bound and its
reasoning.**
**T8 must record the measured payload — T9 quotes it rather than the brief's
projection.**

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-07-31 | planning | Mission brief created | SI11 raised as a tracked row when SI8 closed; planned the same day |
| 2026-07-31 | planning | **SI11 SPLIT into SI11a and SI11b on maintainer direction** | Two distinct mechanisms (per-resource fetch; per-sprite transform), a build-pipeline change, a licensing carve-out and a hosting decision in one mission was too much. The split also fixed a sequencing problem: SI11b's sprite index rides on the manifest/asset shape SI11a establishes, so planning it first would have built on an unbuilt foundation |
| 2026-07-31 | planning | Mechanism = runtime HTTP fetch, NOT per-resource static modules | Maintainer ruling before planning. 6,849 modules for tupadr3 (29,101 tree-wide) is a bundler-explosion risk and would substantially change the generated package shape |
| 2026-07-31 | planning | **The three published packages have THREE different shapes** — measured, and it reshaped the mission | `bootstrap1.13.1` is 1.06 MB in **3 files** (2,078 sprites in ONE 1,059.9 KB file), so per-resource splitting is a NO-OP for it; `awslib14` is 7.93 MB / 891 resources; `tupadr3` is 19.54 MB / 6,849. "Per-resource splitting" as ADR-2 of SI8 framed it solves the two giants and does nothing for bootstrap — which is what justified the split |
| 2026-07-31 | planning | ADR-3 (key→path map, not convention) rests on a measurement | **890 of 891 `awslib14` paths contain uppercase** while `derivePumlKey` lowercases. Path-by-convention would require renaming vendored files; the map costs ~19 KB gzip more for tupadr3 (49.6 vs 31.0) and keeps SI11a a pure checksummed file copy — which matters because `awslib14` is the CC BY-ND bundle |
| 2026-07-31 | planning | ADR-7 was written only after extensibility was **verified working today** | Probed a non-`@plantuml-ts` bundle: registers under its own name and resolves eagerly, lazily, and through nested cross-includes. Nothing in `src/` hardcodes a package list or closes the bundle namespace. So the gap SI11a could introduce is not "third parties can't register" but "third parties can't get per-resource" — which is what ADR-7 closes |
| 2026-07-31 | planning | The sprite crux was verified, not assumed — and it is SI11b's, not SI11a's | `SpriteRegistry` is a per-diagram `Map` read SYNCHRONOUSLY at measure/render (`getSprite`, `spriteDimsLookupFor`, `Stereotype#getSprite`). No await is available at lookup and `renderSync` must stay sync, so per-sprite loading must be prefetch-driven off a `<$name>` scan. Recorded here so SI11b does not re-derive it |
| 2026-07-31 | planning | `assets/stdlib/stdlib` is a **self-referential symlink** | Discovered while measuring; a naive recursive `find` double-counts or loops. The 29,101 figure excludes it and is correct. The tree is gitignored and regenerable, so this is a note for tooling, not a defect to file |
| 2026-07-31 | pre-flight | **The new `vendor-stdlib --verify` gate failed at BASELINE — fixed before handoff** | `bootstrap1.13.1/.gitignore` had `.serena/cache/` appended to it by Serena MCP tooling, so the gate this mission promotes to a stop condition was already red. Restored the exact vendored 55 bytes by hashing every line-boundary truncation against the manifest's `sha256:3c315ddb…` rather than guessing (a first guessed trim cut one byte too many and did not match). Gate now reports `all files verbatim (sha256 match)` across 34,587 files / 34 bundles. **If `--verify` flags this same file mid-mission, it is Serena drift in a gitignored regenerable tree — NOT a stop-condition-5 violation.** Any OTHER file is a real violation |
