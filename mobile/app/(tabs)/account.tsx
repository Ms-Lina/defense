import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius, cardShadow } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { SpeakableLabel } from "@/components/SpeakableLabel";

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Siba konti",
      "Urabyemeye gukura konti yawe byuze. Ibi byose (amasomo, iterambere) bizasibwa ntakiringo. Emeza?",
      [
        { text: "Oya", style: "cancel" },
        {
          text: "Yego, siba konti",
          style: "destructive",
          onPress: async () => {
            const token = user ? await user.getIdToken() : null;
            const result = await api.deleteAccount(token);
            if (result.ok) {
              await logout();
              router.replace("/login");
            } else {
              Alert.alert("Byabuze", result.message ?? "Ntabwo twashoboye gusiba konti. Gerageza nyuma.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: colors.primaryMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>
        </View>
        <SpeakableLabel
          speakText="Konti"
          variant="button"
          textStyle={{ fontSize: fontSize["2xl"], fontWeight: "700", color: colors.foreground }}
        />
        <View style={{ marginTop: spacing.xs, alignSelf: "stretch", alignItems: "center" }}>
          <SpeakableLabel
            speakText="Hindura amakuru kuri konti yawe"
            variant="inline"
            textStyle={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: "center" }}
            iconColor={colors.mutedForeground}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={{
            marginTop: spacing.xl,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: spacing.lg,
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            width: "100%",
            maxWidth: 400,
            ...cardShadow({ color: "#000", offset: { width: 0, height: 2 }, opacity: 0.08, radius: 8 }),
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Ionicons name="person" size={24} color={colors.primary} />
            <SpeakableLabel speakText="Guhindura amakuru" variant="button" textStyle={{ fontSize: fontSize.base, fontWeight: "600", color: colors.foreground }} />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={{
            marginTop: spacing.xl,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: spacing.lg,
            backgroundColor: colors.card,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            width: "100%",
            maxWidth: 400,
            ...cardShadow({ color: "#000", offset: { width: 0, height: 2 }, opacity: 0.08, radius: 8 }),
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Ionicons name="settings" size={24} color={colors.primary} />
            <SpeakableLabel speakText="Igenamiterere" variant="button" textStyle={{ fontSize: fontSize.base, fontWeight: "600", color: colors.foreground }} />
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={{
            marginTop: spacing.xl,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            alignSelf: "center",
            borderWidth: 1,
            borderColor: "#EF4444",
            borderRadius: borderRadius.md,
          }}
        >
          <SpeakableLabel speakText="Siba konti yawe" variant="inline" textStyle={{ fontSize: fontSize.sm, fontWeight: "600", color: "#EF4444" }} iconColor="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={{ marginTop: spacing.lg, paddingVertical: spacing.sm, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm }}
        >
          <SpeakableLabel speakText="Gusohoka" variant="inline" textStyle={{ fontSize: fontSize.sm, color: colors.mutedForeground }} iconColor={colors.mutedForeground}>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>Gusohoka /</Text>
          </SpeakableLabel>
          <View style={{ backgroundColor: colors.accentYellow, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm }}>
            <SpeakableLabel speakText="Injira" variant="inline" textStyle={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.foreground }} iconColor={colors.foreground} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
