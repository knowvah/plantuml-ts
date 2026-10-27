import { describe, expect, it } from 'vitest';
import { Duration } from '../../../src/core/time/Duration.js';
import { newLocale } from '../../../src/core/utils/I18nTimeData.js';
import { GanttI18n } from '../../../src/diagrams/gantt/GanttI18n.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttI18n.java
const LANGS = ['en', 'fr', 'es', 'de', 'ja', 'ko', 'ru', 'zh'] as const;
const loc = newLocale;

describe('GanttI18n headers', () => {
  it.each([
    ['en', 'Task', 'Start', 'End', 'Duration'], // fallbacks :64, :85, :106, :127
    ['fr', 'Tâche', 'Début', 'Fin', 'Durée'],
    ['es', 'Tarea', 'Inicio', 'Fin', 'Duración'],
    ['de', 'Aufgabe', 'Start', 'Ende', 'Dauer'],
    ['ja', 'タスク', '開始', '終了', '期間'],
    ['ko', '작업', '시작', '끝', '기간'],
    ['ru', 'Задача', 'Начало', 'Окончание', 'Длительность'],
    ['zh', '任务', '开始', '结束', '持续时间'],
  ])('%s', (lang, task, start, end, duration) => {
    const l = loc(lang);
    expect(GanttI18n.task(l)).toBe(task);
    expect(GanttI18n.start(l)).toBe(start);
    expect(GanttI18n.end(l)).toBe(end);
    expect(GanttI18n.duration(l)).toBe(duration);
  });

  it('an unknown language falls back to English', () => {
    expect(GanttI18n.task(loc('xx'))).toBe('Task');
    expect(GanttI18n.dayNumber(loc('xx'), 4)).toBe('Day 4');
  });
});

describe('GanttI18n.dayNumber (java:244-264)', () => {
  it.each([
    ['fr', 'Jour 3'],
    ['es', 'Día 3'],
    ['de', 'Tag 3'],
    ['ja', '3日目'],
    ['ko', '3일째'],
    ['ru', 'День 3'],
    ['zh', '第3天'],
    ['en', 'Day 3'],
  ])('%s', (lang, expected) => {
    expect(GanttI18n.dayNumber(loc(lang), 3)).toBe(expected);
  });
});

describe('GanttI18n.durationHumanReadable (java:130-150, Units :157-241)', () => {
  it('zero seconds is the language\'s "none" word (:134-135)', () => {
    const none = ['none', 'aucune', 'ninguna', 'keine', 'なし', '없음', 'нет', '无'];
    expect(LANGS.map((l) => GanttI18n.durationHumanReadable(loc(l), Duration.ZERO))).toEqual(none);
  });

  it('days, hours, minutes and seconds with singular forms (:202 value > 1 ? plural : singular)', () => {
    expect(GanttI18n.durationHumanReadable(loc('en'), Duration.ofSeconds(90061))).toBe(
      '1 day, 1 hour, 1 minute, 1 second',
    );
  });

  it('plural forms in en, fr, es, de', () => {
    const d = Duration.ofSeconds(2 * 86400 + 3 * 3600 + 4 * 60 + 5);
    expect(GanttI18n.durationHumanReadable(loc('en'), d)).toBe('2 days, 3 hours, 4 minutes, 5 seconds');
    expect(GanttI18n.durationHumanReadable(loc('fr'), d)).toBe('2 jours, 3 heures, 4 minutes, 5 secondes');
    expect(GanttI18n.durationHumanReadable(loc('es'), d)).toBe('2 días, 3 horas, 4 minutos, 5 segundos');
    expect(GanttI18n.durationHumanReadable(loc('de'), d)).toBe('2 Tage, 3 Stunden, 4 Minuten, 5 Sekunden');
  });

  it('zero components are skipped (:176 value <= 0)', () => {
    expect(GanttI18n.durationHumanReadable(loc('en'), Duration.ofSeconds(86400 + 5))).toBe('1 day, 5 seconds');
  });

  it('CJK: single form, no space (ja/zh also no separator, ko ", ")', () => {
    const d = Duration.ofSeconds(3 * 86400 + 5 * 3600);
    expect(GanttI18n.durationHumanReadable(loc('ja'), d)).toBe('3日5時間');
    expect(GanttI18n.durationHumanReadable(loc('zh'), d)).toBe('3天5小时');
    expect(GanttI18n.durationHumanReadable(loc('ko'), d)).toBe('3일, 5시간');
  });

  it.each([
    [1, '1 день'],
    [2, '2 дня'],
    [4, '4 дня'],
    [5, '5 дней'],
    [11, '11 дней'],
    [12, '12 дней'],
    [14, '14 дней'],
    [21, '21 день'],
    [22, '22 дня'],
    [111, '111 дней'],
    [101, '101 день'],
  ])('Russian plural rule (:195-199) for %i days', (days, expected) => {
    expect(GanttI18n.durationHumanReadable(loc('ru'), Duration.ofSeconds(days * 86400))).toBe(expected);
  });

  it('Russian hours/minutes/seconds labels (:226-231)', () => {
    expect(GanttI18n.durationHumanReadable(loc('ru'), Duration.ofSeconds(3600 + 2 * 60 + 5))).toBe(
      '1 час, 2 минуты, 5 секунд',
    );
  });

  it('a negative duration yields no component (every value <= 0)', () => {
    expect(GanttI18n.durationHumanReadable(loc('en'), Duration.ofSeconds(-90))).toBe('');
  });
});
