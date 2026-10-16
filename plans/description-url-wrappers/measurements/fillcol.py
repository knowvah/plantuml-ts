import sys,re,os
# usage: fillcol.py <fixtures.md> <rd-dir> <colname>
fx, rd, col = sys.argv[1:4]
with open(fx) as fh:
    lines = fh.read().split('\n')
hdr = None
out=[]
for ln in lines:
    if not ln.startswith('|'):
        hdr = None  # a table ended; the ledger table below must not match
    elif ln.startswith('| tree/slug'):
        hdr=[c.strip() for c in ln.strip('|').split('|')]
    elif hdr and ln.startswith('| ') and '/' in ln.split('|')[1] and not ln.startswith('|---'):
        cells=[c.strip() for c in ln.strip('|').split('|')]
        slug=cells[0].split('/')[-1]
        f=os.path.join(rd,slug+'.txt')
        if os.path.exists(f):
            with open(f) as fh:
                t=fh.read()
            m=re.search(r'structural=(\d+) numeric=(\d+)',t)
            if m is None:
                raise SystemExit(f'{f}: no render-diff structural/numeric header')
            a=len(re.findall(r'exp=a |act=a( |$)|\[childCount\]',t,re.M))
            i=len(re.findall(r'/@id ',t))
            v=f"{m.group(1)}/{m.group(2)}"
            v+=f" (a {a}" + (f", id {i})" if i else ")")
            cells[hdr.index(col)]=v
            ln='| '+' | '.join(cells)+' |'
    out.append(ln)
with open(fx,'w') as fh:
    fh.write('\n'.join(out))
