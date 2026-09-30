// Trophies (id036): many small achievements, like the ones in mobile games.
// Each series is one measure with rising steps; every step is a trophy.
// Days and streaks get dense steps; volume series get wide ones so long
// sessions are not pushed too hard (docs/SPEC.md 14.7). Nothing is
// random, conditions are always shown (except a few secrets), and a trophy,
// once earned, is kept.
import { SKILLS, LANES } from './skills.js';
import { isUnlocked, isMastered, starsOf } from './session.js';

export const CATS = ['堅持', '累積', '技能', '成長', '加碼關', '連擊', '精準', '多巴', '複習', '年級', '收藏', '秘密'];

const fmt = (n) => (n >= 10000 && n % 10000 === 0 ? `${n / 10000}万` : n.toLocaleString('zh-Hant-TW'));
const DOPA_LABEL = { 2: '100', 3: '1000', 4: '1万', 5: '10万', 6: '100万', 7: '1000万', 8: '1億', 9: '10億' };
const RANKS = ['bronze', 'silver', 'gold', 'rainbow'];
export const RANK_NAME = { bronze: '銅', silver: '銀', gold: '金', rainbow: '彩虹', secret: '秘密' };

// Rank by position in its series: first ~30% bronze, then silver, gold, and the last step rainbow.
function rankAt(i, n) {
  if (n === 1) return 'gold';
  if (i === n - 1) return 'rainbow';
  return RANKS[Math.min(2, Math.floor((i / (n - 1)) * 3.3))];
}

// A series: { key, cat, title, metric, steps, name(v), desc(v) } or explicit items.
const SERIES_DEFS = [
  { key: 'streak', cat: '堅持', title: '連續遊玩', metric: 'bestStreak', steps: [3, 5, 7, 10, 14, 21, 30, 50, 75, 100, 150, 200, 365], name: (v) => `連續 ${v} 天`, desc: (v) => `連續 ${v} 天都玩` },
  { key: 'days', cat: '堅持', title: '玩過的天數', steps: [1, 3, 5, 7, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 365, 500, 730, 1000], name: (v) => `玩過 ${fmt(v)} 天`, desc: (v) => `總共玩過 ${fmt(v)} 天` },
  { key: 'stickers', cat: '堅持', title: '簽到貼紙', metric: 'stickers', steps: [1, 7, 14, 30, 50, 100, 200, 365], name: (v) => `貼紙 ${v} 張`, desc: (v) => `收集 ${v} 張簽到貼紙` },
  { key: 'crowns', cat: '堅持', title: '皇冠貼紙', metric: 'crowns', steps: [1, 3, 5, 10, 20, 52], name: (v) => `皇冠 ${v} 個`, desc: (v) => `收集 ${v} 張第 7 天的皇冠貼紙` },
  { key: 'problems', cat: '累積', title: '解過的題目', metric: 'problems', steps: [10, 30, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 20000, 30000, 50000, 100000], name: (v) => `解了 ${fmt(v)} 題`, desc: (v) => `總共解了 ${fmt(v)} 題` },
  { key: 'cells', cat: '累積', title: '輸入的數字', metric: 'cells', steps: [100, 500, 1000, 3000, 5000, 10000, 30000, 50000, 100000, 300000], name: (v) => `輸入 ${fmt(v)} 個數字`, desc: (v) => `總共輸入 ${fmt(v)} 個正確的數字` },
  { key: 'plays', cat: '累積', title: '遊玩次數', metric: 'plays', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000], name: (v) => `玩了 ${fmt(v)} 次`, desc: (v) => `把練習簿整份做完 ${fmt(v)} 次` },
  { key: 'minutes', cat: '累積', title: '遊玩時間', metric: 'minutes', steps: [10, 30, 60, 120, 300, 600, 1200, 3000], name: (v) => (v >= 60 ? `合計 ${v / 60} 小時` : `合計 ${v} 分鐘`), desc: (v) => `總遊玩時間 ${v >= 60 ? `${v / 60} 小時` : `${v} 分鐘`}` },
  { key: 'unlocked', cat: '技能', title: '解鎖技能', metric: 'unlocked', steps: [3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58], name: (v) => `解鎖 ${v} 個`, desc: (v) => `解鎖 ${v} 個技能` },
  { key: 'mastered', cat: '技能', title: '精通技能', metric: 'mastered', steps: [1, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58], name: (v) => `精通 ${v} 個`, desc: (v) => `精通 ${v} 個技能` },
  { key: 'gradeDone', cat: '技能', title: '年級全部精通', items: [1, 2, 3, 4, 5, 6].map((g) => ({ id: `gradeDone-${g}`, metric: `gradeDone${g}`, need: 1, name: `${g} 年級全部精通`, desc: `精通 ${g} 年級的所有技能` })) },
  { key: 'laneDone', cat: '技能', title: '系統全部精通', items: LANES.map((l, i) => ({ id: `laneDone-${i}`, metric: `laneDone${i}`, need: 1, name: `${l} 精通`, desc: `精通「${l}」的所有技能` })) },
  { key: 'extras', cat: '加碼關', title: '進入加碼關', metric: 'extras', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300], name: (v) => `加碼關 ${v} 次`, desc: (v) => `進入加碼關 ${v} 次` },
  { key: 'extraBest', cat: '加碼關', title: '加碼關單次最佳', metric: 'extraBest', steps: [3, 5, 7, 10, 12, 15, 18, 20, 23, 25, 30], name: (v) => `單次 ${v} 題`, desc: (v) => `單次在加碼關解 ${v} 題` },
  { key: 'extraSolved', cat: '加碼關', title: '加碼關解過的題', metric: 'extraSolved', steps: [10, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000], name: (v) => `加碼關 ${fmt(v)} 題`, desc: (v) => `在加碼關總共解 ${fmt(v)} 題` },
  { key: 'combo', cat: '連擊', title: '連擊', metric: 'maxCombo', steps: [5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300], name: (v) => `${v}連擊`, desc: (v) => `達成 ${v} 連擊` },
  { key: 'perfects', cat: '精準', title: '零失誤完成', metric: 'perfects', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300], name: (v) => `零失誤 ${v} 次`, desc: (v) => `首次答對率 100% 完成 ${v} 次` },
  { key: 'firstTry', cat: '精準', title: '首次答對', metric: 'firstTry', steps: [10, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 30000], name: (v) => `首次答對 ${fmt(v)} 題`, desc: (v) => `一次就答對 ${fmt(v)} 題` },
  { key: 'dopa', cat: '多巴', title: '多巴', metric: 'bestDopaL', steps: [2, 3, 4, 5, 6, 7, 8, 9], name: (v) => `${DOPA_LABEL[v]}多巴`, desc: (v) => `單次遊玩的多巴倍率超過 ${DOPA_LABEL[v]}` },
  { key: 'review', cat: '複習', title: '複習', metric: 'reviewSolved', steps: [1, 5, 10, 30, 50, 100, 200, 300], name: (v) => `複習 ${v} 題`, desc: (v) => `重做 ${v} 題答錯的題目` },
  ...[1, 2, 3, 4, 5, 6].map((g) => ({ key: `grade${g}`, cat: '年級', title: `${g}年級遊玩`, metric: `gradePlays${g}`, steps: [1, 10, 30], name: (v) => `${g} 年級 ${v} 次`, desc: (v) => `用「${g} 年級」玩 ${v} 次` })),
  { key: 'secret', cat: '秘密', title: '秘密', items: [
    { id: 'secret-perfect14', metric: 'flag:perfect14', need: 1, name: '14題 滿分', desc: '14 題全對、零失誤', secret: true },
    { id: 'secret-extraClean', metric: 'flag:extraClean', need: 1, name: '加碼關零失誤', desc: '在加碼關解 5 題以上、零失誤', secret: true },
    { id: 'secret-sunday', metric: 'flag:sunday', need: 1, name: '星期天的數學', desc: '在星期天玩', secret: true },
    { id: 'secret-newyear', metric: 'flag:newyear', need: 1, name: '新年的練習簿', desc: '在 1 月 1 日遊玩', secret: true },
    { id: 'secret-comeback', metric: 'flag:comeback', need: 1, name: '歡迎回來！', desc: '超過 1 星期沒玩之後又回來玩', secret: true },
    { id: 'secret-allmodes', metric: 'allModes', need: 1, name: '全部玩法', desc: '四種玩法都玩過（我的程度、年級、練習、複習）', secret: true },
  ] },
];

// Other features add their own series (id045). Keep this list append-only.
export const SERIES = [];
export const TROPHIES = [];
export const TROPHY = {};
export function addSeries(def) {
  const items = def.items
    ? def.items.map((it, i, a) => ({ rank: it.secret ? 'secret' : rankAt(i, a.length), ...it }))
    : def.steps.map((v, i, a) => ({ id: `${def.key}-${v}`, metric: def.metric, need: v, name: def.name(v), desc: def.desc(v), rank: rankAt(i, a.length) }));
  const series = { key: def.key, cat: def.cat, title: def.title, items: items.map((it) => ({ ...it, series: def.key, cat: def.cat, reward: it.reward || null })) };
  SERIES.push(series);
  for (const it of series.items) { TROPHIES.push(it); TROPHY[it.id] = it; }
  return series;
}
SERIES_DEFS.forEach(addSeries);

// id045: the features added after id036 (stars, quests, hammer, rust,
// time capsule, "進步了", collection).
[
  { key: 'questDays', cat: '堅持', title: '任務全部完成', metric: 'questDays', steps: [1, 3, 7, 14, 30, 50, 100, 200, 365], name: (v) => `全部完成 ${v} 天`, desc: (v) => `完成當天全部任務的天數 ${v} 天` },
  { key: 'questRun', cat: '堅持', title: '任務連續', metric: 'questRun', steps: [2, 3, 5, 7, 14, 30], name: (v) => `連續 ${v} 天完成任務`, desc: (v) => `連續 ${v} 天完成全部任務` },
  { key: 'hammer', cat: '堅持', title: '免計鐵鎚', metric: 'hammerUsed', steps: [1, 3, 10], name: (v) => (v === 1 ? '第一次的 免計' : `免計 ${v} 次`), desc: (v) => `使用 ${v} 次免計鐵鎚` },
  { key: 'starsTotal', cat: '技能', title: '星星的 數量', metric: 'starsTotal', steps: [5, 10, 25, 50, 75, 100, 150, 200, 250, 290], name: (v) => `星星 ${v} 顆`, desc: (v) => `總共收集 ${v} 顆技能星星` },
  { key: 'star5', cat: '技能', title: '☆5 的技能', metric: 'star5', steps: [1, 3, 5, 10, 20, 30, 58], name: (v) => `☆5 ${v} 個`, desc: (v) => `做出 ${v} 個 ☆5 技能` },
  { key: 'gradeStar3', cat: '技能', title: '年級全部 ☆3', items: [1, 2, 3, 4, 5, 6].map((g) => ({ id: `gradeStar3-${g}`, metric: `gradeStar3${g}`, need: 1, name: `${g} 年級全部 ☆3`, desc: `把 ${g} 年級的技能全部升到 ☆3 以上` })) },
  { key: 'polished', cat: '成長', title: '磨掉生鏽', metric: 'polished', steps: [1, 3, 5, 10, 30, 50], name: (v) => `閃亮亮 ${v} 次`, desc: (v) => `打磨 ${v} 次生鏽的技能` },
  { key: 'capsules', cat: '成長', title: '時光膠囊', metric: 'capsules', steps: [1, 3, 5, 10, 30], name: (v) => `膠囊 ${v} 個`, desc: (v) => `打開 ${v} 個時光膠囊` },
  { key: 'capsuleFaster', cat: '成長', title: '比那天更快', metric: 'capsuleFaster', steps: [1, 5, 10], name: (v) => `比那天更快 ${v} 次`, desc: (v) => `用時光膠囊比那天更快解出（${v} 次）` },
  { key: 'grew', cat: '成長', title: '進步了！', metric: 'grew', steps: [1, 5, 10, 30, 50, 100], name: (v) => `進步 ${v} 次`, desc: (v) => `結果出現 ${v} 次「進步了！」` },
  { key: 'items', cat: '收藏', title: '收藏', metric: 'itemsOwned', steps: [10, 20, 30, 40, 47], name: (v) => `收藏 ${v} 個`, desc: (v) => `收集 ${v} 個收藏品` },
  { key: 'catComplete', cat: '收藏', title: '全部 集滿', metric: 'catComplete', steps: [1, 3, 5, 8], name: (v) => `${v}種類 全部完成`, desc: (v) => `收藏的 ${v}種類 全部 集滿` },
].forEach(addSeries);

// Numbers every trophy is measured against, from the saved state.
// snap: { stats, prog, bestStreak, stickers, crowns, ...extra metrics }
export function trophyMetrics(snap) {
  const s = snap.stats || {};
  const prog = snap.prog || { skills: {} };
  const m = {
    bestStreak: snap.bestStreak || 0, days: s.days || 0, stickers: snap.stickers || 0, crowns: snap.crowns || 0,
    problems: s.problems || 0, cells: s.cells || 0, plays: s.plays || 0, minutes: Math.floor((s.playMs || 0) / 60000),
    unlocked: SKILLS.filter((x) => isUnlocked(prog, x.id)).length, mastered: SKILLS.filter((x) => isMastered(prog, x.id)).length,
    extras: s.extras || 0, extraBest: s.extraBest || 0, extraSolved: s.extraSolved || 0, maxCombo: s.maxCombo || 0,
    perfects: s.perfects || 0, firstTry: s.firstTry || 0, bestDopaL: Math.floor((s.bestDopaL || 0) + 1e-9), reviewSolved: s.reviewSolved || 0,
  };
  const stars = Object.fromEntries(SKILLS.map((x) => [x.id, starsOf(prog, x.id)]));
  m.starsTotal = Object.values(stars).reduce((a, b) => a + b, 0);
  m.star5 = Object.values(stars).filter((n) => n >= 5).length;
  m.polished = s.polished || 0; m.capsules = s.capsules || 0; m.capsuleFaster = s.capsuleFaster || 0; m.grew = s.grew || 0;
  for (let g = 1; g <= 6; g++) {
    m[`gradeStar3${g}`] = SKILLS.filter((x) => x.grade === g).every((x) => stars[x.id] >= 3) ? 1 : 0;
    m[`gradeDone${g}`] = SKILLS.filter((x) => x.grade === g).every((x) => isMastered(prog, x.id)) ? 1 : 0;
    m[`gradePlays${g}`] = (s.grades || {})[g] || 0;
  }
  LANES.forEach((_, i) => { m[`laneDone${i}`] = SKILLS.filter((x) => x.lane === i).every((x) => isMastered(prog, x.id)) ? 1 : 0; });
  for (const [k, v] of Object.entries(s.flags || {})) if (v) m[`flag:${k}`] = 1;
  const modes = s.modes || {};
  m.allModes = ['level', 'grade', 'practice', 'review'].every((k) => modes[k]) ? 1 : 0;
  Object.assign(m, snap.extra || {});
  return m;
}
export const valueOf = (m, metric) => m[metric] || 0;

// Earn every trophy whose condition is met. Returns the new ones (in list order).
// `state` is the saved { got: { id: time } }; the first call earns what the
// existing records already reach and marks them as a batch.
export function evaluate(state, metrics, at = Date.now()) {
  state.got = state.got || {};
  const fresh = [];
  for (const t of TROPHIES) {
    if (state.got[t.id]) continue;
    if (valueOf(metrics, t.metric) >= t.need) { state.got[t.id] = at; fresh.push(t); }
  }
  if (!state.init) { state.init = true; state.batch = fresh.map((t) => t.id); return []; }
  return fresh;
}

export const earnedCount = (state) => TROPHIES.filter((t) => state.got && state.got[t.id]).length;

// Progress of one series for the list screen.
export function seriesView(series, state, metrics) {
  const got = series.items.filter((t) => state.got && state.got[t.id]);
  const next = series.items.find((t) => !(state.got && state.got[t.id]));
  const top = got[got.length - 1] || null;
  return { series, got, next, top, value: next ? valueOf(metrics, next.metric) : null };
}
