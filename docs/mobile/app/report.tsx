/**
 * Learner Report / Certificate screen — /report
 * Shows a full personal achievement report the learner can share.
 */
import { View, Text, ScrollView, TouchableOpacity, Share, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize, borderRadius, cardShadow } from "@/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { copy } from "@/lib/copy";

const MODULES = [
    { name: "Imirongo", icon: "pencil" as const, color: "#4CAF78", total: 5 },
    { name: "Inyuguti", icon: "text" as const, color: "#3B82F6", total: 8 },
    { name: "Imibare", icon: "calculator" as const, color: "#F59E0B", total: 10 },
    { name: "Amashusho n'Amabara", icon: "shapes" as const, color: "#EC4899", total: 7 },
];

export default function ReportScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!user) {
            setProgress(null);
            setHistory([]);
            setLoadError(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        try {
            const token = await user.getIdToken();
            const [p, h] = await Promise.all([api.getProgress(token), api.getLessonHistory(token)]);
            setProgress(p ?? null);
            setHistory(Array.isArray(h) ? h : []);
        } catch (e) {
            setLoadError((e as Error)?.message ?? "Ntabwo twashoboye kubona raporo.");
            setProgress(null);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [user?.uid, load]);

    useFocusEffect(useCallback(() => {
        if (user) load();
    }, [user, load]));

    const handleShare = async () => {
        const badgeLabel = progress?.badge?.label ?? copy.report.noBadge;
        const avg = (progress as any)?.averageScore ?? avgScore;
        const avgStr = avg != null ? `${avg}%` : "—";
        const msg = copy.report.shareMessage(displayCompleted, totalLessons, badgeLabel, progress?.streakDays ?? 0, avgStr);
        await Share.share({ message: msg });
    };

    const passedHistory = history.filter(h => h && h.passed === true);
    const avgScore = history.length ? Math.round(history.reduce((s, h) => s + (typeof h?.score === "number" ? h.score : 0), 0) / history.length) : null;
    const displayCompleted = progress?.completedLessons ?? passedHistory.length;
    const totalLessons = Math.max(progress?.totalLessons ?? 0, 1);
    const percent = Math.min(100, Math.round((displayCompleted / totalLessons) * 100));
    const badge = progress?.badge;
    const nextBadgeInfo = progress?.nextBadge;
    const badgeLabel = (badge?.label != null && typeof badge.label === "string") ? badge.label : "";

    const dateStr = new Date().toLocaleDateString("rw-RW", { year: "numeric", month: "long", day: "numeric" });

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ color: colors.mutedForeground, marginTop: spacing.md }}>Tegereza amakuru...</Text>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
                        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground }}>{copy.report.title}</Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
                    <Ionicons name="document-text-outline" size={64} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, marginTop: spacing.lg, fontSize: fontSize.base, textAlign: "center" }}>
                        Injira kugira ngo urebe raporo yanjye.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (loadError) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
                        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground }}>{copy.report.title}</Text>
                </View>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl }}>
                    <Ionicons name="cloud-offline-outline" size={64} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, marginTop: spacing.lg, fontSize: fontSize.base, textAlign: "center" }}>
                        {loadError}
                    </Text>
                    <TouchableOpacity onPress={() => load()} style={{ marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md }}>
                        <Text style={{ color: "#fff", fontWeight: "700" }}>Ongera ugerageze</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
                    <Ionicons name="arrow-back" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground }}>{copy.report.title}</Text>
                    <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>{copy.report.subtitle}</Text>
                </View>
                <TouchableOpacity onPress={handleShare} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full }}>
                    <Ionicons name="share-outline" size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: fontSize.xs }}>{copy.report.share}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Certificate-style Card */}
                <View style={{
                    backgroundColor: badge?.color ?? colors.card,
                    borderRadius: borderRadius.xl,
                    padding: spacing.xl,
                    marginBottom: spacing.lg,
                    alignItems: "center",
                    ...cardShadow({ color: badge?.color ?? "#000", offset: { width: 0, height: 6 }, opacity: 0.25, radius: 16 }),
                    elevation: 8,
                }}>
                    <View style={{ marginBottom: spacing.sm }}>
                        <Ionicons name="medal" size={56} color="#fff" />
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: fontSize.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
                        IMPAMYABUSHOBOZI
                    </Text>
                    <Text style={{ color: "#fff", fontSize: fontSize["2xl"], fontWeight: "800", marginTop: 4, textAlign: "center" }}>
                        {badgeLabel ? badgeLabel.replace(/\s*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u, "").trim() || "Tangira Kwiga" : "Tangira Kwiga"}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: fontSize.xs, marginTop: spacing.xs }}>
                        {user?.displayName ?? "Umunyeshuri wa MenyAI"}
                    </Text>
                    <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.2)", width: "100%", marginVertical: spacing.md }} />
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{dateStr}</Text>
                </View>

                {/* Stats Row */}
                <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
                    {[
                        { label: "Yarangiye", value: `${displayCompleted}/${progress?.totalLessons ?? totalLessons}`, icon: "checkmark-done-circle", color: colors.primary },
                        { label: "Amanota", value: avgScore !== null ? `${avgScore}%` : "—", icon: "ribbon", color: "#F59E0B" },
                        { label: "Streak", value: `${progress?.streakDays ?? 0}`, icon: "flame", color: "#EF4444" },
                    ].map(item => (
                        <View key={item.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                {item.icon === "flame" && <Ionicons name="flame" size={18} color={item.color} />}
                                {item.icon === "ribbon" && <Ionicons name="ribbon" size={18} color={item.color} />}
                                {item.icon === "checkmark-done-circle" && <Ionicons name="checkmark-done-circle" size={18} color={item.color} />}
                                <Text style={{ fontSize: fontSize.lg, fontWeight: "800", color: item.color }}>{item.value}</Text>
                            </View>
                            <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2, textAlign: "center" }}>{item.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Overall progress */}
                <View style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...cardShadow({ color: "#000", offset: { width: 0, height: 2 }, opacity: 0.06, radius: 8 }), elevation: 2 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                        <Text style={{ fontWeight: "700", color: colors.foreground, fontSize: fontSize.base }}>{copy.progress.overallPercentage}</Text>
                        <Text style={{ fontWeight: "800", color: colors.primary, fontSize: fontSize.xl }}>{percent}%</Text>
                    </View>
                    <View style={{ height: 10, backgroundColor: colors.muted, borderRadius: 5, overflow: "hidden" }}>
                        <View style={{ width: `${Math.min(percent, 100)}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 5 }} />
                    </View>
                    {nextBadgeInfo && (
                        <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: spacing.xs }}>
                            Urakeneye amasomo {nextBadgeInfo?.remaining ?? "—"} kugira ubone {nextBadgeInfo?.label ?? ""}
                        </Text>
                    )}
                </View>

                {/* Module breakdown */}
                <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground, marginBottom: spacing.md }}>Ubwoko bw'amasomo</Text>
                {MODULES.map(mod => (
                    <View key={mod.name} style={{ backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.md, ...cardShadow({ color: "#000", offset: { width: 0, height: 1 }, opacity: 0.05, radius: 4 }), elevation: 1, borderLeftWidth: 4, borderLeftColor: mod.color }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: mod.color + "20", alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name={mod.icon} size={20} color={mod.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "700", color: colors.foreground, fontSize: fontSize.sm }}>{mod.name}</Text>
                            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>{mod.total} amasomo</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontWeight: "700", color: mod.color, fontSize: fontSize.sm }}>—</Text>
                            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>asigaye</Text>
                        </View>
                    </View>
                ))}

                {/* Recent completed lessons */}
                {passedHistory.length > 0 && (
                    <>
                        <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground, marginTop: spacing.md, marginBottom: spacing.md }}>
                            {copy.report.comingSoon} ({passedHistory.length})
                        </Text>
                        {passedHistory.slice(0, 5).map((h, i) => (
                            <View key={h.lessonId ?? `h-${i}`} style={{ backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.xs, flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.foreground }}>
                                        Isomo #{h.lessonId ? String(h.lessonId).slice(0, 6) : "—"}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                                        {h.updatedAt ? new Date(h.updatedAt).toLocaleDateString("rw-RW") : "—"} · {typeof h.attempts === "number" ? h.attempts : 1} {copy.progress.attempt(typeof h.attempts === "number" ? h.attempts : 1)}
                                    </Text>
                                </View>
                                <View style={{ backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full }}>
                                    <Text style={{ fontWeight: "700", color: colors.primary, fontSize: fontSize.sm }}>{typeof h.score === "number" ? h.score : 0}%</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
