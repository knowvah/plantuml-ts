/**
 * Upstream's `SecurityProfile` -- the parts that govern network access.
 *
 * Upstream picks the profile once per process from the
 * `PLANTUML_SECURITY_PROFILE` environment variable (`SecurityProfile#init`).
 * `src/` cannot read the environment, so the profile is a render option
 * (`RenderOptions.securityProfile`); a Node host that wants the jar's
 * behavior reads the variable itself and passes it through.
 *
 * Not ported, because they govern nothing this port does: the local-file
 * rules (`SFile`), `canWeReadThisEnvironmentVariable` (`%getenv` is inert
 * here -- DIVERGENCES.md) and `allowDotSvg`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/security/SecurityProfile.java
 */

/** @see ~/git/plantuml/.../security/SecurityProfile.java:58-107 */
export const SecurityProfile = {
  /** No remote URL access at all. */
  SANDBOX: 'SANDBOX',
  /** Only URLs matching `RenderOptions.urlAllowlist`. */
  ALLOWLIST: 'ALLOWLIST',
  /** Public hosts on ports 80/443 only -- upstream's profile for a server on the Internet. */
  INTERNET: 'INTERNET',
  /** As INTERNET for URL access. */
  INTERNET_WITH_DOTSVG: 'INTERNET_WITH_DOTSVG',
  /** Upstream's default: public hosts on any port. */
  LEGACY: 'LEGACY',
  /** Any URL, internal addresses included. */
  INSECURE: 'INSECURE',
} as const;

export type SecurityProfile = (typeof SecurityProfile)[keyof typeof SecurityProfile];

/**
 * `SecurityProfile#init`'s fallback when `PLANTUML_SECURITY_PROFILE` is unset:
 * LEGACY. (Upstream's TeaVM build answers INSECURE instead, :119-120; this port
 * mirrors the JVM jar, which is its oracle.)
 * @see ~/git/plantuml/.../security/SecurityProfile.java:118-137
 */
export const DEFAULT_SECURITY_PROFILE: SecurityProfile = SecurityProfile.LEGACY;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** @see ~/git/plantuml/.../security/SecurityProfile.java:158-176 */
const TIMEOUT_MS: Readonly<Record<SecurityProfile, number>> = {
  SANDBOX: SECOND,
  ALLOWLIST: 5 * MINUTE,
  INTERNET: 10 * SECOND,
  INTERNET_WITH_DOTSVG: 10 * SECOND,
  LEGACY: MINUTE,
  INSECURE: 5 * MINUTE,
};

/**
 * How long one URL fetch may take under `profile`, in milliseconds.
 * @see ~/git/plantuml/.../security/SecurityProfile.java:158-176 (`getTimeout`)
 */
export function getTimeout(profile: SecurityProfile): number {
  return TIMEOUT_MS[profile];
}
