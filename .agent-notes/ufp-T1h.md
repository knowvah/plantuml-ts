# ufp-T1h: eggs + dedication

## Observation: Apple //e and RIP images cost ~210 KB of bundle once registered
- **Context**: porting `PSystemAppleTwo` (`PSystemVersion.getApple2Image`, java:124-126) and
  `PSystemRIP` (`SImageIO.read(imm)`, java:63); neither image was vendored by T0e.
- **Finding**: upstream's sources are tiny (`version/apple2.png` is a 5.4 KB header-stripped WebP;
  `imm` is a 3.3 KB JPEG) but the jar re-encodes both as PNG in SVG: 145,450 and 64,558 base64
  chars. Vendored inline (the charlie precedent) as `src/diagrams/eggs/{apple2,rip}-image.ts`.
  esbuild (minified, browser) of `src/index.ts` plus the five T1h plugins: 4,955,908 B vs
  4,713,961 B without them = +241,947 B, most of it these two images plus `CHARLIE_PNG`.
- **Impact**: when T2a registers the plugins this alone nearly reaches stop 12 (+250 KB over b0).
  Moving the two images to the asset channel (like `assets/dedication/`) is the lever; it needs
  `assets/` and store wiring outside T1h's write-set.
- **Confidence**: High (measured).

## Observation: the port's UImage has no calculateDimension
- **Context**: `PSystemCharlie`/`PSystemDedication#calculateDimension` = `image.calculateDimension`.
- **Finding**: upstream is the raster size less one (`UImage.java:87-93`, `:118-120`); the port's
  `core/klimt/shape/UImage.ts` is a data carrier without it. Computed locally from the raster
  size, as `core/error/error-block.ts#imageBlock` and `svek/image/Footprint.ts` already do.
- **Impact**: a third local copy of `raster - 1`; a core `UImage#calculateDimension` would retire all.
- **Confidence**: High.

## Observation: equalsIgnoreCase follows Java's char-wise rules, and the jar proves it
- **Context**: the egg factories compare the raw line with `String#equalsIgnoreCase`.
- **Finding**: jar probes: `charlıe` (dotless i) renders charlie (upper cases agree);
  `Steve WozniaK` (Kelvin sign) renders Apple //e (lower of upper agrees); `straße`
  is a syntax error. `toLowerCase`/`===` would get both wrong. Ported per char in
  `eggs/equals-ignore-case.ts`, copied to `dedication/` (layering rule 2 forbids the import).
- **Impact**: any other factory porting `equalsIgnoreCase` should reuse this logic; a core home is
  a follow-on.
- **Confidence**: High.

## Observation: the egg positive path is testable without the secrets
- **Context**: D10 forbids testing the secret sentences.
- **Finding**: the key is the line's letters read in base 26, so a line can be built that xors the
  jar's second payload into any chosen text: `lxvbbhmpdcicntnfcksjrrvqyoxsiiexvws` ->
  `Hello|from|the|tests!`. The jar renders it as an egg page (4 lines, 39x59); the port matches
  with zero diffs.
- **Impact**: a positive-path oracle for `PSystemEggFactory` that reveals nothing.
- **Confidence**: High (jar probe).

## Observation: no store serves the dedication PNGs to the harnesses
- **Context**: `kavama-92-noro949` (`Write your own dedication!`).
- **Finding**: the port reads the bytes through `ParseOptions.assetStore` under
  `dedication:<resource>.png`; without a store `Dedications.get` matches nothing (upstream's
  failed `load`/decode -> null) and the page is `Syntax Error?`.
  `render-fixture-utility.ts#measureUtilityMarkup` passes only `includeStore`, and
  `scripts/svg-parity-survey.ts:71` combines only sprite + emoji stores, so the row cannot go
  conformant in the survey until a dedication store is wired. With a test store the row is zero-diff.
- **Impact**: harness change outside T1h's write-set (reported).
- **Confidence**: High.

## Observation: oracle-render.sh nests output by the input's relative path
- **Context**: rendering `tests/fixtures/utility/*.puml` with `<out-dir> = tests/fixtures/utility`.
- **Finding**: a RELATIVE puml path writes `<out-dir>/<relative path>/<name>.svg`
  (`tests/fixtures/utility/tests/fixtures/utility/apple.svg`); an absolute path writes flat.
- **Impact**: pass absolute puml paths, or move the svgs after.
- **Confidence**: High.
