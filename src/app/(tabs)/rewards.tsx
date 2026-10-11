import { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WhoBar } from '@/components/who-bar';
import { Btn3D, Card, SectionTitle, T } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { stickerBalance } from '@/domain/selectors';
import { useCurrentChild, useStore } from '@/domain/store';
import type { Reward } from '@/domain/types';

const timeLabel = (t: number) => {
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const child = useCurrentChild();
  const events = useStore((s) => s.events);
  const rewards = useStore((s) => s.rewards);
  const caregivers = useStore((s) => s.caregivers);
  const redeem = useStore((s) => s.redeem);
  const [celebrate, setCelebrate] = useState<Reward | null>(null);

  const balance = stickerBalance(events, child.id);
  const sorted = [...rewards].sort((a, b) => a.cost - b.cost);
  const recent = events
    .filter((e) => e.childId === child.id && e.type === 'redeem' && !e.undone)
    .sort((a, b) => b.at - a.at)
    .slice(0, 5);

  const doRedeem = (r: Reward) => {
    redeem(r);
    setCelebrate(r);
    setTimeout(() => setCelebrate(null), 2200);
  };

  const ask = (r: Reward) => {
    const msg = `用 ${r.cost} 張貼紙換 ${r.emoji} ${r.title}？`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) doRedeem(r);
      return;
    }
    Alert.alert('兌換獎品', msg, [
      { text: '再等等', style: 'cancel' },
      { text: '兌換！', onPress: () => doRedeem(r) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.md, paddingTop: insets.top + S.md, paddingBottom: S.xl * 2 }}>
        <WhoBar />
        <Card t="yellow" style={{ marginTop: S.md, alignItems: 'center', paddingVertical: S.lg }}>
          <T size={14} weight="800" color={C.text}>
            {child.emoji} {child.name} 的貼紙
          </T>
          <T size={44} weight="900">
            ⭐ {balance} 張
          </T>
        </Card>

        <T size={13} color={C.textSoft} style={{ marginTop: S.md }}>
          💡 延遲滿足：多存一點貼紙，換更大的獎品，等待之後的開心會更大！
        </T>

        <SectionTitle>🎁 獎品</SectionTitle>
        {sorted.length === 0 && <T color={C.textSoft}>還沒有獎品，到「規則」頁新增吧。</T>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.md }}>
          {sorted.map((r) => {
            const can = balance >= r.cost;
            const pct = Math.min(1, balance / r.cost);
            return (
              <View key={r.id} style={{ width: '47%', flexGrow: 1 }}>
                <Card t={can ? 'white' : 'white'} style={{ alignItems: 'center', gap: 6, opacity: can ? 1 : 0.95 }}>
                  <Text style={{ fontSize: 56 }}>{r.emoji}</Text>
                  <T size={17} weight="800" center>
                    {r.title}
                  </T>
                  <T size={14} weight="700" color={C.orangeEdge}>
                    ⭐ {r.cost} 張
                  </T>
                  <View style={{ alignSelf: 'stretch', height: 14, borderRadius: R.pill, backgroundColor: C.line, overflow: 'hidden' }}>
                    <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: can ? C.green : C.orange, borderRadius: R.pill }} />
                  </View>
                  {can ? (
                    <Btn3D t="green" depth={5} onPress={() => ask(r)} style={{ alignSelf: 'stretch' }}>
                      <T size={16} weight="900" color="#fff">
                        兌換！
                      </T>
                    </Btn3D>
                  ) : (
                    <T size={14} weight="800" color={C.textSoft}>
                      還差 {r.cost - balance} 張
                    </T>
                  )}
                </Card>
              </View>
            );
          })}
        </View>

        <SectionTitle>🧾 最近兌換</SectionTitle>
        {recent.length === 0 ? (
          <T size={14} color={C.textSoft}>
            還沒有兌換紀錄。
          </T>
        ) : (
          <View style={{ gap: S.sm }}>
            {recent.map((e) => {
              const who = caregivers.find((g) => g.id === e.caregiverId);
              return (
                <Card key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 30 }}>{e.emoji ?? '🎁'}</Text>
                  <View style={{ flex: 1 }}>
                    <T size={16} weight="800">
                      {e.label ?? '獎品'}
                    </T>
                    <T size={12} color={C.textSoft}>
                      {timeLabel(e.at)}
                      {who ? `　${who.emoji} ${who.name}` : ''}
                    </T>
                  </View>
                  <T size={14} weight="800" color={C.redEdge}>
                    {e.stickers} ⭐
                  </T>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!celebrate} transparent animationType="fade" onRequestClose={() => setCelebrate(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(61,44,30,0.55)', alignItems: 'center', justifyContent: 'center' }}>
          <Card style={{ alignItems: 'center', paddingHorizontal: S.xl, paddingVertical: S.xl }}>
            <Text style={{ fontSize: 28 }}>🎉🎊✨</Text>
            <Text style={{ fontSize: 96 }}>{celebrate?.emoji}</Text>
            <T size={26} weight="900">
              兌換成功！
            </T>
            <T size={18} color={C.textSoft}>
              {celebrate?.title}
            </T>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
