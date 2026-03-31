/**
 * Row: visible text + tap-to-hear (Kinyarwanda TTS). Matches Figma: "button" = grey rounded
 * speaker chip on hero; "inline" = small speaker after labels (stats cards).
 */
import type { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { speakKinyarwanda, playVoiceAsset } from "@/lib/speech";
import { colors } from "@/theme";

export type SpeakableLabelProps = {
  /** Text read aloud (and shown if no children). */
  speakText: string;
  /** Optional bundled audio (require). When set, speaker plays this clip instead of TTS. */
  audioAsset?: number;
  variant?: "button" | "inline";
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  numberOfLines?: number;
  /** Custom visible content; speakText is still what is spoken. */
  children?: ReactNode;
  iconColor?: string;
  /** Background for button variant (light grey on white, or translucent on hero). */
  buttonBackgroundColor?: string;
};

export function SpeakableLabel({
  speakText,
  audioAsset,
  variant = "inline",
  textStyle,
  containerStyle,
  numberOfLines,
  children,
  iconColor,
  buttonBackgroundColor,
}: SpeakableLabelProps) {
  const onSpeak = () => {
    if (audioAsset != null) void playVoiceAsset(audioAsset);
    else speakKinyarwanda(speakText);
  };

  const speaker =
    variant === "button" ? (
      <TouchableOpacity
        onPress={onSpeak}
        style={[
          styles.buttonChip,
          { backgroundColor: buttonBackgroundColor ?? "rgba(0,0,0,0.08)" },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Tege amatwi: ${speakText}`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="volume-medium" size={18} color={iconColor ?? "#1a1a1a"} />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={onSpeak}
        style={styles.inlineHit}
        accessibilityRole="button"
        accessibilityLabel={`Tege amatwi: ${speakText}`}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      >
        <Ionicons name="volume-medium" size={17} color={iconColor ?? colors.foreground} />
      </TouchableOpacity>
    );

  return (
    <View
      style={[
        styles.row,
        variant === "button" ? styles.rowButton : styles.rowInline,
        containerStyle,
      ]}
    >
      <View style={styles.textShrink}>
        {children != null ? (
          children
        ) : (
          <Text style={textStyle} numberOfLines={numberOfLines}>
            {speakText}
          </Text>
        )}
      </View>
      {speaker}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  rowButton: {
    alignItems: "flex-start",
  },
  rowInline: {
    alignItems: "center",
  },
  textShrink: {
    flexShrink: 1,
  },
  buttonChip: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineHit: {
    justifyContent: "center",
    paddingVertical: 2,
  },
});
