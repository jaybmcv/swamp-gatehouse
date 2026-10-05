import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { describe, test } from 'node:test';

const fullPath = 'examples/swamp-full-course-host-walk.html';
const fullHtml = fs.readFileSync(fullPath, 'utf8');
const course = JSON.parse(fullHtml.match(/var COURSE=(\{[^\n]+\});/)[1]);
const targets = [
  { name: 'shared source', html: fullHtml,
    script: `var COURSE=${JSON.stringify(course)};\n${fs.readFileSync('scripts/swamp-course.js', 'utf8')}` },
  ...[fullPath, 'examples/swamp-full-course-host-walk-preview.html',
    'examples/swamp-full-course-compact.html'].map(path => {
    const html = fs.readFileSync(path, 'utf8');
    return { name: path, html, script: html.match(/<script>([\s\S]*?)<\/script>/)[1] };
  }),
];

// Deliberately deliver ticks at explicit times rather than running real timers.
// This models a delayed callback deterministically; it does not simulate avatar physics.
function runtime(target) {
  const start = 1000;
  let time = start;
  const nodes = new Map();
  const writes = [];
  const intervals = [];
  function node(type) {
    return {
      type, attrs: {}, events: {},
      setAttribute(key, value) {
        const text = String(value);
        this.attrs[key] = text;
        if (key === 'id') nodes.set(text, this);
        writes.push({ id: this.attrs.id, key, value: text, time });
      },
      addEventListener(key, callback) { this.events[key] = callback; },
      appendChild() {},
    };
  }
  for (const match of target.html.split('<script>')[0].matchAll(/<([\w-]+)([^>]*)>/g)) {
    const element = node(match[1]);
    for (const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) {
      element.setAttribute(attr[1], attr[2]);
    }
  }
  const math = Object.create(Math);
  math.random = () => 0.5;
  const ctx = vm.createContext({
    document: { createElement: node, documentElement: node('root'),
      getElementById: id => nodes.get(id) },
    Date: { now: () => time }, Math: math,
    setInterval: (callback, delay) => intervals.push({ callback, delay }),
  });
  vm.runInContext(target.script, ctx, { filename: target.name });
  const timer = intervals.find(interval => interval.delay === 5);
  assert.ok(timer, 'motion timer is registered');
  writes.length = 0;
  return {
    ctx, nodes, writes, intervals,
    tick(elapsed) {
      assert.ok(start + elapsed >= time, 'test clock must be monotonic');
      time = start + elapsed;
      timer.callback();
      assert.equal(ctx.lastError, '', 'the timer must not swallow a runtime error');
    },
    touch(door) { nodes.get(`${door.id}-pad`).events.collisionstart(); },
  };
}

function collisionStates(rt, door) {
  return [door.id, `${door.id}-pad`].map(id => rt.nodes.get(id).attrs.collide);
}

for (const target of targets) describe(target.name, () => {
  test('80 doors and contact-driven midpoint motion', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => !d.safe);
    assert.equal(rt.ctx.doors.length, 80);
    assert.equal(rt.intervals.length, 2);
    rt.touch(door);
    rt.tick(175);
    assert.equal(Number(rt.nodes.get(door.id).attrs.y), 3.75);
    assert.equal(Number(rt.nodes.get(door.id).attrs.z), door.z - 0.75 + 4.5);
    assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
  });

  test('on-time ticks release both colliders at 290ms and restore at 410ms', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => !d.safe);
    rt.touch(door);
    for (const [elapsed, solid] of [[289, true], [290, false], [350, false],
      [409, false], [410, true], [700, true]]) {
      rt.tick(elapsed);
      assert.deepEqual(collisionStates(rt, door), [String(solid), String(solid)],
        `wall and riser collision at ${elapsed}ms`);
    }
    assert.equal(Number(rt.nodes.get(door.id).attrs.y), 1.75);
    assert.equal(Number(rt.nodes.get(`${door.id}-pad`).attrs.y), 0);
  });

  test('release writes precede motion and restoration follows motion', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => !d.safe);
    rt.touch(door);
    for (const [elapsed, solid] of [[290, false], [410, true]]) {
      rt.writes.length = 0;
      rt.tick(elapsed);
      for (const id of [door.id, `${door.id}-pad`]) {
        const collision = rt.writes.findIndex(w => w.id === id && w.key === 'collide'
          && w.value === String(solid));
        const movement = rt.writes.findIndex(w => w.id === id && (w.key === 'y' || w.key === 'z'));
        assert.ok(collision >= 0 && movement >= 0, `${id}: collision and motion were written`);
        assert.ok(solid ? collision > movement : collision < movement,
          `${id}: correct collision write ordering at ${elapsed}ms`);
      }
    }
  });

  test('wrong-door cooldown rejects repeat contact then permits another launch', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => !d.safe);
    rt.touch(door);
    rt.tick(290);
    rt.tick(410);
    rt.tick(1699);
    rt.touch(door);
    assert.equal(rt.ctx.launches, 1);
    rt.tick(1700);
    assert.equal(door.start, null);
    rt.touch(door);
    assert.equal(rt.ctx.launches, 2);
  });

  // Required recovery: if every callback in [290, 410) is missed, release
  // both colliders before the first observed return movement.
  for (const schedule of [[280, 420], [289, 410], [280, 699], [420]]) {
    test(`missed release window recovers on ticks ${schedule.join(' → ')}ms`, () => {
      const rt = runtime(target);
      const door = rt.ctx.doors.find(d => !d.safe);
      rt.touch(door);
      const resumedAt = schedule.at(-1);
      for (const elapsed of schedule) rt.tick(elapsed);
      const colliderIds = [door.id, `${door.id}-pad`];
      assert.deepEqual(collisionStates(rt, door), ['false', 'false'],
        `both colliders must be released on the resumed ${resumedAt}ms callback`);
      // Symmetric samples (280/420ms) have equal positions, so cached writes
      // can omit movement until the next tick. Check the first actual return write.
      rt.tick(699);
      assert.deepEqual(collisionStates(rt, door), ['false', 'false'], 'stay released through return');
      for (const id of colliderIds) {
        const release = rt.writes.findIndex(w => w.id === id && w.key === 'collide' && w.value === 'false');
        const movement = rt.writes.findIndex(w => w.id === id && w.time >= 1000 + resumedAt
          && (w.key === 'y' || w.key === 'z'));
        assert.ok(release >= 0 && movement > release, `${id}: release must precede resumed movement`);
      }
      rt.tick(700);
      assert.deepEqual(collisionStates(rt, door), ['true', 'true'], 'restore after reaching home');
      rt.tick(1700);
      assert.equal(door.start, null, 'cooldown still completes');
    });
  }
  for (const elapsed of [700, 701, 1700, 10000]) {
    test(`callback resuming at ${elapsed}ms returns home without a late launch`, () => {
      const rt = runtime(target);
      const door = rt.ctx.doors.find(d => !d.safe);
      rt.touch(door);
      rt.tick(280);
      rt.writes.length = 0;
      rt.tick(elapsed);
      assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
      const ids = [door.id, `${door.id}-pad`];
      const home = [[1.75, door.z - 0.75], [0, door.z + 2.2]];
      const motion = rt.writes.filter(w => ids.includes(w.id) && ['y', 'z'].includes(w.key));
      assert.equal(motion.length, 4, 'each collider returns directly home');
      for (const [index, id] of ids.entries()) {
        assert.deepEqual(['y', 'z'].map(key => Number(rt.nodes.get(id).attrs[key])), home[index]);
        assert.deepEqual(rt.writes.filter(w => w.id === id && w.key === 'collide')
          .map(w => w.value), ['false', 'true'], 'release then restore in the resumed tick');
      }
      const firstMovement = rt.writes.findIndex(w => motion.includes(w));
      const lastMovement = rt.writes.findLastIndex(w => motion.includes(w));
      for (const id of ids) {
        assert.ok(rt.writes.findIndex(w => w.id === id && w.key === 'collide' && w.value === 'false')
          < firstMovement, 'both colliders release before either moves');
        assert.ok(rt.writes.findIndex(w => w.id === id && w.key === 'collide' && w.value === 'true')
          > lastMovement, 'restore only after both are home');
      }
      assert.equal(rt.ctx.launches, 1);
      if (elapsed >= 1700) assert.equal(door.start, null);
      rt.writes.length = 0;
      rt.tick(elapsed + 1);
      assert.equal(rt.writes.filter(w => ids.includes(w.id)).length, 0, 'no deferred launch or collision flicker');
    });
  }

  test('normal and delayed repeated launches do not leak release state', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => !d.safe);
    for (const [index, delayed] of [false, true, true, false].entries()) {
      const offset = index * 1700;
      rt.touch(door);
      rt.tick(offset + 280);
      assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
      if (!delayed) rt.tick(offset + 290);
      rt.tick(offset + 420);
      assert.deepEqual(collisionStates(rt, door), delayed ? ['false', 'false'] : ['true', 'true']);
      rt.tick(offset + 699);
      assert.deepEqual(collisionStates(rt, door), delayed ? ['false', 'false'] : ['true', 'true']);
      rt.tick(offset + 700);
      assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
      rt.tick(offset + 1700);
      assert.equal(door.start, null);
    }
    assert.equal(rt.ctx.launches, 4);
  });

  test('reset during recovery clears state before a new round', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => !d.safe);
    rt.touch(door);
    rt.tick(420);
    assert.deepEqual(collisionStates(rt, door), ['false', 'false']);
    rt.nodes.get('reset-auth').events.prompt({ detail: { value: 'demo-reset' } });
    rt.tick(10420);
    assert.equal(rt.ctx.round, 2);
    assert.equal(door.start, null);
    assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
    assert.equal(door.released, false);
    assert.equal(door.recoverRelease, false);
    rt.touch(door);
    rt.tick(10700);
    assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
    rt.tick(10840);
    assert.deepEqual(collisionStates(rt, door), ['false', 'false'], 'new launch can recover again');
    rt.tick(11120);
    assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
  });

  test('safe-door opening and closing remain unchanged', () => {
    const rt = runtime(target);
    const door = rt.ctx.doors.find(d => d.safe);
    rt.touch(door);
    for (const elapsed of [420, 600, 1800, 2399]) {
      rt.tick(elapsed);
      assert.deepEqual(collisionStates(rt, door), ['false', 'true']);
    }
    rt.tick(2400);
    assert.deepEqual(collisionStates(rt, door), ['true', 'true']);
    assert.equal(Number(rt.nodes.get(door.id).attrs.y), 1.75);
    rt.tick(3400);
    assert.equal(door.start, null);
    assert.equal(door.open, false);
  });

});


test('all bundled scenes embed the exact shared runtime', () => {
  const source = fs.readFileSync('scripts/swamp-course.js', 'utf8').trim();
  for (const target of targets.slice(1)) {
    assert.ok(target.script.includes(source), `${target.name}: rebuild when the source changes`);
  }
});
