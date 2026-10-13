/**
 * `LicenseInfo` — the PlantUML licence the running build carries, as
 * `License` and `PSystemLicense` read it.
 *
 * Upstream retrieves it from three host sources, none of which exists in a
 * browser-safe `src/` (CLAUDE.md, Architecture): a `/distributor.txt` classpath
 * resource (`retrieveDistributor`, java:172-193), the `license` key of a
 * `java.util.prefs.Preferences` node and `license.txt` files next to the
 * classpath entries (`retrieveNamedSlow`, java:102-132). This build has none of
 * them, exactly like the stock (oracle) jar, which ships no distributor
 * resource and finds no key, so every retrieval resolves to {@link LicenseInfo.NONE}
 * as the oracle's does.
 *
 * Not ported, each because it only serves those host sources or the key tools
 * (`keygen`/`keyimport`/`keycheck`/`keydistributor`, out by decisions.md D8):
 * `persistMe` (java:93-96, a `Preferences` write), `retrieveNamed` and
 * `retrieve` (java:134-145, :220-235, `PLSSignature` decryption of a key read
 * from those sources), `setIfValid` (java:213-218, called only from the two
 * skipped `retrieveNamedSlow` branches), `fileCandidates` (java:195-211, the
 * JVM classpath) and `main` (java:237-242).
 *
 * `System.currentTimeMillis()` (`isValid`, `hasExpired`) is injected: `src/`
 * reads no clock (CLAUDE.md, Architecture).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java
 */
import type { RasterImage } from '../../core/error/raster-image.js';
import { LicenseType } from './LicenseType.js';

/** The constructor's six stored fields, one object for the
 *  complexity hook's 5-parameter cap, plus the injected clock.
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:76-81 */
export interface LicenseInfoFields {
  readonly type: LicenseType;
  readonly generationDate: number;
  readonly expirationDate: number;
  readonly owner: string | undefined;
  readonly context: string | undefined;
  readonly sha: Uint8Array | undefined;
  /** `System.currentTimeMillis()`. */
  readonly currentTimeMillis: () => number;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:55 */
export class LicenseInfo {
  /** The clock is never read for NONE: `owner == null` short-circuits
   *  `isValid` and `hasExpired` (java:68, :261).
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:74 */
  static readonly NONE: LicenseInfo = new LicenseInfo({
    type: LicenseType.NONE,
    generationDate: 0,
    expirationDate: 0,
    owner: undefined,
    context: undefined,
    sha: undefined,
    currentTimeMillis: () => 0,
  });

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:83-91 */
  constructor(private readonly fields: LicenseInfoFields) {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:67-69 */
  isValid(): boolean {
    return this.fields.owner !== undefined && this.fields.currentTimeMillis() <= this.fields.expirationDate;
  }

  /** `new Date(generationDate)`, as epoch milliseconds.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:244-246 */
  getGenerationDate(): number {
    return this.fields.generationDate;
  }

  /** `new Date(expirationDate)`, as epoch milliseconds.
   *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:248-250 */
  getExpirationDate(): number {
    return this.fields.expirationDate;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:252-254 */
  getOwner(): string | undefined {
    return this.fields.owner;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:256-258 */
  isNone(): boolean {
    return this.fields.owner === undefined;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:260-262 */
  hasExpired(): boolean {
    return this.fields.owner !== undefined && this.fields.currentTimeMillis() > this.fields.expirationDate;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:264-266 */
  getLicenseType(): LicenseType {
    return this.fields.type;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:268-270 */
  getContext(): string | undefined {
    return this.fields.context;
  }
}

/**
 * `private static LicenseInfo cache` (java:71). Concurrency contract: written
 * once, by the first {@link retrieveQuick}/{@link retrieveNamedSlow} call; every
 * value it can take here is {@link LicenseInfo.NONE}, so a re-entrant or
 * repeated write stores the same object (upstream's `synchronized` guards a
 * slow read this port does not perform).
 */
let cache: LicenseInfo | undefined;

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:58-65 */
export function retrieveQuick(): LicenseInfo {
  cache ??= retrieveDistributor();
  cache ??= retrieveNamedSlow();
  return cache;
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:98-100 */
export function retrieveNamedOrDistributorQuickIsValid(): boolean {
  return retrieveQuick().isValid();
}

/**
 * `cache = NONE`, then the `Preferences` key (java:107-113) and the classpath
 * `license.txt` candidates (java:114-130). This build has no `Preferences`
 * store (`prefs.get("license", "")` is `""`, so java:108's `key.length() > 0`
 * is false) and no classpath (`fileCandidates()` is empty), so both branches
 * are skipped and the result is NONE — what the oracle jar, with neither,
 * returns.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:102-132
 */
export function retrieveNamedSlow(): LicenseInfo {
  cache = LicenseInfo.NONE;
  return cache;
}

/**
 * The distributor logo. Null for any licence but a DISTRIBUTOR one
 * (java:148-150); a DISTRIBUTOR one passes the `PLSSignature` check
 * (java:151-153) to read the `/distributor.png` classpath resource, which this
 * build does not bundle — `if (dis == null) return null;` (java:156-158). So
 * every licence answers null here.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:147-170
 */
export function retrieveDistributorImage(_licenseInfo: LicenseInfo): RasterImage | undefined {
  return undefined;
}

/**
 * `getResourceAsStream("/distributor.txt")` is null in this build, as in the
 * stock jar: `if (dis == null) return null;` (java:173-175).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/LicenseInfo.java:172-193
 */
export function retrieveDistributor(): LicenseInfo | undefined {
  return undefined;
}
