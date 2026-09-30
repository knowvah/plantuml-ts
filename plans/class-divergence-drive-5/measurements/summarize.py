"""cdd5: SUMMARY.md for a survey checkpoint dir. Usage: summarize.py <dir> <title>"""
import json, collections, sys, os
from pathlib import Path
M, title = sys.argv[1], sys.argv[2]
V = ['conformant', 'structural-match', 'diverged', 'errored', 'timeout', 'oracle-error']
rows = []
for fn in sorted(os.listdir(M)):
    if fn.startswith('parity-') and fn.endswith('.json'):
        e = fn[7:-5]
        fx = json.loads(Path(os.path.join(M, fn)).read_text())['fixtures']
        c = collections.Counter(x['verdict'] for x in fx)
        rows.append((e, len(fx), [c.get(v, 0) for v in V], sum(1 for x in fx if x.get('dotEqual') is True)))
rb = json.loads(Path('oracle/goldens/svg-conformance/routing-baseline.json').read_text())['fixtures']
ucls = {x['slug']: x for x in rb if x['type'] == 'unknown' and 'CLASS' in (x.get('jarType'), x.get('ourType'))}
unk = {x['slug']: x for x in json.loads(Path(os.path.join(M, 'parity-unknown.json')).read_text())['fixtures']}
out = [f'# {title}', '', '| engine | n | ' + ' | '.join(V) + ' | dotEqual=true |', '|---|---|' + '---|' * (len(V) + 1)]
for e, n, cs, de in rows:
    out.append(f'| {e} | {n} | ' + ' | '.join(map(str, cs)) + f' | {de} |')
out += ['', f'## unknown-bucket CLASS subset (routing-baseline jarType or ourType = CLASS): {len(ucls)} rows', '',
        '| jarType/ourType | n | ' + ' | '.join(V) + ' | missing |', '|---|---|' + '---|' * (len(V) + 1)]
by = collections.defaultdict(list)
for s, r in ucls.items(): by[(r.get('jarType'), r.get('ourType'))].append(s)
for k, ss in sorted(by.items()):
    c = collections.Counter(unk[s]['verdict'] if s in unk else 'missing' for s in ss)
    out.append(f'| {k[0]}/{k[1]} | {len(ss)} | ' + ' | '.join(str(c.get(v, 0)) for v in V) + f" | {c.get('missing', 0)} |")
Path(os.path.join(M, 'SUMMARY.md')).write_text('\n'.join(out) + '\n')
print('\n'.join(out))
