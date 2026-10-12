/**
 * Support for the complex salt factory tests: the scenarios of
 * `fixtures/complex-factory-scenarios.txt`, the jar's answers for them
 * (`fixtures/complex-factories.json`, from `fixtures/ComplexFactoryProbe.java`),
 * the `PSystemSalt#createElement` wiring the probe uses
 * (PSystemSalt.java:174-216, restricted to the six complex factories plus
 * `ElementFactoryText`), and the structural dump the probe prints, read from
 * the same private fields.
 */
import { readFileSync } from 'node:fs';
import { trin } from '../../../../src/core/style/parser/StyleParser.js';
import { UFontFactory } from '../../../../src/core/klimt/font/UFontFactory.js';
import type { DataSource } from '../../../../src/diagrams/salt/DataSource.js';
import { DataSourceImpl } from '../../../../src/diagrams/salt/DataSourceImpl.js';
import type { Element } from '../../../../src/diagrams/salt/element/Element.js';
import { ElementBorder } from '../../../../src/diagrams/salt/element/ElementBorder.js';
import { ElementEmpty } from '../../../../src/diagrams/salt/element/ElementEmpty.js';
import { ElementMenuBar } from '../../../../src/diagrams/salt/element/ElementMenuBar.js';
import { ElementPyramid } from '../../../../src/diagrams/salt/element/ElementPyramid.js';
import { ElementPyramidScrolled } from '../../../../src/diagrams/salt/element/ElementPyramidScrolled.js';
import { ElementTabBar } from '../../../../src/diagrams/salt/element/ElementTabBar.js';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { ElementTree } from '../../../../src/diagrams/salt/element/ElementTree.js';
import type { AbstractElementFactoryComplex } from '../../../../src/diagrams/salt/factory/AbstractElementFactoryComplex.js';
import type { ElementFactory } from '../../../../src/diagrams/salt/factory/ElementFactory.js';
import { ElementFactoryBorder } from '../../../../src/diagrams/salt/factory/ElementFactoryBorder.js';
import { ElementFactoryMenu } from '../../../../src/diagrams/salt/factory/ElementFactoryMenu.js';
import { ElementFactoryPyramid } from '../../../../src/diagrams/salt/factory/ElementFactoryPyramid.js';
import { ElementFactoryScroll } from '../../../../src/diagrams/salt/factory/ElementFactoryScroll.js';
import { ElementFactoryTab } from '../../../../src/diagrams/salt/factory/ElementFactoryTab.js';
import { ElementFactoryTree } from '../../../../src/diagrams/salt/factory/ElementFactoryTree.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { Terminated } from '../../../../src/diagrams/salt/Terminated.js';
import { stringBounder } from '../salt-test-support.js';

const FIXTURES = 'tests/unit/salt/factory/fixtures';

export const dictionary = new SaltDictionary();

/** The six factories, in the probe's `ready` column order. */
export const FACTORY_NAMES = ['Pyramid', 'Scroll', 'Border', 'Tree', 'Menu', 'Tab'] as const;
export type FactoryName = (typeof FACTORY_NAMES)[number];

type FactoryCtor = new (dataSource: DataSource, dictionary: SaltDictionary) => ElementFactory;
const FACTORIES: Readonly<Record<FactoryName, FactoryCtor>> = {
  Pyramid: ElementFactoryPyramid,
  Scroll: ElementFactoryScroll,
  Border: ElementFactoryBorder,
  Tree: ElementFactoryTree,
  Menu: ElementFactoryMenu,
  Tab: ElementFactoryTab,
};

/** One scenario's lines, by `<kind> <name>` header, in file order. */
function readScenarios(): Map<string, string[]> {
  const scenarios = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of readFileSync(`${FIXTURES}/complex-factory-scenarios.txt`, 'utf8').split('\n')) {
    if (line.startsWith('### ')) {
      current = [];
      scenarios.set(line.substring(4), current);
    } else if (current !== undefined && line.length > 0) {
      current.push(line);
    }
  }
  return scenarios;
}

const SCENARIOS = readScenarios();
const JAR: unknown = JSON.parse(readFileSync(`${FIXTURES}/complex-factories.json`, 'utf8'));

/** The data lines of scenario `<kind> <name>`. */
export function lines(kind: 'ready' | 'create', name: string): string[] {
  const found = SCENARIOS.get(`${kind} ${name}`);
  if (found === undefined) throw new Error(`no scenario ${kind} ${name}`);
  return found;
}

/** Every scenario name of `kind`, in file order. */
export function scenarioNames(kind: 'ready' | 'create'): string[] {
  return [...SCENARIOS.keys()].filter((k) => k.startsWith(`${kind} `)).map((k) => k.substring(kind.length + 1));
}

/** The jar's answer for scenario `name`. */
export function jar(name: string): Record<string, unknown> {
  const all = JAR as Record<string, Record<string, unknown>>;
  const found = all[name];
  if (found === undefined) throw new Error(`no jar row ${name}`);
  return found;
}

/** `factory.ready()` as the probe prints it: `true`, `false`, or the exception's Java class name. */
export function readyAnswer(name: FactoryName, data: readonly string[]): string {
  const f = new FACTORIES[name](new DataSourceImpl(data), dictionary);
  try {
    return String(f.ready());
  } catch (e) {
    return javaName(e);
  }
}

/** The Java exception class the port's thrown `Error` stands for (its message prefix). */
export function javaName(e: unknown): string {
  return String((e as Error).message).split(':')[0] ?? '';
}

/**
 * `ElementFactoryText` as upstream writes it (ElementFactoryText.java:58-77),
 * a test double: the factory is batch-3 T3a's and is not on this branch.
 */
export class TextFactory implements ElementFactory {
  constructor(private readonly dataSource: DataSource) {}

  create(): Terminated<Element> {
    if (!this.ready()) throw new Error('IllegalStateException');
    const next = this.dataSource.next();
    return new Terminated<Element>(
      new ElementText([next.getElement()], UFontFactory.byDefault(12), dictionary),
      next.getTerminator(),
    );
  }

  ready(): boolean {
    const text = this.dataSource.peek(0).getElement();
    if (text.startsWith('{') || text.startsWith('}')) return false;
    return trin(text).length > 0;
  }
}

/** The four root candidates, wired as `PSystemSalt#createElement` wires them. */
export function wire(source: DataSource): AbstractElementFactoryComplex[] {
  const treeFactory = new ElementFactoryTree(source, dictionary);
  const cpx: AbstractElementFactoryComplex[] = [
    new ElementFactoryPyramid(source, dictionary),
    new ElementFactoryScroll(source, dictionary),
    new ElementFactoryBorder(source, dictionary),
    treeFactory,
  ];
  for (const f of cpx) {
    f.addFactory(new ElementFactoryMenu(source, dictionary));
    f.addFactory(treeFactory);
    f.addFactory(new ElementFactoryTab(source, dictionary));
    f.addFactory(new TextFactory(source));
  }
  for (const f1 of cpx) for (const f2 of cpx) f1.addFactory(f2);
  return cpx;
}

/** What the probe prints for a `create` scenario. */
export interface CreateResult {
  readonly root?: string;
  readonly dump?: string;
  readonly terminator?: string;
  readonly dim?: readonly [number, number];
  readonly error?: string;
}

/** Runs a `create` scenario through the port the way the probe runs it through the jar. */
export function create(data: readonly string[]): CreateResult {
  const cpx = wire(new DataSourceImpl(data));
  try {
    for (const f of cpx) {
      if (f.ready()) {
        const t = f.create();
        const dim = t.getElement().getPreferredDimension(stringBounder, 0, 0);
        return {
          root: f.constructor.name,
          dump: dump(t.getElement()),
          terminator: t.getTerminator(),
          dim: [dim.getWidth(), dim.getHeight()],
        };
      }
    }
    return { error: 'IllegalArgumentException' };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

function field(o: unknown, name: string): unknown {
  return Reflect.get(o as object, name) as unknown;
}

function q(s: unknown): string {
  return JSON.stringify(s);
}

function list(elements: unknown): string {
  return `[${(elements as Element[]).map(dump).join(', ')}]`;
}

function pyramid(e: Element): string {
  const cells = [...(field(e, 'positions1') as Map<Element, unknown>)].map(([k, v]) => `${String(v)}=${dump(k)}`);
  return `Pyramid(${String(field(e, 'tableStrategy'))} rows=${String(field(e, 'rows'))} cols=${String(field(e, 'cols'))} [${cells.join(', ')}])`;
}

function border(e: Element): string {
  const parts = ['north', 'south', 'east', 'west', 'center'].map(
    (n) => `${n.charAt(0).toUpperCase()}=${dump(field(e, n) as Element)}`,
  );
  return `Border(${parts.join(', ')})`;
}

function tree(e: Element): string {
  const rows = (field(e, 'entries') as unknown[]).map(
    (entry) =>
      `${String(field(entry, 'level'))}:${dump(field(entry, 'firstElement') as Element)} ${list(field(entry, 'otherElements'))}`,
  );
  return `Tree(${String(field(e, 'strategy'))} [${rows.join(', ')}])`;
}

function menu(e: Element): string {
  const popups = field(e, 'popups') as Map<unknown, unknown>;
  const out = (field(e, 'entries') as unknown[]).map((entry) => {
    const popup = popups.get(entry);
    const head = q(field(entry, 'text'));
    if (popup === undefined) return head;
    return `${head}{${(field(popup, 'entries') as unknown[]).map((s) => q(field(s, 'text'))).join(', ')}}`;
  });
  return `Menu[${out.join(', ')}]`;
}

/** The probe's structural dump (ComplexFactoryProbe.java#dump). */
export function dump(e: Element): string {
  if (e instanceof ElementText) return `Text(${q(e.getText())})`;
  if (e instanceof ElementEmpty) return 'Empty';
  if (e instanceof ElementPyramidScrolled) return `Scroll(${String(field(e, 'scrollStrategy'))} ${pyramid(e)})`;
  if (e instanceof ElementPyramid) return pyramid(e);
  if (e instanceof ElementBorder) return border(e);
  if (e instanceof ElementTree) return tree(e);
  if (e instanceof ElementTabBar) return `Tab(vertical=${String(field(e, 'vertical'))} ${list(field(e, 'tabs'))})`;
  if (e instanceof ElementMenuBar) return menu(e);
  return e.constructor.name;
}
