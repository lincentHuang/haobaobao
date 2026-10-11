import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Share, View } from 'react-native';

import { Field, TextField, askConfirm, notify } from '@/components/settings/common';
import { Btn3D, Card, T } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { useStore } from '@/domain/store';
import { createFamily, joinFamily, leaveFamily } from '@/domain/sync';
import { supabase } from '@/lib/supabase';

export default function FamilyScreen() {
  const family = useStore((s) => s.family);
  const [name, setName] = useState('我們家');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await fn();
      notify(done);
    } catch (e) {
      notify('沒有成功', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!supabase) {
    return (
      <View style={{ flex: 1, padding: S.lg }}>
        <T>雲端尚未設定。</T>
      </View>
    );
  }

  if (family) {
    return (
      <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }}>
        <Card style={{ alignItems: 'center', gap: S.sm }}>
          <T size={16} color={C.textSoft}>
            {family.name} 的邀請碼
          </T>
          <T size={44} weight="900" style={{ letterSpacing: 8 }}>
            {family.inviteCode}
          </T>
          <T size={13} color={C.textSoft} center>
            其他照顧者在自己的手機打開「好習慣」→ 規則 → 家庭同步，輸入這組邀請碼就能加入。
          </T>
        </Card>
        <Btn3D
          t="blue"
          onPress={() => Share.share({ message: `一起用「好習慣」記錄小孩的好行為！家庭邀請碼：${family.inviteCode}` })}>
          <T size={18} weight="900" color="#fff">
            📤 傳邀請碼給家人
          </T>
        </Btn3D>
        <Btn3D
          t="white"
          onPress={() =>
            askConfirm('離開家庭？', '這台裝置將停止同步，雲端上的資料會保留。', '離開', () => {
              leaveFamily();
              router.back();
            })
          }>
          <T size={15} weight="800" color={C.redEdge}>
            讓這台裝置離開家庭
          </T>
        </Btn3D>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: S.lg, gap: S.lg }} keyboardShouldPersistTaps="handled">
      <T size={14} color={C.textSoft}>
        全家共用一個「家庭」，每個人的手機記錄都會即時同步。不需要帳號密碼。
      </T>

      <Card style={{ gap: S.sm }}>
        <T size={18} weight="900">
          🏠 第一次用：建立家庭
        </T>
        <T size={13} color={C.textSoft}>
          這台裝置目前的規則和紀錄會成為全家的起點。
        </T>
        <Field label="家庭名稱">
          <TextField value={name} onChangeText={setName} maxLength={20} />
        </Field>
        <Btn3D t="green" disabled={busy} onPress={() => run(() => createFamily(name), '家庭建立好了！把邀請碼傳給家人吧')}>
          <T size={18} weight="900" color="#fff">
            建立家庭
          </T>
        </Btn3D>
      </Card>

      <Card style={{ gap: S.sm }}>
        <T size={18} weight="900">
          🔑 家人已經建立了：輸入邀請碼
        </T>
        <T size={13} color={C.textSoft}>
          加入後會改用家庭的規則與紀錄，這台裝置原本的紀錄不會上傳。
        </T>
        <Field label="邀請碼（6 碼）">
          <TextField value={code} onChangeText={(t) => setCode(t.toUpperCase())} maxLength={6} placeholder="例如 7KQ2MX" />
        </Field>
        <Btn3D
          t="orange"
          disabled={busy || code.trim().length !== 6}
          onPress={() => run(() => joinFamily(code), '加入成功！')}>
          <T size={18} weight="900" color="#fff">
            加入家庭
          </T>
        </Btn3D>
      </Card>

      {busy && <ActivityIndicator color={C.orange} />}
    </ScrollView>
  );
}
