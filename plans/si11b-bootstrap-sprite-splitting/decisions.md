# Architecture Decisions — si11b-bootstrap-sprite-splitting

All seven approved by the maintainer 2026-07-31. **Treat every decision here
as locked.** If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

ADR-1 and ADR-3 are the ones that redefine the mission; ADR-2 is the one that
protects a licence grant. Read those three even if you skip the rest.

## ADR-1 — Derive fragments; do NOT transform the vendored file

**Context.** The SI11b row in `planning/mission-index.md` and SI11a's
planning notes both state that this mission "requires transforming a vendored
file", needing an explicit carve-out from SI5b's checksummed-file-copy rule
and a change to the `vendor-stdlib --verify` gate. **Checked against the
code, that is not so.** SI11a already derives artifacts from `assets/stdlib/`
into the package tree — `.remote.js` manifests and a verbatim asset copy —
without mutating anything.

**Decision.** The splitter READS `assets/stdlib/bootstrap1.13.1/bootstrap.puml`
and WRITES per-sprite fragments as generated output under
`packages/stdlib/assets/bootstrap1.13.1/sprites/`. The vendored file is never
modified, moved or renamed.

**Consequences.** No SI5b carve-out. **`vendor-stdlib --verify` needs no
change** and keeps asserting all 34,587 files verbatim — the mission's
riskiest proposed edit disappears entirely. MIT permits derivative works;
attribution is preserved because the bundle's LICENSE ships unchanged. This
is what removes SI11b's reputation as the dangerous half of the split.

**Method note.** This ADR exists because method rule 2 was applied to the
mission's own founding premise. A premise inherited from a previous mission's
notes is still a claim to verify, not a fact to build on.

## ADR-2 — MIT allowlist on the splitter, fail-closed

**Context.** Measured: only **8 of 34** bundles carry a `license` field in
`assets/stdlib.manifest.json`. `bootstrap1.13.1` is `"MIT License"`.
**`awslib14` has NO `license` field at all** — its CC BY-**ND** status exists
only as prose in `packages/stdlib-aws/LICENSES.md`.

**Decision.** The splitter refuses any bundle whose manifest `license` is not
on an explicit MIT allowlist. Absent or unrecognised ⇒ refused.

**Consequences.** A denylist ("refuse CC BY-ND") would fail **OPEN** on
`awslib14`, the single bundle where deriving a modified work voids the grant.
An allowlist fails closed, making the dangerous case structurally impossible
rather than a code-review question. Adding a future bundle to the allowlist is
a deliberate, reviewable act.

**Rejected.** Checking `LICENSES.md` prose — unparseable and per-package, not
per-bundle.

## ADR-3 — Path-by-convention + a name-list manifest (INVERTS SI11a ADR-3)

**Context.** SI11a's ADR-3 ships a key→path MAP because 890 of 891 `awslib14`
paths contain uppercase while key derivation lowercases. Measured for
bootstrap: **all 2,078 sprite names are unique, lowercase and
filesystem-safe; zero uppercase.**

**Decision.** Ship a sorted **name list**; derive the fragment path by
convention as `sprites/<name>.puml`.

**Consequences.** Measured **7,289 B gzip** versus **12,201 B** for the
equivalent map — 40% smaller. That matters more here than it would elsewhere
because the manifest floor DOMINATES the payload at small N: a 3-sprite
diagram is ~8.8 KB with the list versus ~13.7 KB with the map, a 36% cut.
Cost: a second manifest shape alongside `StdlibRemoteManifest`, expanded to
one at load time. Offline miss-detection is preserved — a name absent from
the list is a known miss with no 404 round-trip.

**Note.** This is a deliberate divergence from SI11a, justified by
measurement, not an inconsistency to "fix" later. Both bundles are right for
their own data.

## ADR-4 — Prefetch-driven `<$name>` scan, reusing the existing pattern

**Context.** Verified against the current call graph: sprites are registered
at PARSE time by `matchSpriteCommand`, called from each diagram plugin's
parser over already-preprocessed lines. `addSprite` is `byName.set`
(`sprite-commands.ts:71`) and `getSprite` is `Map.get` (`:78`) — both
synchronous, and `renderSync` must stay synchronous. So there is no await at
lookup and loading cannot be demand-driven.

**Decision.** Scan the source for `<$name>` during the PREFETCH walk (async,
where `!include` is already resolved) and fetch only those fragments. Export
the existing `SPRITE_PATTERN` from `creole-atoms.ts:250` and reuse it.

**Consequences.** The lever is the include PAYLOAD, not the sprite registry:
parsing is untouched, it simply sees fewer `sprite` blocks. Reusing the
pattern is not optional — SI11a lost a task to a stop precisely because the
`Stdlib.java` key transform was private and a second copy was forbidden. Two
answers to "what is a sprite reference?" is how the port drifts from the jar.

## ADR-5 — Macro-produced sprite names: document AND provide an escape hatch

**Context.** Prefetch sees raw source plus fetched include text — **not**
macro-expanded text. A `<$name>` produced by a `!define` expansion is
invisible to the scan.

**Decision.** Both (a) and (b):
- **(a)** Accept the limitation and report a miss as a NAMED error
  identifying the sprite — never a silently missing icon.
- **(b)** Provide an explicit `RenderOptions.sprites?: readonly string[]`
  escape hatch so a consumer can name what the scan cannot see.

**Rejected.** Falling back to whole-file loading when the source contains
macro definitions — it silently restores the 1.06 MB the mission exists to
remove, and does so for the diagrams most likely to be large.

## ADR-6 — Measure and state what this does NOT solve

Per SI11a ADR-6's precedent: measure and state, never assert success.

- **The floor dominates at small N.** 7,289 B of manifest buys nothing by
  itself; at one sprite you pay it for ~431 B of content.
- **Request count, not bytes, is the ceiling here** — the inverse of SI11a. A
  20-sprite diagram makes ~21 requests.
- **Projected ~98.7%**, not SI11a's 99.7%. T6 must measure and report the
  real figure; if it lands materially below, report and STOP (stop
  condition 15).
- **Sprite NAMES remain a flat global namespace** — see ADR-7.

## ADR-7 — Collision warning: collect on the registry, surface via a callback

**Context.** The sprite NAME namespace is flat and global per diagram
(`addSprite` is `byName.set`, last-write-wins), so two collections both
defining `$star` collide silently — upstream `SkinParam.sprites` behavior.
SI11a's ADR-7 said document-don't-fix; the maintainer asked for a warning.
Measured constraint: `SpriteRegistry.skippedColorSprites` already collects
diagnostics **and is surfaced nowhere** — asserted in exactly one unit test
(`tests/unit/sprite-commands.test.ts:214`). Copying that pattern alone would
build a warning no consumer ever sees.

**Decision.** Two halves.
- **Collect:** `SpriteRegistry` gains `collisions: string[]`, mirroring
  `skippedColorSprites`.
- **Surface:** a new optional `RenderOptions.onWarning?: (message: string) =>
  void`, invoked after parse.

**Consequences.** Matches the injected-seam pattern this codebase already
uses (`IncludeFetcher`, `measurer`): deterministic, testable by asserting
call arguments, and **free when omitted**. Strictly an opt-in diagnostic
rather than a dev-mode flag. Reusable later for `skippedColorSprites` and for
ADR-5(a)'s macro-miss reporting, neither of which has a channel today.
**Adds `src/index.ts` to a write-set, and that file is AT the 500-line cap.**

**Rejected.** `process.env.NODE_ENV` — forbidden in `src/`, which is why this
cannot be "dev mode" in the usual sense. A gated `console.warn` — an
uninterceptable, untestable global side effect in a library.

## Rollback classification

**Reversible** — revert the commits. ADR-1 removed the only irreversible
candidate: fragments are regenerable output, the vendored tree is untouched,
exports are additive, and no data migrates. `npm publish` is maintainer-gated
and out of scope.

## Public API impact

Additive only. `RenderOptions` gains two OPTIONAL fields (`onWarning`,
`sprites`); `SpriteRegistry` gains one field. Nothing in SI11a's surface
changes. The eager `!include <bootstrap/bootstrap>` path keeps working
untouched and is the fallback if per-sprite loading disappoints.
