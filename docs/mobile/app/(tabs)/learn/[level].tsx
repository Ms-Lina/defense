import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export default function LearnLevelScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const levelId = level ?? "1";
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [durationMin] = useState(60); // Default duration

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const allLessons = await api.getLessons(user?.token || null);
        const levelLessons = allLessons.filter((lesson: any) => lesson.level === levelId);
        setLessons(levelLessons);
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLessons();
    } else {
      setLoading(false);
    }
  }, [levelId, user]);

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
      <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>Lesson List</Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.sm }}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: colors.foreground }}>Yiga</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TouchableOpacity>
            <Ionicons name="folder-open" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="volume-high" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
          <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: colors.foreground }}>Level {levelId}</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>{durationMin} min</Text>
        </View>

        {lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            onPress={() => lesson.status !== "locked" && router.push(`/lesson/${lesson.id}`)}
            activeOpacity={lesson.status === "locked" ? 1 : 0.7}
            disabled={lesson.status === "locked"}
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", padding: spacing.md }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: colors.primaryMuted,
                  borderRadius: borderRadius.md,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={(lesson.icon ?? "leaf") as any} size={32} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  {lesson.status === "completed" && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  )}
                  <Text style={{ fontSize: fontSize.base, fontWeight: "600", color: colors.foreground }}>
                    {lesson.title}
                  </Text>
                </View>
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>
                  {lesson.subtitle}
                </Text>
              </View>
              <View style={{ justifyContent: "center", alignItems: "flex-end" }}>
                {lesson.status === "completed" && (
                  <View
                    style={{
                      backgroundColor: colors.primaryMuted,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" }}>Completed</Text>
                  </View>
                )}
                {lesson.status === "download" && (
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/practice")}
                    style={{
                      backgroundColor: colors.muted,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color: colors.foreground }}>Tangira</Text>
                  </TouchableOpacity>
                )}
                {lesson.status === "locked" && (
                  <Ionicons name="lock-closed" size={24} color={colors.mutedForeground} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
