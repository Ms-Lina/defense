import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@/lib/auth-context";
import { colors } from "@/theme";

// Give native bridge and (in dev) Metro time to stabilize before redirecting
const MIN_READY_MS = 400;
const SLOW_LOAD_MS = 12000;

export default function Index() {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setReady(true), MIN_READY_MS);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    const t = setTimeout(() => setSlowLoad(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (typeof SplashScreen.hideAsync === "function") {
        SplashScreen.hideAsync().catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [ready]);

  if (loading || !ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        {slowLoad && (
          <View style={styles.slowHint}>
            <Text style={styles.slowHintText}>
              Birakomeza. In dev: fungura Metro (npx expo start).
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    ...(Platform.OS === "web" ? { minHeight: "100vh" } : {}),
  } as Record<string, unknown>,
  slowHint: { marginTop: 24, paddingHorizontal: 24 },
  slowHintText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },
});
