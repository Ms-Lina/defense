import { cardShadow as getCardShadow } from "@/lib/shadowStyles";

/**
 * MenyAI – design system (matches menyai-ui-design.html)
 * Primary: #2D9B5F, Dark: #1F7A47
 */
/** Use instead of inline shadowColor/shadowOffset/shadowOpacity/shadowRadius (fixes web deprecation). */
export const cardShadow = getCardShadow;

export const colors = {
  primary: "#2D9B5F",
  primaryDark: "#1F7A47",
  primaryLight: "#4CAF78",
  primaryForeground: "#FFFFFF",
  primaryMuted: "#E8F5E9",
  accentYellow: "#FFB84D",
  accentOrange: "#FF8C42",
  aiPurpleStart: "#667EEA",
  aiPurpleEnd: "#764BA2",
  background: "#FAF8F5",
  backgroundAlt: "#F0EDE8",
  foreground: "#1A1A1A",
  muted: "#F5F5F5",
  mutedForeground: "#666666",
  border: "#E5E5E5",
  card: "#FFFFFF",
  success: "#27AE60",
  warning: "#F57C00",
  warningBg: "#FFF3E0",
  danger: "#E74C3C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
} as const;
