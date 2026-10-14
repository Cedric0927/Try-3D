// Demonstration parcel footprint bridges the transfer-to-side-line handoff.
export const PARCEL = { width:46, depth:70, height:28 };
export const PHASES = {
  idle:'等待包裹', feed:'主线输送', weigh:'静态称重', scanmove:'经过扫码门', scan:'读取运单', index:'定位停稳', lift:'顶升皮带', transfer:'横向移载', straight:'主线直行', lower:'机构复位'
};
export class Sorter {
  constructor(){this.reset();}
  reset(){this.running=true;this.auto=true;this.rate=1;this.interval=5;this.mass=8;this.destination='side';this.queue=[];this.parcel=null;this.nextId=0;this.accepted=0;this.review=0;this.straight=0;this.clock=0;this.arrival=0;this.phase='idle';this.age=0;this.lift=0;this.beltDistance=0;this.mainDistance=0;this.stepMode=false;this.last=[];this.weighed=0;this.scanned=false;this.disposition=null;this.history=[];}
  enqueue(mass=this.mass,destination=this.destination){if(this.queue.length>=12)return false;this.queue.push({id:++this.nextId,mass,destination,x:-200,y:0,z:87});return true;}
  change(phase){this.phase=phase;this.age=0;this.history.push(phase);if(this.history.length>20)this.history.shift();if(this.stepMode){this.running=false;this.stepMode=false;}}
  stepPhase(){this.stepMode=true;this.running=true;}
  update(dt){
    if(!this.running||dt<=0)return;dt=Math.min(dt,.05)*this.rate;this.clock+=dt;this.arrival+=dt;
    if(this.auto&&this.arrival>=this.interval){this.arrival%=this.interval;this.enqueue();}
    if(this.phase==='idle'){
      if(this.queue.length){this.parcel=this.queue.shift();this.weighed=0;this.scanned=false;this.disposition=null;this.change('feed');}return;
    }
    this.age+=dt;const p=this.parcel;const v=65;
    switch(this.phase){
      case 'feed':p.x=Math.min(-145,p.x+v*dt);this.mainDistance+=v*dt;if(p.x>=-145)this.change('weigh');break;
      case 'weigh':this.weighed=p.mass*Math.min(1,this.age/.7);if(this.age>=.7){this.weighed=p.mass;this.change('scanmove');}break;
      case 'scanmove':p.x=Math.min(-93,p.x+v*dt);this.mainDistance+=v*dt;if(p.x>=-93)this.change('scan');break;
      case 'scan':if(this.age>=.6){this.scanned=true;this.disposition=p.mass>15?'review':p.destination;this.change('index');}break;
      case 'index':p.x=Math.min(0,p.x+v*dt);this.mainDistance+=v*dt;if(p.x>=0)this.change(this.disposition==='side'?'lift':'straight');break;
      case 'lift':this.lift=8*Math.min(1,this.age/.7);p.z=Math.max(87,84.3+this.lift);if(this.age>=.7){this.lift=8;p.z=92.3;this.change('transfer');}break;
      case 'transfer':p.y=Math.min(230,p.y+v*dt);this.beltDistance+=v*dt;p.z=92.3;if(p.y>=230){this.complete();this.change('lower');}break;
      case 'straight':p.x=Math.min(230,p.x+v*dt);this.mainDistance+=v*dt;if(p.x>=230){this.complete();this.change('lower');}break;
      case 'lower':this.lift=8*Math.max(0,1-this.age/.65)*(this.disposition==='side'?1:0);if(this.age>=.65){this.lift=0;this.change('idle');}break;
    }
  }
  complete(){const p=this.parcel;if(this.disposition==='review')this.review++;else if(this.disposition==='side')this.accepted++;else this.straight++;this.last.unshift({id:p.id,mass:p.mass,out:this.disposition});this.last.length=Math.min(4,this.last.length);this.parcel=null;}
  get completed(){return this.accepted+this.review+this.straight;}
}
