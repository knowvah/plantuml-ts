#!/usr/bin/env python3
"""isw T1b (D7): classify every survey row, sequence score and element census
row b0 -> b1 as unchanged / fell / owed, and group owed rows into families.

Usage: classify.py <prev-tag> <next-tag>   (e.g. b0 b1; reads $M/<tag>-eng,
       $M/<tag>-seq.json, $M/<tag>-elements.json)
Writes $M/classify-<next>.json  { "<engine>/<slug>": {cls, why[], family} }
and prints per-engine counts plus the family table (signature -> count).

owed  = conformant loss, verdict rank drop, dotEqual true->false, sequence
        weightedScore rise, or any element tag moving AWAY from the jar.
fell  = verdict rank rise, dotEqual false->true, or sequence score fall
        (and nothing owed).
Family signature = engine + first diff path with element indices stripped
(the b1 survey row's firstDiff), or the reason when there is no diff path.
"""
import json, os, re, sys
from collections import Counter, defaultdict

M = os.path.dirname(os.path.abspath(__file__))
RANK = {'conformant': 3, 'structural-match': 2, 'diverged': 1}


def survey(tag):
    out = {}
    d = os.path.join(M, f'{tag}-eng')
    for f in sorted(os.listdir(d)):
        if f.startswith('parity-') and f.endswith('.json'):
            e = f[len('parity-'):-5]
            for x in json.load(open(os.path.join(d, f)))['fixtures']:
                out[f"{e}/{x['slug']}"] = x
    return out


def strip(path):
    return re.sub(r'\[\d+\]', '', path or '')


def survey_why(a, b):
    owed, fell = [], []
    ra, rb = RANK.get(a.get('verdict'), 0), RANK.get(b.get('verdict'), 0)
    if rb < ra:
        owed.append(f"verdict {a.get('verdict')}->{b.get('verdict')}")
    elif rb > ra:
        fell.append(f"verdict {a.get('verdict')}->{b.get('verdict')}")
    if a.get('dotEqual') is True and b.get('dotEqual') is False:
        owed.append('dotEqual true->false')
    elif a.get('dotEqual') is False and b.get('dotEqual') is True:
        fell.append('dotEqual false->true')
    return owed, fell


def elements_away(a, b):
    out = []
    if 'err' in a or 'err' in b:
        return ['element err change'] if ('err' in a) != ('err' in b) else []
    for t in sorted(set(a['o']) | set(b['o']) | set(a['j']) | set(b['j'])):
        da = abs(a['o'].get(t, 0) - a['j'].get(t, 0))
        db = abs(b['o'].get(t, 0) - b['j'].get(t, 0))
        if db > da:
            out.append(f'element <{t}> away {da}->{db}')
    return out


def seq_why(k, qa, qb):
    s = k.split('/', 1)[1]
    wa, wb = qa.get(s, {}).get('w'), qb.get(s, {}).get('w')
    if wa is not None and wb is not None:
        if wb > wa:
            return [f'seq w {wa}->{wb}'], []
        return ([], [f'seq w {wa}->{wb}']) if wb < wa else ([], [])
    if ('err' in qa.get(s, {})) != ('err' in qb.get(s, {})):
        return ['seq err change'], []
    return [], []


def row(k, a, b, ctx):
    qa, qb, ea, eb = ctx
    owed, fell = survey_why(a, b)
    if k.startswith('sequence/'):
        o, f = seq_why(k, qa, qb)
        owed += o
        fell += f
    if k in ea and k in eb:
        owed += elements_away(ea[k], eb[k])
    if owed:
        eng = k.split('/', 1)[0]
        fam = f"{eng}:{strip(b.get('firstDiff')) or owed[0].split(' ')[0]}"
        return {'cls': 'owed', 'why': owed, 'family': fam,
                'b0': {'verdict': a.get('verdict'), 'dotEqual': a.get('dotEqual')},
                'b1': {'verdict': b.get('verdict'), 'dotEqual': b.get('dotEqual'),
                       'firstDiff': b.get('firstDiff')}}
    return {'cls': 'fell', 'why': fell} if fell else {'cls': 'unchanged'}


def report(res):
    per = defaultdict(Counter)
    for k, v in res.items():
        per[k.split('/', 1)[0]][v['cls']] += 1
    for e in sorted(per):
        print(e, dict(per[e]))
    fams = Counter(v['family'] for v in res.values() if v['cls'] == 'owed')
    print(f'owed={sum(fams.values())} families={len(fams)}')
    for f, n in fams.most_common():
        print(f'{n:5d} {f}')


def load(name):
    return json.load(open(os.path.join(M, name)))


def main():
    pt, nt = sys.argv[1], sys.argv[2]
    sa, sb = survey(pt), survey(nt)
    ctx = (load(f'{pt}-seq.json'), load(f'{nt}-seq.json'),
           load(f'{pt}-elements.json'), load(f'{nt}-elements.json'))
    res = {k: row(k, sa.get(k, {}), sb.get(k, {}), ctx) for k in sorted(set(sa) | set(sb))}
    json.dump(res, open(os.path.join(M, f'classify-{nt}.json'), 'w'), indent=1)
    report(res)


main()
