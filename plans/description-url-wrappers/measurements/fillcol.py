import sys,re,os,glob
# usage: fillcol.py <fixtures.md> <rd-dir> <colname>
fx, rd, col = sys.argv[1:4]
lines = open(fx).read().split('\n')
hdr = None
out=[]
for ln in lines:
    if ln.startswith('| tree/slug'):
        hdr=[c.strip() for c in ln.strip('|').split('|')]
    elif hdr and ln.startswith('| ') and '/' in ln.split('|')[1] and not ln.startswith('|---'):
        cells=[c.strip() for c in ln.strip('|').split('|')]
        slug=cells[0].split('/')[-1]
        f=os.path.join(rd,slug+'.txt')
        if os.path.exists(f):
            t=open(f).read()
            m=re.search(r'structural=(\d+) numeric=(\d+)',t)
            a=len(re.findall(r'exp=a |act=a( |$)|\[childCount\]',t,re.M))
            i=len(re.findall(r'/@id ',t))
            v=f"{m.group(1)}/{m.group(2)}"
            v+=f" (a {a}" + (f", id {i})" if i else ")")
            cells[hdr.index(col)]=v
            ln='| '+' | '.join(cells)+' |'
    out.append(ln)
open(fx,'w').write('\n'.join(out))
