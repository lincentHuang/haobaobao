import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { C, font } from '@/constants/theme';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
        tabBarActiveTintColor: C.orangeEdge,
        tabBarInactiveTintColor: C.textSoft,
        tabBarLabelStyle: { fontFamily: font, fontWeight: '700', fontSize: 11 },
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line, height: 84, paddingTop: 6 },
      }}>
      <Tabs.Screen name="index" options={{ title: '貼紙板', tabBarIcon: icon('⭐') }} />
      <Tabs.Screen name="record" options={{ title: '記錄', tabBarIcon: icon('✍️') }} />
      <Tabs.Screen name="rewards" options={{ title: '獎品', tabBarIcon: icon('🎁') }} />
      <Tabs.Screen name="history" options={{ title: '時間軸', tabBarIcon: icon('📜') }} />
      <Tabs.Screen name="settings" options={{ title: '規則', tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
