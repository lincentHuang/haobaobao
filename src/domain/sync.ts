import type { RealtimeChannel } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { ensureSignedIn, supabase } from '@/lib/supabase';

import { pickConfig, useStore, type Family, type FamilyConfig } from './store';
import type { LogEvent } from './types';

// 本機優先：所有操作先寫本機，再由這裡推上雲端；別台裝置的變更經 Realtime 進來。

type EventRow = {
  id: string;
  family_id: string;
  child_id: string;
  caregiver_id: string;
  at: number;
  type: LogEvent['type'];
  ref_id: string | null;
  step_id: string | null;
  stickers: number | null;
  label: string | null;
  emoji: string | null;
  undone: boolean;
};

const toRow = (e: LogEvent, familyId: string): EventRow => ({
  id: e.id,
  family_id: familyId,
  child_id: e.childId,
  caregiver_id: e.caregiverId,
  at: e.at,
  type: e.type,
  ref_id: e.refId ?? null,
  step_id: e.stepId ?? null,
  stickers: e.stickers ?? null,
  label: e.label ?? null,
  emoji: e.emoji ?? null,
  undone: !!e.undone,
});

const fromRow = (r: EventRow): LogEvent => ({
  id: r.id,
  childId: r.child_id,
  caregiverId: r.caregiver_id,
  at: Number(r.at),
  type: r.type,
  refId: r.ref_id ?? undefined,
  stepId: r.step_id ?? undefined,
  stickers: r.stickers ?? undefined,
  label: r.label ?? undefined,
  emoji: r.emoji ?? undefined,
  undone: r.undone,
});

type FamilyRow = { id: string; name: string; invite_code: string };
const toFamily = (r: FamilyRow): Family => ({ id: r.id, name: r.name, inviteCode: r.invite_code });

export type SyncStatus = 'off' | 'connecting' | 'online' | 'error';
let status: SyncStatus = supabase ? 'connecting' : 'off';
const listeners = new Set<() => void>();
const setStatus = (s: SyncStatus) => {
  status = s;
  listeners.forEach((l) => l());
};
export const syncStatus = {
  get: () => status,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

let pushing = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;

/** 把 outbox 的事件和有修改的設定推上雲端 */
export async function push() {
  const { family, outbox, configDirty, events } = useStore.getState();
  if (!supabase || !family || pushing || (!outbox.length && !configDirty)) return;
  pushing = true;
  try {
    const ids = [...new Set(outbox)];
    if (ids.length) {
      const byId = new Map(events.map((e) => [e.id, e]));
      const rows = ids.map((id) => byId.get(id)).filter((e): e is LogEvent => !!e).map((e) => toRow(e, family.id));
      const { error } = await supabase.from('events').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }
    if (configDirty) {
      const { error } = await supabase
        .from('family_config')
        .upsert({ family_id: family.id, data: pickConfig(useStore.getState()), updated_at: new Date().toISOString() });
      if (error) throw error;
    }
    useStore.getState().markPushed(ids, configDirty);
    setStatus('online');
  } catch (e) {
    console.warn('[sync] push failed', e);
    setStatus('error');
  } finally {
    pushing = false;
  }
  // 推的同時又有新操作，再推一次
  const s = useStore.getState();
  if (s.outbox.length || s.configDirty) schedulePush(2000);
}

function schedulePush(ms = 400) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, ms);
}

/** 從雲端拉整份設定與事件 */
export async function pull() {
  const { family } = useStore.getState();
  if (!supabase || !family) return;
  const [cfg, ev] = await Promise.all([
    supabase.from('family_config').select('data').eq('family_id', family.id).maybeSingle(),
    supabase.from('events').select('*').eq('family_id', family.id).order('at', { ascending: true }).limit(10000),
  ]);
  if (cfg.error || ev.error) throw cfg.error ?? ev.error;
  useStore.getState().applyRemote({
    config: (cfg.data?.data as FamilyConfig | undefined) ?? undefined,
    events: (ev.data as EventRow[]).map(fromRow),
  });
}

let channel: RealtimeChannel | null = null;

function subscribeRealtime(familyId: string) {
  if (!supabase) return;
  if (channel) supabase.removeChannel(channel);
  channel = supabase
    .channel(`family:${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `family_id=eq.${familyId}` }, (p) => {
      if (p.new && 'id' in p.new) useStore.getState().applyRemote({ events: [fromRow(p.new as EventRow)] });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_config', filter: `family_id=eq.${familyId}` }, (p) => {
      const data = (p.new as { data?: FamilyConfig } | undefined)?.data;
      if (data) useStore.getState().applyRemote({ config: data });
    })
    .subscribe((s) => {
      if (s === 'SUBSCRIBED') setStatus('online');
      if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('error');
    });
}

let started = false;

/** App 啟動時呼叫一次 */
export async function startSync() {
  if (!supabase || started) return;
  started = true;

  // 本機有新操作 → 稍等一下批次上傳
  useStore.subscribe((s, prev) => {
    if (s.outbox !== prev.outbox || s.configDirty !== prev.configDirty) schedulePush();
    if (s.family?.id !== prev.family?.id && s.family) connect(s.family.id);
  });

  // 回到前景：補推、補拉
  AppState.addEventListener('change', (st) => {
    if (st === 'active') resync();
  });

  try {
    await ensureSignedIn();
  } catch (e) {
    console.warn('[sync] sign-in failed', e);
    setStatus('error');
    return;
  }
  const { family } = useStore.getState();
  if (family) await connect(family.id);
  else setStatus('online');
}

async function connect(familyId: string) {
  setStatus('connecting');
  try {
    await push();
    await pull();
    subscribeRealtime(familyId);
    setStatus('online');
  } catch (e) {
    console.warn('[sync] connect failed', e);
    setStatus('error');
  }
}

export async function resync() {
  const { family } = useStore.getState();
  if (family) await connect(family.id);
}

/** 建立家庭：把這台裝置目前的設定與紀錄當成家庭的起點 */
export async function createFamily(name: string) {
  if (!supabase) throw new Error('尚未設定雲端');
  await ensureSignedIn();
  const s = useStore.getState();
  const { data, error } = await supabase.rpc('create_family', { family_name: name, initial_config: pickConfig(s) });
  if (error) throw error;
  // 既有紀錄全部排進 outbox 上傳
  useStore.setState({ outbox: s.events.map((e) => e.id), configDirty: false });
  useStore.getState().setFamily(toFamily(data as FamilyRow));
}

/** 用邀請碼加入家庭：以家庭的設定為準，這台裝置原本的紀錄不上傳 */
export async function joinFamily(code: string) {
  if (!supabase) throw new Error('尚未設定雲端');
  await ensureSignedIn();
  const { data, error } = await supabase.rpc('join_family', { code });
  if (error) throw new Error(error.message.includes('找不到') ? '找不到這個邀請碼' : error.message);
  useStore.setState({ events: [], outbox: [], configDirty: false });
  useStore.getState().setFamily(toFamily(data as FamilyRow));
}

/** 離開家庭（只影響這台裝置；資料保留在雲端） */
export function leaveFamily() {
  if (channel && supabase) supabase.removeChannel(channel);
  channel = null;
  useStore.setState({ family: null, outbox: [], configDirty: false });
}
