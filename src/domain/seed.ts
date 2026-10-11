import type {
  BadBehavior,
  Caregiver,
  Child,
  GoodBehavior,
  PenaltySettings,
  Reward,
  Routine,
} from './types';

export const seedChildren: Child[] = [{ id: 'c1', name: '老大', emoji: '🐻', color: '#FF9F43', birthYm: '2024-06' }];

export const seedCaregivers: Caregiver[] = [
  { id: 'g1', name: '爸爸', emoji: '👨' },
  { id: 'g2', name: '媽媽', emoji: '👩' },
  { id: 'g3', name: '阿嬤', emoji: '👵' },
  { id: 'g4', name: '阿公', emoji: '👴' },
];

export const seedGood: GoodBehavior[] = [
  { id: 'b1', title: '自己吃飯', emoji: '🍚', stickers: 1 },
  { id: 'b2', title: '收玩具', emoji: '🧸', stickers: 1 },
  { id: 'b3', title: '說謝謝', emoji: '🙏', stickers: 1 },
  { id: 'b4', title: '自己穿鞋', emoji: '👟', stickers: 1 },
  { id: 'b5', title: '分享', emoji: '🤝', stickers: 1 },
];

export const seedBad: BadBehavior[] = [
  { id: 'x1', title: '打人', emoji: '✋', script: '手是用來抱抱的，不能打人。' },
  { id: 'x2', title: '丟東西', emoji: '🪃', script: '東西要輕輕放，丟了會壞掉。' },
  { id: 'x3', title: '尖叫', emoji: '😱', script: '我們用小聲音說話。' },
  { id: 'x4', title: '吃飯亂跑', emoji: '🏃', script: '吃飯要坐在椅子上。' },
];

export const seedRewards: Reward[] = [
  { id: 'r1', title: '去公園', emoji: '🛝', cost: 5 },
  { id: 'r2', title: '小點心', emoji: '🍪', cost: 3 },
  { id: 'r3', title: '多講一本故事', emoji: '📖', cost: 4 },
  { id: 'r4', title: '新玩具', emoji: '🚗', cost: 20 },
];

export const seedRoutines: Routine[] = [
  {
    id: 'rt1',
    title: '睡前',
    emoji: '🌙',
    stickers: 2,
    steps: [
      { id: 's1', title: '刷牙', emoji: '🪥' },
      { id: 's2', title: '換睡衣', emoji: '👕' },
      { id: 's3', title: '聽故事', emoji: '📚' },
    ],
  },
  {
    id: 'rt2',
    title: '早上',
    emoji: '☀️',
    stickers: 1,
    steps: [
      { id: 's4', title: '尿尿', emoji: '🚽' },
      { id: 's5', title: '洗臉', emoji: '🧼' },
      { id: 's6', title: '吃早餐', emoji: '🥣' },
    ],
  },
];

/** 罰站常見建議約每歲 1 分鐘；2 歲預設 2 分鐘 */
export const seedPenalty: PenaltySettings = { pointsPerTimeout: 3, timeoutMinutes: 2, ladderResetMinutes: 30 };
