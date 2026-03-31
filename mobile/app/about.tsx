import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";

export default function AboutScreen() {
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
        <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: colors.foreground }}>
          Ibitwerekeye
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginTop: spacing.xl,
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons name="book" size={40} color={colors.primaryForeground} />
        </View>
        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: colors.foreground, marginBottom: spacing.xs }}>
          MenyAI
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.xl }}>
          Verisiyo 1.0.0
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            width: "100%",
            maxWidth: 400,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: fontSize.base, color: colors.foreground, lineHeight: 24, textAlign: "center" }}>
            MenyAI ni porogaramu yo kwiga gusoma no kwandika mu Kinyarwanda, yateguwe kugira ngo abanyarwanda
            bose bashobore gukoresha neza ururimi rwabo.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: spacing.lg,
            marginTop: spacing.md,
          }}
        >
          <TouchableOpacity
            onPress={() => {}}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
            }}
          >
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: "500" }}>
              Amategeko
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {}}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
            }}
          >
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: "500" }}>
              Ibyabujijwe
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
