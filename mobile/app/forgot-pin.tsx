import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export default function ForgotPinScreen() {
  const router = useRouter();
  const { requestPinReset, error, clearError } = useAuth();
  const [phone, setPhone] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Alert.alert("", "Shyiramo nimero ya telefoni.");
      return;
    }
    if (newPin.trim().length < 6) {
      Alert.alert("", "PIN nshya: imibare 6 (6 digits).");
      return;
    }
    setLoading(true);
    clearError();
    try {
      await requestPinReset(trimmedPhone, newPin);
      Alert.alert(
        "PIN nshya yashyizwe",
        "Injira ubu ukoze PIN nshya.",
        [{ text: "Injira", onPress: () => router.replace("/login") }]
      );
    } catch {
      // error shown via useAuth().error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: spacing.lg }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: colors.foreground, marginBottom: spacing.xs }}>
          Wibagiwe PIN?
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.lg }}>
          Shyiramo nimero ya telefoni na PIN nshya. Uzahita ushobora kwinjira ukoze PIN nshya.
        </Text>

        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>
          1. Nimero ya telefoni
        </Text>
        <Input
          label="Telefoni"
          placeholder="Urugero: 07xx xxx xxx"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          containerStyle={{ marginBottom: spacing.lg }}
        />

        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>
          2. PIN nshya (imibare 6)
        </Text>
        <Input
          label="PIN nshya"
          placeholder="Imibare 6"
          value={newPin}
          onChangeText={setNewPin}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={6}
          containerStyle={{ marginBottom: spacing.lg }}
        />

        {error ? (
          <Text style={{ fontSize: fontSize.sm, color: colors.warning, marginBottom: spacing.md }}>
            {error}
          </Text>
        ) : null}

        <Button
          title="Emeza PIN nshya"
          onPress={handleReset}
          loading={loading}
          style={{ marginBottom: spacing.md }}
        />

        <TouchableOpacity onPress={() => router.back()} style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: spacing.sm }}>
          <Text style={{ fontSize: fontSize.sm, color: colors.foreground }}>Subiza kuri</Text>
          <View style={{ backgroundColor: colors.accentYellow, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.foreground }}>Injira</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
