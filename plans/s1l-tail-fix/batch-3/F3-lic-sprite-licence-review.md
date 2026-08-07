# F3-lic — sprite licence review (ADR-9 gate for F4-a)

## Context

**plantuml-ts** is MIT-licensed (per `CLAUDE.md`'s License section, maintainer
decision 2026-07-11) and requires all dependencies — including vendored
binary/artwork assets — to be MIT-compatible. `lesori-32`/`ravodu-50`/
`tuliba-37` (G3, container-cluster bucket) and `kofuca-08` (G4, sprite
bucket) all depend on resolving `<<$archimate/interface>>`-style stereotype
sprites, which requires vendoring PlantUML's own jar-internal `/sprites/**`
resource bundle (`SpriteImage.java:125`: `final String path = "/sprites/" +
inner;` — the ONLY reference to that resource root found in
`~/git/plantuml/src/main/java/net/`, verified 2026-08-07 via a full-tree grep
per `CLAUDE.md`'s "grep `src/main/java/net/`, never just
`.../net/sourceforge/plantuml/`" warning). That vendoring is `F4-a`'s job, in
Batch 4 — but ADR-9(a) makes this review a **hard precondition**, not
parallel advisory work: *"A licence-review task reports per-icon-set
provenance and licence for every set that would be vendored under
`/sprites/**` before any sprite asset lands."*

**Why this blocks rather than merely advises.** A licence violation, once
merged, lives in git history forever — a `git revert` removes the file from
`HEAD` but not from every clone's `.git/objects` that already fetched it.
ADR-9's own Consequences section says this explicitly: *"A licence violation
in git history is not undone by a revert, which is exactly why the review
gate is blocking rather than advisory."* If this task's verdict is wrong or
incomplete, F4-a either vendors something it shouldn't (a real IP problem
that outlives the mission) or the mission's fix count is silently
overstated. Neither is acceptable, which is why F4-a cannot even START before
this task's verdict lands (stop condition — see Boundaries).

## Task

Report per-icon-set provenance and licence for every icon set that would be
vendored under `/sprites/**` if `F4-a` proceeds.

**Verified starting point, not the final word — confirm it yourself rather
than trusting this task file:** a full glob of `~/git/plantuml/src/main/
resources/sprites/**` in this checkout finds exactly ONE top-level directory,
`archimate/` (139 files, a mix of `.svg` and `.png`). No `LICENSE`,
`NOTICE`, or attribution file exists anywhere under that resource tree, and
`~/git/plantuml/LICENSES.md` at the repo root does not mention `archimate` or
`sprites` in any form (grepped, case-insensitive, zero hits). This is
consistent with — but does not by itself prove — "no licence metadata ships
with this set." Before writing the verdict:

1. **Re-verify the enumeration yourself.** Confirm `archimate/` is genuinely
   the only top-level set (a different checkout, a different PlantUML
   release, or a build-time resource-fetch step this task didn't see could
   change that). Do not simply cite this file's count without re-running the
   glob.
2. **Establish provenance for `archimate/`.** ArchiMate is an Open Group
   modeling notation/standard; the icon SET is a separate artifact from the
   notation itself. Determine where PlantUML's own `archimate/*.svg`/`*.png`
   files actually originate (an upstream ArchiMate tooling project, a
   PlantUML-original creation, a third-party icon pack) — check
   `~/git/plantuml`'s own commit history/README/CHANGELOG for the sprite
   set's introduction, and check whether the upstream ArchiMate specification
   or a companion tool (e.g. the Archi modeling tool) publishes these icons
   under an open licence.
3. **Do not confuse this with the SI5b stdlib corpus.** `plans/si5b-stdlib/
   decisions.md` D2 already audited a DIFFERENT vendored corpus — the
   `~/git/plantuml-stdlib` PUML macro-library bundles (awslib, tupadr3, azure,
   etc.), each with its own licence already researched there (CC BY-ND,
   MIT/CC BY 4.0/Apache/OFL, GPL for `adaml`). That prior audit is a useful
   METHOD precedent (verbatim-copy discipline, per-bundle README/LICENSE
   capture) but covers NONE of `/sprites/**` — the jar's own internal sprite
   resource root is a wholly separate corpus with no existing audit. Do not
   assume `archimate`'s licence from that prior work.
4. **Render a verdict per set** (today, one set: `archimate/`; re-derive if
   your own re-enumeration in step 1 finds more):
   - **MIT-compatible** → may land in F4-a's vendored bundle.
   - **Not compatible** → becomes a documented gap in this findings file;
     the sprite stereotype for that set stays unresolved (renders as literal
     `«$name»` text, today's behavior) — F4-a proceeds with the REMAINING
     compatible sets only.
   - **Provenance unknown** (cannot be established after genuine effort) →
     **treat as not compatible.** Silence is not a licence grant.
5. **If EVERY set fails** (today, that means `archimate/` itself is
   determined not-MIT-compatible or provenance-unknown), **that is mission
   stop condition 10 — a scope collapse.** Do not silently let F4-a proceed
   with an empty vendored bundle as if that were a normal "documented gap."
   Flag it explicitly for the maintainer/orchestrator; this is escalation,
   not push-forward judgment 5 (which covers "one set fails among several").

## Write-set

- `plans/s1l-tail-fix/findings/sprite-licence-review.md` (new file; create
  the `plans/s1l-tail-fix/findings/` directory if it does not exist yet)

Nothing else. No `src/` changes, no `assets/**`, no vendored files of any
kind — this task reports, it does not copy.

## Read-set

- `~/git/plantuml/src/main/resources/sprites/**` — the resource tree itself
  (re-enumerate; do not trust this task file's count as final)
- `~/git/plantuml/LICENSES.md` — the upstream project's own licence ledger
  (verified: no `archimate`/`sprites` mention today; re-check for drift)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/
  SpriteImage.java:125` — the one confirmed reference to the `/sprites/`
  resource root, for context on how the jar consumes the set
- `../../s1l-tail-diagnosis/findings/container-cluster.md` — `lesori-32`,
  `ravodu-50`, `tuliba-37` records (why `archimate/interface.svg` specifically
  is needed, with its declared `19.995mm × 19.928mm` dimensions)
- `../../s1l-tail-diagnosis/findings/SYNTHESIS.md` §1 row G3b, §8
  ("G3b, G12 and the §6 harness audit each carry a non-code decision")
- `plans/si5b-stdlib/decisions.md` D1–D4 — the METHOD precedent for a prior,
  DIFFERENT vendored-asset licence audit in this repo (do not reuse its
  conclusions, reuse its rigor)
- `CLAUDE.md`'s License section — this repo's MIT policy statement
- `../decisions.md` — ADR-9 in full (both (a) and (b))
- `../README.md` — stop condition 10, push-forward rule 5

## Architecture decisions

ADR-9(a) governs this task directly: the review blocks landing; a
non-MIT-compatible or provenance-unknown set becomes a documented gap, never
a silent vendored asset. ADR-9(b) is context, not this task's job: Twemoji
artwork (F4-b, G12) is a SEPARATE corpus, gated by the lazy-channel rule
(default bundle must not grow), not by this licence review — do not fold
Twemoji into this task's scope.

## Interface contract

The findings file must open with a table F4-a can act on directly:

```markdown
| Icon set | Files | Provenance | Licence | Verdict |
|---|---|---|---|---|
```

Followed by, per set: the evidence trail for provenance (what you checked,
what you found, what you could not establish), and — for any non-`MIT-compatible`
verdict — the exact consequence for F4-a's scope (which stereotypes/fixtures
stay unresolved as a result).

## Acceptance criteria

- **Given** the resource tree, **when** re-enumerated, **then** the set list
  in the findings file is stated as independently re-verified, not copied
  from this task file's count.
- **Given** each set, **when** a verdict is rendered, **then** it is exactly
  one of `MIT-compatible` / `not compatible` / `provenance unknown` (treated
  as not compatible), with the evidence trail that produced it — no set is
  left without a verdict.
- **Given** a non-`MIT-compatible` verdict on any set, **when** recorded,
  **then** the file states explicitly which fixtures/stereotypes stay
  unresolved as a documented gap (cross-reference `lesori-32`/`ravodu-50`/
  `tuliba-37`/`kofuca-08` by slug).
- **Given** every set fails, **when** that outcome occurs, **then** the file
  states this is stop condition 10 (scope collapse) and flags it for
  escalation — it does not quietly recommend F4-a proceed with nothing.
- **Given** completion, **when** `git diff --name-only` runs, **then** no
  `src/` path and no `assets/**` path appears — only the new findings file
  (+ directory).

## Quality bar

**Not the code gates** — this task changes no `src/` file. The quality bar
is:

```sh
git diff --name-only   # no src/ path, no assets/** path
```

Capture `$?` directly.

## Observability

N/A — this task produces a document; no runtime behavior changes.

## Rollback classification

Fully reversible, zero risk to the codebase. Revert = delete the findings
file. Note, however, that the DECISION this document informs (whether F4-a
vendors `archimate/`) is the kind of decision ADR-9 calls out as NOT cheaply
reversible once acted on — this task's own output is cheap to revert, but a
wrong verdict acted on by F4-a is not, which is the whole reason the gate is
blocking.

## Boundaries

**Always:** re-verify the resource enumeration yourself; render an explicit
verdict for every set found, with evidence; treat unresolved provenance as
`not compatible`; escalate rather than silently accept an all-fail outcome
(stop condition 10); read `~/git/plantuml/LICENSES.md` for drift before
concluding.

**Ask first:** if provenance genuinely cannot be established after real
effort (not a first-pass "I didn't find it") — surface what you tried before
defaulting to `not compatible`, so the maintainer can decide whether to
pursue it further outside this task's timebox.

**Never:** copy, download, or otherwise vendor any actual sprite bytes (that
is F4-a's job, gated on this task's verdict, not this task's); declare a
verdict without a stated evidence trail; treat this review as advisory or let
F4-a's scope decide the verdict rather than the other way around; conflate
this corpus with the already-audited `plans/si5b-stdlib` PUML bundles.

## Commit format

`docs(F3-lic): sprite icon-set licence review` — or defer to the
orchestrator, per the mission's usual convention for docs-only tasks.
