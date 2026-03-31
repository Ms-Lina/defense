import { Platform, ViewStyle } from "react-native";

/**
 * Cross-platform shadow: uses boxShadow on web (avoids "shadow* deprecated" warning),
 * and shadow* props on native.
 */
export function cardShadow(opts?: {
  color?: string;
  offset?: { width: number; height: number };
  opacity?: number;
  radius?: number;
}): ViewStyle {
  const color = opts?.color ?? "#000";
  const offset = opts?.offset ?? { width: 0, height: 2 };
  const opacity = opts?.opacity ?? 0.08;
  const radius = opts?.radius ?? 8;

  if (Platform.OS === "web") {
    const hex = color.startsWith("#") ? color.slice(1) : "000000";
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(${r},${g},${b},${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 2,
  };
}
