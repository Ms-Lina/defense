import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { db, auth } from "@/lib/firebase";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy";
import {
  INTARA_OPTIONS,
  INTARA_TO_AKARERE,
  AKARERE_TO_UMURENGE,
} from "@/lib/rwanda-admin";

/** Derive phone from auth email (phone stored as digits@menyai.local) */
function phoneFromAuthEmail(email: string | null | undefined): string {
  if (!email || !email.endsWith("@menyai.local")) return "";
  const digits = email.replace(/@menyai\.local$/, "");
  if (digits.length >= 9) return `+${digits}`;
  return "";
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [intara, setIntara] = useState("");
  const [akarere, setAkarere] = useState("");
  const [umurenge, setUmurenge] = useState("");
  const [showIntaraPicker, setShowIntaraPicker] = useState(false);
  const [showAkarerePicker, setShowAkarerePicker] = useState(false);
  const [showUmurengePicker, setShowUmurengePicker] = useState(false);
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    const authPhone = phoneFromAuthEmail(user.email);
    const authName = user.displayName ?? "";

    const load = async () => {
      setLoading(true);
      setError("");
      setName(authName);
      setContact(authPhone);
      try {
        const profileSnap = await getDoc(doc(db(), "userProfiles", user.uid));
        const data = profileSnap.exists() ? profileSnap.data() : {};
        setName(data?.name ?? authName);
        setContact(data?.contact ?? authPhone);
        setIntara(data?.intara ?? data?.sector ?? "");
        setAkarere(data?.akarere ?? "");
        setUmurenge(data?.umurenge ?? "");
        setAge(data?.age != null ? String(data.age) : "");
      } catch (e) {
        setError(copy.profile.loadError);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, user?.displayName, user?.email]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    setError("");
    try {
      const profileData: Record<string, unknown> = {
        name: name.trim() || null,
        contact: contact.trim() || null,
        sector: intara || null,
        intara: intara || null,
        akarere: akarere || null,
        umurenge: umurenge || null,
        age: age.trim() ? parseInt(age, 10) : null,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db(), "userProfiles", user.uid), profileData, { merge: true });
      if (name.trim()) {
        await updateProfile(auth().currentUser!, { displayName: name.trim() });
      }
      router.back();
    } catch (e) {
      setError(copy.profile.saveError);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    router.replace("/login");
    return null;
  }

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
          Guhindura amakuru
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            alignItems: "center",
            marginBottom: spacing.xl,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.primaryMuted,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: spacing.md,
            }}
          >
            <Ionicons name="person" size={44} color={colors.primary} />
          </View>
        </View>

        {loading ? (
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: "center" }}>
            Bireba amakuru…
          </Text>
        ) : (
          <>
            <Input
              label="Amazina"
              value={name}
              onChangeText={setName}
              placeholder="Andika amazina yawe"
              autoCapitalize="words"
              containerStyle={{ marginBottom: spacing.md }}
            />
            <Input
              label="Telefoni / Konti"
              value={contact}
              onChangeText={setContact}
              placeholder="+250 7xx xxx xxx"
              keyboardType="phone-pad"
              containerStyle={{ marginBottom: spacing.md }}
            />
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>
              Intara
            </Text>
            <TouchableOpacity
              onPress={() => setShowIntaraPicker(!showIntaraPicker)}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                marginBottom: spacing.sm,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: fontSize.base, color: intara ? colors.foreground : colors.mutedForeground }}>
                {intara || copy.profile.selectProvince}
              </Text>
              <Ionicons
                name={showIntaraPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {showIntaraPicker && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.card,
                  marginBottom: spacing.md,
                }}
              >
                {INTARA_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={opt.value || "none"}
                    onPress={() => {
                      setIntara(opt.value);
                      setAkarere("");
                      setUmurenge("");
                      setShowIntaraPicker(false);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderBottomWidth: i < INTARA_OPTIONS.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.base, color: colors.foreground }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>
              Akarere
            </Text>
            <TouchableOpacity
              onPress={() => intara && setShowAkarerePicker(!showAkarerePicker)}
              disabled={!intara}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: intara ? colors.card : colors.muted,
                marginBottom: spacing.sm,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: fontSize.base, color: akarere ? colors.foreground : colors.mutedForeground }}>
                {akarere || copy.profile.selectDistrict}
              </Text>
              <Ionicons
                name={showAkarerePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {showAkarerePicker && intara && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.card,
                  marginBottom: spacing.md,
                }}
              >
                {(INTARA_TO_AKARERE[intara] ?? []).map((d, i) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => {
                      setAkarere(d);
                      setUmurenge("");
                      setShowAkarerePicker(false);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderBottomWidth: i < (INTARA_TO_AKARERE[intara]?.length ?? 1) - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.base, color: colors.foreground }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm }}>
              Umurenge
            </Text>
            <TouchableOpacity
              onPress={() => akarere && setShowUmurengePicker(!showUmurengePicker)}
              disabled={!akarere}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: akarere ? colors.card : colors.muted,
                marginBottom: spacing.sm,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: fontSize.base, color: umurenge ? colors.foreground : colors.mutedForeground }}>
                {umurenge || copy.profile.selectSector}
              </Text>
              <Ionicons
                name={showUmurengePicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {showUmurengePicker && akarere && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.card,
                  marginBottom: spacing.md,
                  maxHeight: 220,
                }}
              >
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                  {(AKARERE_TO_UMURENGE[akarere] ?? []).map((s, i) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => {
                        setUmurenge(s);
                        setShowUmurengePicker(false);
                      }}
                      style={{
                        paddingVertical: spacing.sm,
                        paddingHorizontal: spacing.md,
                        borderBottomWidth: i < (AKARERE_TO_UMURENGE[akarere]?.length ?? 1) - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: fontSize.base, color: colors.foreground }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <Input
              label="Imyaka"
              value={age}
              onChangeText={setAge}
              placeholder={copy.profile.agePlaceholder}
              keyboardType="number-pad"
              containerStyle={{ marginBottom: spacing.md }}
            />
            {error ? (
              <Text style={{ fontSize: fontSize.sm, color: colors.warning, marginBottom: spacing.md }}>
                {error}
              </Text>
            ) : null}
            <View style={{ marginTop: spacing.lg }}>
              <Button
                title={copy.profile.saveSuccess}
                onPress={handleSave}
                loading={saving}
                disabled={loading}
                icon={<Ionicons name="checkmark" size={18} color={colors.primaryForeground} />}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
