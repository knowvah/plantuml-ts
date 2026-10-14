# Decisions (approved by the maintainer 2026-10-13, plan-mission Phase 3)

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## D1 — Layout: upstream packages, one TS file per Java file
`src/diagrams/{eggs,openiconic,emoji,sudoku,donors,version,dedication}/` and
`src/core/klimt/sprite/PSystemListArchimateSprites*.ts`, upstream names, `@see` on every symbol,
`file:line` on every constant. Base classes and core helpers in their upstream homes under
`src/core/` (D3, D6).

## D2 — Dispatch: one plugin per factory at its upstream position
Each factory is its own plugin registered in `src/index.ts` at its `PSystemBuilder.java:133-200`
position relative to the existing plugins (`PSystemColorsFactory` BEFORE `sequencePlugin`, java:134;
License/Version/Donors/Skinparameters/Emoji/OpenIconic/ListOpenIconic/ListArchimate after the
UML factories, java:144-152; Sudoku java:163; Egg/AppleTwo/RIP/Charlie java:175-181; Dedication
java:186). Each uses the `@startuml` candidate type via upstream's `SEQUENCE` hack
(`PSystemSingleLineFactory.java:61`). The registry is an ordered list filtered by
`upstreamTypeOf(plugin.type)` (`src/core/dispatcher.ts:416-440`) — no registry change expected;
T0c verifies.

## D3 — Core bases
`UgDiagram.java` (164), `UgSimpleDiagram.java` (51), `PlainStringsDiagram.java` (64) ported to
`src/core/`, exporting through the existing titled/plain path with `getDefaultMargins()`
(`UgDiagram.java:145`); `command/PSystemSingleLineFactory.java` as a plugin helper (3-line gate
after `removeInitialNoise`, java:66-90); `donors/PSystemDonors.java#getCols` (java:146-154)
exported for the openiconic/archimate/donors listings. Pre-declared core (T0c).

## D4 — Image pages
`charlie` and the 10 `DedicationSimple` sentences (`dedication/Dedications.java:55-65`) embed
vendored PNGs as data URIs; the PNG bytes are extracted ONCE from jar renders via
`scripts/oracle-render.sh` by a provenance script (T0e). `compareSvg` exempts image href bytes, so
dimensions are what is compared. The 3 `DedicationEncrypted` secrets (argon2 + a 5-second
wall-clock throttle, `DedicationEncrypted.java:65-79`) are OUT: `Dedications.get` returns null for
them in the port — follow-on, journaled.

## D5 — Vendored data as generated modules
OpenIconic `all.txt` order (`PSystemListOpenIconic.java:79`), archimate sprite names
(`PSystemListArchimateSprites.java:57-79` enumerates the classpath at runtime — the port ships the
list), the skinparameter key table, the bare-`stdlib` catalog text, the donors list, the charlie
and dedication PNGs: generated, checked-in modules with an upstream provenance header (the
`openiconic-glyphs-data.ts` precedent), each generator byte-stable on rerun. Large binary data
stays out of the core bundle where the existing asset-store pattern allows (stop 12 at +250 KB).

## D6 — Colour core
`HColorSet.names()`, `HColorSimple.distanceTo` (`HColorSimple.java:217-219`), `ColorUtils.distance`
(`ColorUtils.java:77-82`) added to their core homes in batch 0 (T0d), pre-declared.

## D7 — Sudoku randomness
With a seed: mirror Java exactly via the existing `src/core/klimt/drawing/hand/JavaRandom.ts`
(`SudokuDLX.java:49`, base-36 seed `PSystemSudokuFactory.java:60`). Without a seed upstream draws
`new Random()` — the port uses a fixed default seed, injectable via render options (no
`Math.random`/`Date.now` in rendering, CLAUDE.md). Any seed yields an output the jar can produce.

## D8 — Version family
Port `license`, `version`, `about`/`authors`, bare `stdlib` (`version/PSystemVersionFactory.java:52-59`),
printing this port's version string (ruling "keep own version string"). The key tools
(`keygen`/`keyimport`/`keycheck`/`keydistributor`, java:65-77) and `testdot` (java:62, runs
graphviz) are OUT.

## D9 — Harness
New `oracle/goldens/svg-utility/` family: golden ratchet, diff-baseline ratchet over the 17
`dot-cache/unknown` slugs, pin / re-pin-baseline / re-pin-routing tools (the wep T0b shape);
routing/refusal twin rows cloned at every pin.

## D10 — Coverage beyond the corpus
Authored fixtures + jar oracles (T3-cov) for every factory with no corpus row: `license`,
`version`, `about`, `donors`, `skinparameters`, AppleTwo/RIP, `openiconic` variants,
`colors <hex>`, seedless `sudoku` (determinism only). `PSystemEgg`'s encrypted sentences are
ported and unit-tested on the negative path only (the phrases are secret).

## D11 — Exit bar
17 rows survey-conformant; every byte-identical row pinned; authored rows conformant or carrying
a mechanism; routing/refusal records corrected (HELP reason "never added" is wrong —
`PSystemBuilder.java:188`; `kubuju-35-neji041` copy-paste reason); 0 conformant losses in any
engine; four gates green with collected = on-disk.

## D12 — Execution rules
wep's: one worktree per task (`measurements/mkwt.sh`), no Serena edit tools in worktrees, oracles
only via `scripts/oracle-render.sh`, merge commits only, no push, typecheck before every commit.

## D13 — Mirror upstream's MIT edition; sudoku dropped (maintainer ruling 2026-10-13, mid-b1)
Where upstream builds differ by licence edition (`// ::remove folder|file when __MIT__ …`,
`// ::comment|uncomment when __MIT__`), the port mirrors the **MIT edition**, not the GPL jar the
oracle was built from. Consequences: (a) **sudoku is dropped** — `sudoku/` is removed and
`PSystemSudokuFactory` unregistered in MIT (`GraphicsSudoku.java:59`, `PSystemBuilder.java:161-164`);
`lazama-75`/`gazale-13` leave the in-scope set (17 → 15) and stay error pages by design; D1's
`sudoku/` package, D7 and D10's seedless sudoku are void; T1e's engine-only branch is deleted.
The project README states the omission is deliberate. (b) `License.java` takes its `__MIT__`
branches (name `MIT`, MIT text; java:63-76, :155-:240). (c) `<qrcode:>` resolves through
`FlashCodeUtilsNone` (zxing's `FlashCodeUtilsZxing` is `::remove file when __MIT__`), so
`AtomImg.createQrcode` draws a blank 10x10 RGB image scaled (`AtomImg.java:90-103`) — no QR
encoder. Oracle rows that render the GPL behaviour differ from the port by this ruling.
**Scope (maintainer ruling 2026-10-14): D13 covers sudoku only.** Upstream also comments out
`PSystemDitaaFactory` for MIT (`PSystemBuilder.java:165-166`, `::comment when __MIT__ __EPL__
__BSD__ __ASL__`); the port **keeps** its ported ditaa engine. Other edition markers are ruled
case by case, not by extension of D13.

## D14 — `version` renders the port's own values (maintainer ruling 2026-10-13, b1 close)
`PSystemVersion#createShowVersion` (java:172-202) prints host state after its first four lines
(`GraphvizUtils.addDotStatus`, `OptionPrint.interestingProperties`/`interestingValues`). The port
renders the page with its own truthful equivalents (its layout engine instead of a Graphviz
binary; no JVM/OS lines it does not have) — a platform-forced divergence, recorded in
`DIVERGENCES.md` when it lands. Never print the oracle host's values. The about/authors label
`plantuml-ts version <v>` (journal row 24a) is confirmed.

## D15 — Core ports approved for batch 3 (maintainer ruling 2026-10-13, b1 close)
Pre-approved core pieces (no stop-10 report needed): `SpriteImage` drawing of internal PNG
sprites (SpriteImage.java:60-100; the internal store keeps PNG bytes), the `<qrcode:>` creole
command + `AtomImg.createQrcode` under the MIT edition (D13: `FlashCodeUtilsNone`, blank 10x10),
and `HColorAutomagic` with `HColorSet`'s `automatic` branch (HColorSet.java:85-86).
