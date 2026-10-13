# ufp-T1i: utility assets

## Observation: npm run build cannot show the egg-image saving yet
- **Context**: measuring `dist/plantuml-ts.js` before/after moving the Apple //e and RIP images out of the bundle.
- **Finding**: no egg plugin is registered in `src/index.ts`, so the library build contains neither image before or after: 2,622,997 B, `du -sk dist` 32756 both times; a 64-char run of the base64 greps 0 in both. An esbuild (minified, browser) of `src/index.ts` plus the two egg plugins is 4,723,606 B after; T1h measured +241,947 B for its five plugins with the images inline (4,955,908 B), i.e. these images were ~210 KB (145,450 + 64,558 base64 chars) of that.
- **Impact**: the saving appears only once T2a registers the plugins; stop-12 headroom is restored then.
- **Confidence**: High (measured).

## Observation: missing-picture branch mirrors the IOException catch
- **Context**: `PSystemAppleTwo`/`PSystemRIP` constructors declare `IOException`; the factories catch it and return null (java:56-59, :55-58).
- **Finding**: a store lacking the key throws `EggImageUnavailableError` (apple2-image.ts), caught only in the factories -> no diagram -> `Syntax Error?`. `EggImage`/`eggRasterImage` live in `apple2-image.ts` because a new shared file was outside the write-set.
- **Impact**: a host that wires no utility store gets syntax errors for `apple //e` and `jean canouet`, as for dedications.
- **Confidence**: High.
