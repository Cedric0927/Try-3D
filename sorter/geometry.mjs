import * as K from '../reference/anatomy-main/kit/iso-kit.mjs';
import * as G from '../reference/anatomy-main/kit/lathe.mjs';
import * as A from '../reference/anatomy-main/kit/audit.mjs';
import {tubePieces,tubeSvg} from '../reference/anatomy-main/kit/tube.mjs';

export function geometry({fast=false}={}){
  const W=1160,H=820;
  const P={origin:[610,570],scale:1.65,azimuth:46,elevation:32};
  const moves={frame:[0,0,0],weigh:[0,0,155],rollers:[0,0,160],cassette:[0,0,80],scanner:[0,0,240],cover:[0,85,-42],rod:[0,0,8],controls:[0,0,0]};
  const order=['scanner','cover','weigh','rollers','cassette'];
  const spring={stagger:.085,stiffness:55,damping:15,substeps:4};
  const R=A.recorder(P,{order,spring});const at=p=>K.iso(p,P);
  const dot=(p,q)=>p.reduce((s,v,i)=>s+v*q[i],0);
  const put=(piece,name,svg,shape,center,extra={})=>R.put({piece,name,svg,shapes:[R.solid(shape)],at:center,move:moves[piece],...extra});
  function box(piece,name,x,y,w,d,z,h,cls='metal',inner=''){
    const plan={x,y,w,d,r:Math.min(1,w/5,d/5)};
    const svg=K.solidSvg(K.slabOf(plan,z,h,P,4,.4),{className:cls,tone:'mid',inner});
    return put(piece,name,svg,A.slab(plan,z,h,{name},4),[x+w/2,y+d/2,z+h/2]);
  }
  const bolts=(x,y,w,d,z)=>K.dotsSvg(K.corners({x,y,w,d,r:0},2).map(([a,b])=>at([a,b,z])),{size:.8,tone:'mid'});
  function disc(piece,name,origin,axis,s0,s1,r,cls='metal',inner=0){const F=G.frameAlong(origin,axis);const svg=K.solidSvg(inner?G.ringBand(s0,s1,inner,r,F,P):G.disc(s0,s1,r,F,P),{tone:'hi',className:cls});return put(piece,name,svg,inner?A.ring(F,s0,s1,inner,r,{name}):A.disc(F,s0,s1,r,{name}),G.pointOf(F,(s0+s1)/2,0,0));}
  const feet=[[-186,-65],[-186,65],[186,-65],[186,65],[-42,181],[42,181]];
  for(let i=0;i<feet.length;i++){const[x,y]=feet[i];box('frame',`stand.foot.${i}`,x-9,y-9,18,18,0,4,'dark',bolts(x-9,y-9,18,18,4));box('frame',`frame.leg.${i}`,x-3,y-3,6,6,4,56);box('frame',`frame.cap.${i}`,x-7,y-7,14,14,60,4,'metal',bolts(x-7,y-7,14,14,64));}
  for(const y of [-64,58])box('frame',`frame.long.${y}`,-220,y,440,6,64,8);
  for(const x of [-56,50])box('frame',`frame.cross.${x}`,x,-64,6,128,29,7);
  // Small pads connect the lowered cross-members to the longitudinal beams.
  for(const x of [-56,50])for(const y of [-64,58])box('frame',`frame.join.${x}.${y}`,x,y,6,6,36,28);
  for(const x of [-49,45])box('frame',`frame.side.${x}`,x,68,4,143,64,8);
  box('frame','frame.side-cross',-45,178,90,6,64,4);
  // Four weigh pads support the separate inbound carrier.
  for(const x of [-210,-92])for(const y of [-64,58])box('frame',`weigh.cell.${x}.${y}`,x,y,12,6,72,2,'sensor');
  for(const y of [-64,58])box('weigh',`weigh.carrier.${y}`,-220,y,145,6,74,13,'metal',bolts(-220,y,145,6,87));
  for(const y of [-64,58])box('rollers',`rollers.carrier.${y}`,-70,y,290,6,72,15,'metal',bolts(-70,y,290,6,87));
  const rollers=[];
  function roller(piece,name,x,y,z,axis='y',half=58){
    const F=G.frameAlong([x,y,z],axis==='y'?[0,1,0]:[1,0,0]);
    const profile=[[-half,1.4],[-half+6,1.4],[-half+6,5],[half-6,5],[half-6,1.4],[half,1.4]];
    const svg=K.solidSvg(G.solidOf(profile,F,P,{steps:32}),{tone:'hi',className:'roller'});
    const it=put(piece,name,svg,A.solid(F,profile,{name}),[x,y,z]);
    rollers.push({name,x,y,z,F,piece,axis,half:half-6});return it;
  }
  for(let x=-208;x<=-88;x+=15)roller('weigh',`weigh.roller.${x}`,x,0,82);
  for(const x of [-56,-40,-12,12,40,56])roller('rollers',`rollers.center.${x}`,x,0,82);
  for(let x=82;x<=208;x+=14)roller('rollers',`rollers.out.${x}`,x,0,82);
  for(const x of [-49,45])box('frame',`side.carrier.${x}`,x,69,4,142,72,16);
  for(let y=79;y<=205;y+=14)roller('frame',`side.roller.${y}`,0,y,87.3,'x',45);
  // Two guided actuators, with rods clipped at their glands.
  for(const x of [-53,53]){
    box('frame',`lift.base.${x}`,x-6,-8,12,16,36,3,'metal',bolts(x-6,-8,12,16,39));
    box('frame',`lift.body.${x}`,x-4,-5,8,10,39,19,'sensor');
    const F=G.frameAlong([x,0,0],[0,0,1]),rod=G.rodOut(F,58,61,1.6,P,{stroke:8});
    const id=`rod-${x<0?'l':'r'}`;
    const svg=`<clipPath id="${id}"><path data-hold d="${rod.clip}"/></clipPath><g clip-path="url(#${id})">${K.solidSvg(rod.paths,{tone:'hi',className:'rod'})}</g>`;
    put('rod',`lift.rod.${x}`,svg,A.slide(F,58,61,1.6,{name:`lift.rod.${x}`}),[x,0,59.5]);
  }
  // Cassette bridge is supported by the two rods; drums and belts stay together.
  box('cassette','cassette.bridge',-55,-4,110,8,61,3,'accent',bolts(-55,-4,110,8,64));
  for(const x of [-24,0,24]){
    for(const side of [-5,3])box('cassette',`cassette.rail.${x}.${side}`,x+side,-50,2,100,73,1,'metal');
    for(const side of[-5,3])box('cassette',`cassette.riser.${x}.${side}`,x+side,-4,2,8,64,9,'metal');
    box('cassette',`cassette.upper.${x}`,x-3,-45,6,90,84,.3,'rubber');
    box('cassette',`cassette.lower.${x}`,x-3,-45,6,90,73.7,.3,'rubber');
    for(const y of [-45,45]){
      // Convex depth-sortable segments, all recording their actual drawn radii.
      disc('cassette',`cassette.pulley.${x}.${y}.back`,[x,y,79],[1,0,0],-5,-3,2.5,'metal');
      disc('cassette',`cassette.pulley.${x}.${y}.drum`,[x,y,79],[1,0,0],-3,3,5,'dark');
      disc('cassette',`cassette.pulley.${x}.${y}.front`,[x,y,79],[1,0,0],3,5,2.5,'metal');
      for(const s of [-5,3]){
        box('cassette',`cassette.pedestal.${x}.${y}.${s}`,x+s,y-1.5,2,3,74,2.5,'metal');
      }
    }
  }
  // Gearmotor mounted under the cassette bridge, resting on a cantilever bracket.
  box('cassette','motor.bracket',-18,-4,36,8,56,5,'metal');
  box('cassette','motor.case',-14,-4,28,8,48,8,'sensor');
  for(let x=-12;x<=12;x+=4)for(const y of[-5.2,4])if(x!==0||y>0)box('cassette',`motor.rib.${x}.${y}`,x,y,1,1.2,49,6,'metal');
  // Enclosed transmission: motor shaft, gearbox and three vertical drive columns.
  disc('cassette','motor.output-shaft',[0,-4,52],[0,-1,0],0,37,1.7,'metal');
  box('cassette','motor.gearbox',-35,-49,70,8,44,12,'sensor');
  for(const x of[-33,29]){
    box('cassette',`motor.long-mount.${x}`,x,-50,4,46,61,3,'metal');
    box('cassette',`motor.gear-mount.${x}`,x,-47,4,4,56,5,'metal');
  }
  for(const x of[-24,0,24])box('cassette',`motor.drive-column.${x}`,x-5,-46.5,2,3,56,17,'metal');
  // Scanner supports stand on the rear/front frame rails.
  for(const y of [-68,64]){
    box('scanner',`scanner.foot.${y}`,-100,y,16,4,64,8,'metal',bolts(-100,y,16,4,72));
    box('scanner',`scanner.post.${y}`,-96,y,8,4,72,74,'metal');
  }
  box('scanner','scanner.beam',-100,-68,16,136,146,8,'sensor',bolts(-100,-68,16,136,154));
  box('scanner','scanner.head',-98,-14,12,28,135,11,'metal');
  box('scanner','scanner.window',-97,-10,10,20,134,1,'accent');
  // A pair of photoelectric sensors mounted onto the rail, not floating in air.
  box('frame','photo.mount',-125,64,12,4,72,28,'metal');box('frame','photo.sensor',-123,68,8,4,93,7,'sensor');
  box('frame','photo.backmount',-125,-68,12,4,72,28,'metal');box('frame','photo.reflector',-123,-72,8,4,93,7,'accent');
  // Removable service panel leaves the rollers exposed from above.
  box('cover','cover.panel',-70,68,140,2,42,22,'panel');
  for(const x of [-67,65])box('frame',`cover.mount.${x}`,x,64,2,4,42,22);
  for(const x of [-67,65])box('frame',`cover.anchor.${x}`,x,64,2,4,64,8);
  // A control cabinet and its display, buttons and door seams.
  box('controls','controls.bracket',22,-94,6,30,69,3);
  box('controls','controls.case',8,-94,34,20,72,35,'metal');
  box('controls','controls.display',13,-91,19,10,107,1,'sensor');
  disc('controls','controls.estop',[37,-84,107],[0,0,1],0,2,2.2,'alarm');
  // Signal lead travels outside the structure, with a real port at either end.
  box('scanner','scanner.port',-95,-70,6,2,80,6,'sensor');
  const route=G.fillet([[25,-94,90],[25,-108,90],[-92,-108,90],[-92,-82,90],[-92,-82,83],[-92,-70,83]],4);
  // Scanner port terminates at its top face, cabinet lead at its rear face.
  const cableName='controls.signal';R.route(cableName,route,.65,{piece:'controls',move:[0,0,0],limp:true,free:[false,true]});
  tubePieces(route,.65,P,{maxLength:16}).forEach((t,i)=>R.put({piece:'controls',name:`${cableName}:${i}`,svg:tubeSvg(t,{tone:'mid'}),at:t.mid,move:[0,0,0],shapes:[A.tube(t.points,t.radii)],route:cableName,chunk:i}));
  let floor='';for(let x=-260;x<=260;x+=40)floor+=`<path class="floor-grid" d="${K.pathOf([at([x,-125,0]),at([x,245,0])])}"/>`;for(let y=-125;y<=245;y+=40)floor+=`<path class="floor-grid" d="${K.pathOf([at([-260,y,0]),at([260,y,0])])}"/>`;
  const text=(t,p)=>{const[x,y]=at(p);return `<text class="floor-text" x="${x}" y="${y}" text-anchor="middle">${t}</text>`;};floor+=text('INFEED / 入件',[-225,-12,0])+text('B / 直行·复核',[228,0,0])+text('A / 侧线分流',[0,245,0]);
  const strokeStates=Array.from({length:17},(_,i)=>({label:`lift-${i/2}`,shares:{cassette:i/2/moves.cassette[2],rod:i/16}}));
  const raisedPose=state=>({label:'raised / '+A.labelOf(state),shares:{...Object.fromEntries(order.map(p=>[p,typeof state==='number'?state:state.shares[p]||0])),cassette:(typeof state==='number'?state:state.shares.cassette||0)+8/moves.cassette[2],rod:1}});
  if(!fast){console.log('Settling geometry and explosion depth…');const states=A.explodeStates(order,spring);A.settle(R,P,{states:[...states.depth,...states.depth.map(raisedPose),...strokeStates]});}
  R.items.sort((a,b)=>a.key-b.key);
  const items=R.items.map((it,i)=>({name:it.name,piece:it.piece,move:it.move,key:it.key,svg:it.svg,index:i}));
  return {W,H,P,moves,order,spring,items,rollers,floor,R,strokeStates,raisedPose,K,G,A,dot};
}
