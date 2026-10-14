export const ROUTES = [
  { name: '上海', code: 'SHA', x: -25, color: '#347767' },
  { name: '杭州', code: 'HGH', x: 125, color: '#bd8041' },
  { name: '南京', code: 'NKG', x: 275, color: '#6879a5' }
];
export class Conveyor {
  constructor() { this.reset(); }
  reset() {
    this.parcels = []; this.pending = []; this.counts = [0, 0, 0];
    this.scanned = 0; this.created = 0; this.elapsed = 0; this.distance = 0;
    this.auto = true; this.running = true; this.speed = 1; this.feedTravel = 0;
    this.events = []; this.lastScan = null; this.selected = null;
  }
  enqueue(route = this.created % 3) {
    if (this.pending.length >= 20) return false;
    this.pending.push({ id: ++this.created, route }); return true;
  }
  seed() {
    for (let i = 0; i < 7; i++) {
      const x = -360 + i * 86;
      // Each seeded parcel is assigned an exit ahead of its current position.
      const route = ROUTES.findIndex(r => r.x > x + 30);
      const p = { id: ++this.created, route: Math.max(0, route), x, y: 0, scanned: x >= -210, stage: 'main' };
      if (p.scanned) this.scanned++;
      this.parcels.push(p);
    }
  }
  step(dt) {
    if (!this.running || dt <= 0) return;
    dt = Math.min(dt, 0.1);
    const travel = 48 * this.speed * dt;
    this.elapsed += dt; this.distance += travel; this.feedTravel += travel;
    for (const p of this.parcels) {
      let left = travel;
      if (p.stage === 'main') {
        const toExit = ROUTES[p.route].x - p.x;
        const move = Math.min(left, Math.max(0, toExit));
        p.x += move; left -= move;
        if (!p.scanned && p.x >= -210) {
          p.scanned = true; this.scanned++;
          this.lastScan = { id: p.id, route: p.route, at: this.elapsed };
          this.events.unshift({ id: p.id, route: p.route, type: 'scan' });
        }
        if (p.x >= ROUTES[p.route].x) p.stage = 'branch';
      }
      if (p.stage === 'branch') p.y += left;
      if (p.y >= 220) {
        p.stage = 'done'; this.counts[p.route]++;
        this.events.unshift({ id: p.id, route: p.route, type: 'done' });
      }
    }
    this.parcels = this.parcels.filter(p => p.stage !== 'done');
    this.events.length = Math.min(this.events.length, 8);
    if (this.auto && this.feedTravel >= 88) {
      this.feedTravel %= 88;
      if (this.pending.length < 4) this.enqueue();
    }
    if (this.pending.length && !this.parcels.some(p => p.stage === 'main' && p.x < -302)) {
      const next = this.pending.shift();
      this.parcels.push({ ...next, x: -390, y: 0, stage: 'main', scanned: false });
    }
  }
  get completed() { return this.counts.reduce((a, b) => a + b, 0); }
}
