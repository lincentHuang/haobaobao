import { router } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, View } from 'react-native';

import { Card, T, tap } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useStore } from '@/domain/store';
import { syncStatus } from '@/domain/sync';
import { supabase } from '@/lib/supabase';

const STATUS = {
  off: { text: '純本機', color: C.textSoft },
  connecting: { text: '連線中…', color: C.orangeEdge },
  online: { text: '已同步', color: C.greenEdge },
  error: { text: '離線，連上網路會自動補傳', color: C.redEdge },
} as const;

/** 規則頁頂部：家庭同步狀態與邀請碼 */
export function FamilyCard() {
  const family = useStore((s) => s.family);
  const pending = useStore((s) => s.outbox.length + (s.configDirty ? 1 : 0));
  const status = useSyncExternalStore(syncStatus.subscribe, syncStatus.get);

  if (!supabase) {
    return (
      <Card style={{ marginTop: S.md }}>
        <T size={15} weight="800">
          ☁️ 家庭同步尚未設定
        </T>
        <T size={13} color={C.textSoft} style={{ marginTop: 4 }}>
          目前資料只存在這台裝置。
        </T>
      </Card>
    );
  }

  const st = STATUS[status];
  return (
    <Pressable
      onPress={() => {
        tap();
        router.push('/family');
      }}
      style={{ marginTop: S.md }}>
      <Card style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T size={16} weight="900">
            ☁️ {family ? family.name : '全家一起用'}
          </T>
          <T size={13} weight="800" color={family ? st.color : C.textSoft}>
            {family ? st.text : '尚未加入家庭'}
          </T>
        </View>
        {family ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
            <T size={13} color={C.textSoft}>
              邀請碼
            </T>
            <View style={{ backgroundColor: C.bg, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 4 }}>
              <T size={18} weight="900" style={{ letterSpacing: 3 }}>
                {family.inviteCode}
              </T>
            </View>
            {pending > 0 && (
              <T size={12} color={C.textSoft}>
                {pending} 筆待上傳
              </T>
            )}
          </View>
        ) : (
          <T size={13} color={C.textSoft}>
            建立家庭或輸入邀請碼，全家手機的紀錄就會同步 →
          </T>
        )}
      </Card>
    </Pressable>
  );
}
