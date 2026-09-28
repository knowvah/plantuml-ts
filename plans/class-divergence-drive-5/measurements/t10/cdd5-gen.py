import json,re,collections,os
exec(open('/tmp/cdd5-schedule.py').read().split("if __name__")[0])
D='plans/class-divergence-drive-5/diagnosis/'
# per-row sections
sec={}
for f in ['S1-text','S2-edge','S3-structure','S4-style']:
    txt=open(D+f+'.md').read()
    parts=re.split(r'^### ',txt,flags=re.M)[1:]
    for p in parts:
        head=p.split('\n',1)[0]; m=re.match(r'((?:class|unknown)/\S+) — (.+)',head)
        if not m: continue
        body=p.split('\n',1)[1] if '\n' in p else ''
        fld={}
        for l in body.split('\n'):
            mm=re.match(r'- (first diff|Java|port|mechanism|confidence|Java / port / mechanism)[^:]*: ?(.*)',l)
            if mm: fld[mm.group(1)]=mm.group(2).strip()
        fld['shard']=f; sec[m.group(1)]=fld
famtab=json.load(open('/tmp/cdd5-famtab.json'))
def fam_mech(fam):
    for s,f in P.items():
        if f==fam and sec[s].get('mechanism') and not sec[s]['mechanism'].lower().startswith('as '):
            return s,sec[s]
    for s,f in P.items():
        if f==fam: return s,sec[s]
    return None,{}
def row_mech(s):
    m=sec[s].get('mechanism') or sec[s].get('Java / port / mechanism','')
    if not m or re.match(r'(?i)as \w',m):
        _,f=fam_mech(P[s]); m=(f.get('mechanism') or m)
    return m.replace('|','/')
json.dump({'sec':sec},open('/tmp/cdd5-sec.json','w'))

import subprocess
ALL=subprocess.check_output(['git','ls-files','src','scripts']).decode().split()
def resolve(name):
    name=name.strip('`').split(':')[0]
    if '/' in name and os.path.exists(name): return name
    hits=[p for p in ALL if p.endswith('/'+name.split('/')[-1])]
    return hits[0] if len(hits)==1 else None
def ws_files(fams):
    out=set()
    for fam in fams:
        for t in famtab.get(fam,[]):
            for tok in re.findall(r'`([^`]+\.ts)`|(\b[\w./-]+\.ts)\b',t[5]):
                n=tok[0] or tok[1]; r=resolve(n)
                if r: out.add(r)
            for tok in re.findall(r'`([^`]+?\.ts)(?::[\d,-]+)?`',t[3]):
                r=resolve(tok)
                if r: out.add(r)
    return sorted(out)
def java_refs(fams):
    out=[]
    for fam in fams:
        for t in famtab.get(fam,[]):
            if t[2] and t[2] not in out: out.append(t[2])
    return out
def port_refs(fams):
    out=[]
    for fam in fams:
        for t in famtab.get(fam,[]):
            if t[3] and t[3] not in out: out.append(t[3])
    return out
def size_of(fams):
    s=[t[4] for f in fams for t in famtab.get(f,[])]
    return 'L' if any(x.startswith('L') for x in s) else ('M' if any(x.startswith('M') for x in s) else 'S')
BATCH={t:t[0] for t in TASKS}
# ---- families.md
lines=['# cdd5 families (T10)','','Merged from `S1-text.md`, `S2-edge.md`, `S3-structure.md`, `S4-style.md`. Renames: `descriptive-usymbol-render-allowlist` (S2) -> `desc-leaf-classbox-fallback` (same port origin `renderer-usymbol-entity.ts:235-252`); `json-node-edge-shield-port` (S1) -> `json-node-emitted-as-shield` (same Java `EntityImageJson.java:240-242`, same port `class-port-rows.ts:220-230`). Rows count toward their PRIMARY family; secondary-only families are listed with rows 0.','',
'| family | rows (both trees) | Java file:line | port write-set | size | confidence | batch |','|---|---|---|---|---|---|---|']
famrows=collections.Counter(P.values())
allfams=sorted(set(famtab)|set(famrows), key=lambda f:(-famrows[f],f))
for f in allfams:
    if f in MERGE: continue
    rs=famrows[f]+sum(famrows[k] for k,v in MERGE.items() if v==f)
    conf=collections.Counter(sec[s].get('confidence','').split(' ')[0] for s,ff in P.items() if ff==f).most_common(1)
    task=fam2task.get(f)
    bt=f'T{task}' if task else ('accept-candidate' if f.startswith('accept-candidate') else ('harness -> cdd6' if f.startswith('harness') else 'open -> cdd6'))
    lines.append(f"| {f} | {rs} | {'; '.join(java_refs([f]))[:220]} | {', '.join(ws_files([f]+[k for k,v in MERGE.items() if v==f]))} | {size_of([f])} | {conf[0][0] if conf and conf[0][0] else '—'} | {bt} |")
lines+=['',f'Scheduled: 14 tasks, {sum(len(v) for v in sched.values())} rows. Deferred: {sum(len(v) for v in deferred.values())} rows (see fixtures.md `final`).']
open(D+'families.md','w').write('\n'.join(lines)+'\n')
# ---- fixtures.md
fx=open('plans/class-divergence-drive-5/fixtures.md').read().split('\n')
out=[]
for l in fx:
    if l.startswith('| class/') or l.startswith('| unknown/'):
        c=l.split('|'); s=c[1].strip()
        if s in P:
            f=P[s]; t=fam2task.get(f)
            if f.startswith('accept-candidate'): fin='accept-candidate'
            elif t: fin=f'scheduled T{t}'
            else: fin='open -> cdd6'
            c[6]=' '+row_mech(s)+' '; c[7]=' '+f+' '; c[8]=' '+fin+' '
            l='|'.join(c)
    out.append(l)
open('plans/class-divergence-drive-5/fixtures.md','w').write('\n'.join(out))
print('ok')

EXTRA={'4b':['src/diagrams/class/renderer.ts','src/diagrams/class/renderer-classifier-header-split.ts','src/diagrams/class/renderer-classifier-box.ts']}
AGENT={'3a':'typescript-pro (sonnet)','3b':'typescript-pro (sonnet)','3c':'typescript-pro (sonnet)','3d':'typescript-pro (sonnet)','3e':'typescript-pro (sonnet)','4a':'typescript-pro (sonnet)','4b':'typescript-pro (opus)','4c':'typescript-pro (sonnet)','4d':'typescript-pro (opus)','4e':'typescript-pro (sonnet)','5a':'typescript-pro (sonnet)','5b':'typescript-pro (sonnet)','5c':'typescript-pro (opus)','5d':'typescript-pro (sonnet)'}
NOTES={
 '3b':'S3 note: `desc-label-embed-unported` rows (T4d) sit behind this dispatch; after widening the allow-list, jixibu/jefidu/sprite-SVG-Fill-Stroke-Combinatory-1 keep residuals (embedded json child count; SVG-sprite stroke-width 1 vs 0.5) — report them, do not chase them here. S2 note: beboke/febuli/fipezo keep +1 px and fezaro 0.5 px after the scratch fix; those also carry degenerate-check-after-group-mute (T4a) as a secondary.',
 '3c':'S3 finding: `free-note-alias-not-quark-qualified` and `note-target-not-namespace-qualified` both resolve a note id without the namespace quark; reuse `class-namespace-resolve.ts#resolveReference` rather than a second resolver.',
 '4b':'zolaza is NOT in this task (see T5d). The visibility icon block must reuse `class-visibility-icon.ts` (member icons) — `VisibilityModifier#getUBlock`, one icon source.',
 '4d':'S3 finding: the jar SIZES a description-label embed at the 42x42 catch fallback (`EmbeddedDiagram.java:137-150` takes the SVG branch only when the StringBounder is the SVG one) but DRAWS the real image. Wire the draw path; keep the 42x42 sizing, or the box geometry that already matches will diverge.',
 '5d':'addmethod-space-lenient (zolaza): once fixed the jar routes `A:foo` (no spaces) to STATE, so zolaza LEAVES the CLASS set; re-measure its routing/refusal pins at the close. tim-guessfunctions-pair-order (xuloxo): Java iterates `HashMap<Integer,…>` in ascending key order (`TokenStack.java:162,173`); mirror the ordering explicitly (sort the pair keys), do not rely on JS Map insertion order.',
 '4a':'Secondary rows elsewhere (beboke, fezaro, febuli, fokudi) carry `degenerate-check-after-group-mute` via the parse-time collapse arm `class-namespace.ts:74-120`; if the fix needs that file, it is a write-set extension to journal (T3b owns it in batch 3 only).',
}
tmpl_rows=lambda t: '\n'.join(f'- `{s}`' for s in sorted(sched[t]))
def famnote(f):
    for sh in ['S1-text','S2-edge','S3-structure','S4-style']:
        txt=open(D+sh+'.md').read()
        m=re.search(r'\*\*'+re.escape(f)+r'[^*]*\*\*\s*(.+?)(?:\n\n|$)',txt,re.S)
        if m: return sh,m.group(1).strip().replace('\n',' ')
    return None,None
def famblock(f):
    s,fl=fam_mech(f)
    if s is None:
        tab=famtab.get(f,[[None,'','','','','']])[0]
        sh,note=famnote(f)
        secs=sorted(x for x,v in rows.items() if any(f in h for _,h in v))
        return f"""### {f} (secondary on {', '.join('`'+x+'`' for x in secs) or 'rows in this task'})
Mechanism: {note or 'see the secondary rows (sections) in their shard files'}
Upstream: {tab[2]}
Port: {tab[3]}
(Diagnosed in `diagnosis/{sh or {'S1':'S1-text','S2':'S2-edge','S3':'S3-structure','S4':'S4-style'}.get(tab[0],'?')}.md`.)
"""
    return f"""### {f}
Mechanism: {fl.get('mechanism','see diagnosis')}
Upstream: {fl.get('Java','see families.md')}
Port: {fl.get('port','see families.md')}
(Diagnosed in `diagnosis/{fl.get('shard','?')}.md`, example row `{s}`, confidence {fl.get('confidence','?')}.)
"""
for b in '345':
    ts=[t for t in sorted(TASKS) if t[0]==b]
    os.makedirs(f'plans/class-divergence-drive-5/batch-{b}',exist_ok=True)
    ov=[f'# Batch {b}: class family fixes (generated by T10)','',
        'Each task runs in its own git worktree off the branch (memory: batch-parallelism-needs-worktrees): link node_modules, oracle/dist, assets/stdlib, tests/corpus, packages/*/{assets,generated}, the tools node_modules and the gitignored test-results CHILDREN; never Serena edit tools in a worktree. Agents run targeted tests + typecheck only; the orchestrator merges and runs the four gates. The batch closes via [../close-procedure.md](../close-procedure.md).','',
        '| ID | Description | Agent | Writes | Depends On | Done |','|---|---|---|---|---|---|']
    for t in ts:
        name,fams=TASKS[t]; ws=sorted(set(ws_files(fams+[k for k,v in MERGE.items() if v in fams]))|set(EXTRA.get(t,[])))
        fn=f'T{t}-{name}.md'
        ov.append(f"| [T{t}]({fn}) | {name}: {len(sched[t])} rows ({', '.join(fams)}) | {AGENT[t]} | {', '.join('`'+w.split('/')[-1]+'`' for w in ws)} (+tests) | {'b'+str(int(b)-1)+' close' if b!='3' else 'T10'} | [ ] |")
        spec=f"""# T{t}: {name} ({len(sched[t])} rows)

Return only the structured report: commit sha, rows moved, and residuals with
mechanisms. No preamble, no trailing summary.

## Prior observations
{NOTES.get(t,'none beyond the per-row sections in the shard diagnosis files.')}

## Context
plantuml-ts is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` (branch `dot-output`, upstream `97a5992`) is the specification.
Read the project `CLAUDE.md` first ("READ THE JAVA FIRST", "Never fit a value",
"Do not refactor while porting", "Preserve upstream names"). The oracle is the
1.2026.8beta1 jar. The cache is at `test-results/dot-cache/<tree>/<slug>/in.svg`.
Families in this task (from `diagnosis/families.md`; each row's own section in its
shard file has the first diff and any row-specific note):

{chr(10).join(famblock(f) for f in fams if f in set(P.values()) or f in famtab)}
## Task (TDD)
1. Write a failing unit test that pins the upstream behaviour at the lowest layer
   that shows it (parser, layout, or render helper). Assert specific values.
2. Port the upstream behaviour at the mechanism's origin (`rules/diagnosis.md`
   scope). Add a JSDoc `@see` to the Java `file:line` on every ported symbol, and an
   upstream citation on every constant.
3. Run `npx jiti plans/class-divergence-drive/tools/render-diff.mts <tree/slug...>`
   on this task's rows. Report each row's structural/numeric counts before and
   after.
4. Gates in the worktree: targeted `npx vitest run <your test files>` (check the
   collected count), `npm run typecheck`, `npx eslint <changed files>`. The
   orchestrator runs the full suite after merge.

## Rows
{tmpl_rows(t)}

## Write-set
{chr(10).join('- `'+w+'`' for w in ws)}
- their unit tests under `tests/`
A pure type or file-cap move that extends this set is push-forward (journal it in
your report). Anything else is stop 1: report instead of editing.

## Read-set
Java: {'; '.join(java_refs(fams))}
Port: {'; '.join(port_refs(fams))}
`plans/class-divergence-drive-5/decisions.md#D5`; the shard sections for every row above.

## Architecture decisions (locked)
`plans/class-divergence-drive-5/decisions.md` D1–D9. dot-engine is off limits
(stop 11). Never sign an acceptance (D7).

## Interface contracts
none

## Acceptance
- Given each row above, when rendered via `renderSync`, then the element named in
  its first diff equals the jar's.
- Given the task's rows, then each is conformant, OR its residual is stated with a
  mechanism (Java and port `file:line`).
- Given the full suite (orchestrator), then all four gates are green and no ratchet
  pin is lost.

## Quality bar
90/90/90 coverage on changed files. Hook complexity limits (30 NLOC functions,
CCN 10, 500-line files).

## Boundaries
- Always: quote the Java before claiming parity.
- Ask first (halt): the write-set is insufficient, or the Java contradicts the
  diagnosis.
- Never: fit a value, edit `~/git/knowvah/dot-engine`, touch the oracle, or push.

## Commit
`fix(class): <what, lowercase, ≤72 chars>` (non-class paths: pick the scope that
fits, e.g. `fix(creole): …`). The body gives the mechanism, the upstream citation,
and the rows moved. No attribution lines.

**Observability:** N/A — no new observable operations. **Rollback:** Reversible.
"""
        open(f'plans/class-divergence-drive-5/batch-{b}/{fn}','w').write(spec)
    open(f'plans/class-divergence-drive-5/batch-{b}/overview.md','w').write('\n'.join(ov)+'\n')
print('specs written')
