// 全家共用的設定 + append-only 事件紀錄。餘額、罰點、三段式階段都由事件推算。

export type Id = string;

export interface Child {
  id: Id;
  name: string;
  emoji: string; // 頭像
  color: string; // 主題色
  birthYm?: string; // 'YYYY-MM'
}

export interface Caregiver {
  id: Id;
  name: string; // 爸爸、媽媽、阿嬤…
  emoji: string;
}

/** 好行為：做到就給貼紙 */
export interface GoodBehavior {
  id: Id;
  title: string;
  emoji: string;
  stickers: number;
}

/** 要改的行為：走「提醒 → 警告 → 罰點」 */
export interface BadBehavior {
  id: Id;
  title: string;
  emoji: string;
  /** 提醒時大人要說的話，讓全家講法一致 */
  script?: string;
}

export interface Reward {
  id: Id;
  title: string;
  emoji: string;
  cost: number; // 需要幾張貼紙
}

export interface RoutineStep {
  id: Id;
  title: string;
  emoji: string;
}

/** 習慣串連：整串完成才拿貼紙 */
export interface Routine {
  id: Id;
  title: string;
  emoji: string;
  steps: RoutineStep[];
  stickers: number;
}

export interface PenaltySettings {
  /** 罰點累積到幾點要罰站 */
  pointsPerTimeout: number;
  /** 罰站幾分鐘 */
  timeoutMinutes: number;
  /** 三段式多久沒再犯就重置（分鐘） */
  ladderResetMinutes: number;
}

export type EventType =
  | 'sticker' // 好行為給貼紙
  | 'remind' // 第一段：提醒
  | 'warn' // 第二段：警告
  | 'penalty' // 第三段：罰點 +1
  | 'timeout_done' // 罰站完成，罰點歸零
  | 'routine_step' // 串連某一步完成
  | 'routine_done' // 整串完成，給貼紙
  | 'redeem' // 兌換獎品，扣貼紙
  | 'ladder_reset'; // 大人手動重置三段式

export interface LogEvent {
  id: Id;
  childId: Id;
  caregiverId: Id;
  at: number; // epoch ms
  type: EventType;
  /** 對應的行為 / 獎品 / 串連 id */
  refId?: Id;
  /** 串連步驟 id（routine_step） */
  stepId?: Id;
  /** 貼紙變化量（sticker/routine_done 為正、redeem 為負） */
  stickers?: number;
  /** 記錄當下的標題快照，規則改名或刪除後歷史仍看得懂 */
  label?: string;
  emoji?: string;
  /** 已撤銷（不刪除事件，方便同步） */
  undone?: boolean;
}

export type LadderStage = 0 | 1 | 2; // 0 尚未提醒、1 已提醒、2 已警告（下一步罰點）
