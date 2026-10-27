/**
 * `java.time.DateTimeException` -- thrown for a value outside a field's range
 * or an impossible date.
 *
 * @see https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/DateTimeException.html
 */
export class DateTimeException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'DateTimeException';
  }
}
