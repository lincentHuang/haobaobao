import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import * as seed from './seed';
import { ladderStage } from './selectors';
import type {
  BadBehavior,
  Caregiver,
  Child,
  GoodBehavior,
  Id,
  LogEvent,
  PenaltySettings,
  Reward,
  Routine,
} from './types';

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

type Collections = {
  children: Child[];
  caregivers: Caregiver[];
  good: GoodBehavior[];
  bad: BadBehavior[];
  rewards: Reward[];
  routines: Routine[];
};
export type CollectionKey = keyof Collections;

interface State extends Collections {
  penalty: PenaltySettings;
  events: LogEvent[];
  /** 這台裝置目前選的小孩 / 照顧者（每台裝置各自記） */
  currentChildId: Id;
  currentCaregiverId: Id;

  setCurrentChild: (id: Id) => void;
  setCurrentCaregiver: (id: Id) => void;

  upsert: <K extends CollectionKey>(key: K, item: Collections[K][number]) => void;
  remove: (key: CollectionKey, id: Id) => void;
  setPenalty: (p: Partial<PenaltySettings>) => void;

  giveSticker: (good: GoodBehavior) => LogEvent;
  /** 走三段式的下一步，回傳這次記錄的事件 */
  discipline: (bad: BadBehavior) => LogEvent;
  resetLadder: (bad: BadBehavior) => void;
  finishTimeout: () => void;
  toggleRoutineStep: (routine: Routine, stepId: Id, done: boolean) => void;
  completeRoutine: (routine: Routine) => void;
  redeem: (reward: Reward) => void;
  undo: (eventId: Id) => void;
  resetAll: () => void;
}

const initial = {
  children: seed.seedChildren,
  caregivers: seed.seedCaregivers,
  good: seed.seedGood,
  bad: seed.seedBad,
  rewards: seed.seedRewards,
  routines: seed.seedRoutines,
  penalty: seed.seedPenalty,
  events: [] as LogEvent[],
  currentChildId: seed.seedChildren[0].id,
  currentCaregiverId: seed.seedCaregivers[0].id,
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const log = (e: Omit<LogEvent, 'id' | 'at' | 'childId' | 'caregiverId'>): LogEvent => {
        const { currentChildId, currentCaregiverId } = get();
        const event: LogEvent = {
          id: newId(),
          at: Date.now(),
          childId: currentChildId,
          caregiverId: currentCaregiverId,
          ...e,
        };
        set((s) => ({ events: [...s.events, event] }));
        return event;
      };

      return {
        ...initial,

        setCurrentChild: (id) => set({ currentChildId: id }),
        setCurrentCaregiver: (id) => set({ currentCaregiverId: id }),

        upsert: (key, item) =>
          set((s) => {
            const list = s[key] as { id: Id }[];
            const exists = list.some((x) => x.id === item.id);
            return {
              [key]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item],
            } as Partial<State>;
          }),
        remove: (key, id) =>
          set((s) => {
            const next = { [key]: (s[key] as { id: Id }[]).filter((x) => x.id !== id) } as Partial<State>;
            if (key === 'children' && s.currentChildId === id) next.currentChildId = s.children.find((c) => c.id !== id)?.id ?? '';
            if (key === 'caregivers' && s.currentCaregiverId === id)
              next.currentCaregiverId = s.caregivers.find((c) => c.id !== id)?.id ?? '';
            return next;
          }),
        setPenalty: (p) => set((s) => ({ penalty: { ...s.penalty, ...p } })),

        giveSticker: (good) =>
          log({ type: 'sticker', refId: good.id, stickers: good.stickers, label: good.title, emoji: good.emoji }),

        discipline: (bad) => {
          const { events, currentChildId, penalty } = get();
          const stage = ladderStage(events, currentChildId, bad.id, penalty);
          const type = stage === 0 ? 'remind' : stage === 1 ? 'warn' : 'penalty';
          return log({ type, refId: bad.id, label: bad.title, emoji: bad.emoji });
        },
        resetLadder: (bad) => log({ type: 'ladder_reset', refId: bad.id, label: bad.title, emoji: bad.emoji }),
        finishTimeout: () => log({ type: 'timeout_done', label: '罰站完成', emoji: '⏱️' }),

        toggleRoutineStep: (routine, stepId, done) => {
          if (done) {
            const step = routine.steps.find((x) => x.id === stepId);
            log({ type: 'routine_step', refId: routine.id, stepId, label: step?.title, emoji: step?.emoji });
          } else {
            // 取消今天這一步：把今天對應的事件標成撤銷
            const from = new Date().setHours(0, 0, 0, 0);
            const { currentChildId } = get();
            set((s) => ({
              events: s.events.map((e) =>
                e.childId === currentChildId && e.type === 'routine_step' && e.refId === routine.id && e.stepId === stepId && e.at >= from
                  ? { ...e, undone: true }
                  : e,
              ),
            }));
          }
        },
        completeRoutine: (routine) =>
          log({
            type: 'routine_done',
            refId: routine.id,
            stickers: routine.stickers,
            label: `${routine.title}串連完成`,
            emoji: routine.emoji,
          }),
        redeem: (reward) =>
          log({ type: 'redeem', refId: reward.id, stickers: -reward.cost, label: reward.title, emoji: reward.emoji }),

        undo: (eventId) => set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, undone: true } : e)) })),
        resetAll: () => set({ ...initial }),
      };
    },
    {
      name: 'haoxiguan-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useCurrentChild = () => useStore((s) => s.children.find((c) => c.id === s.currentChildId) ?? s.children[0]);
export const useCurrentCaregiver = () =>
  useStore((s) => s.caregivers.find((c) => c.id === s.currentCaregiverId) ?? s.caregivers[0]);
