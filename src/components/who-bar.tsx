import { Pressable, ScrollView, View } from 'react-native';

import { T, tap } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useStore } from '@/domain/store';

/** 頂部：切換小孩；showCaregiver 時也顯示「現在是誰在記」 */
export function WhoBar({ showCaregiver }: { showCaregiver?: boolean }) {
  const children = useStore((s) => s.children);
  const caregivers = useStore((s) => s.caregivers);
  const childId = useStore((s) => s.currentChildId);
  const caregiverId = useStore((s) => s.currentCaregiverId);
  const setChild = useStore((s) => s.setCurrentChild);
  const setCaregiver = useStore((s) => s.setCurrentCaregiver);

  return (
    <View style={{ gap: S.sm }}>
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
          {children.map((c) => (
            <Chip key={c.id} active={c.id === childId} color={c.color} onPress={() => setChild(c.id)} label={`${c.emoji} ${c.name}`} />
          ))}
        </ScrollView>
      )}
      {showCaregiver && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
          <T size={13} color={C.textSoft} style={{ flexShrink: 0 }}>
            記錄人
          </T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
            {caregivers.map((g) => (
              <Chip key={g.id} small active={g.id === caregiverId} color={C.blue} onPress={() => setCaregiver(g.id)} label={`${g.emoji} ${g.name}`} />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function Chip({ label, active, color, onPress, small }: { label: string; active: boolean; color: string; onPress: () => void; small?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={{
        paddingVertical: small ? 5 : 8,
        paddingHorizontal: small ? 10 : 14,
        borderRadius: R.pill,
        backgroundColor: active ? color : C.card,
        borderWidth: 2,
        borderColor: active ? color : C.line,
      }}>
      <T size={small ? 13 : 15} weight="700" color={active ? '#fff' : C.text}>
        {label}
      </T>
    </Pressable>
  );
}
