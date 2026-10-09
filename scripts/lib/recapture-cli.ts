/**
 * Argument parsing for scripts/recapture-oracles.ts. Pure: argv in, options
 * or an error message out.
 */
export interface CliOptions {
  readonly mode: 'verify' | 'write';
  readonly workers: number;
  readonly only: readonly string[];
  readonly jar: string | undefined;
  readonly report: string | undefined;
  readonly scratch: string | undefined;
}

export const DEFAULT_WORKERS = 6;
export const USAGE =
  'usage: recapture-oracles.ts [--verify|--write] [--workers N] [--only glob[,glob]]… [--jar path] [--report out.json] [--scratch dir]';

type Draft = {
  write: boolean;
  verify: boolean;
  workers: number;
  only: string[];
  jar?: string;
  report?: string;
  scratch?: string;
};

const VALUE_FLAGS: Record<string, (d: Draft, v: string) => string | undefined> = {
  '--workers': (d, v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1) return `--workers needs a positive integer, got "${v}"`;
    d.workers = n;
    return undefined;
  },
  '--only': (d, v) => {
    d.only.push(...v.split(',').filter((s) => s.length > 0));
    return undefined;
  },
  '--jar': (d, v) => ((d.jar = v), undefined),
  '--report': (d, v) => ((d.report = v), undefined),
  '--scratch': (d, v) => ((d.scratch = v), undefined),
};

/** Parses argv (after the script name). Returns the options or `{ error }`. */
export function parseArgs(argv: readonly string[]): CliOptions | { error: string } {
  const d: Draft = { write: false, verify: false, workers: DEFAULT_WORKERS, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--write') d.write = true;
    else if (arg === '--verify') d.verify = true;
    else if (arg in VALUE_FLAGS) {
      const value = argv[++i];
      if (value === undefined) return { error: `${arg} needs a value` };
      const err = VALUE_FLAGS[arg]!(d, value);
      if (err) return { error: err };
    } else return { error: `unknown argument "${arg}"` };
  }
  if (d.write && d.verify) return { error: '--write and --verify are mutually exclusive' };
  return {
    mode: d.write ? 'write' : 'verify',
    workers: d.workers,
    only: d.only,
    jar: d.jar,
    report: d.report,
    scratch: d.scratch,
  };
}
