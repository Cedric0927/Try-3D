const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
const sim=new Sorter();sim.enqueue();
const still=matchMedia('(prefers-reduced-motion: reduce)');if(still.matches)sim.running=false;
let exploded=false,cutaway=true,selected=null,wantsRun=false,wantsStep=false,visible=true,frame=0,last=0,viewShare=0,lastPhase='',clock=0,scanLevel=0;
const states=Object.fromEntries(Object.keys(D.moves).map(k=>[k,{x:0,v:0,target:0,pending:null}]));
const nodes=D.items.map(it=>({...it,el:document.querySelector(`[data-i="${it.index}"]`),lift:it.move.reduce((s,v,i)=>s+v*viewVector()[i],0)}));
const original=K.iso([0,0,0],D.P);
const descriptions={
  weigh:['01 / 称重台','入口滚筒安装在独立承载梁上，下方四只称重垫块读取包裹重量。静态称重时停止输送，超出 15 kg 的包裹会继续直行至复核出口。'],
  scanner:['02 / 扫码门','读头与主线垂直。包裹经过扫码门后，控制器读取本次运单目的地；重量与目的地共同决定走侧线还是继续直行。'],
  rollers:['03 / 主线滚筒','主线滚筒轴线沿 Y 方向，因此推动包裹沿 X 方向前进。中央预留三个间隙，让横向窄皮带从滚筒之间抬起。'],
  cassette:['04 / 横向皮带盒','三条皮带与主线运动方向垂直。下降时皮带表面低于滚筒；抬起后接住包裹，沿 Y 方向送往侧线。带盒、带轮与减速电机作为同一组件拆解。'],
  rod:['05 / 顶升执行器','两个直线执行器共同托起带盒，行程为 8 mm 示意值。先完成顶升，再启动横向移载；包裹离开后才能回落，避免中途失去支撑。'],
  controls:['06 / 控制柜','控制器按“称重 → 扫码 → 定位 → 顶升 → 移载 → 复位”驱动机构。一次处理一件包裹，投件间隔缩短会增加入口等待队列。']
};
const phases=['feed','weigh','scan','index','lift','transfer','lower'];
$('sequence').innerHTML=phases.map(p=>`<span data-phase="${p}">${PHASES[p]}</span>`).join('');
function viewVector(){const a=D.P.azimuth*Math.PI/180,e=D.P.elevation*Math.PI/180;return[Math.cos(a)*Math.cos(e),Math.sin(a)*Math.cos(e),Math.sin(e)];}
function smooth(t){return t*t*(3-2*t);}
function select(part){selected=selected===part?null:part;const d=descriptions[selected];$('part-label').textContent=d?d[0]:'机制 / 顶升式移载';$('part-description').textContent=d?d[1]:'横向皮带平时低于主线滚筒。包裹定位后，执行器抬升皮带盒，使包裹离开滚筒，再由皮带送入侧线。';document.querySelectorAll('[data-part]').forEach(b=>{const active=b.dataset.part===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}
for(const n of nodes){n.el.addEventListener('click',()=>select(n.name.startsWith('lift.')?'rod':n.name.startsWith('weigh.cell')?'weigh':n.piece));}
function setExploded(next){
  exploded=next;sim.running=false;wantsRun=false;wantsStep=false;
  // Preserve the actual stroke when entering service view; no snap-to-home.
  const order=next?D.order:[...D.order].reverse();
  const changing=order.filter(p=>states[p].target!==(next?1:0));
  for(const p of D.order)states[p].pending=null;
  changing.forEach((p,i)=>states[p].pending={value:next?1:0,at:clock+i*D.spring.stagger});
  $('explode').textContent=next?'⌘ 重新组装':'⌘ 拆解结构';$('explode').setAttribute('aria-pressed',String(next));
  run();render();
}
function assembleThenRun(step=false){
  if(exploded||D.order.some(p=>states[p].x>.001||states[p].pending)){
    setExploded(false);wantsRun=true;wantsStep=step;
  }else{if(step)sim.stepPhase();else sim.running=true;}
  run();render();
}
function springTick(dt){
  for(const p of D.order){const s=states[p];if(s.pending&&clock>=s.pending.at){s.target=s.pending.value;s.pending=null;}
    if(still.matches){s.x=s.target;s.v=0;continue;}
    for(let i=0;i<D.spring.substeps;i++){const h=dt/D.spring.substeps;s.v+=(D.spring.stiffness*(s.target-s.x)-D.spring.damping*s.v)*h;s.x+=s.v*h;}
    if(Math.abs(s.x-s.target)<.0002&&Math.abs(s.v)<.0003){s.x=s.target;s.v=0;}
  }
}
function parcelShape(){
  const plan={x:-PARCEL.width/2,y:-PARCEL.depth/2,w:PARCEL.width,d:PARCEL.depth,r:1};const h=PARCEL.height;
  const solid=K.solidSvg(K.slabOf(plan,87,h,D.P,4,.7),{className:'package',tone:'hi'});
  const tape=`<path d="${K.planOutline({x:-3,y:-PARCEL.depth/2,w:6,d:PARCEL.depth,r:0},115.1,D.P)}" fill="#ead8b8"/>`;
  const sticker=`<path d="${K.planOutline({x:5,y:-10,w:12,d:18,r:1},115.2,D.P)}" fill="#f6f1e5"/>`;
  let marks='';for(let x=7;x<16;x+=1.2)marks+=`<path d="${K.pathOf([K.iso([x,-7,115.3],D.P),K.iso([x,1,115.3],D.P)])}" stroke="#6b6b56" stroke-width=".7"/>`;
  return solid+tape+sticker+marks;
}
$('parcel').innerHTML=parcelShape();
// Split the scanner front post into an occluding overlay for the moving parcel.
// These are the same source nodes, moved between layers, not duplicated geometry.
const frontGantry=nodes.filter(n=>n.name==='scanner.post.64'||n.name==='scanner.foot.64');
for(const n of frontGantry)$('gantry-front').append(n.el);
const rollerMarks=new Map();
for(const r of D.rollers){const n=nodes.find(n=>n.name===r.name),path=document.createElementNS(NS,'path');path.classList.add('roller-mark');n.el.append(path);rollerMarks.set(r.name,path);}
const beltMarks=new Map();
for(const n of nodes.filter(n=>n.name.startsWith('cassette.upper.'))){const p=document.createElementNS(NS,'path');p.classList.add('belt-mark');n.el.append(p);beltMarks.set(Number(n.name.split('.').at(-1)),p);}
function moveOf(n){
  let share=states[n.piece]?.x||0;
  if(n.piece==='rod')share=sim.lift/8;
  if(n.piece==='cassette')share+=sim.lift/D.moves.cassette[2];
  return n.move.map(v=>v*share);
}
function render(){
  const all=[];
  for(const n of nodes){const off=moveOf(n),p=K.iso(off,D.P),x=p[0]-original[0],y=p[1]-original[1];n.el.setAttribute('transform',`translate(${x} ${y})`);
    const clip=n.el.querySelector('[data-hold]');if(clip)clip.setAttribute('transform',`translate(${-x} ${-y})`);
    const highlighted=selected&&(n.piece===selected||(selected==='rod'&&n.name.startsWith('lift.'))||(selected==='weigh'&&n.name.startsWith('weigh.cell')));
    n.el.classList.toggle('selected',!!highlighted);n.el.classList.toggle('dim',!!selected&&!highlighted);n.el.classList.toggle('cut',cutaway&&n.piece==='cover'&&!exploded);
    if(!frontGantry.includes(n))all.push({el:n.el,key:n.key+off.reduce((s,v,i)=>s+v*viewVector()[i],0)});
  }
  all.sort((a,b)=>a.key-b.key);let previous=null;
  for(const n of all){const next=previous?previous.nextSibling:$('world').firstChild;if(next!==n.el)$('world').insertBefore(n.el,next);previous=n.el;}
  const mean=Math.max(...D.order.map(p=>states[p].x));viewShare=mean;
  const assembled=[70,125,1040,735],apart=[0,-325,1160,1145];
  $('scene').setAttribute('viewBox',assembled.map((v,i)=>v+(apart[i]-v)*mean).join(' '));
  const p=sim.parcel;
  $('parcel').style.display=p&&!exploded&&mean<.02?'':'none';
  if(p){const t=K.iso([p.x,p.y,p.z-87],D.P);$('parcel').setAttribute('transform',`translate(${t[0]-original[0]} ${t[1]-original[1]})`);$('parcel').classList.toggle('warning',sim.disposition==='review');$('parcel').style.opacity=p.x>214||p.y>214?String(Math.max(0,(230-Math.max(p.x,p.y))/16)):'1';}
  // Registered to the reader's world plane; it follows the scanner assembly.
  const scannerZ=states.scanner.x*D.moves.scanner[2],beamOpacity=.045+.195*scanLevel;
  const detected=p&&p.x>=-142&&p.x<=-96&&p.y===0;
  $('beam').innerHTML=mean>.02?'':`<path class="scan-light" style="opacity:${beamOpacity}" d="${K.pathOf([K.iso([-92,-20,135+scannerZ],D.P),K.iso([-92,20,135+scannerZ],D.P),K.iso([-92,26,87],D.P),K.iso([-92,-26,87],D.P)],true)}"/><path class="photo-light" style="opacity:${detected?.5:.09}" d="${K.pathOf([K.iso([-119,-68,96],D.P),K.iso([-119,68,96],D.P)])}"/>`;
  for(const r of D.rollers){const distance=r.axis==='x'?sim.beltDistance:sim.mainDistance,theta=distance/5;const c=Math.cos(theta),s=Math.sin(theta);let d='';if(s>=0){const a=r.axis==='y'?[r.x+5*c,-r.half,r.z+5*s]:[-r.half,r.y+5*c,r.z+5*s];const b=r.axis==='y'?[r.x+5*c,r.half,r.z+5*s]:[r.half,r.y+5*c,r.z+5*s];d=K.pathOf([K.iso(a,D.P),K.iso(b,D.P)]);}rollerMarks.get(r.name).setAttribute('d',d);}
  for(const [x,path]of beltMarks){let d='';for(let y=-43+(sim.beltDistance%12);y<44;y+=12)d+=K.pathOf([K.iso([x-3,y,84.35],D.P),K.iso([x+3,y,84.35],D.P)]);path.setAttribute('d',d);}
  $('play').textContent=sim.running?'Ⅱ 暂停':wantsRun?'⋯ 组装中':'▷ 运行';
  $('play').setAttribute('aria-pressed',String(sim.running));$('state-pill').textContent=mean>.01?(exploded?'检修拆解':'重新组装'):sim.running?'运行中':'已暂停';
  const label=PHASES[sim.phase];$('readout').textContent=mean>.01?'检修模式 · 运行互锁':`${p?'FL'+String(p.id).padStart(4,'0')+' · ':''}${label}${sim.disposition==='review'?' · 超重复核':''}`;
  $('weight-readout').innerHTML=`${p&&sim.weighed>0?sim.weighed.toFixed(1):'—'}<small>kg</small>`;$('lift-readout').innerHTML=`${sim.lift.toFixed(1)}<small>mm</small>`;
  $('queue').textContent=`入口等待：${sim.queue.length} 件${sim.queue.length===12?' · 队列已满':''}`;$('add').disabled=sim.queue.length>=12;
  $('count-side').textContent=sim.accepted;$('count-straight').textContent=sim.straight;$('count-review').textContent=sim.review;
  document.querySelectorAll('[data-phase]').forEach(el=>el.classList.toggle('active',el.dataset.phase===sim.phase||(el.dataset.phase==='scan'&&sim.phase==='scanmove')));
  if(sim.phase!==lastPhase){lastPhase=sim.phase;$('announcement').textContent=label;}
  $('interlock-label').textContent=mean>.01?'互锁 / 检修停止':sim.phase==='lift'?'互锁 / 先抬升再移载':sim.phase==='transfer'?'互锁 / 保持抬升':sim.phase==='weigh'?'互锁 / 停稳后称重':sim.disposition==='review'?'决策 / 超重直行复核':'互锁 / 单件处理';
  $('interlock-text').textContent=mean>.01?'设备拆解时禁止输送。点击运行会先重新组装，再继续原流程。':sim.phase==='transfer'?'横向皮带已高于主线滚筒，包裹被送向侧线；完全离开后机构才会回落。':sim.disposition==='review'?'当前包裹超过 15 kg 的演示上限，取消顶升并沿主线送往复核出口。':'入口仅在前一件处理结束后放行。投件更密时，等待队列会增加。';
  $('events').innerHTML=sim.last.length?sim.last.map(e=>`<li><span>FL${String(e.id).padStart(4,'0')} · ${e.mass} kg</span><span>${e.out==='review'?'复核':e.out==='side'?'侧线 A':'主线 B'}</span></li>`).join(''):'<li>等待第一件包裹完成。</li>';
}
function tick(now){frame=0;const dt=last?Math.min(.033,(now-last)/1000):0;last=now;clock+=dt;springTick(dt);
  const settled=D.order.every(p=>Math.abs(states[p].x)<.001&&!states[p].pending);
  if(wantsRun&&settled){wantsRun=false;if(wantsStep){wantsStep=false;sim.stepPhase();}else sim.running=true;}
  if(!exploded&&settled&&!document.hidden&&visible)sim.update(dt);
  const scanTarget=sim.phase==='scan'?1:0;scanLevel=still.matches?scanTarget:scanLevel+(scanTarget-scanLevel)*(1-Math.exp(-dt/.14));
  render();const moving=D.order.some(p=>Math.abs(states[p].x-states[p].target)>.0001||states[p].pending);
  if((sim.running||moving||wantsRun)&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
}
function run(){if(!frame&&visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
$('play').onclick=()=>{if(sim.running){sim.running=false;render();}else assembleThenRun();};
$('step').onclick=()=>assembleThenRun(true);
$('explode').onclick=()=>setExploded(!exploded);
$('section').onclick=()=>{cutaway=!cutaway;$('section').textContent=`剖面：${cutaway?'开':'关'}`;$('section').setAttribute('aria-pressed',String(cutaway));render();};
document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>select(b.dataset.part));
$('mass').oninput=e=>{sim.mass=Number(e.target.value);$('mass-value').textContent=sim.mass+' kg';};
$('destination').onchange=e=>sim.destination=e.target.value;
$('interval').oninput=e=>{sim.interval=Number(e.target.value);$('interval-value').textContent=sim.interval+' s';};
$('rate').oninput=e=>{sim.rate=Number(e.target.value);$('rate-value').textContent=sim.rate.toFixed(1)+'×';};
$('auto').onchange=e=>{sim.auto=e.target.checked;sim.arrival=0;};
$('add').onclick=()=>{sim.enqueue();render();};
$('theme').onclick=()=>{const next=document.body.dataset.theme==='light'?'dark':'light';document.body.dataset.theme=next;$('theme').setAttribute('aria-label',`切换${next==='light'?'深色':'浅色'}模式`);};
$('reset').onclick=()=>{sim.reset();sim.enqueue();sim.running=!still.matches;wantsRun=false;wantsStep=false;exploded=false;for(const s of Object.values(states)){s.x=0;s.v=0;s.target=0;s.pending=null;}$('mass').value=8;$('mass-value').textContent='8 kg';$('destination').value='side';$('interval').value=5;$('interval-value').textContent='5 s';$('auto').checked=true;$('rate').value=1;$('rate-value').textContent='1.0×';$('explode').textContent='⌘ 拆解结构';$('explode').setAttribute('aria-pressed','false');render();run();};
document.addEventListener('keydown',e=>{if(e.target.closest('input,select,button'))return;if(e.key===' '){e.preventDefault();$('play').click();}else if(e.key.toLowerCase()==='e')$('explode').click();else if(e.key.toLowerCase()==='n')$('add').click();else if(e.key==='ArrowRight'){e.preventDefault();$('step').click();}else if(e.key==='Escape'){if(selected)select(selected);setExploded(false);}});
new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;if(visible)run();},{rootMargin:'120px'}).observe($('scene'));document.addEventListener('visibilitychange',run);
still.addEventListener('change',e=>{if(e.matches)sim.running=false;render();run();});
window.sorterState=()=>({phase:sim.phase,running:sim.running,exploded,assembled:D.order.every(p=>states[p].x<.001&&!states[p].pending),lift:sim.lift,completed:sim.completed,accepted:sim.accepted,review:sim.review,straight:sim.straight,created:sim.nextId,queue:sim.queue.length,parcel:sim.parcel?{...sim.parcel}:null,scanned:sim.scanned,disposition:sim.disposition,weight:sim.weighed,history:[...sim.history]});
render();run();
