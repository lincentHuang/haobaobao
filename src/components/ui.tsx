import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { C, R, S, font, tone, type Tone } from '@/constants/theme';

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** 立體按鈕：底下有一層深色「底邊」，按下時表面往下沉 */
export function Btn3D({
  children,
  onPress,
  t = 'orange',
  depth = 6,
  radius = R.md,
  style,
  faceStyle,
  disabled,
}: {
  children: ReactNode;
  onPress?: () => void;
  t?: Tone;
  depth?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const { face, edge } = tone(disabled ? 'grey' : t);
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={style}>
      {({ pressed }) => (
        <View style={{ borderRadius: radius, backgroundColor: edge, flexGrow: 1 }}>
          <View
            style={[
              styles.face,
              {
                flexGrow: 1,
                borderRadius: radius,
                backgroundColor: face,
                marginTop: pressed ? depth - 1 : 0,
                marginBottom: pressed ? 1 : depth,
              },
              faceStyle,
            ]}>
            {children}
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** 立體卡片（不可按） */
export function Card({ children, style, t = 'white' }: { children: ReactNode; style?: StyleProp<ViewStyle>; t?: Tone }) {
  const { face, edge } = tone(t);
  return (
    <View style={{ borderRadius: R.lg, backgroundColor: edge, paddingBottom: 5 }}>
      <View style={[{ borderRadius: R.lg, backgroundColor: face, padding: S.md }, style]}>{children}</View>
    </View>
  );
}

export function T({
  children,
  size = 16,
  weight = '600',
  color = C.text,
  style,
  center,
  numberOfLines,
}: {
  children: ReactNode;
  size?: number;
  weight?: TextStyle['fontWeight'];
  color?: string;
  style?: StyleProp<TextStyle>;
  center?: boolean;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontSize: size, fontWeight: weight, color, fontFamily: font, textAlign: center ? 'center' : undefined }, style]}>
      {children}
    </Text>
  );
}

/** 一張「貼紙」：白邊圓形 + emoji，有點歪斜像真的貼上去 */
export function Sticker({ emoji, size = 56, tilt = 0, dim }: { emoji: string; size?: number; tilt?: number; dim?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dim ? C.grey : '#fff',
        borderWidth: 3,
        borderColor: dim ? C.greyEdge : C.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: `${tilt}deg` }],
        shadowColor: '#7a5a2a',
        shadowOpacity: 0.25,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
        opacity: dim ? 0.5 : 1,
      }}>
      <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.lg, marginBottom: S.sm }}>
      <T size={18} weight="800">
        {children}
      </T>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16 },
});
