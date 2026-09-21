/**
 * Bounding one include fetch by time -- the port of upstream's
 * `Future#get(SecurityUtils.getSecurityProfile().getTimeout(), MILLISECONDS)`
 * around every URL read (`security/SURL.java:357-358`, :402, :438).
 *
 * Kept free of `include-resolver.ts` imports (the caller supplies the timeout
 * error) so both that module and `tim/StdlibRemote.ts` can use it without an
 * import cycle.
 */

/**
 * `fetchOnce()`'s result, or a rejection with `onTimeout()` once `timeoutMs`
 * elapses first. The timer is the global `setTimeout`, cleared as soon as the
 * fetch settles either way. A fetcher that throws synchronously rejects too.
 *
 * The underlying request is NOT cancelled here -- a caller-supplied fetcher
 * has no cancellation channel; the built-in `fetchInclude` aborts its own
 * request on the same deadline.
 */
export function withIncludeTimeout<T>(
  fetchOnce: () => Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(onTimeout());
    }, timeoutMs);
  });
  const attempt = new Promise<T>((settle) => {
    settle(fetchOnce());
  });
  return Promise.race([attempt, deadline]).finally(() => {
    clearTimeout(timer);
  });
}
