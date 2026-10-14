const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const P = K.fitProjection(K.boxCorners({x:-445,y:-110,w:875,d:410,r:0},0,170), 1100, 630, {pad:55,azimuth:48,elevation:32});
const sim = new Conveyor(); sim.seed();
const origin = K.iso([0,0,0],P);
const staticItems = [], parcelNodes = new Map(), branches = [], seams = [];
let frame=0,last=0,visible=true,paint=0,statsKey='',theme='light';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if(reduced.matches) sim.running=false;
function node(markup) { const temp=document.createElementNS(NS,'g');temp.innerHTML=markup;return temp; }
function item(markup,center,layer=0) { const n=node(markup);const depth=K.depthOf(center,P);staticItems.push({node:n,depth,layer});return n; }
function slab(x,y,w,d,z,h,cls='machine',extra='') {
  return K.solidSvg(K.slabOf({x,y,w,d,r:Math.min(1.8,w/4,d/4)},z,h,P,4,.5),{className:cls,inner:extra,tone:'mid'});
}
function part(x,y,w,d,z,h,cls='machine',extra='') {return item(slab(x,y,w,d,z,h,cls,extra),[x+w/2,y+d/2,z+h/2],z+h>=120?2:0);}
function stroke(a,b,cls='floor-line'){return `<path class="${cls}" d="${K.pathOf([K.iso(a,P),K.iso(b,P)])}"/>`;}
function label(text,x,y,z,cls='scene-text'){const p=K.iso([x,y,z],P);return `<text class="${cls}" x="${p[0]}" y="${p[1]}" text-anchor="middle">${text}</text>`;}
function bolts(x,y,w,d,z){return K.dotsSvg(K.corners({x,y,w,d,r:0},3).map(([a,b])=>K.iso([a,b,z],P)),{size:.8,tone:'hi'});}
// Parts: floor pads, adjustable feet, twin leg frames, cross braces,
// modular chassis, belt decks, side guards, end covers, motor housings,
// mounting plates, bolts, scanner posts, overhead reader, control cabinet,
// transfer plates and three separate receiving trays.
let floor='';
for(let x=-450;x<=450;x+=50) floor+=stroke([x,-110,0],[x,305,0]);
for(let y=-110;y<=305;y+=50) floor+=stroke([-450,y,0],[450,y,0]);
floor+=`<path d="${K.planOutline({x:-410,y:-44,w:800,d:100,r:13},0,P)}" fill="#425641" opacity=".08" filter="url(#shadow)"/>`;
floor+=label('INFEED',-403,-70,0)+label('扫码识别',-225,-82,0,'scene-label');
for(let i=0;i<3;i++) floor+=label(`${String(i+1).padStart(2,'0')} / ${ROUTES[i].name}`,ROUTES[i].x,294,0,'scene-label');
$('floor').innerHTML=floor;
function support(x,y) {
  part(x-8,y-7,16,14,0,3,'machine',bolts(x-8,y-7,16,14,3));
  part(x-3,y-3,6,6,3,45);
  part(x-5,y-5,10,10,41,6,'rail',bolts(x-5,y-5,10,10,47));
}
function motor(x,y) {
  part(x-14,y-8,28,16,23,3,'machine',bolts(x-14,y-8,28,16,26));
  part(x-11,y-7,22,14,26,13,'sensor');
  for(let i=0;i<5;i++)part(x-9+i*4,y-8,1.4,16,28,9,'machine');
  part(x+11,y-5,7,10,29,7,'rail');
}
// Main conveyor: actual gaps in the near guard at the transfer stations.
for(let x=-400;x<385;x+=49){
  part(x,-33,48.5,66,48,9,'machine',bolts(x,-33,48.5,66,57));
  part(x+1,-27,46.5,54,57,3,'belt');
  part(x,-35,48.5,3,57,7,'rail');
  if(!ROUTES.some(r=>r.x>=x-27 && r.x<=x+76))part(x,32,48.5,3,57,7,'rail');
  if((x+400)%98===0){support(x+8,-27);support(x+8,27);part(x+5,-27,6,54,20,4);}
}
motor(-344,43);motor(342,-45);
part(-405,-34,5,68,48,13,'rail');part(385,-34,5,68,48,13,'rail');
const mainMarks=item('',[0,0,60.1]);seams.push({node:mainMarks,axis:'x',from:-398,to:385,cross:-25,span:50,offset:0});
for(let i=0;i<3;i++){
  const x=ROUTES[i].x;
  for(let y=35;y<220;y+=37){
    part(x-29,y,58,36.7,48,9,'machine',bolts(x-29,y,58,36.7,57));
    part(x-24,y+1,48,34.7,57,3,'belt');
    part(x-31,y,3,36.7,57,6,'rail');part(x+28,y,3,36.7,57,6,'rail');
    if(y===35||y===183){support(x-24,y+12);support(x+24,y+12);part(x-24,y+10,48,5,20,4);}
  }
  // Transverse transfer bars redirect a parcel onto its destination branch.
  for(let a=-23;a<=23;a+=7)part(x+a-1.5,-28,3,58,60,1.2,'rail');
  part(x-27,-26,54,3,61.3,1,'sensor');
  const mark=item('',[x,126,60.1]);seams.push({node:mark,axis:'y',from:36,to:220,cross:x-23,span:46,offset:0});
  motor(x+38,176);
  // Receiving tray with a rear wall and two side walls, open towards the line.
  part(x-34,221,68,42,38,9,'machine');
  part(x-34,221,3,42,47,17,'rail');part(x+31,221,3,42,47,17,'rail');
  part(x-34,259,68,4,47,17,'rail');
  support(x-26,250);support(x+26,250);
  const routeStripe = node(`<path d="${K.planOutline({x:x-27,y:240,w:54,d:14,r:1},47.2,P)}" fill="${ROUTES[i].color}" opacity=".75"/>`);
  staticItems.push({node:routeStripe,depth:K.depthOf([x,247,47.2],P),layer:0});
  branches.push({x,route:i});
}
// Scanner gantry: posts beside the belt, one elevated transverse beam.
for(const y of [-45,39]){
  part(-231,y-5,20,12,0,4,'machine',bolts(-231,y-5,20,12,4));
  part(-227,y-2,8,6,4,134,'sensor');
  part(-230,y-4,14,10,119,10,'machine');
}
part(-231,-47,20,96,138,11,'sensor',bolts(-231,-47,20,96,149));
part(-228,-16,14,32,127,11,'machine');
part(-225,-10,8,20,124,3,'sensor');
const scanLight=item(`<path class="scan-beam" d="${K.pathOf([K.iso([-221,-25,61],P),K.iso([-221,25,61],P),K.iso([-221,16,125],P),K.iso([-221,-16,125],P)],true)}"/>`,[-221,0,85]);
// Floor-mounted control cabinet and its small face controls.
part(-275,-100,45,26,0,4,'machine');part(-272,-98,39,22,4,43,'machine');
part(-267,-96,29,17,47,2,'sensor');
part(-264,-93,18,10,49,1,'belt');part(-242,-93,3,3,49,1,'rail');
const orderItems=(a,b)=>a.layer-b.layer||a.depth-b.depth;
const ordered = [...staticItems].sort(orderItems);
for(const o of ordered)$('world').append(o.node);
function parcelMarkup(route,id){
  const size=32+(id%3)*3,height=19+(id%2)*6;
  const shape=slab(-size/2,-12,size,24,60,height,'package');
  const tape=`<path d="${K.planOutline({x:-3,y:-12,w:6,d:24,r:0},60+height+.1,P)}" fill="#efe0c1" opacity=".85"/>`;
  const sticker=`<path d="${K.planOutline({x:5,y:-8,w:8,d:13,r:.5},60+height+.2,P)}" fill="${ROUTES[route].color}"/>`;
  let barcode='';for(let i=0;i<7;i++)barcode+=stroke([-12+i*1.3,-7,60+height+.3],[-12+i*1.3,2,60+height+.3],'barcode');
  return shape+tape+sticker+`<g stroke="#715b42" stroke-width=".7">${barcode}</g>`;
}
function selectParcel(id){sim.selected=id;updateDetail();render();}
function updateDetail(){
  const p=sim.parcels.find(p=>p.id===sim.selected);
  if(!sim.selected)return;
  if(!p){$('detail').innerHTML='<span class="small-label">PARCEL DELIVERED</span><p>所选包裹已到达分拣出口。</p>';return;}
  $('detail').innerHTML=`<span class="small-label">运单 FL${String(p.id).padStart(5,'0')}</span><p>目的地：${ROUTES[p.route].name} · ${ROUTES[p.route].code}<br>状态：${p.stage==='branch'?'支线输送':p.scanned?'已识别，前往分拣口':'主线输送，等待扫码'}</p>`;
}
function render(){
  const moving=[];
  for(const p of sim.parcels){
    let n=parcelNodes.get(p.id);
    if(!n){n=node(parcelMarkup(p.route,p.id));n.classList.add('parcel');n.style.setProperty('--route',ROUTES[p.route].color);n.setAttribute('tabindex','0');n.setAttribute('role','button');n.addEventListener('click',()=>selectParcel(p.id));n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();selectParcel(p.id);}});parcelNodes.set(p.id,n);}
    const [sx,sy]=K.iso([p.x,p.y,0],P);
    n.setAttribute('transform',`translate(${sx-origin[0]} ${sy-origin[1]})`);
    n.setAttribute('aria-label',`包裹 FL${String(p.id).padStart(5,'0')}，目的地${ROUTES[p.route].name}，${p.scanned?'已扫码':'待扫码'}`);
    n.classList.toggle('selected',p.id===sim.selected);
    n.dataset.id=p.id;n.dataset.route=p.route;n.dataset.stage=p.stage;
    if(p.y>204)n.style.opacity=String(Math.max(0,(220-p.y)/16));else n.style.opacity='1';
    moving.push({node:n,depth:K.depthOf([p.x,p.y,71],P),layer:1});
  }
  for(const [id,n]of parcelNodes)if(!sim.parcels.some(p=>p.id===id)){n.remove();parcelNodes.delete(id);}
  // Maintain painter order without rebuilding static geometry or package paths.
  const all=[...ordered,...moving].sort(orderItems);
  let previous=null;
  for(const o of all){const expected=previous?previous.nextSibling:$('world').firstChild;if(expected!==o.node)$('world').insertBefore(o.node,expected);previous=o.node;}
  for(const m of seams){let d='';const offset=sim.distance%18;for(let at=m.from+offset;at<m.to;at+=18){const a=m.axis==='x'?[at,m.cross,60.2]:[m.cross,at,60.2];const b=m.axis==='x'?[at,m.cross+m.span,60.2]:[m.cross+m.span,at,60.2];d+=K.pathOf([K.iso(a,P),K.iso(b,P)]);}m.node.innerHTML=`<path class="belt-mark" d="${d}"/>`;}
  scanLight.style.opacity=sim.lastScan&&sim.elapsed-sim.lastScan.at<.55?'1':'.35';
  const total=sim.completed;
  $('completed').firstChild.textContent=total;$('active').firstChild.textContent=sim.parcels.length;
  for(let i=0;i<3;i++)$('count-'+i).textContent=sim.counts[i];
  $('queue-message').textContent=`等待投件：${sim.pending.length} 件${sim.pending.length>=20?' · 队列已满':''}`;$('add').disabled=sim.pending.length>=20;
  const k=sim.events.map(e=>`${e.id}${e.type}`).join(',');
  if(k!==statsKey){statsKey=k;$('events').innerHTML=sim.events.slice(0,4).map(e=>`<li><span><strong>FL${String(e.id).padStart(5,'0')}</strong> ${e.type==='scan'?'扫码识别':'完成分拣'}</span><small style="color:${ROUTES[e.route].color}">${ROUTES[e.route].name} ↗</small></li>`).join('')||'<li class="empty-event">传送线已启动，等待包裹经过扫码门。</li>';}
  $('scene-readout').textContent=!sim.running?'输送已暂停 · 包裹保持当前位置':sim.lastScan&&sim.elapsed-sim.lastScan.at<2?`FL${String(sim.lastScan.id).padStart(5,'0')} → ${ROUTES[sim.lastScan.route].name} · 已识别`:`主线运行 · ${sim.parcels.length} 件在线`;
  updateDetail();
}
function updateRun(){
  $('pause-icon').textContent=sim.running?'Ⅱ':'▷';$('pause-text').textContent=sim.running?'暂停输送':'继续输送';$('pause').setAttribute('aria-pressed',String(!sim.running));
  $('run-status').innerHTML=`<i></i>${sim.running?'运行中':'已暂停'}`;$('run-status').classList.toggle('paused',!sim.running);render();
}
function tick(now){
  frame=0;const dt=last?Math.min((now-last)/1000,.033):0;last=now;
  if(!document.hidden&&visible)sim.step(dt);
  render();if(sim.running&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
}
function run(){if(!frame&&sim.running&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
function toggle(){sim.running=!sim.running;updateRun();run();}
$('routes').innerHTML=ROUTES.map((r,i)=>`<div class="route" style="--route:${r.color}"><span class="route-name"><i class="route-dot"></i><strong>${r.name}<small>${r.code}</small></strong></span><span id="count-${i}" class="route-count">0</span></div>`).join('');
$('pause').addEventListener('click',toggle);
$('add').addEventListener('click',()=>{sim.enqueue(Number($('destination').value));render();});
$('auto').addEventListener('change',e=>{sim.auto=e.target.checked;sim.feedTravel=0;render();});
$('speed').addEventListener('input',e=>{sim.speed=Number(e.target.value);$('speed-value').textContent=sim.speed.toFixed(2)+'×';render();});
$('reset').addEventListener('click',()=>{sim.reset();sim.seed();sim.running=!reduced.matches;statsKey='reset';$('auto').checked=true;$('speed').value=1;$('speed-value').textContent='1.00×';$('detail').innerHTML='<span class="small-label">INSPECT A PARCEL</span><p>点击传送带上的包裹<br>查看它的目的地与当前状态。</p>';updateRun();run();});
$('theme').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';document.body.dataset.theme=theme;$('theme').setAttribute('aria-label',`切换${theme==='light'?'深色':'浅色'}主题`);});
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,select,button,.parcel'))return;
  if(e.key===' '){e.preventDefault();toggle();}
  if(e.key.toLowerCase()==='n'){sim.enqueue(Number($('destination').value));render();}
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();$('speed').value=Math.max(.5,Math.min(2,sim.speed+(e.key==='ArrowRight'?.25:-.25)));$('speed').dispatchEvent(new Event('input'));}
});
new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;if(visible)run();},{rootMargin:'120px'}).observe($('scene'));
document.addEventListener('visibilitychange',run);
reduced.addEventListener('change',e=>{if(e.matches){sim.running=false;updateRun();}});
// Read-only state makes browser verification possible without controlling the simulation.
window.flowState=()=>({running:sim.running,speed:sim.speed,auto:sim.auto,completed:sim.completed,counts:[...sim.counts],scanned:sim.scanned,active:sim.parcels.length,pending:sim.pending.length,parcels:sim.parcels.map(p=>({...p}))});
updateRun();run();
