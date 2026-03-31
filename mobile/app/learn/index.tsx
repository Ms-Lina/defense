import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

interface Level {
  id: string;
  label: string;
  lessonCount: number;
  completedLessons: number;
  locked: boolean;
}

export default function LearnScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<Level[]>([]);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const lessonsData = await api.getLessons(user?.token || null);
        const userProgress = await api.getProgress(user?.token || null);
        
        // Group lessons by level
        const levelsMap: Record<string, any[]> = {};
        lessonsData.forEach((lesson: any) => {
          const levelId = lesson.level || "1";
          if (!levelsMap[levelId]) {
            levelsMap[levelId] = [];
          }
          levelsMap[levelId].push(lesson);
        });

        // Create levels array with progress
        const levelsArray = Object.keys(levelsMap).map(levelId => {
          const levelLessons = levelsMap[levelId];
          const completedCount = userProgress?.completedLessons || 0;
          
          return {
            id: levelId,
            label: `Ikirenga ${levelId}`,
            lessonCount: levelLessons.length,
            completedLessons: Math.min(completedCount, levelLessons.length),
            locked: parseInt(levelId) > 1 && completedCount === 0
          };
        });

        // Sort by level ID
        levelsArray.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setLevels(levelsArray);
      } catch (err) {
        console.error("Failed to fetch levels:", err);
        // No fallback - show empty state if API fails
        setLevels([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLevels();
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
      <View style={{ padding: spacing.md }}>
        <Text style={{ fontSize: fontSize["2xl"], fontWeight: "700", color: colors.foreground }}>
          Yiga
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>
          Hitamo ikirenga ugitangira kuri
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {levels.map((level) => (
          <TouchableOpacity
            key={level.id}
            onPress={() => !level.locked && router.push(`/learn/${level.id}`)}
            disabled={level.locked}
            style={{
              backgroundColor: level.locked ? colors.muted : colors.card,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: level.locked ? colors.border : colors.primary + "40",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: level.locked ? 0.02 : 0.08,
              shadowRadius: 8,
              elevation: level.locked ? 1 : 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: level.locked ? colors.background : colors.primaryMuted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {level.locked ? (
                  <Ionicons name="lock-closed" size={32} color={colors.mutedForeground} />
                ) : (
                  <Ionicons name="school" size={32} color={colors.primary} />
                )}
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={{ 
                    fontSize: fontSize.lg, 
                    fontWeight: "600", 
                    color: level.locked ? colors.mutedForeground : colors.foreground 
                  }}>
                    {level.label}
                  </Text>
                  {level.completedLessons > 0 && !level.locked && (
                    <View
                      style={{
                        backgroundColor: colors.primaryMuted,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: "600" }}>
                        {level.completedLessons}/{level.lessonCount}
                      </Text>
                    </View>
                  )}
                </View>
                
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: 2 }}>
                  {level.lessonCount} amasomo
                </Text>
                
                {/* Progress bar */}
                {!level.locked && level.lessonCount > 0 && (
                  <View style={{ marginTop: spacing.sm }}>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: colors.muted,
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${(level.completedLessons / level.lessonCount) * 100}%`,
                          backgroundColor: colors.primary,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>
                )}
                
                {level.locked && (
                  <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: spacing.sm }}>
                  Tangira ikirenga 1 kugirango ukure
                  </Text>
                )}
              </View>

              <Ionicons 
                name={level.locked ? "lock-closed" : "chevron-forward"} 
                size={20} 
                color={level.locked ? colors.mutedForeground : colors.mutedForeground} 
              />
            </View>
          </TouchableOpacity>
        ))}

        {levels.length === 0 && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: spacing.xl,
              backgroundColor: colors.muted,
              borderRadius: borderRadius.md,
              marginTop: spacing.md,
            }}
          >
            <Ionicons name="school-outline" size={48} color={colors.primary} />
            <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground, marginTop: spacing.md }}>
              Nta masomo iboneka kuri ubu
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.sm }}>
              Subira inyuma nyakugire
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
