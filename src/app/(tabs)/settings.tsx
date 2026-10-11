import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stepper, askConfirm } from '@/components/settings/common';
import { ItemEditor, type EditKind } from '@/components/settings/item-editor';
import { Btn3D, Card, SectionTitle, T, tap } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useStore } from '@/domain/store';

type Row = { id: string; emoji: string; title: string; sub?: string; color?: string };

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const s = useStore();
  const [edit, setEdit] = useState<{ kind: EditKind; id: string | null } | null>(null);

  const sections: { kind: EditKind; title: string; rows: Row[] }[] = [
    {
      kind: 'children',
      title: '👶 小孩',
      rows: s.children.map((c) => ({ id: c.id, emoji: c.emoji, title: c.name, sub: c.birthYm, color: c.color })),
    },
    { kind: 'caregivers', title: '👪 照顧者', rows: s.caregivers.map((c) => ({ id: c.id, emoji: c.emoji, title: c.name })) },
    {
      kind: 'good',
      title: '🌟 好行為',
      rows: s.good.map((g) => ({ id: g.id, emoji: g.emoji, title: g.title, sub: `${g.stickers} 張貼紙` })),
    },
    {
      kind: 'bad',
      title: '🚧 要改的行為',
      rows: s.bad.map((b) => ({ id: b.id, emoji: b.emoji, title: b.title, sub: b.script })),
    },
    {
      kind: 'rewards',
      title: '🎁 獎品',
      rows: s.rewards.map((r) => ({ id: r.id, emoji: r.emoji, title: r.title, sub: `${r.cost} 張貼紙` })),
    },
    {
      kind: 'routines',
      title: '🔗 習慣串連',
      rows: s.routines.map((r) => ({
        id: r.id,
        emoji: r.emoji,
        title: r.title,
        sub: `${r.steps.map((x) => x.emoji).join(' → ')}　${r.stickers} 張貼紙`,
      })),
    },
  ];

  const editing = edit
    ? edit.id === null
      ? null
      : ((s[edit.kind] as { id: string }[]).find((x) => x.id === edit.id) ?? null)
    : null;

  const resetAll = () =>
    askConfirm('重設為預設資料？', '所有規則與貼紙紀錄都會被清除。', '繼續', () =>
      askConfirm('真的要重設嗎？', '這個動作無法復原。', '全部重設', () => s.resetAll()),
    );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.md, paddingTop: insets.top + S.md, paddingBottom: S.xl * 2 }}>
        <T size={28} weight="900">
          ⚙️ 全家的規則
        </T>
        <T size={14} color={C.textSoft} style={{ marginTop: 4 }}>
          這裡的規則全家共用，每位照顧者看到的都一樣。
        </T>

        {sections.map((sec) => (
          <View key={sec.kind}>
            <SectionTitle
              right={
                <Pressable
                  onPress={() => {
                    tap();
                    setEdit({ kind: sec.kind, id: null });
                  }}
                  style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: R.pill, backgroundColor: C.green, borderBottomWidth: 3, borderBottomColor: C.greenEdge }}>
                  <T size={14} weight="800" color="#fff">
                    ＋ 新增
                  </T>
                </Pressable>
              }>
              {sec.title}
            </SectionTitle>
            <View style={{ gap: S.sm }}>
              {sec.rows.length === 0 && (
                <T size={14} color={C.textSoft}>
                  還沒有項目，點「新增」開始吧。
                </T>
              )}
              {sec.rows.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    tap();
                    setEdit({ kind: sec.kind, id: r.id });
                  }}>
                  <Card style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 10 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: r.color ?? C.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text style={{ fontSize: 28 }}>{r.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <T size={17} weight="800">
                        {r.title}
                      </T>
                      {!!r.sub && (
                        <T size={13} color={C.textSoft} numberOfLines={2}>
                          {r.sub}
                        </T>
                      )}
                    </View>
                    <T size={18} color={C.textSoft}>
                      ✏️
                    </T>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <SectionTitle>⏱️ 罰站設定</SectionTitle>
        <Card style={{ gap: S.md }}>
          <PenaltyRow label="累積幾個罰點就罰站" value={s.penalty.pointsPerTimeout} min={1} max={10} unit="點" onChange={(v) => s.setPenalty({ pointsPerTimeout: v })} />
          <PenaltyRow label="罰站幾分鐘" value={s.penalty.timeoutMinutes} min={1} max={10} unit="分鐘" onChange={(v) => s.setPenalty({ timeoutMinutes: v })} />
          <PenaltyRow
            label="多久沒再犯，三段式重新開始"
            value={s.penalty.ladderResetMinutes}
            min={15}
            max={60}
            step={15}
            unit="分鐘"
            onChange={(v) => s.setPenalty({ ladderResetMinutes: v })}
          />
          <T size={12} color={C.textSoft}>
            建議約每歲 1 分鐘（參考：美國兒科醫學會 AAP / HealthyChildren.org），請依孩子狀況調整；本 App 不能取代專業醫療或兒童發展建議。
          </T>
        </Card>

        <View style={{ marginTop: S.xl }}>
          <Btn3D t="red" onPress={resetAll}>
            <T size={16} weight="800" color="#fff">
              🗑️ 重設為預設資料
            </T>
          </Btn3D>
        </View>
      </ScrollView>

      {edit && (
        <ItemEditor
          key={`${edit.kind}-${edit.id ?? 'new'}`}
          kind={edit.kind}
          item={editing as never}
          onClose={() => setEdit(null)}
        />
      )}
    </View>
  );
}

function PenaltyRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <T size={14} weight="800" color={C.textSoft}>
        {label}
      </T>
      <Stepper value={value} onChange={onChange} min={min} max={max} step={step} unit={unit} />
    </View>
  );
}
