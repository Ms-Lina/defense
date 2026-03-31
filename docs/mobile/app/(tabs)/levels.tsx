import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export default function LevelsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lessonsData = await api.getLessons(user?.token || null);
        setLessons(lessonsData);

        // Group lessons by level
        const levelsMap: Record<string, any[]> = {};
        lessonsData.forEach((lesson: any) => {
          const levelId = lesson.level || "1";
          if (!levelsMap[levelId]) {
            levelsMap[levelId] = [];
          }
          levelsMap[levelId].push(lesson);
        });

        // Convert to levels array
        const levelsArray = Object.keys(levelsMap).map(levelId => ({
          id: levelId,
          label: `Ikirenga ${levelId}`,
          lessonCount: levelsMap[levelId].length,
          lessons: levelsMap[levelId]
        }));

        setLevels(levelsArray);
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: fontSize.lg, color: colors.foreground }}>Tuzakugurire</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: 2 }}>Hitamo icyiciro</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: colors.foreground }}>Amasomo</Text>
          <TouchableOpacity style={{ padding: spacing.sm }}>
            <Ionicons name="volume-high" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: colors.foreground, marginBottom: spacing.md }}>
          Hitamo Icyiciro
        </Text>

        {levels.map((level) => (
          <TouchableOpacity
            key={level.id}
            onPress={() => router.push(`/(tabs)/learn/${level.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: spacing.md,
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.md }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#eab30840",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="book" size={20} color="#b45309" />
              </View>
              <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: colors.foreground, marginLeft: spacing.md }}>
                {level.label}
              </Text>
            </View>
            <View
              style={{
                height: 160,
                backgroundColor: colors.primaryMuted,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="school" size={48} color={colors.primary} />
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: spacing.sm }}>
                {level.lessonCount} amasomo
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
