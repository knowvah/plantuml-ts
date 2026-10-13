# T0e: generated utility data (D4, D5)

Prepend [../task-preamble.md](../task-preamble.md).

## Task (TDD)
One provenance generator, `scripts/generate-utility-data.mts`, producing checked-in modules,
byte-stable on rerun, each with a header naming its upstream source and the generator:
1. **OpenIconic list order** — `src/main/resources/openiconic/all.txt` (read by
   `PSystemListOpenIconic.java:79`) → `src/diagrams/openiconic/openiconic-all.ts`; cross-check
   every name exists in `src/core/openiconic-glyphs-data.ts` `RAW_GLYPHS`.
2. **ArchiMate sprite names** — the files under upstream `src/main/resources/sprites/archimate/`
   in the order `ResourcesUtils.getJarFile` yields (read `ResourcesUtils.java:63-85`; verify the
   order against the jar's `xucoma-93-jeko861` oracle) → `src/core/klimt/sprite/archimate-sprite-names.ts`.
3. **Skinparameter keys** — the table `PSystemSkinparameterList.java` prints (read where it comes
   from) → `src/diagrams/donors/skinparameter-names.ts`.
4. **Donors list** — the text `PSystemDonors.java` decodes (`TranscoderImpl.utf8`, java:156-158)
   → `src/diagrams/donors/donors-list.ts` (decode once in the generator, mirror the decode in a
   unit test against one name).
5. **Bare `stdlib` catalog** — what `PSystemVersion`'s `stdlib` branch prints (read
   `PSystemVersionFactory.java:59` → its target; T6 cites `preproc/Stdlib.java:327`) → a data
   module under `src/diagrams/version/`; prefer deriving from the port's vendored stdlib if the
   Java reads the stdlib at runtime (journal the choice with the Java quote).
6. **Charlie + dedication PNGs** — render `@startuml\ncharlie\n@enduml` and each of the 10
   `DedicationSimple` sentences (`dedication/Dedications.java:55-65`) through
   `scripts/oracle-render.sh` into a scratch dir, extract each `<image xlink:href="data:image/png;base64,…">`
   with its width/height, store as assets via the existing asset-store pattern
   (`src/core/internal-emoji-store.ts`, `packages/emoji/`) or a module, whichever keeps the core
   bundle under stop 12 (+250 KB). Measure `npm run build` before/after; journal both.
7. Tests: each module's count and first/last entries; generator byte-stability (run twice, diff).

## Write-set
`scripts/generate-utility-data.mts`, `src/diagrams/openiconic/openiconic-all.ts`,
`src/core/klimt/sprite/archimate-sprite-names.ts`, `src/diagrams/donors/{skinparameter-names,donors-list}.ts`,
`src/diagrams/version/stdlib-catalog.ts`, the image assets (new files only, under a path you name
in the report), their tests, `docs/catalog.md`, `.agent-notes/ufp-T0e.md`. Any OTHER file is a stop.

## Interface contract (→ batch 1)
Named exports per module: `OPENICONIC_ALL: readonly string[]`, `ARCHIMATE_SPRITE_NAMES: readonly
{folder, name, format}[]`, `SKINPARAMETER_NAMES`, `DONORS`, `STDLIB_CATALOG`,
`CHARLIE_PNG` / `DEDICATION_IMAGES: Record<sentence, {png, width, height}>` — final names in the report.

## Acceptance
- Given the generator run twice, then no file changes.
- Given each module, then counts equal the upstream resource's.
- Given the build, then the size delta is journaled and under +250 KB.

**Observability:** N/A. **Rollback:** Reversible (new files).
