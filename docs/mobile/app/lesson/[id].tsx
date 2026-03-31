import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { colors, spacing, fontSize, borderRadius } from "@/theme";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import YoutubePlayer from "react-native-youtube-iframe";
// expo-av is deprecated in SDK 54; plan to migrate to expo-audio for recording
import { Audio } from "expo-av";
import { useAuth } from "@/lib/auth-context";
import { copy } from "@/lib/copy";
import { SpeakableLabel } from "@/components/SpeakableLabel";

export default function ActiveLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = Video, 1+ = Activities
  const [answers, setAnswers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<{ score: number; passed: boolean } | null>(null);
  
  // Enhanced state for answer verification
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const lessonStartTime = useRef(Date.now());
  const stepStartTime = useRef(Date.now());
  const [questionTimings, setQuestionTimings] = useState<number[]>([]);
  const sessionStartRef = useRef(Date.now());
  const totalTimeSpentStoredRef = useRef(0);
  const [elapsedDisplay, setElapsedDisplay] = useState(0);
  const playerRef = useRef<any>(null);
  const videoStartSecondsRef = useRef(0);

  const [videoWatchedSeconds, setVideoWatchedSeconds] = useState(0);

  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!id) return;
      try {
        const token = user ? await user.getIdToken() : null;
        const [data, progressRes] = await Promise.all([
          api.getLesson(id, token),
          api.getLessonProgress(id, token),
        ]);
        if (data) {
          setLesson(data);
          const activities = data.activities || [];
          const len = activities.length;
          let initialStep = 0;
          let initialAnswers = new Array(len).fill("");
          if (progressRes?.progress && !progressRes.completed) {
            const p = progressRes.progress;
            initialStep = Math.min(Math.max(0, p.currentStep), len);
            totalTimeSpentStoredRef.current = p.totalTimeSpent || 0;
            const savedVideoSec = p.videoProgressSeconds || 0;
            videoStartSecondsRef.current = savedVideoSec;
            setVideoWatchedSeconds((prev) => Math.max(prev, savedVideoSec));
            if (Array.isArray(p.answers) && p.answers.length) {
              initialAnswers = p.answers.slice(0, len);
              while (initialAnswers.length < len) initialAnswers.push("");
            }
          }
          sessionStartRef.current = Date.now();
          lessonStartTime.current = Date.now();
          stepStartTime.current = Date.now();
          setCurrentStep(initialStep);
          setAnswers(initialAnswers);
          if (initialStep > 0 && initialAnswers[initialStep - 1]) {
            const opts = activities[initialStep - 1]?.options ?? [];
            const idx = opts.findIndex((o: string) => String(o) === initialAnswers[initialStep - 1]);
            setSelectedOptionIndex(idx >= 0 ? idx : null);
            setSelectedAnswer(initialAnswers[initialStep - 1]);
          }
        } else {
          Alert.alert(copy.common.error, "Ntabwo twashoboye kubona isomo.");
        }
      } catch (err) {
        Alert.alert(copy.common.error, "Ntabwo twashoboye kubona isomo.");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id, user?.uid]);

  const getTotalTimeSpent = () =>
    totalTimeSpentStoredRef.current + (Date.now() - sessionStartRef.current) / 1000;

  const currentStepRef = useRef(currentStep);
  const answersRef = useRef(answers);
  currentStepRef.current = currentStep;
  answersRef.current = answers;

  const saveProgress = async (overrides?: { currentStep?: number; totalTimeSpent?: number; videoProgressSeconds?: number; answers?: string[] }) => {
    if (!id || !lesson) return;
    const token = user ? await user.getIdToken() : null;
    const total = getTotalTimeSpent();
    totalTimeSpentStoredRef.current = total;
    sessionStartRef.current = Date.now();
    await api.recordLessonProgress(
      id,
      {
        currentStep: overrides?.currentStep ?? currentStepRef.current,
        totalTimeSpent: Math.round(total),
        videoProgressSeconds: overrides?.videoProgressSeconds,
        answers: overrides?.answers ?? answersRef.current,
      },
      token
    );
  };

  useEffect(() => {
    const t = setInterval(() => setElapsedDisplay(getTotalTimeSpent()), 1000);
    return () => clearInterval(t);
  }, [lesson]);

  useEffect(() => {
    if (!id || !lesson) return;
    const t = setInterval(() => saveProgress(), 20000);
    return () => clearInterval(t);
  }, [id, lesson]);

  useEffect(() => {
    if (!lesson?.videoUrl || currentStep !== 0) return;
    const interval = setInterval(async () => {
      try {
        const t = playerRef.current?.getCurrentTime;
        if (typeof t === "function") {
          const sec = Math.round(await t()) || 0;
          setVideoWatchedSeconds((prev) => Math.max(prev, sec));
        }
      } catch (_) {}
    }, 1500);
    return () => clearInterval(interval);
  }, [lesson?.videoUrl, currentStep]);

  const handleNext = async () => {
    const activities = lesson?.activities ?? [];
    const isVideoStep = currentStep === 0;

    if (isVideoStep && id) {
      let videoSec = 0;
      try {
        if (playerRef.current?.getCurrentTime) videoSec = Math.round(await playerRef.current.getCurrentTime()) || 0;
      } catch (_) {}
      await saveProgress({
        currentStep: 0,
        videoProgressSeconds: videoSec,
      });
      const token = user ? await user.getIdToken() : null;
      await api.recordLessonProgress(id, { descriptionRead: true, videoWatched: true }, token);
    }

    if (currentStep < activities.length) {
      if (currentStep > 0) {
        const elapsed = Math.round((Date.now() - stepStartTime.current) / 1000);
        setQuestionTimings((prev) => {
          const next = [...prev];
          next[currentStep - 1] = elapsed;
          return next;
        });
      }
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setSelectedAnswer("");
      setSelectedOptionIndex(null);
      setShowFeedback(false);
      stepStartTime.current = Date.now();
      if (nextStep > 0 && answers[nextStep - 1] !== undefined) {
        const prevAnswer = String(answers[nextStep - 1]);
        setSelectedAnswer(prevAnswer);
        const opts = (lesson?.activities ?? [])[nextStep - 1]?.options ?? [];
        const idx = opts.findIndex((o: string) => String(o) === prevAnswer);
        setSelectedOptionIndex(idx >= 0 ? idx : null);
      }
      saveProgress({ currentStep: nextStep });
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const activities = lesson?.activities ?? [];
    const len = activities.length;
    const toSend = [...answers];
    // Sync current step's answer (state can lag); use selectedAnswer first, else existing answers[]
    if (len > 0 && currentStep >= 1 && currentStep <= len) {
      const currentAnswer = selectedAnswer ?? answers[currentStep - 1];
      if (currentAnswer !== undefined && currentAnswer !== null) {
        toSend[currentStep - 1] = typeof currentAnswer === "string" ? currentAnswer.trim() : currentAnswer;
      }
    }
    // Ensure we have an entry for every activity (pad with "" so backend receives correct length)
    while (toSend.length < len) toSend.push("");
    setIsSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - lessonStartTime.current) / 1000);
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        Alert.alert(copy.common.error, "Injira kugira ngo uohereze igisubizo.");
        setIsSubmitting(false);
        return;
      }
      const res = await api.submitLesson(id!, toSend, token, {
        timeSpent,
        questionTimes: questionTimings,
      });
      if (res?.error) {
        Alert.alert(copy.common.error, res.error || copy.lessons.submitError);
        return;
      }
      if (res && typeof res.score === "number") {
        setScore({ score: res.score, passed: !!res.passed });
        // Confirmation: result screen shows "Urakoze! Igisubizo cyawe cyakiriwe" and score
      } else {
        Alert.alert(copy.common.error, copy.lessons.submitError + " (Injira cyangwa gerageza nyuma.)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : copy.lessons.submitError;
      Alert.alert(copy.common.error, msg + " (Injira cyangwa gerageza nyuma.)");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced answer verification functions
  const checkAnswer = (answer: string, activity: any): boolean => {
    if (activity.type === "mc") {
      return answer === activity.correctAnswer;
    } else if (activity.type === "typing") {
      return answer.trim().toLowerCase() === activity.correctAnswer.trim().toLowerCase();
    }
    return false;
  };

  const handleAnswerSelect = (answer: string, optionIndex: number) => {
    const activities = lesson?.activities ?? [];
    const activity = activities[currentStep - 1];
    setSelectedAnswer(answer);
    setSelectedOptionIndex(optionIndex);
    const correct = activity ? checkAnswer(answer, activity) : false;
    setIsCorrect(correct);
    
    const newAnswers = [...answers];
    newAnswers[currentStep - 1] = answer;
    setAnswers(newAnswers);
    
    const elapsed = Math.round((Date.now() - stepStartTime.current) / 1000);
    setQuestionTimings((prev) => {
      const next = [...prev];
      next[currentStep - 1] = elapsed;
      return next;
    });
  };

  const handleAnswerConfirm = () => {
    setShowFeedback(true);
    
    // Auto-proceed after feedback
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer("");
      setSelectedOptionIndex(null);
      handleNext();
    }, 2000);
  };

  const getFeedbackMessage = (isCorrect: boolean, activity: any): string => {
    if (isCorrect) return "🎉 " + copy.lessons.correct;
    return "❌ " + copy.lessons.incorrect(activity?.correctAnswer ?? "");
  };

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

  const stopRecording = async (index: number) => {
    setRecording(null);
    await recording?.stopAndUnloadAsync();
    const uri = recording?.getURI();
    const newAnswers = [...answers];
    newAnswers[index] = uri; // In real app, upload this to storage
    setAnswers(newAnswers);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!lesson) return <View style={{ flex: 1, justifyContent: "center" }}><Text>Lesson not found</Text></View>;

  if (score) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.xl,
            minHeight: "100%",
          }}
          style={{ flex: 1 }}
        >
          <View style={{ alignItems: "center", width: "100%", maxWidth: 360 }}>
            {score.passed && (
              <>
                <SpeakableLabel
                  speakText="Urakoze! Igisubizo cyawe cyakiriwe."
                  variant="button"
                  textStyle={{ fontSize: fontSize.base, fontWeight: "600", color: colors.success, marginBottom: spacing.xs }}
                  containerStyle={{ marginBottom: spacing.xs }}
                />
                <SpeakableLabel
                  speakText={copy.lessons.resultPassSubtitle}
                  variant="inline"
                  textStyle={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.sm, textAlign: "center" }}
                  iconColor={colors.mutedForeground}
                  containerStyle={{ marginBottom: spacing.sm, alignSelf: "center" }}
                />
              </>
            )}
            <SpeakableLabel
              speakText={score.passed ? "Impamyabushobozi" : "Igisubizo"}
              variant="button"
              textStyle={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.mutedForeground, marginBottom: spacing.sm, textTransform: "uppercase" }}
              containerStyle={{ marginBottom: spacing.sm }}
            />
            <Ionicons name={score.passed ? "checkmark-circle" : "close-circle"} size={88} color={score.passed ? colors.success : colors.danger} />
            <SpeakableLabel
              speakText={`${score.score} pasan`}
              variant="inline"
              textStyle={{ fontSize: 42, fontWeight: "800", marginTop: spacing.md, color: colors.foreground }}
              iconColor={colors.foreground}
              containerStyle={{ marginTop: spacing.md }}
            >
              <Text style={{ fontSize: 42, fontWeight: "800", color: colors.foreground }}>{score.score}%</Text>
            </SpeakableLabel>
            <SpeakableLabel
              speakText={score.passed ? copy.lessons.resultPass : copy.lessons.resultFail}
              variant="inline"
              textStyle={{ fontSize: fontSize.lg, color: colors.mutedForeground, textAlign: "center", marginVertical: spacing.lg, paddingHorizontal: spacing.md }}
              iconColor={colors.mutedForeground}
              containerStyle={{ marginVertical: spacing.lg, paddingHorizontal: spacing.md, alignSelf: "center" }}
            />
            <Button
              title={score.passed ? copy.lessons.backToLessons : copy.lessons.retry}
              onPress={() => {
                if (score.passed) {
                  router.replace("/(tabs)/lessons");
                } else {
                  setScore(null);
                  setCurrentStep(0);
                  setAnswers(new Array((lesson?.activities ?? []).length).fill(""));
                  setSelectedAnswer("");
                  setSelectedOptionIndex(null);
                  setShowFeedback(false);
                  setQuestionTimings([]);
                  lessonStartTime.current = Date.now();
                  stepStartTime.current = Date.now();
                }
              }}
              variant="primary"
              style={{ width: "100%", marginTop: spacing.md }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const activities = lesson.activities || [];
  const isVideoStep = currentStep === 0;
  const currentActivity = isVideoStep ? null : activities[currentStep - 1];
  
  // Fixed progress calculation
  const progressPercentage = ((currentStep + 1) / (activities.length + 1)) * 100;

  // Feedback components
  const FeedbackMessage = ({ isCorrect, message }: { isCorrect: boolean; message: string }) => (
    <View style={[
      {
        padding: spacing.md,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        backgroundColor: isCorrect ? colors.success : colors.danger
      }
    ]}>
      <Ionicons 
        name={isCorrect ? "checkmark-circle" : "close-circle"} 
        size={24} 
        color="#fff" 
      />
      <Text style={{ 
        color: '#fff',
        fontWeight: '600',
        fontSize: fontSize.sm,
      }}>
        {message}
      </Text>
    </View>
  );

  const ConfirmationButton = () => {
    if (!selectedAnswer || showFeedback || !currentActivity) return null;
    
    return (
      <TouchableOpacity
        onPress={handleAnswerConfirm}
        style={{
          backgroundColor: colors.primary,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          alignItems: 'center',
          marginTop: spacing.lg,
        }}
      >
        <Text style={{ 
          color: '#fff',
          fontWeight: '700',
          fontSize: fontSize.base,
        }}>
          {copy.lessons.confirmAnswer}
        </Text>
      </TouchableOpacity>
    );
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => { saveProgress(); if (router.canGoBack()) router.back(); else router.replace("/(tabs)/lessons"); }} style={{ marginRight: spacing.md }}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <SpeakableLabel speakText={lesson.title} variant="button" textStyle={{ fontSize: fontSize.lg, fontWeight: "700" }} numberOfLines={1} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginRight: spacing.sm }}>
          <Ionicons name="time-outline" size={18} color={colors.mutedForeground} />
          <Text style={{ fontSize: fontSize.sm, fontWeight: "600", color: colors.mutedForeground, marginLeft: 4 }}>
            {formatTime(elapsedDisplay)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            const title = lesson.title || "";
            const desc = (lesson.description || "").slice(0, 400);
            const module = (lesson.module || "").slice(0, 80);
            const q = new URLSearchParams({ lessonTitle: title, lessonDesc: desc, lessonModule: module });
            router.push(`/ai-assistant?${q.toString()}`);
          }}
          style={{
            padding: spacing.sm,
            borderRadius: borderRadius.md,
            backgroundColor: "#8B5CF6",
          }}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>
        {/* Progress Bar */}
        <View style={{ height: 6, backgroundColor: colors.muted, borderRadius: 3, marginBottom: spacing.lg }}>
          <View style={{ width: `${progressPercentage}%`, height: "100%", backgroundColor: colors.primary, borderRadius: 3 }} />
        </View>

        {isVideoStep ? (
          <View>
            <SpeakableLabel
              speakText="Iga Gusoma no Kwandika"
              variant="button"
              textStyle={{ fontSize: fontSize.xl, fontWeight: "700", marginBottom: spacing.md }}
              containerStyle={{ marginBottom: spacing.md }}
            />
            {lesson.videoUrl ? (
              <YoutubePlayer
                ref={playerRef}
                height={220}
                videoId={lesson.videoUrl.split("v=")[1]?.split("&")[0] || lesson.videoUrl.split("/").pop()}
                initialPlayerParams={videoStartSecondsRef.current > 0 ? { start: videoStartSecondsRef.current } : undefined}
              />
            ) : (
              <View style={{ height: 200, backgroundColor: colors.muted, justifyContent: "center", alignItems: "center" }}>
                <SpeakableLabel speakText={copy.lessons.noVideo} variant="inline" textStyle={{ color: colors.foreground }} iconColor={colors.foreground} />
              </View>
            )}
            {lesson.description ? (
              <SpeakableLabel
                speakText={String(lesson.description)}
                variant="button"
                textStyle={{ marginTop: spacing.lg, color: colors.mutedForeground, lineHeight: 24 }}
                containerStyle={{ marginTop: spacing.lg }}
              />
            ) : null}
          </View>
        ) : (
          <View>
            <SpeakableLabel
              speakText={String((currentActivity.question ?? currentActivity.prompt) || `Activity ${currentStep}`)}
              variant="button"
              textStyle={{ fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.lg }}
              containerStyle={{ marginBottom: spacing.lg }}
            />

            {currentActivity.type === "typing" && (
              <View>
                <TextInput
                  style={{ 
                    borderWidth: 2, 
                    borderColor: showFeedback 
                      ? (isCorrect ? colors.success : colors.danger)
                      : colors.primary, 
                    borderRadius: borderRadius.md, 
                    padding: spacing.md, 
                    fontSize: fontSize.lg,
                    backgroundColor: showFeedback
                      ? (isCorrect ? colors.success + "10" : colors.danger + "10")
                      : colors.card
                  }}
                  value={selectedAnswer}
                  onChangeText={(text) => {
                    setSelectedAnswer(text);
                    const newAnswers = [...answers];
                    newAnswers[currentStep - 1] = text;
                    setAnswers(newAnswers);
                  }}
                  autoFocus
                  placeholder={copy.lessons.typePlaceholder}
                  editable={!showFeedback}
                />
                
                {/* Feedback Message */}
                {showFeedback && (
                  <FeedbackMessage 
                    isCorrect={isCorrect} 
                    message={getFeedbackMessage(isCorrect, currentActivity)} 
                  />
                )}
                
                {/* Confirmation Button */}
                <ConfirmationButton />
              </View>
            )}

            {currentActivity.type === "mc" && (
              <View style={{ gap: spacing.sm }}>
                {(currentActivity.options || []).map((opt: string, idx: number) => {
                  const isSelected = selectedOptionIndex === idx;
                  const showCorrectFeedback = showFeedback && isSelected;
                  const label = (opt != null && String(opt).trim()) ? opt : `Option ${idx + 1}`;
                  const borderColor = showCorrectFeedback
                    ? (isCorrect ? colors.success : colors.danger)
                    : (isSelected ? colors.primary : colors.border);
                  const backgroundColor = showCorrectFeedback
                    ? (isCorrect ? "rgba(39, 174, 96, 0.12)" : "rgba(231, 76, 60, 0.12)")
                    : (isSelected ? "rgba(45, 155, 95, 0.08)" : colors.card);
                  const textColor = showCorrectFeedback
                    ? (isCorrect ? colors.success : colors.danger)
                    : (isSelected ? colors.primary : colors.foreground);
                  return (
                    <TouchableOpacity
                      key={`mc-opt-${currentStep}-${idx}`}
                      onPress={() => handleAnswerSelect(opt, idx)}
                      disabled={showFeedback}
                      style={{
                        padding: spacing.lg,
                        borderRadius: borderRadius.md,
                        borderWidth: 2,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderColor,
                        backgroundColor,
                      }}
                    >
                      <Text style={{
                        fontWeight: "600",
                        fontSize: fontSize.base,
                        color: textColor,
                      }}>
                        {label}
                      </Text>
                      {showCorrectFeedback && (
                        <Ionicons 
                          name={isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={20} 
                          color={isCorrect ? colors.success : colors.danger} 
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
                
                {/* Feedback Message */}
                {showFeedback && (
                  <FeedbackMessage 
                    isCorrect={isCorrect} 
                    message={getFeedbackMessage(isCorrect, currentActivity)} 
                  />
                )}
                
                {/* Confirmation Button */}
                <ConfirmationButton />
              </View>
            )}

            {currentActivity.type === "audio" && (
              <View style={{ alignItems: "center", padding: spacing.xl }}>
                <TouchableOpacity
                  onPressIn={startRecording}
                  onPressOut={() => stopRecording(currentStep - 1)}
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
                <Text style={{ marginTop: spacing.md, color: colors.mutedForeground }}>
                  {recording ? copy.lessons.recording : copy.lessons.recordHint}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={{ padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          title={isVideoStep ? copy.lessons.startExercises : (currentStep === activities.length ? copy.lessons.submit : copy.lessons.next)}
          onPress={handleNext}
          disabled={!isVideoStep && !answers[currentStep - 1] && !selectedAnswer && currentActivity?.type !== "audio"}
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}
