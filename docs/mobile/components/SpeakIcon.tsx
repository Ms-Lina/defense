import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { speakKinyarwanda, playVoiceAsset } from "@/lib/speech";
import { colors } from "@/theme";

/** Small tap-to-speak control for form fields (matches design: speaker icon). */
export function SpeakIcon({
  speakText,
  audioAsset,
  size = 20,
  color,
}: {
  speakText: string;
  audioAsset?: number;
  size?: number;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (audioAsset != null) void playVoiceAsset(audioAsset);
        else speakKinyarwanda(speakText);
      }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={`Tege amatwi: ${speakText}`}
    >
      <Ionicons name="volume-medium" size={size} color={color ?? colors.mutedForeground} />
    </TouchableOpacity>
  );
}
