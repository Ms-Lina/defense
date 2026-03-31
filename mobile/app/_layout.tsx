import { useEffect } from "react";
import { View, Platform, StyleSheet, type ViewStyle } from "react-native";
import { Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

try {
  SplashScreen.preventAutoHideAsync();
} catch {
  // ignore if splash not available (e.g. in some dev environments)
}

// Force-hide splash after 3s so we never stay stuck on native splash if JS fails to hide it
function useForceHideSplash() {
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (typeof SplashScreen.hideAsync === "function") {
          SplashScreen.hideAsync().catch(() => {});
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);
}

const rootStyles = StyleSheet.create({
  root: {
    flex: 1,
    ...(Platform.OS === "web" ? { minHeight: "100vh" } : {}),
  } as ViewStyle,
});

export default function RootLayout() {
  useForceHideSplash();
  const segments = useSegments();
  const isInTabs = segments[0] === "(tabs)";
  const showBottomNav = isInTabs;

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <View style={rootStyles.root}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
          {showBottomNav && <BottomNav />}
        </View>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
