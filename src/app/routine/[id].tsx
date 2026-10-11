import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn3D, Sticker, T, tap } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { routineProgress } from '@/domain/selectors';
import { useCurrentChild, useStore } from '@/domain/store';

function Pulse({ active, children }: { active: boolean; children: React.ReactNode }) {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = active ? withRepeat(withSequence(withTiming(1.05, { duration: 600 }), withTiming(1, { duration: 600 })), -1) : withTiming(1);
  }, [active, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

function Bounce({ emoji, delay }: { emoji: string; delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-14, { duration: 350 + delay }), withSpring(0)), -1);
  }, [y, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={style}>
      <Sticker emoji={emoji} size={64} tilt={delay % 2 ? 8 : -8} />
    </Animated.View>
  );
}

export default function RoutineRun() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const child = useCurrentChild();
  const routine = useStore((s) => s.routines.find((r) => r.id === id));
  const events = useStore((s) => s.events);
  const toggle = useStore((s) => s.toggleRoutineStep);
  const complete = useStore((s) => s.completeRoutine);
  const scrollRef = useRef<ScrollView>(null);

  const close = (
    <Pressable
      onPress={() => {
        tap();
        router.back();
      }}
      hitSlop={10}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.card, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
      <T size={22} weight="900" color={C.textSoft}>
        ✕
      </T>
    </Pressable>
  );

  if (!routine) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, padding: S.md }}>
        {close}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64 }}>🤔</Text>
          <T size={18} color={C.textSoft}>找不到這個串連</T>
        </View>
      </SafeAreaView>
    );
  }

  const { done: routineDone, steps } = routineProgress(events, child.id, routine.id);
  const currentIdx = routine.steps.findIndex((s) => !steps.has(s.id));
  const allDone = currentIdx === -1;
  const lastDoneIdx = allDone ? routine.steps.length - 1 : currentIdx - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: S.md, flexDirection: 'row', alignItems: 'center', gap: S.md }}>
        {close}
        <T size={24} weight="900">
          {routine.emoji} {routine.title}
        </T>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: S.md, alignItems: 'center', paddingBottom: S.xl * 2 }}>
        {routine.steps.map((step, i) => {
          const isDone = steps.has(step.id);
          const isCurrent = i === currentIdx && !routineDone;
          const canTap = !routineDone && (isCurrent || (isDone && i === lastDoneIdx));
          return (
            <View key={step.id} style={{ alignItems: 'center', width: '100%' }}>
              <Pulse active={isCurrent}>
                <Btn3D
                  t={isDone ? 'green' : isCurrent ? 'orange' : 'grey'}
                  depth={8}
                  radius={R.lg}
                  disabled={!canTap && !isDone}
                  onPress={() => canTap && toggle(routine, step.id, !isDone)}
                  style={{ width: 280 }}
                  faceStyle={{ paddingVertical: 10 }}>
                  <Text style={{ fontSize: 56 }}>{step.emoji}</Text>
                  <T size={24} weight="900" color="#fff">
                    {step.title} {isDone ? '✅' : ''}
                  </T>
                </Btn3D>
              </Pulse>
              {i < routine.steps.length - 1 && <Text style={{ fontSize: 28, marginVertical: 2 }}>⬇️</Text>}
            </View>
          );
        })}

        <View style={{ marginTop: S.lg, alignItems: 'center', gap: S.md, width: '100%' }}>
          {routineDone ? (
            <>
              <View style={{ flexDirection: 'row', gap: S.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                {Array.from({ length: routine.stickers }).map((_, i) => (
                  <Bounce key={i} emoji="⭐" delay={i * 120} />
                ))}
              </View>
              <T size={26} weight="900" color={C.greenEdge}>
                今天完成了！
              </T>
              <Btn3D t="blue" onPress={() => router.back()} style={{ width: 200 }}>
                <T size={20} weight="900" color="#fff">
                  關閉
                </T>
              </Btn3D>
            </>
          ) : allDone ? (
            // 按鈕一出現就捲到底，確保小孩看得到
            <View style={{ width: '100%' }} onLayout={() => scrollRef.current?.scrollToEnd({ animated: true })}>
              <Btn3D t="yellow" depth={8} onPress={() => complete(routine)} style={{ width: '100%' }} faceStyle={{ paddingVertical: 22 }}>
                <T size={28} weight="900" color={C.text}>
                  拿貼紙 ⭐ x {routine.stickers}
                </T>
              </Btn3D>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
