import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useMemo } from "react";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Message = { id: string; type: "ai" | "user"; text: string };

const INITIAL_MESSAGES: Message[] = [
  { id: "1", type: "ai" as const, text: "Muraho! Ndi MenyAI, umufasha wawe. Ufite ikibazo cyangwa ukenera ubufasha kuri iri somo?" },
];

const FALLBACK_AUTH = "Injira kugira ngo AI ikoreshwe (MenyAI Umufasha).";
const FALLBACK_UNAVAILABLE = "AI ntabwo ishoboye ubu. Gerageza nyuma cyangwa uhuze umurongo.";
const FALLBACK_NOT_CONFIGURED = "Ubufasha bwa AI bujya gushyirwa (OPENAI_API_KEY). Gerageza nyuma.";
const FALLBACK_NETWORK = "Ntabwo twashoboye kuvugana na seriveri. Gerageza nyuma.";
const FALLBACK_TOO_FAST = "Wihangane gato mbere yo kongera kubaza, hanyuma wongere ugerageze.";

export default function AIAssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lessonTitle?: string; lessonDesc?: string; lessonModule?: string }>();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [retryText, setRetryText] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const lessonContext = useMemo(() => {
    const title = params.lessonTitle ?? "";
    const desc = params.lessonDesc ?? "";
    const module = params.lessonModule ?? "";
    if (!title && !desc && !module) return undefined;
    const parts = [];
    if (title) parts.push(`Isomo: ${title}`);
    if (module) parts.push(`Moduli: ${module}`);
    if (desc) parts.push(desc);
    const raw = parts.join(". ");
    return raw.slice(0, 1500) || undefined;
  }, [params.lessonTitle, params.lessonDesc, params.lessonModule]);

  const lessonFallbackTip = useMemo(() => {
    const title = (params.lessonTitle ?? "").trim();
    const module = (params.lessonModule ?? "").trim();
    const desc = (params.lessonDesc ?? "").trim();
    const shortDesc = desc ? desc.slice(0, 160) : "";
    if (!title && !module && !shortDesc) return null;
    const parts = [];
    if (title) parts.push(`isomo "${title}"`);
    if (module) parts.push(`moduli "${module}"`);
    const where = parts.length > 0 ? parts.join(" muri ") : "isomo";
    const descLine = shortDesc ? ` Inama: ${shortDesc}.` : "";
    return `Mu gihe AI itabonetse, fata umwanya usome neza ${where}, wandike amagambo y'ingenzi, hanyuma wongere ubaze ikibazo kigufi.${descLine}`;
  }, [params.lessonTitle, params.lessonModule, params.lessonDesc]);

  const sendMessage = async (presetText?: string) => {
    const text = (presetText ?? input.trim()).trim();
    if (!text || loading) return;
    if (!presetText) setInput("");
    setRetryText(text);
    const userMsg: Message = { id: Date.now().toString(), type: "user" as const, text };
    setMessages((m) => [...m, userMsg]);
    if (!user) {
      setMessages((m) => [...m, { id: (Date.now() + 1).toString(), type: "ai" as const, text: FALLBACK_AUTH }]);
      return;
    }
    setLoading(true);
    const token = await user.getIdToken();
    const result = await api.postAiChat(text, token, { lessonContext });
    let aiText: string;
    if ("reply" in result) {
      aiText = result.reply;
      setRetryText(null);
    } else {
      if (result.error === "auth") aiText = FALLBACK_AUTH;
      else if (result.error === "unavailable") {
        if (result.code === "OPENAI_NOT_CONFIGURED") aiText = FALLBACK_NOT_CONFIGURED;
        else if (result.code === "TOO_MANY_REQUESTS_LOCAL") aiText = FALLBACK_TOO_FAST;
        else aiText = FALLBACK_UNAVAILABLE;
      } else aiText = FALLBACK_NETWORK;
      if (lessonFallbackTip) aiText = `${aiText}\n\n${lessonFallbackTip}`;
    }
    setMessages((m) => [...m, { id: (Date.now() + 1).toString(), type: "ai" as const, text: aiText }]);
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* AI Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 2,
          borderBottomColor: colors.border,
          marginBottom: spacing.md,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.aiPurpleStart,
            alignItems: "center",
            justifyContent: "center",
            marginRight: spacing.md,
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.base, fontWeight: "700", color: colors.foreground }}>
            MenyAI Umufasha
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.success,
              }}
            />
            <Text style={{ fontSize: fontSize.xs, color: colors.success }}>Ndi hano kugufasha</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: spacing.sm }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sign-in required banner – when not logged in, AI returns 401 */}
        {!user && (
          <View
            style={{
              backgroundColor: "#FFF3E0",
              padding: spacing.md,
              borderRadius: borderRadius.md,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: "#FFB74D",
            }}
          >
            <Text style={{ fontSize: fontSize.sm, color: colors.foreground, lineHeight: 22, marginBottom: spacing.sm }}>
              Injira kugira ngo ukoreshe MenyAI Umufasha. Niba utariyinjiye, kanda "Injira" hasi.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={{
                alignSelf: "flex-start",
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: "#fff" }}>Injira</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Info card */}
        <View
          style={{
            backgroundColor: "#E3F2FD",
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ fontSize: fontSize.sm, color: colors.foreground, lineHeight: 22 }}>
            Menya: Baza AI igihe cyose ufite ikibazo. Itanga ibisubizo mu Kinyarwanda!
          </Text>
        </View>

        {/* Chat messages */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={{
              alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              marginBottom: spacing.md,
            }}
          >
            <View
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.lg,
                backgroundColor: msg.type === "user" ? colors.primary : colors.muted,
                borderBottomRightRadius: msg.type === "user" ? 4 : borderRadius.lg,
                borderBottomLeftRadius: msg.type === "user" ? borderRadius.lg : 4,
              }}
            >
              <Text
                style={{
                  fontSize: fontSize.sm,
                  color: msg.type === "user" ? "#fff" : colors.foreground,
                  lineHeight: 22,
                }}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {/* Quick action buttons – send preset prompts with lesson context */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }}>
          <TouchableOpacity
            onPress={() => sendMessage("Sobanura neza")}
            disabled={loading}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color: colors.primary }}>Sobanura neza</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => sendMessage("Mpa urugero")}
            disabled={loading}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color: colors.primary }}>Mpa urugero</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => sendMessage("Komeza isomo")}
            disabled={loading}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.md,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: fontSize.xs, fontWeight: "600", color: colors.primary }}>Komeza isomo</Text>
          </TouchableOpacity>
          {retryText ? (
            <TouchableOpacity
              onPress={() => sendMessage(retryText)}
              disabled={loading}
              style={{
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontSize: fontSize.xs, fontWeight: "700", color: "#fff" }}>Ongera ugerageze nonaha</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* Chat input - fixed at bottom */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          padding: spacing.md,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TextInput
          placeholder="Andika ikibazo cyawe hano..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            borderWidth: 2,
            borderColor: colors.border,
            fontSize: fontSize.sm,
            color: colors.foreground,
          }}
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={loading}
          style={{
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
