// Refresh UI and simulation code while preserving already-audited SVG geometry.
// Machine geometry changes must use build.mjs and a new geometry audit.
import {readFileSync,writeFileSync}from'node:fs';
const base=new URL('./',import.meta.url),root=new URL('../',base);
const read=p=>readFileSync(new URL(p,base),'utf8');
let html=read('../sorter.html');const match=html.match(/const D=(\{[^\n]+\});\n/);
if(!match)throw Error('No built geometry data; run build.mjs first.');
const data=JSON.parse(match[1]);if(data.items.length!==185)throw Error('Unexpected geometry version.');
const kit=read('../reference/anatomy-main/kit/iso-kit.mjs');
const names=[...kit.matchAll(/export (?:function|const) (\w+)/g)].map(m=>m[1]);
const script=`const K=(()=>{${kit.replace(/\bexport /g,'')}\nreturn {${names.join(',')}};})();\n${read('model.mjs').replace(/\bexport /g,'')}\nconst D=${JSON.stringify(data)};\n${read('live.js')}`;
html=html.replace(/<style>[\s\S]*?<\/style>/,`<style>${read('../reference/anatomy-main/kit/iso.css')}\n${read('style.css')}</style>`).replace(/<script>[\s\S]*?<\/script>/,`<script>${script.replace(/<\/script/gi,'<\\/script')}</script>`);
writeFileSync(new URL('sorter.html',root),html);console.log('Rebundled UI; audited SVG and depth keys unchanged.');
