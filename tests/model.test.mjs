import test from 'node:test';
import assert from 'node:assert/strict';
import { Conveyor, ROUTES } from '../src/model.mjs';
function advance(sim, seconds) { for(let i=0;i<seconds*100;i++)sim.step(.01); }
test('all three destinations are scanned and delivered to their matching exits',()=>{
  const sim=new Conveyor();sim.auto=false;
  for(let i=0;i<3;i++)sim.enqueue(i);
  advance(sim,30);
  assert.deepEqual(sim.counts,[1,1,1]);assert.equal(sim.scanned,3);assert.equal(sim.parcels.length,0);
});
test('pause preserves all movement, counters and queued parcels',()=>{
  const sim=new Conveyor();sim.seed();sim.enqueue(2);sim.running=false;
  const before=JSON.stringify(sim);advance(sim,20);assert.equal(JSON.stringify(sim),before);
});
test('sustained automatic flow conserves parcels and spacing at each speed',()=>{
  for(const speed of [.5,1,2]){
    const sim=new Conveyor();sim.speed=speed;sim.seed();
    for(let i=0;i<12000;i++){
      sim.step(.01);
      assert.equal(sim.created,sim.completed+sim.parcels.length+sim.pending.length);
      const main=sim.parcels.filter(p=>p.stage==='main').sort((a,b)=>a.x-b.x);
      for(let n=1;n<main.length;n++)assert.ok(main[n].x-main[n-1].x>=65);
      for(let route=0;route<3;route++){
        const branch=sim.parcels.filter(p=>p.stage==='branch'&&p.route===route).sort((a,b)=>a.y-b.y);
        for(let n=1;n<branch.length;n++)assert.ok(branch[n].y-branch[n-1].y>=35);
      }
      for(const p of sim.parcels)assert.ok(p.x<=ROUTES[p.route].x+.001);
    }
    assert.ok(sim.completed>10);
  }
});
test('manual burst queue is bounded and all accepted parcels eventually finish',()=>{
  const sim=new Conveyor();sim.auto=false;
  for(let i=0;i<20;i++)assert.equal(sim.enqueue(i%3),true);
  assert.equal(sim.enqueue(),false);advance(sim,80);
  assert.equal(sim.completed,20);assert.equal(sim.pending.length,0);assert.equal(sim.scanned,20);
});
