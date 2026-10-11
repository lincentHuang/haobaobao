import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { T, tap } from '@/components/ui';
import { C, R, S, font } from '@/constants/theme';

/** 跨平台確認框 */
export function askConfirm(title: string, message: string, okText: string, onOk: () => void, destructive = true) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: '取消', style: 'cancel' },
    { text: okText, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6, marginBottom: S.md }}>
      <T size={14} weight="800" color={C.textSoft}>
        {label}
      </T>
      {children}
    </View>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  maxLength,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numbers-and-punctuation';
  maxLength?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.greyEdge}
      multiline={multiline}
      keyboardType={keyboardType}
      maxLength={maxLength}
      style={{
        backgroundColor: C.card,
        borderWidth: 2,
        borderColor: C.line,
        borderRadius: R.md,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 17,
        color: C.text,
        fontFamily: font,
        minHeight: multiline ? 80 : undefined,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  );
}

/** 表情符號：可自己輸入/貼上，下方一排建議 */
export function EmojiField({ value, onChange, suggestions }: { value: string; onChange: (s: string) => void; suggestions: string[] }) {
  return (
    <Field label="圖案（可自己輸入或貼上一個表情符號）">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
        <TextInput
          value={value}
          onChangeText={(s) => onChange(lastGlyph(s))}
          placeholder="🙂"
          style={{
            width: 72,
            height: 64,
            textAlign: 'center',
            fontSize: 36,
            backgroundColor: C.card,
            borderWidth: 2,
            borderColor: C.line,
            borderRadius: R.md,
          }}
        />
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {suggestions.map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                tap();
                onChange(e);
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: value === e ? C.yellow : C.card,
                borderWidth: 2,
                borderColor: value === e ? C.yellowEdge : C.line,
              }}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Field>
  );
}

/** 取最後輸入的一個「字」（盡量保留完整 emoji 序列） */
function lastGlyph(s: string): string {
  const t = s.trim();
  if (!t) return '';
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) {
    const parts = Array.from(new Seg(undefined, { granularity: 'grapheme' }).segment(t), (x) => x.segment);
    return parts[parts.length - 1] ?? '';
  }
  return Array.from(t).slice(-1)[0] ?? '';
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}) {
  const btn = (label: string, next: number, disabled: boolean) => (
    <Pressable
      disabled={disabled}
      onPress={() => {
        tap();
        onChange(next);
      }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? C.grey : C.orange,
        borderBottomWidth: 4,
        borderBottomColor: disabled ? C.greyEdge : C.orangeEdge,
      }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff' }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.md }}>
      {btn('−', Math.max(min, value - step), value <= min)}
      <T size={24} weight="900" style={{ minWidth: 70, textAlign: 'center' }}>
        {value}
        {unit ? ` ${unit}` : ''}
      </T>
      {btn('＋', Math.min(max, value + step), value >= max)}
    </View>
  );
}
