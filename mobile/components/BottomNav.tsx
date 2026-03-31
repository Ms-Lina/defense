import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize } from "@/theme";
import { cardShadow } from "@/lib/shadowStyles";
import { speakKinyarwanda, playVoiceAsset } from "@/lib/speech";
import { voiceAssets } from "@/lib/voiceAssets";

const TABS = [
  { key: "index", route: "/(tabs)", label: "Ahabanza", icon: "home" as const },
  { key: "lessons", route: "/(tabs)/lessons", label: "Amasomo", icon: "book" as const },
  { key: "progress", route: "/(tabs)/progress", label: "Iterambere", icon: "stats-chart" as const },
  { key: "account", route: "/(tabs)/account", label: "Konti", icon: "person" as const },
] as const;

const TAB_AUDIO: Partial<Record<(typeof TABS)[number]["key"], number>> = {
  lessons: voiceAssets.amasomo,
  progress: voiceAssets.iterambere,
};

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === "/(tabs)") return pathname === "/(tabs)" || pathname === "/(tabs)/" || pathname.includes("/(tabs)/index");
    return pathname.includes(route);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: 24,
        paddingHorizontal: 8,
        height: 64,
        ...cardShadow({ offset: { width: 0, height: -2 }, radius: 8 }),
        elevation: 8,
      }}
    >
      {TABS.map((tab) => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => router.push(tab.route as any)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: active ? "rgba(45, 155, 95, 0.1)" : "transparent",
            }}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={active ? colors.primary : colors.mutedForeground}
            />
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 2 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: active ? colors.primary : colors.mutedForeground,
                }}
              >
                {tab.label}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const clip = TAB_AUDIO[tab.key];
                  if (clip != null) void playVoiceAsset(clip);
                  else speakKinyarwanda(tab.label);
                }}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`Tege amatwi: ${tab.label}`}
              >
                <Ionicons name="volume-medium" size={14} color={active ? colors.primary : colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
