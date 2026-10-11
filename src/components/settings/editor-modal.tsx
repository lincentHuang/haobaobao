import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn3D, T } from '@/components/ui';
import { C, S } from '@/constants/theme';

/** 編輯用的 Modal 外殼：標題 + 內容 + 儲存/刪除/取消 */
export function EditorModal({
  visible,
  title,
  onSave,
  onCancel,
  onDelete,
  canSave = true,
  children,
}: {
  visible: boolean;
  title: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  canSave?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={ios ? 'pageSheet' : 'fullScreen'}
      transparent={false}
      onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={ios ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ paddingTop: ios ? S.md : insets.top + S.sm, paddingHorizontal: S.md, paddingBottom: S.sm }}>
          <T size={22} weight="900" center>
            {title}
          </T>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: S.md, paddingBottom: S.xl }}>
          {children}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: S.sm, padding: S.md, paddingBottom: ios ? S.md : insets.bottom + S.md }}>
          <Btn3D t="grey" onPress={onCancel} style={{ flex: 1 }}>
            <T size={16} weight="800">
              取消
            </T>
          </Btn3D>
          {onDelete && (
            <Btn3D t="red" onPress={onDelete} style={{ flex: 1 }}>
              <T size={16} weight="800" color="#fff">
                刪除
              </T>
            </Btn3D>
          )}
          <Btn3D t="green" onPress={onSave} disabled={!canSave} style={{ flex: 1.4 }}>
            <T size={16} weight="900" color="#fff">
              儲存
            </T>
          </Btn3D>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
