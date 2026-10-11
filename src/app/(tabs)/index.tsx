import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn3D, Card, SectionTitle, Sticker, T } from '@/components/ui';
import { WhoBar } from '@/components/who-bar';
import { C, S } from '@/constants/theme';
import { needsTimeout, penaltyPoints, routineProgress, stickerBalance, todaysStickerEvents } from '@/domain/selectors';
import { useCurrentChild, useStore } from '@/domain/store';

const tiltOf = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 25) - 12;
};

export default function StickerBoard() {
  const router = useRouter();
  const child = useCurrentChild();
  const events = useStore((s) => s.events);
  const rewards = useStore((s) => s.rewards);
  const routines = useStore((s) => s.routines);
  const penalty = useStore((s) => s.penalty);

  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );
  const balance = stickerBalance(events, child.id);
  const today = todaysStickerEvents(events, child.id, now);
  const points = penaltyPoints(events, child.id, now);
  const timeout = needsTimeout(events, child.id, penalty, now);

  const sorted = [...rewards].sort((a, b) => a.cost - b.cost);
  const goal = sorted.find((r) => r.cost > balance);
  const affordable = sorted.filter((r) => r.cost <= balance);
  const slots = goal ? Math.min(goal.cost, 20) : 0;
  const filled = goal ? Math.min(balance, slots) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: S.md, paddingBottom: S.xl * 2 }}>
        <WhoBar />

        <View style={{ alignItems: 'center', marginTop: S.md }}>
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: child.color,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 5,
              borderColor: '#fff',
            }}>
            <Text style={{ fontSize: 64 }}>{child.emoji}</Text>
          </View>
          <T size={26} weight="900" style={{ marginTop: S.sm }}>
            {child.name}
          </T>
        </View>

        {timeout && (
          <Btn3D t="red" depth={8} style={{ marginTop: S.md }} onPress={() => router.push('/timeout')} faceStyle={{ paddingVertical: 20 }}>
            <T size={26} weight="900" color="#fff">
              開始罰站 ⏱️
            </T>
          </Btn3D>
        )}

        <SectionTitle>今天的貼紙</SectionTitle>
        <Card>
          {today.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: S.md }}>
              <Text style={{ fontSize: 48 }}>🌱</Text>
              <T size={16} color={C.textSoft} center>
                今天還沒有貼紙，一起加油！
              </T>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, justifyContent: 'center', padding: S.xs }}>
              {today.map((e) => (
                <Sticker key={e.id} emoji={e.emoji ?? '⭐'} size={68} tilt={tiltOf(e.id)} />
              ))}
            </View>
          )}
        </Card>

        <SectionTitle right={<T size={22} weight="900" color={C.orangeEdge}>⭐ {balance}</T>}>我的貼紙罐</SectionTitle>
        <Card t="yellow">
          {goal ? (
            <View style={{ alignItems: 'center', gap: S.sm }}>
              <Text style={{ fontSize: 72 }}>{goal.emoji}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {Array.from({ length: slots }).map((_, i) => (
                  <Sticker key={i} emoji="⭐" size={34} dim={i >= filled} />
                ))}
              </View>
              <T size={20} weight="800" center>
                再 {goal.cost - balance} 張就能 {goal.emoji} {goal.title}
              </T>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: S.sm }}>
              <Text style={{ fontSize: 64 }}>🎉</Text>
              <T size={20} weight="800" center>
                貼紙夠多了，可以換獎品囉！
              </T>
            </View>
          )}
          {affordable.length > 0 && goal && (
            <T size={14} color={C.textSoft} center style={{ marginTop: S.sm }}>
              現在就能換：{affordable.map((r) => r.emoji).join(' ')}
            </T>
          )}
        </Card>

        <SectionTitle>罰點</SectionTitle>
        <View style={{ flexDirection: 'row', gap: S.sm, justifyContent: 'center' }}>
          {Array.from({ length: penalty.pointsPerTimeout }).map((_, i) => (
            <Text key={i} style={{ fontSize: 30 }}>
              {i < points ? '🟡' : '⚪'}
            </Text>
          ))}
        </View>

        <SectionTitle>習慣串連</SectionTitle>
        <View style={{ gap: S.md }}>
          {routines.map((r) => {
            const done = routineProgress(events, child.id, r.id, now).done;
            return (
              <Btn3D key={r.id} t={done ? 'green' : 'blue'} depth={7} onPress={() => router.push(`/routine/${r.id}`)}>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <T size={26} weight="900" color="#fff">
                    {r.emoji} {r.title} {done ? '✅' : ''}
                  </T>
                  <Text style={{ fontSize: 28 }}>{r.steps.map((s) => s.emoji).join(' ➜ ')}</Text>
                </View>
              </Btn3D>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
