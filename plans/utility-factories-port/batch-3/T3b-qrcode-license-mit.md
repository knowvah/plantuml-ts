# T3b (F2): `<qrcode:>` under the MIT edition + License's MIT branches (D13, D15)

Prepend [../task-preamble.md](../task-preamble.md). Agent: typescript-pro (opus). Pre-approved core (D15).

## Mechanism (journal rows 23, 30)
The license page's line 16 is `\t<qrcode:…>\t\t<qrcode:…>\t\t<qrcode:…>` (License.java:145-146).
Chain: `CommandCreoleQrcode.java:69-77` → `StripeSimple.java:216-218` (`addQrcode`) →
`AtomImg.createQrcode` (AtomImg.java:90-103) → `FlashCodeFactory.getFlashCodeUtils()`
(FlashCodeFactory.java:42-57). Under the MIT edition (D13) `FlashCodeUtilsZxing` is
`::remove file when __MIT__`, so the factory returns `FlashCodeUtilsNone` (`exportFlashcode` →
null) and `createQrcode` builds a blank `PortableImageFactory.build(10, 10, TYPE_INT_RGB)` scaled
by `scale`, drawn as an `AtomImg`. The port has only `qrcodePattern` (`Splitter.ts:35`): today the
line draws as text and every later row sits 87 px high. Separately `License.java` takes its
`__MIT__` branches (java:63-76 name, :155-:240 text) — T1f mirrored the GPL ones.

## Task (TDD)
1. Port `CommandCreoleQrcode` (+ its registration where upstream registers it in the creole
   command list), `StripeSimple#addQrcode`, `AtomImg.createQrcode` with `FlashCodeUtils` /
   `FlashCodeUtilsNone` / `FlashCodeFactory` (MIT: always None). The blank image: read
   `PortableImageFactory.build` + `TYPE_INT_RGB` (zero pixels = black) and `UImage.scale`/`getImage(1)`;
   emit the PNG the jar's MIT path would (verify the 10x10 dims and scale against the Java; the
   jar oracle itself is GPL and draws real QR codes — its image DIMENSIONS differ by edition, so
   pin our dims to the Java, not to the GPL oracle, and record the delta).
2. `src/diagrams/version/License.ts`: take every `__MIT__` branch (name `MIT`, MIT texts).
3. License probe: report the remaining compareSvg diffs vs the GPL jar oracle, each attributed
   to D13 (edition text, qrcode dims) or named with a mechanism.

## Write-set
`src/core/klimt/creole/command/CommandCreoleQrcode.ts` (new) + the creole command registry file,
`src/core/klimt/creole/legacy/StripeSimple.ts`, a new `src/core/klimt/creole/atom/AtomImg*.ts`
or the existing img-atom home (find it; report the file), `src/core/flashcode/**` (new),
`src/diagrams/version/{License,LicenseInfo}.ts`, their tests, `docs/catalog.md`,
`.agent-notes/ufp-T3b.md`. NOT `src/core/creole-atoms-image-resolver.ts`,
`src/core/internal-sprite-store.ts`, `src/core/sprite-registry.ts` (T3a) — if the qrcode image
needs one of them, stop and report. NOT `src/diagrams/version/PSystemVersion*` (T3d).

**Observability:** N/A. **Rollback:** Reversible.
