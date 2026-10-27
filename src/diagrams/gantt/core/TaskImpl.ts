import type { Display } from '../../../core/klimt/creole/Display.js';
import type { Stereotype } from '../../../core/stereo/Stereotype.js';
import type { StyleBuilder } from '../../../core/style/StyleBuilder.js';
import { DayOfWeek } from '../../../core/time/DayOfWeek.js';
import type { LocalDate } from '../../../core/time/LocalDate.js';
import type { Url } from '../../../core/url/Url.js';
import type { GanttDiagram } from '../GanttDiagram.js';
import type { CenterBorderColor } from '../lang/CenterBorderColor.js';
import { Load } from '../ngm/Load.js';
import { NGMAllocation } from '../ngm/NGMAllocation.js';
import { Combiner } from '../ngm/math/Combiner.js';
import { Fraction } from '../ngm/math/Fraction.js';
import type { PiecewiseConstant } from '../ngm/math/PiecewiseConstant.js';
import { PiecewiseConstantSpecificDays } from '../ngm/math/PiecewiseConstantSpecificDays.js';
import { PiecewiseConstantUtils } from '../ngm/math/PiecewiseConstantUtils.js';
import { PiecewiseConstantWeekday } from '../ngm/math/PiecewiseConstantWeekday.js';
import type { PValue } from '../PValue.js';
import { Solver } from '../solver/Solver.js';
import { TimePoint } from '../time/TimePoint.js';
import { AbstractTask } from './AbstractTask.js';
import type { Resource } from './Resource.js';
import type { Task } from './Task.js';
import { TaskAttribute } from './TaskAttribute.js';
import type { TaskCode } from './TaskCode.js';

/** Percentage denominator of `new Fraction(ent.getValue(), 100)`. @see TaskImpl.java:171 */
const PERCENT = 100;

/** The `%` shown by `getPrettyDisplay` unless the share is full. @see TaskImpl.java:187 */
const FULL_PERCENTAGE = 100;

/** Java `(TimePoint) solver.getData(...)`: a wrong type is a ClassCastException. */
function asTimePoint(value: PValue): TimePoint {
  if (!(value instanceof TimePoint)) throw new Error('ClassCastException: not a TimePoint');
  return value;
}

/** Java `(Load) solver.getData(...)`. */
function asLoad(value: PValue): Load {
  if (!(value instanceof Load)) throw new Error('ClassCastException: not a Load');
  return value;
}

/** One `LinkedHashMap<Resource, Integer>` entry; the map keeps the FIRST key object on re-put. */
interface ResourceShare {
  readonly resource: Resource;
  percentage: number;
}

/**
 * TaskImpl -- the regular task: start/end/load solved lazily by a {@link Solver}
 * over the working-time calendar (default plan x resources or local pauses).
 *
 * Java collections: `TreeSet<LocalDate>` is a sorted, de-duplicated array;
 * `EnumSet<DayOfWeek>` a Set iterated in ordinal order; `LinkedHashMap<Resource, Integer>`
 * a Map keyed by `Resource.getName()` (Resource.hashCode/equals are on the name).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskImpl.java:67
 */
export class TaskImpl extends AbstractTask implements Task {
  /** `TreeSet<LocalDate>`, ascending. @see TaskImpl.java:69 */
  readonly #pausedDay: LocalDate[] = [];
  /** `EnumSet<DayOfWeek>`. @see TaskImpl.java:70 */
  readonly #pausedDayOfWeek = new Set<DayOfWeek>();

  readonly #solver: Solver;
  /** @see TaskImpl.java:73 */
  readonly #resources = new Map<string, ResourceShare>();
  #diamond = false;
  readonly #gantt: GanttDiagram;

  #cachedPiecewiseConstant: PiecewiseConstant | undefined;
  #cachedStart: TimePoint | undefined;
  #cachedEnd: TimePoint | undefined;

  #completion: number;
  #note: Display | undefined;
  #noteStereotype: Stereotype | undefined;

  #url: Url | undefined;
  #colors: CenterBorderColor[] | undefined;

  /** @see TaskImpl.java:100-108 */
  public constructor(
    gantt: GanttDiagram,
    styleBuilder: StyleBuilder,
    code: TaskCode,
    startingDay: TimePoint,
    completion: number,
  ) {
    super(styleBuilder, code);
    this.#gantt = gantt;
    this.#completion = completion;

    this.#solver = new Solver();
    this.setStart(startingDay);
    this.setLoad(Load.of(gantt.durationOfDays(1)));
  }

  /** @see TaskImpl.java:91-93 */
  public setUrl(url: Url): void {
    this.#url = url;
  }

  /** @see TaskImpl.java:110-112 */
  public getDefaultPlan(): PiecewiseConstant {
    return this.#gantt.getLoadPlanableForTask(this.getCode().getId());
  }

  /** @see TaskImpl.java:114-135 */
  #localPause(): PiecewiseConstant {
    let weekPattern = PiecewiseConstantWeekday.of(Fraction.ONE);

    for (const day of this.#sortedDaysOfWeek()) weekPattern = weekPattern.with(day, Fraction.ZERO);

    let result: PiecewiseConstant = weekPattern;

    if (this.#pausedDay.length > 0) {
      const closedDays = new Map<LocalDate, Fraction>();
      for (const date of this.#pausedDay) closedDays.set(date, Fraction.ZERO);

      const specificDaysClosed = PiecewiseConstantSpecificDays.of(Fraction.ONE, closedDays);

      result = Combiner.product(weekPattern, specificDaysClosed);
    }

    return result;
  }

  /** `EnumSet` iterates in ordinal order. */
  #sortedDaysOfWeek(): DayOfWeek[] {
    return [...this.#pausedDayOfWeek].sort((a, b) => a.ordinal() - b.ordinal());
  }

  /** @see TaskImpl.java:137-148 */
  public asPiecewiseConstant(): PiecewiseConstant {
    if (this.#cachedPiecewiseConstant !== undefined) return this.#cachedPiecewiseConstant;

    if (this.#resources.size > 0)
      this.#cachedPiecewiseConstant = Combiner.product(this.getDefaultPlan(), this.allRessources());
    else this.#cachedPiecewiseConstant = Combiner.product(this.getDefaultPlan(), this.#localPause());

    return this.#cachedPiecewiseConstant;
  }

  /** @see TaskImpl.java:150-158 */
  #isPaused(instant: TimePoint): boolean {
    if (this.#pausedDay.some((d) => d.equals(instant.toDay()))) return true;

    if (this.#pausedDayOfWeek_(instant)) return true;

    return false;
  }

  /** `pausedDayOfWeek(TimePoint)` (the Java method shares its name with the field). @see TaskImpl.java:160-166 */
  #pausedDayOfWeek_(instant: TimePoint): boolean {
    for (const dayOfWeek of this.#sortedDaysOfWeek()) if (instant.toDayOfWeek() === dayOfWeek) return true;

    return false;
  }

  /** @see TaskImpl.java:168-180 */
  public loadForResource(res: Resource, instant: TimePoint): number {
    const share = this.#resources.get(res.getName());
    if (
      share !== undefined &&
      instant.compareTo(this.getStart()) >= 0 &&
      instant.compareTo(this.getEndMinusOneDayTOBEREMOVED()) <= 0
    ) {
      if (this.#isPaused(instant)) return 0;

      if (res.isClosedAt(instant.toDay())) return 0;

      return share.percentage;
    }
    return 0;
  }

  /** Both `addPause` overloads. @see TaskImpl.java:182-192 */
  public addPause(pause: LocalDate | DayOfWeek): void {
    if (pause instanceof DayOfWeek) {
      this.#pausedDayOfWeek.add(pause);
    } else {
      this.#addPausedDay(pause);
    }
    this.#invalidateCache();
  }

  /** `TreeSet#add`: sorted, no duplicate. */
  #addPausedDay(day: LocalDate): void {
    let index = 0;
    while (index < this.#pausedDay.length) {
      const cmp = this.#pausedDay[index]!.compareTo(day);
      if (cmp === 0) return;
      if (cmp > 0) break;
      index++;
    }
    this.#pausedDay.splice(index, 0, day);
  }

  /** @see TaskImpl.java:194-212 */
  public allRessources(): PiecewiseConstant {
    const contributions: PiecewiseConstant[] = [];

    for (const { resource: res, percentage } of this.#resources.values()) {
      const availability = res.asPiecewiseConstant();

      const percentageFraction = PiecewiseConstantSpecificDays.of(new Fraction(percentage, PERCENT));

      // Multiply availability by percentage to get the contribution
      const contribution = Combiner.product(availability, percentageFraction);

      contributions.push(contribution);
    }

    return Combiner.product(this.#localPause(), Combiner.sum(...contributions));
  }

  /** @see TaskImpl.java:214-234 */
  public getPrettyDisplay(): string {
    if (this.#resources.size > 0) {
      let result = this.getCode().getDisplay();
      result += ' ';
      const entries = [...this.#resources.values()];
      entries.forEach((ent, i) => {
        result += '{';
        result += ent.resource.getName();
        const percentage = ent.percentage;
        if (percentage !== FULL_PERCENTAGE) result += ':' + percentage + '%';

        result += '}';
        if (i < entries.length - 1) result += ' ';
      });
      return result;
    }
    return this.getCode().getDisplay();
  }

  /** `TaskCode#toString()` is the Object default in Java (TaskCode defines none). @see TaskImpl.java:236-239 */
  public toString(): string {
    return Object.prototype.toString.call(this.getCode());
  }

  /** @see TaskImpl.java:241-243 */
  public debug(): string {
    return `${this.getStart().toString()} ---> ${this.getEnd().toString()}   [${this.getLoad().toString()}]`;
  }

  /** @see TaskImpl.java:245-262 */
  public getStart(): TimePoint {
    if (this.#cachedStart !== undefined) return this.#cachedStart;

    const allocation = NGMAllocation.of(this.asPiecewiseConstant());
    let result = asTimePoint(this.#solver.getData(allocation, TaskAttribute.START));
    if (!this.#diamond) {
      const cal = this.asPiecewiseConstant();
      while (PiecewiseConstantUtils.isZeroOnDay(cal, result.toDay())) result = result.increment();
    }
    this.#cachedStart = result;
    return this.#cachedStart;
  }

  /** @see TaskImpl.java:264-272 */
  public getEnd(): TimePoint {
    if (this.#cachedEnd !== undefined) return this.#cachedEnd;

    const allocation = NGMAllocation.of(this.asPiecewiseConstant());
    this.#cachedEnd = asTimePoint(this.#solver.getData(allocation, TaskAttribute.END));
    return this.#cachedEnd;
  }

  /** @see TaskImpl.java:274-278 */
  public getLoad(): Load {
    const allocation = NGMAllocation.of(this.asPiecewiseConstant());
    return asLoad(this.#solver.getData(allocation, TaskAttribute.LOAD));
  }

  /** @see TaskImpl.java:280-284 */
  public setLoad(load: Load): void {
    this.#solver.setData(TaskAttribute.LOAD, load);
    this.#invalidateCache();
  }

  /** @see TaskImpl.java:286-291 */
  public setStart(start: TimePoint): void {
    this.#solver.setData(TaskAttribute.START, start);
    this.#invalidateCache();
  }

  /** @see TaskImpl.java:293-298 */
  public setEnd(end: TimePoint): void {
    this.#solver.setData(TaskAttribute.END, end);
    this.#invalidateCache();
  }

  /** Varargs `CenterBorderColor...`. @see TaskImpl.java:300-303 */
  public setColors(...colors: CenterBorderColor[]): void {
    this.#colors = colors;
  }

  /** `LinkedHashMap#put`: an existing key keeps its position AND its key object. @see TaskImpl.java:305-309 */
  public addResource(resource: Resource, percentage: number): void {
    const existing = this.#resources.get(resource.getName());
    if (existing === undefined) this.#resources.set(resource.getName(), { resource, percentage });
    else existing.percentage = percentage;
    this.#invalidateCache();
  }

  /** @see TaskImpl.java:311-315 */
  #invalidateCache(): void {
    this.#cachedPiecewiseConstant = undefined;
    this.#cachedStart = undefined;
    this.#cachedEnd = undefined;
  }

  /** @see TaskImpl.java:317-320 */
  public setDiamond(diamond: boolean): void {
    this.#diamond = diamond;
  }

  /** @see TaskImpl.java:322-325 */
  public isDiamond(): boolean {
    return this.#diamond;
  }

  /** @see TaskImpl.java:327-330 */
  public setCompletion(completion: number): void {
    this.#completion = completion;
  }

  /** @see TaskImpl.java:332-334 */
  public getUrl(): Url | undefined {
    return this.#url;
  }

  /** `colors[1]` on a single-element array never happens (length 1 returns first). @see TaskImpl.java:336-343 */
  public getColors(): CenterBorderColor | undefined {
    const colors = this.#colors;
    if (colors === undefined) return undefined;

    const first = colors[0];
    if (first === undefined) throw new Error('ArrayIndexOutOfBoundsException: Index 0 out of bounds for length 0');
    if (colors.length === 1) return first;

    const second = colors[1];
    if (second === undefined) throw new Error('ArrayIndexOutOfBoundsException');
    return first.unlinearTo(second, this.#completion);
  }

  /** @see TaskImpl.java:345-347 */
  public getCompletion(): number {
    return this.#completion;
  }

  /** Ascending, de-duplicated (a `SortedSet` copy). @see TaskImpl.java:349-355 */
  public getAllPaused(): LocalDate[] {
    const result: LocalDate[] = [...this.#pausedDay];
    for (const dayOfWeek of this.#sortedDaysOfWeek()) this.#addAll(result, dayOfWeek);

    return result;
  }

  /** `result` is a sorted set: insert keeping order, skipping duplicates. @see TaskImpl.java:357-363 */
  #addAll(result: LocalDate[], dayOfWeek: DayOfWeek): void {
    const start = this.getStart();
    const end = this.getEndMinusOneDayTOBEREMOVED();
    for (let current = start; current.compareTo(end) <= 0; current = current.increment())
      if (current.toDayOfWeek() === dayOfWeek) {
        const day = current.toDay();
        if (!result.some((d) => d.equals(day))) {
          result.push(day);
          result.sort((a, b) => a.compareTo(b));
        }
      }
  }

  /** @see TaskImpl.java:365-368 */
  public setNote(note: Display, stereotype: Stereotype | undefined): void {
    this.#note = note;
    this.#noteStereotype = stereotype;
  }

  /** @see TaskImpl.java:370-372 */
  public getNote(): Display | undefined {
    return this.#note;
  }

  /** @see TaskImpl.java:374-376 */
  public getNoteStereotype(): Stereotype | undefined {
    return this.#noteStereotype;
  }

  /** @see TaskImpl.java:378-381 */
  public isAssignedTo(res: Resource): boolean {
    return this.#resources.has(res.getName());
  }
}
