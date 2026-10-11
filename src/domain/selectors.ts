import type { Id, LadderStage, LogEvent, PenaltySettings } from './types';

const live = (events: LogEvent[], childId: Id) =>
  events.filter((e) => e.childId === childId && !e.undone);

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** 目前貼紙餘額（得到的 − 兌換的） */
export function stickerBalance(events: LogEvent[], childId: Id) {
  return live(events, childId).reduce((sum, e) => sum + (e.stickers ?? 0), 0);
}

/** 累積得到的貼紙總數（不扣兌換），給貼紙板顯示收藏 */
export function stickersEarned(events: LogEvent[], childId: Id) {
  return live(events, childId).reduce((sum, e) => sum + Math.max(0, e.stickers ?? 0), 0);
}

/** 今天得到的貼紙事件（貼紙板顯示用，含 emoji） */
export function todaysStickerEvents(events: LogEvent[], childId: Id, now = Date.now()) {
  const from = startOfDay(now);
  return live(events, childId).filter((e) => e.at >= from && (e.stickers ?? 0) > 0);
}

/** 目前罰點：上次罰站完成（或今天開始）之後累積的罰點 */
export function penaltyPoints(events: LogEvent[], childId: Id, now = Date.now()) {
  const from = startOfDay(now);
  let points = 0;
  for (const e of live(events, childId).sort((a, b) => a.at - b.at)) {
    if (e.at < from) continue;
    if (e.type === 'penalty') points += 1;
    if (e.type === 'timeout_done') points = 0;
  }
  return points;
}

export function needsTimeout(events: LogEvent[], childId: Id, s: PenaltySettings, now = Date.now()) {
  return penaltyPoints(events, childId, now) >= s.pointsPerTimeout;
}

/**
 * 某個行為目前在三段式的哪一段。
 * 罰點、手動重置、或超過 ladderResetMinutes 沒再犯，都回到 0。
 */
export function ladderStage(
  events: LogEvent[],
  childId: Id,
  behaviorId: Id,
  s: PenaltySettings,
  now = Date.now(),
): LadderStage {
  const relevant = live(events, childId)
    .filter((e) => e.refId === behaviorId && ['remind', 'warn', 'penalty', 'ladder_reset'].includes(e.type))
    .sort((a, b) => a.at - b.at);
  const last = relevant[relevant.length - 1];
  if (!last) return 0;
  if (now - last.at > s.ladderResetMinutes * 60_000) return 0;
  if (last.type === 'remind') return 1;
  if (last.type === 'warn') return 2;
  return 0;
}

/** 今天某個串連已完成的步驟 id；整串完成後當天回傳 'done' */
export function routineProgress(events: LogEvent[], childId: Id, routineId: Id, now = Date.now()) {
  const from = startOfDay(now);
  const today = live(events, childId).filter((e) => e.at >= from && e.refId === routineId);
  const done = today.some((e) => e.type === 'routine_done');
  const steps = new Set(today.filter((e) => e.type === 'routine_step').map((e) => e.stepId!));
  return { done, steps };
}
