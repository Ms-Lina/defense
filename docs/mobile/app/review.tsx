/**
 * Flashcard Review Screen — /review
 * Learner can flip through key vocabulary from all modules.
 */
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { api } from "@/lib/api";

type Flashcard = {
    front: string;
    back: string;
    module: string;
    moduleColor: string;
};

const BUILT_IN_CARDS: Flashcard[] = [
    // Imirongo
    { front: "Horizontal", back: "Umurongo Yegeranye", module: "Imirongo", moduleColor: "#4CAF78" },
    { front: "Vertical", back: "Umurongo Ihagarara", module: "Imirongo", moduleColor: "#4CAF78" },
    { front: "Diagonal", back: "Umurongo w'Igitama", module: "Imirongo", moduleColor: "#4CAF78" },
    { front: "Curved", back: "Umurongo Inziga", module: "Imirongo", moduleColor: "#4CAF78" },
    // Inyuguti
    { front: "Vowels", back: "Inyajwi: A, E, I, O, U", module: "Inyuguti", moduleColor: "#3B82F6" },
    { front: "Letter B", back: "B — bakuru, baho, bya", module: "Inyuguti", moduleColor: "#3B82F6" },
    { front: "Syllable", back: "Imigemo — igice cy'ijambo", module: "Inyuguti", moduleColor: "#3B82F6" },
    { front: "Sentence", back: "Interuro — amagambo ahuriye", module: "Inyuguti", moduleColor: "#3B82F6" },
    // Imibare
    { front: "1", back: "Imwe", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "2", back: "Ebyiri", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "3", back: "Eshatu", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "5", back: "Eshanu", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "7", back: "Karindwi", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "10", back: "Icumi", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "20", back: "Makumyabiri", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "Addition (+)", back: "Guterana", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "Subtraction (−)", back: "Gukuramo", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "Multiply (×)", back: "Gukuba", module: "Imibare", moduleColor: "#F59E0B" },
    { front: "Divide (÷)", back: "Kugabanya", module: "Imibare", moduleColor: "#F59E0B" },
    // Amashusho n'Amabara
    { front: "Circle", back: "Uruziga", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Square", back: "Urukiramende na Kare", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Triangle", back: "Mpandeshatu", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Red", back: "Umutuku", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Blue", back: "Ubururu", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Green", back: "Icyatsi", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Yellow", back: "Umuhondo", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Big", back: "Nini", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Small", back: "Ngufi", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Above", back: "Hejuru", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
    { front: "Below", back: "Hasi", module: "Amashusho n'Amabara", moduleColor: "#EC4899" },
];

const MODULES = ["All", "Imirongo", "Inyuguti", "Imibare", "Amashusho n'Amabara"];
const MODULE_COLORS: Record<string, string> = {
    Imirongo: "#4CAF78", Inyuguti: "#3B82F6", Imibare: "#F59E0B", "Amashusho n'Amabara": "#EC4899",
};

export default function ReviewScreen() {
    const router = useRouter();
    const [selectedModule, setSelectedModule] = useState("All");
    const [currentIdx, setCurrentIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [knownIds, setKnownIds] = useState<Set<number>>(new Set());

    const cards = selectedModule === "All"
        ? BUILT_IN_CARDS
        : BUILT_IN_CARDS.filter(c => c.module === selectedModule);

    const card = cards[currentIdx];
    const isKnown = knownIds.has(currentIdx);

    const next = () => { setFlipped(false); setCurrentIdx(i => (i + 1) % cards.length); };
    const prev = () => { setFlipped(false); setCurrentIdx(i => (i - 1 + cards.length) % cards.length); };
    const toggleKnown = () => {
        const s = new Set(knownIds);
        if (s.has(currentIdx)) s.delete(currentIdx);
        else s.add(currentIdx);
        setKnownIds(s);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
                    <Ionicons name="arrow-back" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.foreground }}>Amakarita y'Inyigisho</Text>
                    <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>Flashcards · {cards.length} amakarita</Text>
                </View>
                <Text style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: "700" }}>
                    {knownIds.size}/{cards.length} ✓
                </Text>
            </View>

            {/* Module Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50 }} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm }}>
                {MODULES.map(mod => (
                    <TouchableOpacity
                        key={mod}
                        onPress={() => { setSelectedModule(mod); setCurrentIdx(0); setFlipped(false); }}
                        style={{
                            paddingHorizontal: spacing.md, paddingVertical: 6,
                            borderRadius: borderRadius.full,
                            backgroundColor: selectedModule === mod ? (MODULE_COLORS[mod] ?? colors.primary) : colors.muted,
                        }}
                    >
                        <Text style={{ fontSize: fontSize.xs, fontWeight: "700", color: selectedModule === mod ? "#fff" : colors.mutedForeground }}>
                            {mod}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg }}>
                {/* Progress dots */}
                <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginBottom: spacing.lg }}>
                    {cards.slice(0, Math.min(cards.length, 20)).map((_, i) => (
                        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === currentIdx % 20 ? card.moduleColor : (knownIds.has(i) ? "#10B981" : colors.muted) }} />
                    ))}
                </View>

                {/* Flashcard */}
                <TouchableOpacity
                    onPress={() => setFlipped(!flipped)}
                    activeOpacity={0.9}
                    style={{
                        backgroundColor: flipped ? card.moduleColor : colors.card,
                        borderRadius: borderRadius.xl,
                        minHeight: 220,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: spacing.xl,
                        shadowColor: card.moduleColor,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: flipped ? 0.35 : 0.12,
                        shadowRadius: 16,
                        elevation: 8,
                        borderWidth: flipped ? 0 : 1,
                        borderColor: colors.border,
                    }}
                >
                    <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color: flipped ? "rgba(255,255,255,0.7)" : colors.mutedForeground, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 1 }}>
                        {flipped ? "Igisubizo" : "Ikibazo — Kanda Usome"}
                    </Text>
                    <Text style={{
                        fontSize: flipped ? fontSize["2xl"] : fontSize["3xl"],
                        fontWeight: "800",
                        color: flipped ? "#fff" : colors.foreground,
                        textAlign: "center",
                    }}>
                        {flipped ? card.back : card.front}
                    </Text>
                    {!flipped && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.md, opacity: 0.5 }}>
                            <Ionicons name="hand-left-outline" size={14} color={colors.mutedForeground} />
                            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>Kanda kugira urebe igisubizo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Controls */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.lg }}>
                    <TouchableOpacity onPress={prev} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.muted, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="chevron-back" size={24} color={colors.foreground} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={toggleKnown}
                        style={{
                            flexDirection: "row", alignItems: "center", gap: spacing.xs,
                            paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
                            borderRadius: borderRadius.full,
                            backgroundColor: isKnown ? "#E8F5E9" : colors.muted,
                        }}
                    >
                        <Ionicons name={isKnown ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color={isKnown ? colors.success : colors.mutedForeground} />
                        <Text style={{ fontWeight: "700", color: isKnown ? colors.success : colors.mutedForeground, fontSize: fontSize.sm }}>
                            {isKnown ? "Nzi" : "Nzi Ubu"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={next} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={{ textAlign: "center", color: colors.mutedForeground, fontSize: fontSize.xs, marginTop: spacing.md }}>
                    {currentIdx + 1} / {cards.length}
                </Text>
            </View>
        </SafeAreaView>
    );
}
