/**
 * I18nTimeData — generated day/month name tables per language.
 *
 * Tables transcribed verbatim from the upstream generated file; the generator
 * (I18nTimeDataGenerator) is not ported. Lookups take the 0-based Java enum
 * ordinal (`DayOfWeek`: MONDAY=0..SUNDAY=6; `Month`: JANUARY=0..DECEMBER=11),
 * so this file stays independent of `src/core/time`.
 *
 * @see net/sourceforge/plantuml/utils/I18nTimeData.java
 */

/**
 * The slice of `java.util.Locale` that I18nTimeData reads (`getLanguage()`).
 * `new Locale(lang)` lower-cases the language (GanttDiagram.java:142).
 *
 * @see net/sourceforge/plantuml/utils/I18nTimeData.java:14 (`locale.getLanguage()`)
 */
export interface Locale {
  readonly language: string;
  readonly country: string;
}

/**
 * `new Locale(language[, country])`: the language is lower-cased.
 *
 * @see net/sourceforge/plantuml/gantt/GanttDiagram.java:142
 */
export function newLocale(language: string, country = ''): Locale {
  return { language: language.toLowerCase(), country };
}

/** @see I18nTimeData.java `dayOfWeekLong` (per-language switch + fallback), ordinal order. */
const DAY_OF_WEEK_LONG: Readonly<Record<string, readonly string[]>> = {
  de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  ja: ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'],
  ko: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'],
  ru: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'],
  zh: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
};

/** @see I18nTimeData.java `dayOfWeekLong` fallback block. */
const DAY_OF_WEEK_LONG_FALLBACK: readonly string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** @see I18nTimeData.java `dayOfWeekShort` (per-language switch + fallback), ordinal order. */
const DAY_OF_WEEK_SHORT: Readonly<Record<string, readonly string[]>> = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  es: ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'],
  fr: ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'],
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  ko: ['월', '화', '수', '목', '금', '토', '일'],
  ru: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
  zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
};

/** @see I18nTimeData.java `dayOfWeekShort` fallback block. */
const DAY_OF_WEEK_SHORT_FALLBACK: readonly string[] = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/** @see I18nTimeData.java `monthShort` (per-language switch + fallback), ordinal order. */
const MONTH_SHORT: Readonly<Record<string, readonly string[]>> = {
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  ru: ['янв.', 'февр.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
  zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
};

/** @see I18nTimeData.java `monthShort` fallback block. */
const MONTH_SHORT_FALLBACK: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** @see I18nTimeData.java `monthLong` (per-language switch + fallback), ordinal order. */
const MONTH_LONG: Readonly<Record<string, readonly string[]>> = {
  de: [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ],
  es: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  fr: [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ],
  ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  ru: [
    'январь',
    'февраль',
    'март',
    'апрель',
    'май',
    'июнь',
    'июль',
    'август',
    'сентябрь',
    'октябрь',
    'ноябрь',
    'декабрь',
  ],
  zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
};

/** @see I18nTimeData.java `monthLong` fallback block. */
const MONTH_LONG_FALLBACK: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
/** Mirrors the Java switch: per-language row, else fallback, else throw. */
function lookup(
  table: Readonly<Record<string, readonly string[]>>,
  fallback: readonly string[],
  ordinal: number,
  locale: Locale,
): string {
  const row = Object.hasOwn(table, locale.language) ? table[locale.language] : fallback;
  const value = row?.[ordinal];
  if (value === undefined) {
    throw new RangeError(`ordinal ${ordinal} is out of range`);
  }
  return value;
}

/**
 * @param dayOfWeek 0-based `DayOfWeek` ordinal (MONDAY=0).
 * @see net/sourceforge/plantuml/utils/I18nTimeData.java:11
 */
export function dayOfWeekLong(dayOfWeek: number, locale: Locale): string {
  return lookup(DAY_OF_WEEK_LONG, DAY_OF_WEEK_LONG_FALLBACK, dayOfWeek, locale);
}

/**
 * @param dayOfWeek 0-based `DayOfWeek` ordinal (MONDAY=0).
 * @see net/sourceforge/plantuml/utils/I18nTimeData.java:105
 */
export function dayOfWeekShort(dayOfWeek: number, locale: Locale): string {
  return lookup(DAY_OF_WEEK_SHORT, DAY_OF_WEEK_SHORT_FALLBACK, dayOfWeek, locale);
}

/**
 * @param month 0-based `Month` ordinal (JANUARY=0).
 * @see net/sourceforge/plantuml/utils/I18nTimeData.java:199
 */
export function monthShort(month: number, locale: Locale): string {
  return lookup(MONTH_SHORT, MONTH_SHORT_FALLBACK, month, locale);
}

/**
 * @param month 0-based `Month` ordinal (JANUARY=0).
 * @see net/sourceforge/plantuml/utils/I18nTimeData.java:333
 */
export function monthLong(month: number, locale: Locale): string {
  return lookup(MONTH_LONG, MONTH_LONG_FALLBACK, month, locale);
}
