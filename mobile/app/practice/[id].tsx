import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { copy } from "@/lib/copy";
import { Audio } from "expo-av";

interface PracticeItem {
  id: string;
  type: "match" | "audio" | "typing";
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  questions?: any[];
}

export default function PracticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [practiceItem, setPracticeItem] = useState<PracticeItem | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<{ score: number; passed: boolean } | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    const fetchPracticeItem = async () => {
      try {
        const item = await api.getPracticeItem(id as string, user?.token || null);
        if (item) {
          setPracticeItem(item);
          setAnswers(new Array(item.questions?.length || 0).fill(""));
        } else {
          Alert.alert("Error", "Practice item not found");
          router.back();
        }
      } catch (err) {
        console.error("Failed to fetch practice item:", err);
        Alert.alert("Error", "Failed to load practice item");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPracticeItem();
    } else {
      setLoading(false);
    }
  }, [id, user]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    setRecording(null);
    await recording?.stopAndUnloadAsync();
    const uri = recording?.getURI();
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = uri || "recorded";
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (practiceItem?.questions?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await api.submitPractice(id as string, answers, user?.token || null);
      if (result) {
        setScore({
          score: result.score,
          passed: result.passed
        });
      } else {
        Alert.alert("Error", "Failed to submit answers");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to submit answers");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user || !practiceItem) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: fontSize.lg, color: colors.foreground }}>Tuzakugurire</Text>
      </SafeAreaView>
    );
  }

  if (score) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: "center", alignItems: "center" }}>
        <Ionicons name={score.passed ? "checkmark-circle" : "close-circle"} size={80} color={score.passed ? colors.primary : colors.danger} />
        <Text style={{ fontSize: fontSize["3xl"], fontWeight: "800", marginTop: spacing.md }}>{score.score}%</Text>
        <Text style={{ fontSize: fontSize.lg, color: colors.mutedForeground, textAlign: "center", marginVertical: spacing.lg }}>
          {score.passed ? copy.practice.resultPass : copy.practice.resultFail}
        </Text>
        <Button
          title={score.passed ? copy.practice.backToPractice : copy.practice.retry}
          onPress={() => score.passed ? router.back() : setScore(null)}
          variant="primary"
          style={{ width: "100%" }}
        />
      </SafeAreaView>
    );
  }

  const currentQ = practiceItem.questions?.[currentQuestion];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.lg, fontWeight: "700" }}>{practiceItem.title}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        {/* Progress Bar */}
        <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, marginBottom: spacing.lg }}>
          <View 
            style={{ 
              width: `${((currentQuestion + 1) / (practiceItem.questions?.length || 1)) * 100}%`, 
              height: "100%", 
              backgroundColor: colors.primary, 
              borderRadius: 3 
            }} 
          />
        </View>

        <Text style={{ fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.lg }}>
          Ikibazo {currentQuestion + 1} / {practiceItem.questions?.length}
        </Text>

        {currentQ && (
          <View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.lg }}>
              {currentQ.question}
            </Text>

            {practiceItem.type === "match" && currentQ.image && (
              <View style={{ 
                height: 200, 
                backgroundColor: colors.primaryMuted, 
                justifyContent: "center", 
                alignItems: "center", 
                borderRadius: borderRadius.lg,
                marginBottom: spacing.lg,
                fontSize: 80
              }}>
                {currentQ.image}
              </View>
            )}

            {practiceItem.type === "typing" && (
              <TextInput
                style={{ 
                  borderWidth: 2, 
                  borderColor: colors.primary, 
                  borderRadius: borderRadius.md, 
                  padding: spacing.md, 
                  fontSize: fontSize.lg 
                }}
                value={answers[currentQuestion]}
                onChangeText={(text) => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestion] = text;
                  setAnswers(newAnswers);
                }}
                autoFocus
                placeholder="Andika hano..."
              />
            )}

            {practiceItem.type === "audio" && (
              <View style={{ alignItems: "center", padding: spacing.xl }}>
                <TouchableOpacity
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: recording ? colors.danger : colors.primary,
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Ionicons name={recording ? "mic" : "mic-outline"} size={40} color="#fff" />
                </TouchableOpacity>
                <Text style={{ marginTop: spacing.md, color: colors.mutedForeground, textAlign: "center" }}>
                  {recording ? "Kurura ukura uruhushya..." : "Kanda hano ufate amajwi"}
                </Text>
              </View>
            )}

            {practiceItem.type === "match" && currentQ.options && (
              <View style={{ gap: spacing.sm }}>
                {currentQ.options.map((opt: string, idx: number) => {
                  const label = (opt != null && String(opt).trim()) ? opt : `Option ${idx + 1}`;
                  return (
                    <TouchableOpacity
                      key={`practice-opt-${currentQuestion}-${idx}`}
                      onPress={() => {
                        const newAnswers = [...answers];
                        newAnswers[currentQuestion] = opt;
                        setAnswers(newAnswers);
                      }}
                      style={{
                        padding: spacing.lg,
                        borderRadius: borderRadius.md,
                        borderWidth: 2,
                        borderColor: answers[currentQuestion] === opt ? colors.primary : colors.border,
                        backgroundColor: colors.card
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          title={currentQuestion === (practiceItem.questions?.length || 0) - 1 ? "Ohereza" : "Komeza"}
          onPress={handleNext}
          disabled={!answers[currentQuestion] && practiceItem.type !== "audio"}
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}

// Button component for reuse
function Button({ title, onPress, variant = "primary", loading = false, style }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[
        {
          backgroundColor: variant === "primary" ? colors.primary : colors.secondary,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.md,
          alignItems: "center",
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: fontSize.base }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
