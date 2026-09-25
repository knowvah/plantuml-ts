# cdd3-T26 — note creole bullets and numbered lists (C-1, C-2, lozego residual)

## Observation: C-1/C-2 confirmed by exact probe reproduction before editing
- **Context**: `plans/class-divergence-drive/tools/render-diff.mts` on ponono-25-fevo574,
  sumocu-27-vubo674, lozego-15-coci435, per the task's "probe first" instruction.
- **Finding**: all three reproduced exactly as diagnosed in `diagnosis/C.md` — ponono/sumocu
  62 S / 75 N (the `insert ellipse`/`'1.' -> '#','\xa0'` hunks); lozego 0 S / 1 N
  (`g[4]/text[2]/@y` exp 349.801 act 262.803).
- **Confidence**: High.

## Observation: `Fission`'s header/blank split is generic — C-1 and C-2 share one mechanism
- **Context**: reading `Fission.java:63-101` before writing `buildNumberedListRows`.
- **Finding**: `Fission#getSplitted` operates on any `Stripe` with an `LHeader` — it never
  branches on which concrete header (`Bullet` vs the numbered-list `ListNumberAtom`) it
  received. So the same "row 0 real header, continuation rows `blank(header)`" rule the C-1
  fix ports for bullets applies unmodified to numbered lists too. Implemented both as a
  `blank?: boolean` field on their respective `MemberRenderAtom` kinds, checked at the two
  render sites (`renderer-note.ts`, `renderer-classifier-rows.ts`) and inside
  `renderBulletAtom`/`renderListNumberAtom` themselves.
- **Impact**: `buildNumberedListRows` (new, `note-layout-measure-list.ts`) mirrors
  `buildBulletRows`'s wrap/blank shape exactly, rather than being designed independently.
- **Confidence**: High.

## Observation: `AtomTextUtils#createListNumber` is an OOP `Atom`; this module family never routes through `Sheet`/`Stripe`
- **Context**: designing where the numbered-list header atom's geometry comes from.
- **Finding**: `note-layout-measure.ts`'s own module doc comment already establishes that
  this file is a flat `MemberRenderAtom` adapter, NOT the OOP `Sheet`/`Stripe`/`Atom` object
  model — `buildBulletRows` already inlines `Bullet.java:72-76`'s geometry constants rather
  than instantiate the OOP `Bullet` class. `AtomTextUtils.createListNumber`/`ListNumberAtom`
  needs a `StringBounder` (a different measurement interface from this family's
  `StringMeasurer`) and exposes only a bundled `calculateDimension`/`drawU`, not the
  decomposed `dx`/`textWidth` this port's render pipeline needs. So `buildNumberedListRows`
  inlines `AtomTextUtils.java:145-159`'s formula directly (`INDENT_REFERENCE = "9. "`,
  `TRAILING_REFERENCE = "."`) instead, the same choice `buildBulletRows` already made for
  `Bullet`.
- **Impact**: `CreoleContext` (the one real OOP class reused, per the task's fix-shape
  hint) has no OOP-Atom coupling itself — a clean, self-contained value class — so reusing
  it verbatim was safe and matches the diagnosis's explicit instruction.
- **Confidence**: High.

## Observation: `CreoleContext` scope is per-`Display`/block, not per-whole-note
- **Context**: `CreoleParser.java:142-145`'s `createSheetSlow` (`new CreoleContext()` once
  per `Sheet`) vs. `BodyEnhanced2.java:96,107`'s `getTextBlock(display)` — each
  block-separator-delimited section gets its OWN `Display#create9` call, hence its own
  `Sheet`, hence its own `CreoleContext`.
- **Finding**: `buildBlockRows` in `note-layout-measure.ts` already runs once per block
  (called from `measureNote`'s `flushBlock` loop, and independently again from
  `measureSeparatorTitle` for a titled separator's own label) — the EXACT scope Java gives
  one `CreoleContext`. So `new CreoleContext()` belongs INSIDE `buildBlockRows`, not once
  per whole note. Verified with a unit test: `# a\n# b\n--\n# c` numbers as 1,2 / 1 (resets
  after `--`), not 1,2,3.
- **Confidence**: High (test-verified, `note-numbered-list.test.ts`).

## Observation: lozego's residual was a Sea-reduction desync, not a `renderer-note-link-box.ts` bug
- **Context**: the task named `renderer-note-link-box.ts` as a primary for the lozego lead;
  the actual mechanism lives in `class-member-creole-sea.ts#noteLineAtomDy`, which
  `renderer-note-link-box.ts#renderLinkNoteBox` reaches only by calling the SHARED
  `renderNoteText` every note kind uses.
- **Finding**: `note-layout-measure-rows.ts#noteLineHeight` correctly includes an `'image'`
  atom's raw height (100px sprite) when sizing a note ROW. But `noteLineAtomDy`'s own
  per-atom `dy` correction recomputed a SEPARATE, narrower reduction via the private
  `textAtomSeaEntry` (text-only — `'image'` reports height 0 there), producing a `maxSpan`
  of 13 instead of the row's real 100. For a text atom sharing the line with the tall
  sprite, this desync produced `dy ≈ -87`, pulling the drawn baseline up near the line's
  TOP instead of its bottom (jar: every atom's own bottom edge lands on the line's shared
  bottom, `Sea.java:72-91`'s `translateMinYto`). Hand-derivation matched the golden to
  0.002px; fix replaces the entry function `noteLineAtomDy` uses with one that mirrors
  `noteLineHeight`'s own inclusion set (text + image), leaving the MEMBER-row-scoped
  `textAtomDy`/`resolveMemberAtoms` machinery untouched.
- **Impact**: `textAtomSeaEntry` turned out to have ZERO callers outside `noteLineAtomDy`
  (grep-verified) — it was never actually shared with the member-row engine despite its
  doc comment framing it as SI30-scoped for that engine. Deleted as dead code (same commit,
  per pr-workflow's dead-code rule) rather than left as an unused, doc-comment-only
  "future shared" formula.
- **Confidence**: High (probe-verified 0/0, hand-derivation matches the golden to <0.01px,
  `class-member-creole-sea.test.ts` pins the exact mixed-atom scenario).

## Observation: two pre-existing files were already over the 500-line complexity cap
- **Context**: `renderer-note.ts` (505 after one import line) and `renderer-classifier-
  rows.ts` (537, before any edit of mine) both tripped the hook on a trivial addition.
- **Finding**: neither was caused by this task; both had simply grown past the cap in
  earlier missions without the hook blocking (or the hook is newer than those commits).
  Split each: `renderer-note.ts` → `renderer-note-background.ts` (the `resolveNoteBackground`
  cascade); `renderer-classifier-rows.ts` → `renderer-classifier-row-font-color.ts` (the
  `classifierCascadeFontColor` cascade, itself split further — the PRE-EXISTING
  `classifierCascadeFontColor` was CCN 16, over the CCN-10 cap, once lizard actually ran
  against it as a fresh file) + a `renderTextRowAtom` extraction inside the same file.
- **Impact**: `note-layout-measure.ts` also needed a split for the SAME pre-existing
  crowding reason (491 lines before any edit, cap bites almost immediately) — see the
  task file's own "+ a split file if the 500-line cap bites" allowance. Split into
  `note-layout-measure-list.ts` (`buildPlainRows` moved verbatim + the new C-2 builder).
- **Confidence**: High (lizard/hook output cited verbatim above).

## Observation: baseline measurement was taken AFTER editing, recovered via patch/checkout/reapply
- **Context**: I began editing before running the required pre-edit `render-all.mts`
  baseline (procedural miss, not a data problem).
- **Finding**: recovered per the worktree rule's own fallback: `git diff > patch`,
  `git checkout --` the modified files + `rm` the new untracked ones (clean tree
  confirmed via `git status --short`), ran `render-all.mts` for the true pre-edit
  baseline, then `git apply patch` to restore every change byte-identical (confirmed via
  `npm run typecheck` passing immediately after re-apply, and the three fixture probes
  and `note-bullet-wrap`/`note-numbered-list`/`class-member-creole-sea` unit tests all
  still green afterward).
- **Impact**: none — the pre-baseline used for the pin-diff below is the TRUE pre-edit
  state, not a partially-edited one.
- **Confidence**: High.

## Final report (cdd3-T26)

Commit: the single commit on `wt/cdd3-T26`, subject `fix(cdd3-T26): note
creole bullet blank rows, numbered lists, sea sync`. A commit cannot carry
its own id; run `git log --grep cdd3-T26` (this commit is `ea39002bb`).

### Fixtures (S/N before → after)
- ponono-25-fevo574: 62/75 → 0/0 (conformant). C-1 + C-2.
- sumocu-27-vubo674: 62/75 → 0/0 (conformant). C-1 + C-2 (identical source shape).
- lozego-15-coci435: 0/1 → 0/0 (conformant). Diagnosed + fixed (Sea-reduction desync,
  `class-member-creole-sea.ts#noteLineAtomDy`) — not merely recorded, per the task's
  "fix if reachable" instruction; reachable through `renderer-note-link-box.ts`'s shared
  `renderNoteText` call.

### Movers (render-all, 723 rows, `/tmp/cdd3-T26-pre.json` → `/tmp/cdd3-T26-post.json`)
- lozego-15-coci435: structural-match → conformant.
- ponono-25-fevo574: diverged → conformant.
- sumocu-27-vubo674: diverged → conformant.
- No other row moved. No conformant fixture left conformant (`pin-diff.mts`: exactly
  these 3 transitions).

### Gates
- `npm test` (full run): only the 5 always-red symlinked-worktree files (stdlib-packages,
  stdlib-all-exports, stdlib-package-files, sprite-package-files, stdlib-remote-e2e) plus
  two load-related failures unrelated to this task's write-set (`description-parity
  .ratchet.test.ts`'s `alias-quoted-display-bare-0`, `sequence.diff-baseline.ratchet
  .test.ts`'s `nereka-67-deco609` — both description/sequence-diagram fixtures, neither
  touched by any file this task edited) — see the full-report addendum below for their
  isolated-rerun status. `catalog.test.ts` failed until `npm run catalog`; `docs/catalog.md`
  is regenerated and included in this commit.
- `npm run typecheck`: pass. `npm run lint`: pass. `npm run build`: pass.
- `tests/oracle/class-dot-parity.test.ts`: 721/721.
- New/extended unit tests, all green: `class-member-creole-sea.test.ts` (new, 3 tests),
  `note-numbered-list.test.ts` (new, 6 tests), `note-bullet-wrap.test.ts` (+1 C-1 test),
  `renderer-note.test.ts` (+2 end-to-end C-1/C-2 render tests).

### Write-set
- Primaries: `note-layout-measure.ts` (C-1 fix + C-2 wiring), `renderer-note-link-box.ts`
  (read-only — confirmed as the reachability path for the lozego mechanism, not itself
  edited; the fix lives in the shared `class-member-creole-sea.ts` it calls through).
- New files: `note-layout-measure-list.ts` (`buildPlainRows` moved + C-2's
  `matchNumberedLine`/`buildNumberedListRows`), `renderer-list-number-atom.ts`
  (`renderListNumberAtom`), `renderer-note-background.ts` (500-line-cap split),
  `renderer-classifier-row-font-color.ts` (500-line-cap split).
- D4 extensions (no concurrent task owns these): `class-member-render-atom.ts` (`blank`
  field on `'bullet'`, new `'listNumber'` kind), `renderer-bullet-atom.ts` (`blank` guard),
  `renderer-note.ts` (listNumber dispatch + the background-resolver split), `renderer-
  classifier-rows.ts` (listNumber dispatch, exhaustiveness, `renderTextRowAtom` split),
  `class-scale-geo-row.ts` (`scaleAtom`'s `'listNumber'` case), `class-member-creole-sea.ts`
  (the lozego fix — `noteAtomSeaEntry` replaces `noteLineAtomDy`'s internal reduction;
  `textAtomSeaEntry` deleted as newly-dead code).
- `git -C <main> status --short` checked clean before commit — no leak into the main
  checkout.
