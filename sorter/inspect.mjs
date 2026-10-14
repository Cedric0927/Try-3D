import {geometry} from './geometry.mjs';import{writeFileSync}from'node:fs';
const g=geometry({fast:true}),{A,R,P}=g;
const explosion=[0,1,...A.prefixStates(g.order)];const poses=[...explosion,...explosion.map(g.raisedPose),...g.strokeStates];
console.log('Quick geometry check:',R.items.length,'items,',poses.length,'poses');
A.settle(R,P,{states:poses});const result=A.audit(R,P,{frames:poses});
const text=A.report(result);writeFileSync(new URL('../logs/sorter-quick.txt',import.meta.url),text);
writeFileSync(new URL('../logs/sorter-quick.json',import.meta.url),JSON.stringify(result,null,2));
console.log(text.split('\n').filter(l=>!l.startsWith('  ')).join('\n'));
console.log('Failures',A.failures(result));
