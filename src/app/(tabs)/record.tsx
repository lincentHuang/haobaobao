import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Btn3D, Card, SectionTitle, T, tap } from '@/components/ui';
import { WhoBar } from '@/components/who-bar';
import { C, R, S, tone } from '@/constants/theme';
import { ladderStage, needsTimeout, penaltyPoints, stickerBalance } from '@/domain/selectors';
import { useCurrentChild, useCurrentCaregiver, useStore } from '@/domain/store';
import type { BadBehavior, GoodBehavior } from '@/domain/types';

const STEPS = ['提醒', '警告', '罰點'];
const STEP_TONE: ('yellow' | 'orange' | 'red')[] = ['yellow', 'orange', 'red'];
const BTN_LABEL = ['🟡 提醒', '🟠 警告', '🔴 罰一點'];

function confirmBox(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(message)) onYes();
    return;
  }
  Alert.alert('罰站', message, [
    { text: '等一下', style: 'cancel' },
    { text: '開始罰站', onPress: onYes },
  ]);
}

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const child = useCurrentChild();
  const caregiver = useCurrentCaregiver();

  const good = useStore((s) => s.good);
  const bad = useStore((s) => s.bad);
  const events = useStore((s) => s.events);
  const penalty = useStore((s) => s.penalty);
  const giveSticker = useStore((s) => s.giveSticker);
  const discipline = useStore((s) => s.discipline);
  const resetLadder = useStore((s) => s.resetLadder);
  const undo = useStore((s) => s.undo);

  const balance = stickerBalance(events, child.id);
  const points = penaltyPoints(events, child.id);

  const onGood = (g: GoodBehavior) => {
    const ev = giveSticker(g);
    toast.show(`已給 ${child.name} ${g.emoji} ${g.title} +${g.stickers} ⭐`, () => undo(ev.id));
  };

  const onBad = (b: BadBehavior) => {
    const ev = discipline(b);
    const name = ev.type === 'remind' ? '提醒' : ev.type === 'warn' ? '警告' : '罰一點';
    toast.show(`${caregiver.emoji} ${child.name} ${b.emoji} ${b.title}：${name}`, () => undo(ev.id));
    if (ev.type === 'penalty') {
      const st = useStore.getState();
      if (needsTimeout(st.events, child.id, st.penalty)) {
        confirmBox(`罰點滿 ${st.penalty.pointsPerTimeout} 點了，要開始罰站 ${st.penalty.timeoutMinutes} 分鐘嗎？`, () =>
          router.push('/timeout'),
        );
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + S.md, paddingHorizontal: S.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <WhoBar showCaregiver />

        {/* 摘要 */}
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.md }}>
          <View style={{ flex: 1 }}>
            <Card t="yellow" style={{ alignItems: 'center', paddingVertical: S.sm }}>
              <T size={13} color={C.text}>
                {child.emoji} {child.name} 的貼紙
              </T>
              <T size={26} weight="900">
                ⭐ {balance}
              </T>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card t="white" style={{ alignItems: 'center', paddingVertical: S.sm }}>
              <T size={13} color={C.textSoft}>
                今天的罰點
              </T>
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6 }}>
                {Array.from({ length: penalty.pointsPerTimeout }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: i < points ? C.red : C.grey,
                      borderWidth: 2,
                      borderColor: i < points ? C.redEdge : C.greyEdge,
                    }}
                  />
                ))}
              </View>
              <T size={13} weight="800">
                {points} / {penalty.pointsPerTimeout}
              </T>
            </Card>
          </View>
        </View>
        <T size={12} color={C.textSoft} center style={{ marginTop: S.sm }}>
          罰點滿 {penalty.pointsPerTimeout} 點 → 罰站 {penalty.timeoutMinutes} 分鐘
        </T>

        {/* 好行為 */}
        <SectionTitle>👍 做得好 → 給貼紙</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
          {good.map((g) => (
            <Btn3D key={g.id} t="green" style={{ width: '31.5%', flexGrow: 1 }} onPress={() => onGood(g)} faceStyle={{ paddingHorizontal: 6 }}>
              <T size={34}>{g.emoji}</T>
              <T size={14} weight="800" color="#fff" center numberOfLines={2}>
                {g.title}
              </T>
              <T size={13} weight="800" color="#fff">
                +{g.stickers} ⭐
              </T>
            </Btn3D>
          ))}
        </View>

        {/* 壞行為 */}
        <SectionTitle>🙅 要改的行為（提醒 → 警告 → 罰點）</SectionTitle>
        <View style={{ gap: S.md }}>
          {bad.map((b) => {
            const stage = ladderStage(events, child.id, b.id, penalty);
            return (
              <Card key={b.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                  <T size={32}>{b.emoji}</T>
                  <View style={{ flex: 1 }}>
                    <T size={18} weight="800">
                      {b.title}
                    </T>
                  </View>
                  {stage > 0 && (
                    <Pressable
                      hitSlop={8}
                      onPress={() => {
                        tap();
                        resetLadder(b);
                      }}>
                      <T size={13} color={C.textSoft} style={{ textDecorationLine: 'underline' }}>
                        重新開始
                      </T>
                    </Pressable>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 6, marginVertical: S.sm }}>
                  {STEPS.map((label, i) => {
                    const active = i === stage;
                    const passed = i < stage;
                    return (
                      <View
                        key={label}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          paddingVertical: 6,
                          borderRadius: R.pill,
                          backgroundColor: active ? tone(STEP_TONE[i]).face : passed ? C.grey : C.bg,
                          borderWidth: 2,
                          borderColor: active ? tone(STEP_TONE[i]).edge : C.line,
                        }}>
                        <T size={12} weight="800" color={active ? '#fff' : C.textSoft}>
                          {passed ? '✓ ' : ''}
                          {i + 1}. {label}
                        </T>
                      </View>
                    );
                  })}
                </View>

                {b.script ? (
                  <View style={{ backgroundColor: C.bg, borderRadius: R.sm, padding: S.sm, marginBottom: S.sm }}>
                    <T size={14} color={C.textSoft}>
                      大人說：{b.script}
                    </T>
                  </View>
                ) : null}

                <Btn3D t={STEP_TONE[stage]} onPress={() => onBad(b)}>
                  <T size={18} weight="900" color={stage === 0 ? C.text : '#fff'}>
                    {BTN_LABEL[stage]}
                  </T>
                </Btn3D>
              </Card>
            );
          })}
        </View>
      </ScrollView>
      {toast.node}
    </View>
  );
}
