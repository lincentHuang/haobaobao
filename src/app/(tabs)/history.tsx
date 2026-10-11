import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, T, tap } from '@/components/ui';
import { WhoBar } from '@/components/who-bar';
import { C, R, S } from '@/constants/theme';
import { startOfDay } from '@/domain/selectors';
import { useCurrentChild, useStore } from '@/domain/store';
import type { Caregiver, EventType, LogEvent } from '@/domain/types';

type Filter = 'all' | 'sticker' | 'discipline' | 'reward' | 'habit';
const FILTERS: { key: Filter; label: string; types?: EventType[] }[] = [
  { key: 'all', label: '全部' },
  { key: 'sticker', label: '貼紙', types: ['sticker'] },
  { key: 'discipline', label: '提醒警告罰點', types: ['remind', 'warn', 'penalty', 'timeout_done', 'ladder_reset'] },
  { key: 'reward', label: '獎品', types: ['redeem'] },
  { key: 'habit', label: '習慣', types: ['routine_step', 'routine_done'] },
];

const badge = (e: LogEvent): { text: string; color: string } => {
  switch (e.type) {
    case 'sticker':
      return { text: `給貼紙 +${e.stickers ?? 0}`, color: C.green };
    case 'remind':
      return { text: '提醒', color: C.yellowEdge };
    case 'warn':
      return { text: '警告', color: C.orange };
    case 'penalty':
      return { text: '罰點', color: C.red };
    case 'timeout_done':
      return { text: '罰站完成', color: C.purple };
    case 'routine_step':
      return { text: '習慣步驟', color: C.blue };
    case 'routine_done':
      return { text: `習慣完成 +${e.stickers ?? 0}`, color: C.green };
    case 'redeem':
      return { text: `兌換 ${e.stickers ?? 0}`, color: C.purple };
    default:
      return { text: '重置', color: C.greyEdge };
  }
};

const pad = (n: number) => String(n).padStart(2, '0');
const dayLabel = (t: number) => {
  const diff = Math.round((startOfDay(Date.now()) - startOfDay(t)) / 86_400_000);
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  const d = new Date(t);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

function confirmUndo(onYes: () => void) {
  const msg = '確定要復原這筆記錄嗎？';
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(msg)) onYes();
    return;
  }
  Alert.alert('復原', msg, [
    { text: '取消', style: 'cancel' },
    { text: '復原', style: 'destructive', onPress: onYes },
  ]);
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const child = useCurrentChild();
  const events = useStore((s) => s.events);
  const caregivers = useStore((s) => s.caregivers);
  const undo = useStore((s) => s.undo);
  const [filter, setFilter] = useState<Filter>('all');

  const cgMap = useMemo(() => new Map<string, Caregiver>(caregivers.map((g) => [g.id, g])), [caregivers]);

  const mine = useMemo(() => events.filter((e) => e.childId === child.id), [events, child.id]);

  const sections = useMemo(() => {
    const types = FILTERS.find((f) => f.key === filter)?.types;
    const list = mine.filter((e) => !types || types.includes(e.type)).sort((a, b) => b.at - a.at);
    const out: { title: string; data: LogEvent[] }[] = [];
    for (const e of list) {
      const title = dayLabel(e.at);
      const last = out[out.length - 1];
      if (last && last.title === title) last.data.push(e);
      else out.push({ title, data: [e] });
    }
    return out;
  }, [mine, filter]);

  // 今天每位照顧者記了什麼
  const stats = useMemo(() => {
    const m = new Map<string, { stickers: number; discipline: number }>();
    for (const e of mine) {
      if (e.undone || dayLabel(e.at) !== '今天') continue;
      const isSticker = e.type === 'sticker';
      const isDisc = e.type === 'remind' || e.type === 'warn' || e.type === 'penalty';
      if (!isSticker && !isDisc) continue;
      const cur = m.get(e.caregiverId) ?? { stickers: 0, discipline: 0 };
      if (isSticker) cur.stickers += 1;
      else cur.discipline += 1;
      m.set(e.caregiverId, cur);
    }
    return [...m.entries()];
  }, [mine]);

  const header = (
    <View style={{ gap: S.md, paddingBottom: S.sm }}>
      <WhoBar />
      <Card>
        <T size={16} weight="800">
          👀 誰今天記了什麼
        </T>
        {stats.length === 0 ? (
          <T size={13} color={C.textSoft} style={{ marginTop: 4 }}>
            今天還沒有記錄
          </T>
        ) : (
          <View style={{ marginTop: S.sm, gap: 6 }}>
            {stats.map(([id, v]) => {
              const g = cgMap.get(id);
              return (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                  <T size={15} weight="700" style={{ width: 90 }}>
                    {g ? `${g.emoji} ${g.name}` : '已刪除的照顧者'}
                  </T>
                  <T size={14} color={C.green}>
                    ⭐ 給貼紙 {v.stickers} 次
                  </T>
                  <T size={14} color={C.red}>
                    🙅 管教 {v.discipline} 次
                  </T>
                </View>
              );
            })}
          </View>
        )}
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                tap();
                setFilter(f.key);
              }}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: R.pill,
                backgroundColor: active ? C.orange : C.card,
                borderWidth: 2,
                borderColor: active ? C.orangeEdge : C.line,
              }}>
              <T size={14} weight="700" color={active ? '#fff' : C.text}>
                {f.label}
              </T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <SectionList
      style={{ flex: 1 }}
      sections={sections}
      keyExtractor={(e) => e.id}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <T size={15} color={C.textSoft} center style={{ marginTop: S.xl }}>
          📭 還沒有記錄
        </T>
      }
      contentContainerStyle={{ paddingTop: insets.top + S.md, paddingHorizontal: S.md, paddingBottom: S.xl }}
      renderSectionHeader={({ section }) => (
        <T size={16} weight="800" color={C.textSoft} style={{ marginTop: S.md, marginBottom: S.xs }}>
          {section.title}
        </T>
      )}
      renderItem={({ item: e }) => {
        const d = new Date(e.at);
        const b = badge(e);
        const g = cgMap.get(e.caregiverId);
        return (
          <Pressable
            onLongPress={() => !e.undone && confirmUndo(() => undo(e.id))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: S.sm,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
              opacity: e.undone ? 0.45 : 1,
            }}>
            <T size={13} color={C.textSoft} style={{ width: 44 }}>
              {pad(d.getHours())}:{pad(d.getMinutes())}
            </T>
            <T size={28}>{e.emoji ?? '📌'}</T>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={15} weight="700" style={e.undone ? { textDecorationLine: 'line-through' } : undefined}>
                {e.label ?? '記錄'}
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <View style={{ backgroundColor: b.color, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 1 }}>
                  <T size={11} weight="800" color="#fff">
                    {b.text}
                  </T>
                </View>
                <T size={12} color={C.textSoft}>
                  {g ? `${g.emoji} ${g.name}` : '已刪除的照顧者'}
                </T>
                {e.undone && (
                  <T size={12} weight="700" color={C.textSoft}>
                    已復原
                  </T>
                )}
              </View>
            </View>
            {!e.undone && (
              <Pressable hitSlop={8} onPress={() => confirmUndo(() => undo(e.id))}>
                <T size={12} color={C.textSoft} style={{ textDecorationLine: 'underline' }}>
                  復原
                </T>
              </Pressable>
            )}
          </Pressable>
        );
      }}
    />
  );
}
