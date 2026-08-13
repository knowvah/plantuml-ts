## Observation: SignatureUtils relocation (T8b)
- **Context**: Moving T8's inline MD5 (embedded in `svek/Ports.ts`) into a
  faithful `utils/SignatureUtils.ts` port, per upstream file organization.
- **Finding**: `AsciiEncoder` (`utils/SignatureUtils.java#toString(byte[])`'s
  delegate) was ALREADY ported at `src/core/klimt/sprite/AsciiEncoder.ts`
  with a compatible `encode(Uint8Array): string` API — reused directly,
  no second implementation needed. `SignatureUtils#getSignature` uses this
  AsciiEncoder path (NOT hex) — easy to conflate with `getMD5Hex`, which
  IS hex. The two produce different strings for the same input.
- **Finding**: `salting(String, byte[])` is grouped with the file-dependent
  methods in the task brief's "do not port" list, but it is NOT blocked by
  the file seam (no file/stream argument) — it's blocked by needing an
  unported PBKDF2WithHmacSHA1 primitive, with zero in-scope callers
  (`version/PLSSignature.java`, license/keygen, outside this port's
  roadmap). Documented with a distinct, accurate JSDoc rationale rather
  than reusing the "BLOCKED ON THE FILE SEAM" phrasing verbatim, since
  that phrasing would misstate the actual cause.
- **Finding**: SHA-512's H0/K round constants were derived at module load
  via integer (BigInt) Newton's-method sqrt/cbrt of the first primes (FIPS
  180-4 §5.3.5 / §4.2.3's own definition), mirroring T8's existing
  MD5_K "computed, not transcribed" style already in this file, rather
  than hardcoding 80 hex literals. Verified correct against NIST vectors
  and node:crypto cross-checks — see
  tests/unit/core/utils/SignatureUtils.test.ts.
- **Impact**: Any future caller of `SignatureUtils` (`UImageSvg`,
  `UmlSource`) should import from `core/utils/SignatureUtils.ts`, not
  reimplement hashing. `getSignature`/`getSignatureWithoutImgSrc` are
  AsciiEncoder-based, not hex — check which one a caller actually needs.
- **Confidence**: High (all claims verified via `npm test`, `node:crypto`
  cross-checks, and the ratchet scripts).
