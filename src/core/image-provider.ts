/**
 * Injectable fetch seam for remote images (`<img:http(s)://…>`, `<img src=…>`).
 * Upstream fetches in `AtomImg.create` (`AtomImg.java:165-169`; bytes via
 * `SURL#getBytes`, `SURL.java:325`). This port is browser-safe and renders
 * synchronously, so the host supplies the transport.
 */

/** Outcome of one {@link ImageProvider.fetch}. */
export type ImageFetchResult =
  | { readonly bytes: Uint8Array; readonly mimeType: string }
  /** Policy refused the fetch; the string is the reason. */
  | { readonly blocked: string }
  /** Transport, size or timeout failure; the string is the reason. */
  | { readonly failed: string };

export interface ImageProvider {
  /** Resolves to a result for every outcome; never rejects. */
  fetch(url: string): Promise<ImageFetchResult>;
}
