import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

interface PracticeItem {
  id: string;
  type: "match" | "audio" | "typing";
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  completed?: boolean;
}

export default function PracticeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);

  useEffect(() => {
    const fetchPracticeItems = async () => {
      try {
        const items = await api.getPractice();
        setPracticeItems(items.map((item: any) => ({
          id: item.id,
          type: item.type || "match",
          title: item.title || "Kwiga Amagambo",
          description: item.description || "Gerageza gusoma no kwandika",
          difficulty: item.difficulty || "easy",
          completed: item.completed || false
        })));
      } catch (err) {
        console.error("Failed to fetch practice items:", err);
        // No fallback - show empty state if API fails
        setPracticeItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPracticeItems();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return colors.primary;
      case "medium": return "#f59e0b";
      case "hard": return "#ef4444";
      default: return colors.primary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "Byoroheje";
      case "medium": return "Bihagije";
      case "hard": return "By'ingenzi";
      default: return "Byoroheje";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "match": return "extension-puzzle";
      case "audio": return "volume-high";
      case "typing": return "create";
      default: return "extension-puzzle";
    }
  };

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
          Imyitozo
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>
          Gerageza ubumenyi bwawe mu Kinyarwanda
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {practiceItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(`/practice/${item.id}`)}
            style={{
              backgroundColor: colors.card,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primaryMuted,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={getTypeIcon(item.type) as any} size={28} color={colors.primary} />
              </View>
              
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: "600", color: colors.foreground }}>
                    {item.title}
                  </Text>
                  {item.completed && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </View>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: 2 }}>
                  {item.description}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs }}>
                  <View
                    style={{
                      backgroundColor: getDifficultyColor(item.difficulty) + "20",
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text style={{ fontSize: fontSize.xs, color: getDifficultyColor(item.difficulty), fontWeight: "600" }}>
                      {getDifficultyText(item.difficulty)}
                    </Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        ))}

        {practiceItems.length === 0 && (
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
            <Ionicons name="extension-puzzle-outline" size={48} color={colors.primary} />
            <Text style={{ fontSize: fontSize.base, color: colors.mutedForeground, marginTop: spacing.md }}>
              Nta myitozo iboneka kuri ubu
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.sm }}>
              Subira inyuma kureba amasomo
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
