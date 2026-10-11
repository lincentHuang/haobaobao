import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Btn3D, T, tap } from '@/components/ui';
import { C, R, S, palette } from '@/constants/theme';
import { newId, useStore, type CollectionKey } from '@/domain/store';
import type { BadBehavior, Caregiver, Child, GoodBehavior, Reward, Routine, RoutineStep } from '@/domain/types';

import { EmojiField, Field, Stepper, TextField, askConfirm, notify } from './common';
import { EditorModal } from './editor-modal';

export type EditKind = 'children' | 'caregivers' | 'good' | 'bad' | 'rewards' | 'routines';

type Item = Child | Caregiver | GoodBehavior | BadBehavior | Reward | Routine;

const KIND_NAME: Record<EditKind, string> = {
  children: '小孩',
  caregivers: '照顧者',
  good: '好行為',
  bad: '要改的行為',
  rewards: '獎品',
  routines: '習慣串連',
};

const SUGGEST: Record<EditKind, string[]> = {
  children: ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼', '🐯', '🦁', '🐸', '🐥', '🦄', '🐙'],
  caregivers: ['👨', '👩', '👵', '👴', '🧑', '👧', '👦', '🧔', '👱‍♀️', '👨‍🍼', '👩‍🍼', '🧑‍🍼'],
  good: ['🍚', '🧸', '🙏', '👟', '🤝', '🚽', '🦷', '😴', '🧼', '📚', '🥦', '👏'],
  bad: ['✋', '🪃', '😱', '🏃', '😡', '🍬', '📱', '🚫', '🗣️', '😤', '🙈', '💢'],
  rewards: ['🛝', '🍪', '📖', '🚗', '🍦', '🎈', '🎬', '🧁', '🎮', '🏊', '🐠', '🎁'],
  routines: ['🌙', '☀️', '🪥', '🛁', '🎒', '🍽️', '🧹', '🚌', '📖', '🧦', '🧴', '🛏️'],
};

const STEP_SUGGEST = ['🪥', '👕', '📖', '🛁', '🧼', '👟', '🎒', '🧸', '🍽️', '🚽', '💤', '🧴'];

export function ItemEditor({
  kind,
  item,
  onClose,
}: {
  kind: EditKind;
  /** null = 新增 */
  item: Item | null;
  onClose: () => void;
}) {
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const childCount = useStore((s) => s.children.length);
  const caregiverCount = useStore((s) => s.caregivers.length);

  // 父層用 key 重新掛載，所以只需要初始值
  const it = item as Partial<Child & Caregiver & GoodBehavior & BadBehavior & Reward & Routine> | null;
  const [title, setTitle] = useState(it?.title ?? it?.name ?? '');
  const [emoji, setEmoji] = useState(it?.emoji ?? SUGGEST[kind][0]);
  const [color, setColor] = useState(it?.color ?? palette[0]);
  const [birthYm, setBirthYm] = useState(it?.birthYm ?? '');
  const [script, setScript] = useState(it?.script ?? '');
  const [num, setNum] = useState(it?.stickers ?? it?.cost ?? 1);
  const [steps, setSteps] = useState<RoutineStep[]>(it?.steps ? it.steps.map((x) => ({ ...x })) : []);

  const isNew = !item;
  const name = title.trim();
  const ymOk = birthYm === '' || /^\d{4}-(0[1-9]|1[0-2])$/.test(birthYm);
  const canSave = name.length > 0 && emoji.length > 0 && ymOk && (kind !== 'routines' || steps.every((s) => s.title.trim()));

  const save = () => {
    const id = item?.id ?? newId();
    const e = emoji;
    switch (kind) {
      case 'children':
        upsert('children', { id, name, emoji: e, color, birthYm: birthYm || undefined });
        break;
      case 'caregivers':
        upsert('caregivers', { id, name, emoji: e });
        break;
      case 'good':
        upsert('good', { id, title: name, emoji: e, stickers: num });
        break;
      case 'bad':
        upsert('bad', { id, title: name, emoji: e, script: script.trim() || undefined });
        break;
      case 'rewards':
        upsert('rewards', { id, title: name, emoji: e, cost: num });
        break;
      case 'routines':
        upsert('routines', {
          id,
          title: name,
          emoji: e,
          stickers: num,
          steps: steps.map((s) => ({ ...s, title: s.title.trim() })),
        });
        break;
    }
    onClose();
  };

  const del = () => {
    if (!item) return;
    if (kind === 'children' && childCount <= 1) return notify('至少要留一位小孩');
    if (kind === 'caregivers' && caregiverCount <= 1) return notify('至少要留一位照顧者');
    askConfirm('確定刪除？', `「${name || KIND_NAME[kind]}」會被刪除，過去的紀錄仍會保留。`, '刪除', () => {
      remove(kind as CollectionKey, item.id);
      onClose();
    });
  };

  const moveStep = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    setSteps(next);
  };

  const titleLabel = kind === 'children' || kind === 'caregivers' ? '名字' : '名稱';
  const numLabel = kind === 'rewards' ? '需要幾張貼紙' : '給幾張貼紙';
  const numMax = kind === 'rewards' ? 99 : 5;

  return (
    <EditorModal
      visible
      title={`${isNew ? '新增' : '編輯'}${KIND_NAME[kind]}`}
      onSave={save}
      onCancel={onClose}
      onDelete={isNew ? undefined : del}
      canSave={canSave}>
      <Field label={titleLabel}>
        <TextField value={title} onChangeText={setTitle} placeholder={titleLabel} maxLength={20} />
      </Field>
      <EmojiField value={emoji} onChange={setEmoji} suggestions={SUGGEST[kind]} />

      {kind === 'children' && (
        <>
          <Field label="主題色">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
              {palette.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    tap();
                    setColor(c);
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: c,
                    borderWidth: 4,
                    borderColor: color === c ? C.text : '#fff',
                  }}
                />
              ))}
            </View>
          </Field>
          <Field label="出生年月（選填，格式 2024-06）">
            <TextField value={birthYm} onChangeText={setBirthYm} placeholder="YYYY-MM" keyboardType="numbers-and-punctuation" maxLength={7} />
            {!ymOk && (
              <T size={13} color={C.redEdge}>
                格式要像 2024-06
              </T>
            )}
          </Field>
        </>
      )}

      {kind === 'bad' && (
        <Field label="大人統一說法（提醒時照著說）">
          <TextField value={script} onChangeText={setScript} placeholder="例如：手是用來抱抱的，不能打人。" multiline />
        </Field>
      )}

      {(kind === 'good' || kind === 'routines' || kind === 'rewards') && (
        <Field label={numLabel}>
          <Stepper value={num} onChange={setNum} min={1} max={numMax} unit="張" />
        </Field>
      )}

      {kind === 'routines' && (
        <Field label="步驟（依順序）">
          <View style={{ gap: S.sm }}>
            {steps.map((s, i) => (
              <StepRow
                key={s.id}
                step={s}
                index={i}
                last={i === steps.length - 1}
                onChange={(n) => setSteps(steps.map((x) => (x.id === s.id ? n : x)))}
                onMove={(d) => moveStep(i, d)}
                onRemove={() => setSteps(steps.filter((x) => x.id !== s.id))}
              />
            ))}
            <Btn3D
              t="blue"
              depth={4}
              onPress={() => setSteps([...steps, { id: newId(), title: '', emoji: STEP_SUGGEST[steps.length % STEP_SUGGEST.length] }])}>
              <T size={15} weight="800" color="#fff">
                ＋ 新增步驟
              </T>
            </Btn3D>
          </View>
        </Field>
      )}
    </EditorModal>
  );
}

function StepRow({
  step,
  index,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  step: RoutineStep;
  index: number;
  last: boolean;
  onChange: (s: RoutineStep) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const small = (label: string, onPress: () => void, off?: boolean) => (
    <Pressable
      disabled={off}
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: off ? C.line : C.grey,
        opacity: off ? 0.4 : 1,
      }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ backgroundColor: C.card, borderRadius: R.md, borderWidth: 2, borderColor: C.line, padding: S.sm, gap: S.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <T size={14} weight="900" color={C.textSoft}>
          {index + 1}
        </T>
        <Pressable
          onPress={() => setPicking(!picking)}
          style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26 }}>{step.emoji}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <TextField value={step.title} onChangeText={(t) => onChange({ ...step, title: t })} placeholder="步驟名稱" maxLength={16} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
        {small('↑', () => onMove(-1), index === 0)}
        {small('↓', () => onMove(1), last)}
        {small('✕', onRemove)}
      </View>
      {picking && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {STEP_SUGGEST.map((e) => (
            <Pressable
              key={e}
              onPress={() => {
                onChange({ ...step, emoji: e });
                setPicking(false);
              }}
              style={{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
