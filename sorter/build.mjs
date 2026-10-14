import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {geometry} from './geometry.mjs';
const here=new URL('./',import.meta.url),root=new URL('../',here);
const read=p=>readFileSync(new URL(p,here),'utf8');
const fast=process.argv.includes('--fast');const geo=geometry({fast});
const {K,A,R,P,items,strokeStates}=geo;
const data={P:geo.P,W:geo.W,H:geo.H,moves:geo.moves,order:geo.order,spring:geo.spring,rollers:geo.rollers,items:items.map(({svg,...it})=>it)};
const kit=read('../reference/anatomy-main/kit/iso-kit.mjs');
const names=[...kit.matchAll(/export (?:function|const) (\w+)/g)].map(m=>m[1]);
const kitScript=`const K=(()=>{${kit.replace(/\bexport /g,'')}\nreturn {${names.join(',')}};})();`;
const machine=items.map(it=>`<g class="component" data-name="${it.name}" data-piece="${it.piece}" data-i="${it.index}">${it.svg}</g>`).join('');
const style=read('../reference/anatomy-main/kit/iso.css')+'\n'+read('style.css');
const script=kitScript+'\n'+read('model.mjs').replace(/\bexport /g,'')+'\nconst D='+JSON.stringify(data)+';\n'+read('live.js');
let page=read('page.html').replace('/* STYLE */',style).replace('/* FLOOR */',geo.floor).replace('/* GEOMETRY */',machine).replace('/* SCRIPT */',script.replace(/<\/script/gi,'<\\/script'));
page=page.replace('</body>',`<!-- Anatomy by Ryan, MIT License\n${read('../reference/anatomy-main/LICENSE')} --></body>`);
writeFileSync(new URL('sorter.html',root),page);console.log(`Built sorter.html: ${items.length} drawn items, ${R.solids.length} solids.`);
if(!fast&&process.argv.includes('--audit')){
  const states=A.explodeStates(geo.order,geo.spring);
  const report=A.audit(R,P,{frames:[...states.frames,...states.frames.map(geo.raisedPose),...strokeStates]});
  const text=A.report(report),failures=A.failures(report);
  console.log(text.split('\n').filter(line=>!line.startsWith('  ')).join('\n'));
  console.log(failures?`audit failed: ${failures}`:'audit passed');
  mkdirSync(new URL('logs/',root),{recursive:true});writeFileSync(new URL('logs/sorter-audit.txt',root),text+'\n'+(failures?'audit failed':'audit passed')+'\n');
  writeFileSync(new URL('logs/sorter-audit.json',root),JSON.stringify(report,null,2));
  if(failures)process.exitCode=1;
}
