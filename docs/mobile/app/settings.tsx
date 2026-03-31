import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";

const SETTINGS_ITEMS = [
  { icon: "notifications" as const, label: "Amatangazo", route: null },
  { icon: "volume-high" as const, label: "Ijwi", route: null },
  { icon: "help-circle" as const, label: "Ubufasha", route: "/help" },
  { icon: "information-circle" as const, label: "Ibitwerekeye", route: "/about" },
];

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: colors.foreground }}>Igenamiterere</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => item.route && router.push(item.route as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: spacing.md,
              backgroundColor: colors.card,
              borderRadius: borderRadius.md,
              marginBottom: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
              gap: spacing.md,
            }}
          >
            <Ionicons name={item.icon} size={22} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: fontSize.base, color: colors.foreground }}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
