import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { T, tap } from '@/components/ui';
import { C, R, S } from '@/constants/theme';

type ToastData = { message: string; onUndo?: () => void; key: number };

/** 小提示條：回傳 show() 與要放在畫面底部的 node，約 4 秒自動消失 */
export function useToast(ms = 4000) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(
    (message: string, onUndo?: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, onUndo, key: Date.now() });
      timer.current = setTimeout(() => setToast(null), ms);
    },
    [ms],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const node = toast ? (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: S.md, right: S.md, bottom: S.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: S.sm,
          backgroundColor: C.text,
          borderRadius: R.md,
          paddingVertical: 12,
          paddingHorizontal: S.md,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 6,
        }}>
        <View style={{ flex: 1 }}>
          <T size={15} weight="700" color="#fff">
            {toast.message}
          </T>
        </View>
        {toast.onUndo && (
          <Pressable
            onPress={() => {
              tap();
              toast.onUndo?.();
              hide();
            }}
            style={{ backgroundColor: C.yellow, borderRadius: R.pill, paddingVertical: 6, paddingHorizontal: 14 }}>
            <T size={14} weight="800" color={C.text}>
              復原
            </T>
          </Pressable>
        )}
      </View>
    </View>
  ) : null;

  return { show, hide, node };
}
