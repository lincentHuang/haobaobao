import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { C } from '@/constants/theme';
import { useStore } from '@/domain/store';
import { startSync } from '@/domain/sync';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 等本機資料讀回再顯示，避免先看到空畫面或在讀回前的操作被覆蓋
  const hydrated = useSyncExternalStore(useStore.persist.onFinishHydration, useStore.persist.hasHydrated);
  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync();
    startSync();
  }, [hydrated]);
  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: C.bg },
          headerTintColor: C.text,
          contentStyle: { backgroundColor: C.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="timeout" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="routine/[id]" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="family" options={{ presentation: 'modal', title: '家庭同步' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
