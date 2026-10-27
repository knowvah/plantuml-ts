import type { Locale } from '../../core/utils/I18nTimeData.js';
import type { Duration } from '../../core/time/Duration.js';

/** Header words, keyed by language; the `default` of each Java `switch` is the English fallback. */
interface Words {
  readonly fr: string;
  readonly es: string;
  readonly de: string;
  readonly ja: string;
  readonly ko: string;
  readonly ru: string;
  readonly zh: string;
  readonly other: string;
}

function pick(words: Words, locale: Locale): string {
  switch (locale.language) {
    case 'fr':
      return words.fr;
    case 'es':
      return words.es;
    case 'de':
      return words.de;
    case 'ja':
      return words.ja;
    case 'ko':
      return words.ko;
    case 'ru':
      return words.ru;
    case 'zh':
      return words.zh;
    default:
      return words.other;
  }
}

const TASK: Words = {
  fr: 'Tâche',
  es: 'Tarea',
  de: 'Aufgabe',
  ja: 'タスク',
  ko: '작업',
  ru: 'Задача',
  zh: '任务',
  other: 'Task',
};
const START: Words = {
  fr: 'Début',
  es: 'Inicio',
  de: 'Start',
  ja: '開始',
  ko: '시작',
  ru: 'Начало',
  zh: '开始',
  other: 'Start',
};
const END: Words = {
  fr: 'Fin',
  es: 'Fin',
  de: 'Ende',
  ja: '終了',
  ko: '끝',
  ru: 'Окончание',
  zh: '结束',
  other: 'End',
};
const DURATION: Words = {
  fr: 'Durée',
  es: 'Duración',
  de: 'Dauer',
  ja: '期間',
  ko: '기간',
  ru: 'Длительность',
  zh: '持续时间',
  other: 'Duration',
};

const DAY = 0;
const HOUR = 1;
const MINUTE = 2;
const SECOND = 3;

/** One language's unit labels (`Units`, :171-). */
class Units {
  readonly none: string;
  readonly #separator: string;
  readonly #labels: readonly (readonly string[])[];
  readonly #suffixNoSpace: boolean;

  constructor(none: string, separator: string, suffixNoSpace: boolean, labels: readonly (readonly string[])[]) {
    this.none = none;
    this.#separator = separator;
    this.#suffixNoSpace = suffixNoSpace;
    this.#labels = labels;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:175-184 */
  append(sb: string, value: number, unit: number): string {
    if (value <= 0) return sb;
    let out = sb;
    if (out.length > 0) out += this.#separator;
    out += String(value);
    if (this.#suffixNoSpace === false) out += ' ';
    return out + this.#label(unit, value);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:186-203 */
  #label(unit: number, value: number): string {
    const forms = this.#labels[unit] as readonly string[];
    if (forms.length === 1) return forms[0] as string;
    if (forms.length === 3) {
      const mod100 = value % 100;
      const mod10 = value % 10;
      if (mod10 === 1 && mod100 !== 11) return forms[0] as string;
      if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[2] as string;
      return forms[1] as string;
    }
    return value > 1 ? (forms[1] as string) : (forms[0] as string);
  }
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:205-241 (`Units.of`) */
function unitsOf(lang: string): Units {
  switch (lang) {
    case 'fr':
      return new Units('aucune', ', ', false, [
        ['jour', 'jours'],
        ['heure', 'heures'],
        ['minute', 'minutes'],
        ['seconde', 'secondes'],
      ]);
    case 'es':
      return new Units('ninguna', ', ', false, [
        ['día', 'días'],
        ['hora', 'horas'],
        ['minuto', 'minutos'],
        ['segundo', 'segundos'],
      ]);
    case 'de':
      return new Units('keine', ', ', false, [
        ['Tag', 'Tage'],
        ['Stunde', 'Stunden'],
        ['Minute', 'Minuten'],
        ['Sekunde', 'Sekunden'],
      ]);
    case 'ja':
      return new Units('なし', '', true, [['日'], ['時間'], ['分'], ['秒']]);
    case 'ko':
      return new Units('없음', ', ', true, [['일'], ['시간'], ['분'], ['초']]);
    case 'ru':
      return new Units('нет', ', ', false, [
        ['день', 'дней', 'дня'],
        ['час', 'часов', 'часа'],
        ['минута', 'минут', 'минуты'],
        ['секунда', 'секунд', 'секунды'],
      ]);
    case 'zh':
      return new Units('无', '', true, [['天'], ['小时'], ['分钟'], ['秒']]);
    default:
      return new Units('none', ', ', false, [
        ['day', 'days'],
        ['hour', 'hours'],
        ['minute', 'minutes'],
        ['second', 'seconds'],
      ]);
  }
}

/**
 * GanttI18n -- the localized strings of the textual task table.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:38-265
 */
export class GanttI18n {
  private constructor() {}

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:46-63 */
  public static task(locale: Locale): string {
    return pick(TASK, locale);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:67-84 */
  public static start(locale: Locale): string {
    return pick(START, locale);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:88-105 */
  public static end(locale: Locale): string {
    return pick(END, locale);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:109-126 */
  public static duration(locale: Locale): string {
    return pick(DURATION, locale);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:130-150 */
  public static durationHumanReadable(locale: Locale, duration: Duration): string {
    let seconds = duration.getSeconds();
    const units = unitsOf(locale.language);

    if (seconds === 0) return units.none;

    const days = Math.trunc(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.trunc(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.trunc(seconds / 60);
    seconds %= 60;

    let result = '';
    result = units.append(result, days, DAY);
    result = units.append(result, hours, HOUR);
    result = units.append(result, minutes, MINUTE);
    result = units.append(result, seconds, SECOND);
    return result;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java:244-264 */
  public static dayNumber(locale: Locale, dayNum: number): string {
    switch (locale.language) {
      case 'fr':
        return 'Jour ' + dayNum;
      case 'es':
        return 'Día ' + dayNum;
      case 'de':
        return 'Tag ' + dayNum;
      case 'ja':
        return dayNum + '日目';
      case 'ko':
        return dayNum + '일째';
      case 'ru':
        return 'День ' + dayNum;
      case 'zh':
        return '第' + dayNum + '天';
      default:
        return 'Day ' + dayNum;
    }
  }
}
