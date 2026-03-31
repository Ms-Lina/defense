import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";

const FAQ_ITEMS = [
  {
    q: "Ni iki MenyAI?",
    a: "MenyAI ni porogaramu yo kwiga gusoma no kwandika mu Kinyarwanda. Yateguwe kugira ngo abanyarwanda bose bashobore gusoma no kwandika neza.",
  },
  {
    q: "Ntangira he?",
    a: "Tangira kuri Amasomo yibanze. Usomye isomo, ugiye kuyiga, hanyuma ukora ibyatoranyijwe (Iyitoze).",
  },
  {
    q: "Nashobora kuvugana na we ute?",
    a: "Twandikira kuri support@kwiga.rw cyangwa usubire amakuru ku konti yacu.",
  },
  {
    q: "Ibitero byanjye niba bigenda he?",
    a: "Ibitero byose bigenzura kuri Iterambere. Kanda kuri Iterambere kugira ngo ubone nkenera wiyandikisha.",
  },
];

export default function HelpScreen() {
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
          Ubufasha
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: colors.primaryMuted,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
          }}
        >
          <Ionicons name="help-circle" size={40} color={colors.primary} />
          <Text style={{ flex: 1, fontSize: fontSize.base, color: colors.foreground }}>
            Ikibazo cyawe kitarabonetse? Reba ibi bikurikira cyangwa twandikire.
          </Text>
        </View>

        {FAQ_ITEMS.map((item, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              marginBottom: spacing.sm,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: colors.foreground, marginBottom: spacing.sm }}>
              {item.q}
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, lineHeight: 22 }}>
              {item.a}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => {}}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            padding: spacing.lg,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.md,
            marginTop: spacing.md,
          }}
        >
          <Ionicons name="mail" size={20} color={colors.primaryForeground} />
          <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: colors.primaryForeground }}>
            Twandikire
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
