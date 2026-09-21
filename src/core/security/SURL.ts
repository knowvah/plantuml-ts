/**
 * The access decision of upstream's `SURL` -- which URL a diagram may open.
 * Transport (credentials, proxies, the `BAD_HOSTS` back-off) is the fetcher's
 * business here, not this module's.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/security/SURL.java
 */
import { SecurityProfile } from './SecurityProfile.js';
import { isURLforbidden } from './URLCheck.js';

/** @see ~/git/plantuml/.../security/SURL.java:234 (`PATTERN_USERINFO`) */
const PATTERN_USERINFO = /^(https?:\/\/)([-_0-9a-zA-Z]+@)([^@]*)$/;

/** @see ~/git/plantuml/.../security/SURL.java:719-726 */
function removeUserInfoFromUrlPath(url: string): string {
  return url.replace(PATTERN_USERINFO, '$1$3');
}

/**
 * Java `String#replace` replaces EVERY occurrence -- including the `/` after
 * the port, which upstream drops too (`http://a.com:80/x` -> `http://a.comx`).
 * @see ~/git/plantuml/.../security/SURL.java:292-302
 */
function cleanPath(path: string): string {
  const cleaned = removeUserInfoFromUrlPath(path).trim().toLowerCase();
  return cleaned.replaceAll(':80/', '').replaceAll(':443/', '');
}

/** @see ~/git/plantuml/.../security/SURL.java:281-290 */
function isInUrlAllowList(url: string, allowlist: readonly string[]): boolean {
  const full = cleanPath(url);
  // Thanks to Agasthya Kasturi
  if (full.includes('@')) return false;
  return allowlist.some((allow) => full.startsWith(cleanPath(allow)));
}

/** Java `URL#getPort()` is -1 (absent) or the literal port; WHATWG reports a
 *  scheme-default port as `''` too. Either way 80/443/absent pass. */
function isWebPort(url: string): boolean {
  const port = new URL(url).port;
  return port === '' || port === '80' || port === '443';
}

/**
 * `SURL#isUrlOk`: may `url` be opened under `profile`? `allowlist` is upstream's
 * `plantuml.allowlist.url` (`;`-separated there, an array here).
 * @see ~/git/plantuml/.../security/SURL.java:200-230
 */
export function isUrlOk(url: string, profile: SecurityProfile, allowlist: readonly string[]): boolean {
  // In SANDBOX, we cannot read any URL
  if (profile === SecurityProfile.SANDBOX) return false;
  if (isInUrlAllowList(url, allowlist)) return true;
  if (profile === SecurityProfile.LEGACY) return !isURLforbidden(cleanPath(url), profile);
  // We are INSECURE anyway
  if (profile === SecurityProfile.INSECURE) return true;
  if (profile === SecurityProfile.INTERNET || profile === SecurityProfile.INTERNET_WITH_DOTSVG) {
    if (isURLforbidden(cleanPath(url), profile)) return false;
    // Using INTERNET profile, port 80 and 443 are ok
    return isWebPort(url);
  }
  return false;
}
