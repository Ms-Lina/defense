/**
 * Bundled voice clips (MP4) for key UI phrases. Tapping the speaker uses these instead of TTS.
 */
export const voiceAssets = {
  amasomo: require("../assets/audio/amasomo.mp4"),
  ibikorwaByIbanze: require("../assets/audio/ibikorwa by'ibanze.mp4"),
  iterambere: require("../assets/audio/iterambere.mp4"),
  murahoWithName: require("../assets/audio/muraho lina.mp4"),
  tangiraIsomo: require("../assets/audio/tangira isomo.mp4"),
} as const;

export type VoiceAssetKey = keyof typeof voiceAssets;
