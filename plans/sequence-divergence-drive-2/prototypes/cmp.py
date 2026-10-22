import json,os,sys
S=os.path.dirname(os.path.abspath(__file__))
with open(S+'/base.json') as f: b=json.load(f)
with open(sys.argv[1]) as f: n=json.load(f)
newz=[s for s in n if n[s]==0 and b[s]!=0]; lost=[s for s in n if b[s]==0 and n[s]!=0]
fall=[s for s in n if n[s]<b[s] and n[s]!=0]; rise=[s for s in n if n[s]>b[s] and b[s]!=0]
print('new zero',len(newz),sorted(newz)); print('LOST pinned',len(lost),sorted(lost)); print('fell',len(fall),'rose',len(rise))
print('rose:',sorted(rise)[:40])
print('sum base',sum(v for v in b.values() if v>0),'sum new',sum(v for v in n.values() if v>0))
