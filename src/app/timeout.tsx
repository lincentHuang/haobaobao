import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Btn3D, T } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { useStore } from '@/domain/store';

const RING = 280;

export default function Timeout() {
  const router = useRouter();
  const minutes = useStore((s) => s.penalty.timeoutMinutes);
  const finishTimeout = useStore((s) => s.finishTimeout);
  const total = minutes * 60_000;

  const [endAt, setEndAt] = useState(() => Date.now() + total);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const finished = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const left = pausedLeft ?? Math.max(0, endAt - now);
  const done = left <= 0;
  const paused = pausedLeft !== null;

  const togglePause = () => {
    if (paused) {
      setEndAt(Date.now() + pausedLeft!);
      setPausedLeft(null);
    } else {
      setPausedLeft(Math.max(0, endAt - Date.now()));
    }
  };
  const restart = () => {
    setPausedLeft(null);
    setEndAt(Date.now() + total);
    setNow(Date.now());
  };
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    finishTimeout();
    router.back();
  }, [finishTimeout, router]);

  const early = () => {
    const msg = '確定要提早結束罰站嗎？';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) finish();
    } else {
      Alert.alert(msg, undefined, [
        { text: '取消', style: 'cancel' },
        { text: '提早結束', onPress: finish },
      ]);
    }
  };

  const secs = Math.ceil(left / 1000);
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const scale = done ? 1 : 0.25 + 0.75 * (left / total);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: done ? '#EAF6EC' : '#E8E4FF' }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: S.md }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <T size={14} color={C.textSoft}>
            取消
          </T>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.lg }}>
        {done ? (
          <>
            <Text style={{ fontSize: 120 }}>🎉</Text>
            <T size={40} weight="900" color={C.greenEdge}>
              做得好！
            </T>
          </>
        ) : (
          <>
            <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  position: 'absolute',
                  width: RING,
                  height: RING,
                  borderRadius: RING / 2,
                  borderWidth: 4,
                  borderColor: C.purple,
                  opacity: 0.35,
                }}
              />
              <View
                style={{
                  width: RING,
                  height: RING,
                  borderRadius: RING / 2,
                  backgroundColor: C.purple,
                  borderBottomWidth: 10,
                  borderColor: C.purpleEdge,
                  transform: [{ scale }],
                }}
              />
              <Text style={{ position: 'absolute', fontSize: 64, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] }}>{mmss}</Text>
            </View>
            <T size={20} weight="800" color={C.purpleEdge} center>
              安靜站好，時間到就可以玩囉
            </T>
          </>
        )}
      </View>

      <View style={{ paddingHorizontal: S.lg, paddingBottom: S.md, gap: S.md }}>
        {done ? (
          <Btn3D t="green" depth={8} onPress={finish} faceStyle={{ paddingVertical: 20 }}>
            <T size={28} weight="900" color="#fff">
              完成
            </T>
          </Btn3D>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: S.md }}>
              <Btn3D t="blue" style={{ flex: 1 }} onPress={togglePause}>
                <T size={18} weight="800" color="#fff">
                  {paused ? '▶️ 繼續' : '⏸️ 暫停'}
                </T>
              </Btn3D>
              <Btn3D t="orange" style={{ flex: 1 }} onPress={restart}>
                <T size={18} weight="800" color="#fff">
                  🔄 重新開始
                </T>
              </Btn3D>
            </View>
            <Pressable onPress={early} hitSlop={8} style={{ alignItems: 'center', padding: S.sm }}>
              <T size={14} color={C.textSoft}>
                提早結束
              </T>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
