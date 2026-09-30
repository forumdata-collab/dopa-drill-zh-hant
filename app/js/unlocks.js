// Unlockable show (id041): backgrounds, correct marks, particles, music,
// Dopakichi's costume and colour, the crowd and the finale. Each item is the
// reward of one trophy (never random), so what is unlocked follows from the
// trophies earned; only the player's choice per category is saved.
import { TROPHY } from './trophies.js';

export const CATS = [
  { key: 'bg', name: '背景' },
  { key: 'mark', name: '答對標記' },
  { key: 'particle', name: '紙吹雪' },
  { key: 'music', name: '音樂' },
  { key: 'costume', name: '換裝' },
  { key: 'color', name: '多巴基的顏色' },
  { key: 'crowd', name: '觀眾' },
  { key: 'finale', name: '壓軸' },
];

// base: available from the start. trophy: the trophy whose reward it is.
export const ITEMS = [];
export const ITEM = {};
export function addItems(list) {
  for (const it of list) {
    ITEMS.push(it); ITEM[it.id] = it;
    if (it.trophy && TROPHY[it.trophy]) TROPHY[it.trophy].reward = it.id;
  }
}
addItems([
  { id: 'bg:classic', cat: 'bg', name: '放射線', base: true },
  { id: 'mark:hanamaru', cat: 'mark', name: '小紅花', base: true },
  { id: 'particle:classic', cat: 'particle', name: '紙吹雪', base: true },
  { id: 'music:classic', cat: 'music', name: '馬林巴 進行曲', base: true },
  { id: 'costume:none', cat: 'costume', name: '無', base: true },
  { id: 'color:pink', cat: 'color', name: '粉紅', base: true },
  { id: 'crowd:classic', cat: 'crowd', name: '換色', base: true },
  { id: 'finale:classic', cat: 'finale', name: '巨大 多巴基', base: true },
]);
// id041: one sample per category, to prove the pipeline end to end.
// Rewards follow effort and coming back (plays, days, streaks, stars earned by
// practice), not the placement check, which can master many skills at once.
addItems([
  { id: 'costume:cap', cat: 'costume', name: '帽子', trophy: 'days-1' },
  { id: 'particle:note', cat: 'particle', name: '音符', trophy: 'days-3' },
  { id: 'mark:stamp', cat: 'mark', name: '答對印章', trophy: 'plays-3' },
  { id: 'bg:night', cat: 'bg', name: '夜空', trophy: 'streak-3' },
  { id: 'color:blue', cat: 'color', name: '藍色', trophy: 'plays-5' },
  { id: 'finale:fireworks', cat: 'finale', name: '煙火大會', trophy: 'extras-5' },
  { id: 'music:chip', cat: 'music', name: '8位元', trophy: 'plays-10' },
  { id: 'crowd:costume', cat: 'crowd', name: '換裝 觀眾', trophy: 'firstTry-50' },
]);
// id042: backgrounds, correct marks and particles.
addItems([
  { id: 'bg:sea', cat: 'bg', name: '海洋與 泡泡', trophy: 'problems-100' },
  { id: 'bg:festival', cat: 'bg', name: '祭典', trophy: 'days-15' },
  { id: 'bg:paper', cat: 'bg', name: '紙做的 工藝', trophy: 'problems-200' },
  { id: 'bg:space', cat: 'bg', name: '宇宙', trophy: 'extras-10' },
  { id: 'mark:medal', cat: 'mark', name: '獎牌', trophy: 'streak-7' },
  { id: 'mark:crown', cat: 'mark', name: '皇冠', trophy: 'perfects-3' },
  { id: 'mark:ring', cat: 'mark', name: '煙火圈', trophy: 'combo-30' },
  { id: 'particle:petal', cat: 'particle', name: '花瓣', trophy: 'stickers-7' },
  { id: 'particle:digit', cat: 'particle', name: '數字', trophy: 'cells-1000' },
  { id: 'particle:bubble', cat: 'particle', name: '泡泡', trophy: 'review-10' },
  { id: 'particle:candy', cat: 'particle', name: '糖果', trophy: 'extraBest-10' },
]);
// id043: songs (8位元 is the id041 sample).
addItems([
  { id: 'music:matsuri', cat: 'music', name: '祭典 伴奏', trophy: 'streak-5' },
  { id: 'music:brass', cat: 'music', name: '銅管樂', trophy: 'days-5' },
  { id: 'music:electro', cat: 'music', name: '電子樂', trophy: 'extras-3' },
]);
// id044: costumes, colours, crowd and finales (id045 moved three rewards to the new series).
addItems([
  { id: 'costume:hachimaki', cat: 'costume', name: '頭巾', trophy: 'problems-50' },
  { id: 'costume:cape', cat: 'costume', name: '披風', trophy: 'combo-20' },
  { id: 'costume:glasses', cat: 'costume', name: '圓眼鏡', trophy: 'firstTry-100' },
  { id: 'costume:ribbon', cat: 'costume', name: '蝴蝶結', trophy: 'stickers-14' },
  { id: 'costume:crown', cat: 'costume', name: '皇冠', trophy: 'streak-14' },
  { id: 'costume:wizard', cat: 'costume', name: '魔法的 帽子', trophy: 'star5-1' },
  { id: 'costume:headphones', cat: 'costume', name: '耳機', trophy: 'capsules-1' },
  { id: 'color:mint', cat: 'color', name: '綠色', trophy: 'days-7' },
  { id: 'color:snow', cat: 'color', name: '雪白', trophy: 'questDays-7' },
  { id: 'color:yellow', cat: 'color', name: '黃色', trophy: 'problems-300' },
  { id: 'color:violet', cat: 'color', name: '紫色', trophy: 'extraSolved-100' },
  { id: 'color:gold', cat: 'color', name: '金色', trophy: 'streak-30' },
  { id: 'color:rainbow', cat: 'color', name: '彩虹', trophy: 'days-100' },
  { id: 'crowd:rainbow', cat: 'crowd', name: '彩虹 觀眾', trophy: 'days-30' },
  { id: 'crowd:twins', cat: 'crowd', name: '同款 觀眾', trophy: 'starsTotal-100' },
  { id: 'finale:parade', cat: 'finale', name: '遊行', trophy: 'streak-10' },
  { id: 'finale:rocket', cat: 'finale', name: '火箭', trophy: 'extras-20' },
]);

export const isUnlocked = (it, got = {}) => !!(it && (it.base || (it.trophy && got[it.trophy])));
export const unlockedIn = (cat, got) => ITEMS.filter((it) => it.cat === cat && isUnlocked(it, got));
export const defaultEquip = () => Object.fromEntries(CATS.map((c) => [c.key, 'auto']));

// The look for one play: fixed choices stay; "auto" picks among the unlocked
// ones so every play can look and sound a little different.
export function pickLook(equip = {}, got = {}, rng = Math.random) {
  const look = {};
  for (const { key } of CATS) {
    const want = equip[key];
    const own = unlockedIn(key, got);
    if (want && want !== 'auto' && own.some((it) => it.id === want)) look[key] = want;
    else look[key] = own[Math.floor(rng() * own.length)].id;
  }
  return look;
}
// The part after "cat:" (what the show modules switch on).
export const variant = (id) => (id ? id.split(':')[1] : 'classic');
