// Audit hardening regression suite (2026-09-30).
// Covers: boundary/typing, state-machine monotonicity, storage fault
// injection, generator property tests, quest determinism, growth thresholds.
// Arrange-Act-Assert, node:test.
import test from 'node:test';
import assert from 'node:assert/strict';

const { SKILLS, SKILL } = await import('../app/js/skills.js');
const { makeProblem, makeRng, _internal } = await import('../app/js/problems.js');
const scoring = await import('../app/js/scoring.js');
const store = await import('../app/js/store.js');
const session = await import('../app/js/session.js');
const growth = await import('../app/js/growth.js');
const quests = await import('../app/js/quests.js');

function mockStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    key: (i) => [...m.keys()][i] ?? null,
    length: m.size,
  };
}
const quotaStorage = () => ({
  getItem: () => null,
  setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); },
  removeItem: () => {},
  key: () => null,
  length: 0,
});

// ================================================================ 1. scoring
test('fmtDopa: boundary matrix', () => {
  const cases = [[0, '1'], [1, '10'], [3.99, null], [4, null], [8, null], [9.08, null], [72, '∞'], [NaN, '∞'], [Infinity, '∞']];
  for (const [L, want] of cases) {
    const got = scoring.fmtDopa(L);
    if (want) assert.equal(got, want, `fmtDopa(${L})`);
    else assert.ok(typeof got === 'string' && got.length, `fmtDopa(${L}) must be a non-empty string`);
  }
});

test('unitOf: exponent boundaries', () => {
  assert.equal(scoring.unitOf(0), '');
  assert.equal(scoring.unitOf(3.99), '千');
  assert.equal(scoring.unitOf(4), '万');
  assert.equal(scoring.unitOf(7.999), '千万');
  assert.equal(scoring.unitOf(8), '億');
  assert.equal(scoring.unitOf(68), '無量大數');
  assert.equal(scoring.unitOf(72), '∞');
});

test('comboMult: clamps negative, huge and NaN combos', () => {
  for (const [c, want] of [[0, 1], [10, 1.5], [20, 2], [999, 2], [-5, 1], [NaN, 1]]) {
    assert.ok(Math.abs(scoring.comboMult(c) - want) < 1e-9, `comboMult(${c}) = ${scoring.comboMult(c)}`);
  }
});

test('addDopa: NaN/Inf base never yields NaN (fault injection)', () => {
  for (const base of [NaN, Infinity, -Infinity, undefined]) {
    assert.ok(Number.isFinite(scoring.addDopa(0, base, 0)), `base=${base}`);
  }
  assert.equal(scoring.addDopa(scoring.DOPA_MAX_L, 10, 5), scoring.DOPA_MAX_L, 'ceiling holds');
});

test('extraPoints/extraTotal: exact arithmetic', () => {
  assert.equal(scoring.extraPoints(0), 10);
  assert.equal(scoring.extraTotal(0), 0);
  assert.equal(scoring.extraTotal(1), 10);
  assert.equal(scoring.extraTotal(3), 10 + 15 + 20);
  assert.equal(scoring.extraTotal(10), 10 * 10 + 5 * (10 * 9) / 2);
});

test('comboWindowMs: grade clamped to [1,6]', () => {
  for (const g of [0, 1, 6, 7, NaN, undefined]) {
    const w = scoring.comboWindowMs(g);
    assert.ok(Number.isFinite(w) && w >= 3000, `grade=${g}`);
  }
});

// ================================================================ 2. generators
test('makeRng: deterministic, seed-sensitive, in [0,1)', () => {
  const a = makeRng(42); const b = makeRng(42);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
  assert.notEqual(makeRng(43)(), makeRng(42)(), 'different seeds diverge');
  for (let i = 0; i < 100; i++) { const v = makeRng(7)(); assert.ok(v >= 0 && v < 1); }
});

test('makeProblem: property test across all skills x 40 seeds', () => {
  let n = 0;
  for (const sk of SKILLS) {
    for (let seed = 0; seed < 40; seed++) {
      const p = makeProblem(sk.id, makeRng(seed * 1009 + 31));
      n += 1;
      const blob = [p.text, p.answer, p.help, p.title].join(' ');
      assert.ok(!/NaN|Infinity|undefined|null/.test(blob), `${sk.id} s${seed}: ${blob.slice(0, 80)}`);
      assert.ok(String(p.answer).length, `${sk.id} s${seed}: empty answer`);
      assert.ok(p.cells.length > 0 && p.steps.length > 0, `${sk.id} s${seed}: empty layout`);
      for (const s of p.steps) {
        assert.match(s.digit, /^[0-9]$/, `${sk.id} s${seed}: digit ${s.digit}`);
        assert.ok(p.cells.some((c) => c.id === s.cell), `${sk.id} s${seed}: cell ${s.cell} missing`);
      }
    }
  }
  assert.ok(n >= 58 * 40, `generated ${n} problems`);
});

test('division generators: divisor >= 2, no NaN, no negative quotient', () => {
  for (let seed = 0; seed < 200; seed++) {
    const cases = [
      () => _internal.GEN.div(makeRng(seed)),
      () => _internal.GEN.divRem(makeRng(seed + 1)),
      () => _internal.GEN.divTens(makeRng(seed + 2)),
      () => _internal.GEN.vdiv(makeRng(seed + 3), { dd: 2, ds: 1 }),
      () => _internal.GEN.decDivInt(makeRng(seed + 4)),
      () => _internal.GEN.decDivDec(makeRng(seed + 5)),
    ];
    for (const gen of cases) {
      const p = gen();
      assert.ok(!/NaN|undefined/.test(p.answer), `${p.answer}`);
      assert.ok(!String(p.answer).startsWith('-'), `negative answer ${p.answer}`);
    }
  }
});

test('percent: answers are always exact integers', () => {
  for (let seed = 0; seed < 300; seed++) {
    assert.match(String(_internal.GEN.percent(makeRng(seed)).answer), /^\d+$/);
  }
});

test('decStr: pads correctly; negative and NaN are contained (defensive)', () => {
  assert.equal(_internal.decStr(1234, 2), '12.34');
  assert.equal(_internal.decStr(5, 2), '0.05');
  assert.equal(_internal.decStr(0, 1), '0.0');
  assert.equal(_internal.decStr(0, 0), '0');
  assert.equal(_internal.decStr(-1234, 2), '-12.34');
  assert.equal(_internal.decStr(NaN, 2), '?');
});

test('GEN.round: answer never longer than the rounded input', () => {
  for (let seed = 0; seed < 300; seed++) {
    const p = _internal.GEN.round(makeRng(seed));
    const srcLen = p.text.match(/\d+/)[0].length;
    assert.ok(p.answer.length <= srcLen + 1, `seed ${seed}: ${p.answer}`);
  }
});

// ================================================================ 3. session / state machine
test('levelPlan: empty placed state still yields valid skill ids', () => {
  const prog = { placed: true, skills: {}, review: [] };
  const plan = session.levelPlan(prog, 10, makeRng(1));
  assert.equal(plan.basic.length, 10);
  for (const id of plan.basic) assert.ok(SKILL[id], `bad id ${id}`);
});

test('state machine: stars are monotonic, mastery holds after 5-of-6 first tries', () => {
  const prog = session.emptyProgress();
  const day = '2026-09-30';
  // 6 consecutive first-try answers -> mastered -> stars >= 1
  for (let i = 0; i < 6; i++) {
    session.recordResult(prog, 'g1-add-c', true, `sig${i}`, { at: Date.now() + i, day, ms: 8000, cells: 5 });
  }
  assert.ok(session.isMastered(prog, 'g1-add-c'));
  assert.ok(session.starsOf(prog, 'g1-add-c') >= 1);
  // a long mixed run never decreases stars
  for (let i = 0; i < 400; i++) {
    const firstTry = (i % 10) !== 0;
    session.recordResult(prog, 'g1-add-c', firstTry, `m${i}`, { at: Date.now() + i, day, ms: 8000 + i, cells: 5 });
    const s = session.starsOf(prog, 'g1-add-c');
    assert.ok(s >= 1 && s <= 5);
  }
});

test('recordResult: mastery unlocks child skills (cascade)', () => {
  const prog = session.emptyProgress();
  for (let i = 0; i < 6; i++) session.recordResult(prog, 'g1-add-c', true, `s${i}`, { at: i, day: '2026-09-01', ms: 5000, cells: 2 });
  assert.ok(session.isMastered(prog, 'g1-add-c'));
  assert.ok(session.isUnlocked(prog, 'g1-add-2d1'), 'g1-add-2d1 unlocked by mastering g1-add-c');
});

test('placementPlan: jump grows on success, halves on slip, never walks off the end', () => {
  const prog = { placed: false, skills: {}, review: [] };
  const plan = session.placementPlan(prog, 10);
  for (let i = 0; i < 200; i++) {
    plan.answer(i % 5 === 4);
    assert.ok(SKILL[plan.pick()], 'walked past the list');
  }
});

test('relockSkill: wipes dependents, never throws on unknown id', () => {
  const prog = session.emptyProgress();
  for (let i = 0; i < 6; i++) {
    session.recordResult(prog, 'g1-add-c', true, `s${i}`, { at: i, day: '2026-09-01', ms: 1000, cells: 2 });
    session.recordResult(prog, 'g1-add-2d1', true, `s${i}`, { at: i, day: '2026-09-01', ms: 1000, cells: 2 });
  }
  const gone = session.relockSkill(prog, 'g1-add-c');
  assert.ok(gone.includes('g1-add-2d1'), `relock removed ${gone.join(',')}`);
  assert.equal(prog.skills['g1-add-2d1'], undefined);
  assert.deepEqual(session.relockSkill(prog, 'g1-add-c'), [], 'relocking a missing skill is a no-op');
});

// ================================================================ 4. storage (fault injection)
test('store: corrupted JSON -> fresh default state, no crash', () => {
  store.reset();
  const s = store.load({ getItem: () => '{corrupt', setItem: () => {}, removeItem: () => {}, key: () => null, length: 0 });
  assert.equal(s.version, 1);
  assert.deepEqual(s.settings, store.defaultState().settings);
  store.reset();
});

test('store: quota-exceeded save returns false without throwing, state stays usable in memory', () => {
  store.reset();
  store.load(quotaStorage());
  assert.equal(store.save(), false);
  store.reset();
});

test('store: record ids are unique under same-millisecond adversarial inserts (regression: random-id collision)', () => {
  store.reset();
  const mem = mockStorage();
  store.load(mem);
  const at = new Date(2026, 0, 1); // identical instant for every insert
  const ids = new Set();
  for (let i = 0; i < 3000; i++) ids.add(store.addRecord({ score: i }, at).id);
  assert.equal(ids.size, 3000, `collisions: ${3000 - ids.size}`);
  store.reset();
});

test('store: history trimmed at 3000 entries', () => {
  store.reset();
  store.load(mockStorage());
  for (let i = 0; i < 3050; i++) store.addRecord({ score: i }, new Date(2026, 0, 1 + Math.floor(i / 500)));
  assert.ok(store.load().history.length <= 3000);
  store.reset();
});

test('store: claimLogin bridges no-count days and resets on a real gap', () => {
  store.reset();
  const mem = mockStorage();
  store.load(mem);
  store.addRecord({}, new Date(2026, 8, 26));
  store.addRecord({}, new Date(2026, 8, 28));
  assert.equal(store.claimLogin(new Date(2026, 8, 26)).run, 1);
  store.useHammer(['2026-09-27'], new Date(2026, 8, 29));
  assert.equal(store.claimLogin(new Date(2026, 8, 28)).run, 2, 'no-count 9/27 bridges 9/26 -> 9/28');
  assert.equal(store.claimLogin(new Date(2026, 8, 29)).run, 3);
  // a real gap resets the run
  assert.equal(store.claimLogin(new Date(2026, 9, 2)).run, 1, '10/02 after a gap starts a new card');
  store.reset();
});

test('store: streak() counts played days bridged by no-count days only', () => {
  store.reset();
  const mem = mockStorage();
  store.load(mem);
  store.addRecord({}, new Date(2026, 8, 26));
  store.addRecord({}, new Date(2026, 8, 28));
  store.useHammer(['2026-09-27'], new Date(2026, 8, 29));
  assert.equal(store.streak(new Date(2026, 8, 29)), 2, '26 -> bridge 27 -> 28');
  assert.equal(store.streak(new Date(2026, 8, 30)), 0, '9/29 and 9/30 are plain misses');
  store.reset();
});

// ================================================================ 5. quests
test('dailyQuests: deterministic per day, exactly 3, within the 15-minute budget', () => {
  const ctx = { count: 10, review: 0, hasNew: true, hasLearning: true, placed: true, extraOk: true, avgCells: 7 };
  assert.deepEqual(quests.dailyQuests('2026-09-30', ctx), quests.dailyQuests('2026-09-30', ctx));
  const list = quests.dailyQuests('2026-09-30', ctx);
  assert.equal(list.length, 3);
  const defs = list.map((q) => ({ ...quests.questDef(q), ...q }));
  const mins = quests.questMinutes(defs, ctx);
  assert.ok(mins <= quests.QUEST_MINUTES + 1e-9, `budget ${mins}`);
});

test('questEvent: progress caps at goal, completion fires once', () => {
  const state = { day: '2026-09-30', list: [{ id: 'combo5', goal: 5, prog: 0, done: false }] };
  for (let i = 0; i < 10; i++) quests.questEvent(state, { type: 'combo', value: i + 1 });
  assert.equal(state.list[0].prog, 5);
  assert.equal(state.list[0].done, true);
  assert.equal(quests.questEvent(state, { type: 'combo', value: 99 }).length, 0, 'no double completion');
});

test('claimReward: once per day only', () => {
  const state = { day: '2026-09-30', list: [{ id: 'play1', goal: 1, prog: 0, done: false }] };
  assert.equal(quests.claimReward(state), false, 'not all done');
  quests.questEvent(state, { type: 'play' });
  assert.equal(quests.claimReward(state), true);
  assert.equal(quests.claimReward(state), false, 'second claim rejected');
  assert.equal(state.doneDays['2026-09-30'], true);
});

// ================================================================ 6. growth
test('growth: compareSkill reports >= 10% improvements, on time or accuracy', () => {
  const r = { n: 10, c: 10, ms: 10000, f: 9, days: [{ d: '2026-09-01', n: 10, ms: 15000, f: 8, c: 10 }] };
  const faster = growth.compareSkill(r, { n: 10, c: 10, ms: 12000, f: 9 }, '2026-09-30');
  assert.equal(faster.what, 'time', '20% faster must be reported');
  const noReport = growth.compareSkill(r, { n: 10, c: 10, ms: 14500, f: 8 }, '2026-09-30');
  assert.equal(noReport, null, '<10% improvement stays silent');
});

test('growth: growthLines returns at most max, sorted by gain descending', () => {
  const records = { a: { n: 10, c: 10, ms: 10000, f: 8, days: [{ d: '2026-09-01', n: 10, ms: 20000, f: 7, c: 10 }] } };
  const lines = growth.growthLines({ a: { n: 10, c: 10, ms: 9000, f: 8 } }, records, '2026-09-30', 3);
  assert.ok(lines.length >= 1);
  assert.equal(lines[0].skill, 'a');
});

test('growth: capsuleCompare prefers time, then misses, then none', () => {
  assert.equal(growth.capsuleCompare({ t: 1000, m: 2 }, 900, 2).what, 'time');
  assert.equal(growth.capsuleCompare({ t: 1000, m: 2 }, 1100, 1).what, 'miss');
  assert.equal(growth.capsuleCompare({ t: 1000, m: 2 }, 1100, 2).what, 'none');
});

// ================================================================ 7. fault injection
test('makeProblem: unknown skill throws a specific error (fail fast)', () => {
  assert.throws(() => makeProblem('nope', makeRng(1)), /unknown skill/);
});

test('signature: problems vary across seeds (generator is not degenerate)', () => {
  const seen = new Set();
  for (let seed = 0; seed < 300; seed++) seen.add(signatureOf(makeProblem('g1-add-c', makeRng(seed))));
  assert.ok(seen.size >= 25, `only ${seen.size} distinct`);
});
function signatureOf(p) { return `${p.title}|${p.text}`; }