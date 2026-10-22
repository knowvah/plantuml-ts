import { readFileSync, writeFileSync } from 'node:fs';
const R='/Users/scottseely/git/knowvah/plantuml-ts';
const { DeterministicMeasurer } = await import(R+'/src/core/measurer-deterministic.js');
const { buildBlockUmls } = await import(R+'/src/core/BlockUmlBuilder.js');
const { buildTheme } = await import(R+'/src/core/build-theme.js');
const { parseSequence } = await import(R+'/src/diagrams/sequence/parser.js');
const { layoutSequence } = await import(R+'/src/diagrams/sequence/layout.js');
const { sequenceBlockSource } = await import(R+'/tests/oracle/svg-conformance/render-fixture-sequence.js');
const { fixtureIncludeStore } = await import(R+'/tests/helpers/fixture-include-store.js');
const widths = JSON.parse(readFileSync(process.argv[2]+'/widths.json','utf8'));
const runsW=(runs:any[])=>{ if(!runs||runs.length===0) return 0; let lo=Infinity,hi=-Infinity; for(const r of runs){lo=Math.min(lo,r.x);hi=Math.max(hi,r.x+r.textWidth);} return hi-lo; };
const out:any[]=[];
for (const w of widths) {
  const dir = `${R}/test-results/dot-cache/sequence/${w.slug}`;
  const src=readFileSync(`${dir}/in.puml`,'utf8');
  const jarSvg=readFileSync(`${dir}/in.svg`,'utf8');
  let geo:any;
  try {
    const first = buildBlockUmls(src,{includeStore: fixtureIncludeStore()})[0];
    const { theme } = buildTheme(first.preprocessed);
    const ast:any = parseSequence(sequenceBlockSource(first), {});
    geo = layoutSequence(ast, theme, new DeterministicMeasurer());
  } catch(e){ out.push({slug:w.slug, err:String(e).slice(0,80)}); continue; }
  const flags=new Set<string>();
  const maxLevel=new Map<string,number>();
  for (const e of geo.events) if (e.kind==='activation') maxLevel.set(e.participantId, Math.max(maxLevel.get(e.participantId)??0, e.level));
  const pById=new Map<string,any>(geo.participants.map((p:any)=>[p.id,p]));
  const nearest=(x:number)=>{let best:any; let bd=Infinity; for(const p of geo.participants){const d=Math.abs(p.centerX-x); if(d<bd){bd=d;best=p;}} return best;};
  const c2=(p:any)=>p.centerX+5*(maxLevel.get(p.id)??0);
  // tile extents: [min, maxReserve, drawnMin, drawnMax, y]
  type T={kind:string,min:number,max:number,dmin:number,dmax:number,y:number,ref?:any};
  const tiles:T[]=[];
  for (const e of geo.events) {
    switch(e.kind){
      case 'message': {
        if (e.exoType) { flags.add('exo'); break; }
        const runs=[...(e.labelLines??[]), ...(e.labelNumber?[e.labelNumber]:[])];
        const pure=runsW(runs);
        if (e.arrowDirection==='self') {
          const p=nearest(e.fromX); const rev=e.arrow?.reverseDefine===true;
          const comp=Math.max(pure+14,50); const drawn=Math.max(42, pure===0?0:7+pure);
          if(rev){flags.add('selfRev'); tiles.push({kind:'self',min:p.centerX-comp,max:c2(p),dmin:p.centerX-drawn,dmax:c2(p),y:e.y});}
          else tiles.push({kind:'self',min:p.centerX,max:c2(p)+comp,dmin:p.centerX,dmax:c2(p)+drawn,y:e.y});
        } else {
          const pa=nearest(e.fromX), pb=nearest(e.toX);
          const lo=Math.min(pa.centerX,pb.centerX), hi=Math.max(pa.centerX,pb.centerX);
          let hiR=hi; if (e.createdHead) { const cp=e.createdHead.participant; hiR = (cp.centerX>=lo && cp===pb && pb.centerX>pa.centerX)? cp.x : hi; }
          tiles.push({kind:'msg',min:lo,max:hiR,dmin:lo,dmax:hiR,y:e.y});
        }
        break; }
      case 'note': tiles.push({kind:'note',min:e.minX,max:e.maxX,dmin:e.minX,dmax:e.maxX,y:e.y}); break;
      case 'activation': { const p=pById.get(e.participantId); if(!p) break; const v=p.centerX+5*e.level; tiles.push({kind:'life',min:p.centerX,max:v,dmin:p.centerX,dmax:v,y:e.y}); tiles.push({kind:'life',min:p.centerX,max:v,dmin:p.centerX,dmax:v,y:e.y+e.height-0.01}); break; }
      case 'frame': if (e.frameType==='ref'){ flags.add('ref'); tiles.push({kind:'ref',min:e.x-(5),max:e.x+e.width+5,dmin:e.x,dmax:e.x+e.width,y:e.y}); } else tiles.push({kind:'frame',min:0,max:0,dmin:0,dmax:0,y:e.y,ref:e}); break;
      case 'else': tiles.push({kind:'else',min:0,max:0,dmin:0,dmax:0,y:e.y,ref:e}); break;
      case 'divider': flags.add('divider'); break;
      case 'delay': flags.add('delay'); break;
      case 'newpage': flags.add('newpage'); break;
      case 'destroy': break;
    }
  }
  // resolve frames innermost first (sort by height ascending)
  const frames=tiles.filter(t=>t.kind==='frame').sort((a,b)=>a.ref.height-b.ref.height);
  const frameInfo:any[]=[];
  for (const f of frames){
    const e=f.ref; const y0=e.y, y1=e.y+e.height;
    const kids=tiles.filter(t=>t!==f && t.kind!=='else' && t.y>y0 && t.y<y1 && !(t.kind==='frame' && t.ref.height>=e.height));
    // exclude grandchildren: frames resolved; a kid inside a nested kid frame is still within; upstream nested frame's extent already covers them, so harmless for max/min
    let header=e.tabWidth; if (e.tabComment!==undefined){let hi=-Infinity; for(const r of e.tabRuns) hi=Math.max(hi,r.x+r.textWidth); header=hi-e.x;}
    let mn=Infinity, mx=-Infinity;
    for(const k of kids){ mn=Math.min(mn,k.dmin-16); mx=Math.max(mx,k.dmax+16); }
    if(!isFinite(mn)) { mn=e.x; }
    const elses=tiles.filter(t=>t.kind==='else' && Math.abs(t.ref.x-e.x)<0.01 && t.y>y0 && t.y<y1);
    for(const el of elses) mx=Math.max(mx, mn-3+runsW(el.ref.runs)+10);
    mx=Math.max(mx, mn+header+16);
    f.min=mn-3; f.max=mx+9; f.dmin=f.min; f.dmax=f.max;
    frameInfo.push({x:Math.round(mn*1000)/1000,w:Math.round((mx-mn)*1000)/1000, ourX:e.x, ourW:e.width});
  }
  const terms: Record<string,number> = {};
  const put=(k:string,v:number)=>{ if(!(k in terms)||v>terms[k]) terms[k]=v; };
  for (const p of geo.participants) { put('participant', p.x+p.width); put('posC2', c2(p)); }
  for (const t of tiles) if (t.kind!=='else' && t.kind!=='life') put(t.kind, t.max);
  let best='',bv=-Infinity; for(const [k,v] of Object.entries(terms)) if(v>bv){bv=v;best=k;}
  const pred=Math.floor(bv+10+1);
  // jar frame rects (fill none, stroke-width 1.5)
  const jarFrames=[...jarSvg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="[\d.]+" fill="[^"]*" style="stroke:[^;]*;stroke-width:1.5;"/g)].map(m=>({x:+m[1],w:+m[2]}));
  out.push({slug:w.slug, ours:w.ours, jar:w.jar, pred, match: pred===w.jar, arg:best, terms:Object.fromEntries(Object.entries(terms).map(([k,v])=>[k,Math.round(v*1000)/1000])), flags:[...flags], frames:frameInfo, jarFrames});
}
writeFileSync(process.argv[2]+'/predict2.json', JSON.stringify(out,null,1));
console.log('done', out.length, out.filter(o=>o.match).length);
