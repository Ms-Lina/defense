/**
 * Accessibility: speak UI copy in Kinyarwanda (TTS), or play bundled MP4 clips via expo-av.
 */
import { Audio } from "expo-av";
import * as Speech from "expo-speech";

let activeSound: Audio.Sound | null = null;
let audioModeReady = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    audioModeReady = true;
  } catch {
    /* ignore */
  }
}

async function unloadActiveSound(): Promise<void> {
  if (!activeSound) return;
  try {
    await activeSound.stopAsync();
  } catch {
    /* ignore */
  }
  try {
    await activeSound.unloadAsync();
  } catch {
    /* ignore */
  }
  activeSound = null;
}

export function stopSpeaking(): void {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
  void unloadActiveSound();
}

/** Speak trimmed text; stops any playing clip first. */
export function speakKinyarwanda(text: string): void {
  const t = text?.trim();
  if (!t) return;
  void unloadActiveSound().then(() => {
    try {
      Speech.stop();
    } catch {
      /* ignore */
    }
    Speech.speak(t, {
      language: "rw-RW",
      pitch: 1,
      rate: 0.92,
    });
  });
}

/** Play a bundled require(...) asset (e.g. MP4); stops TTS and any prior clip. */
export async function playVoiceAsset(source: number): Promise<void> {
  try {
    Speech.stop();
  } catch {
    /* ignore */
  }
  await unloadActiveSound();
  await ensureAudioMode();
  try {
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
    activeSound = sound;
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void unloadActiveSound();
      }
    });
  } catch {
    /* ignore */
  }
}
