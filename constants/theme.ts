/**
 * ECONNET App - Theme Colors for Environmental Waste Collection
 * Primary: Green (environment), Blue (trust), White (clean), Gray (neutral)
 */

import { Platform } from "react-native";

// Main App Colors - Modern Environment Theme
export const AppColors = {
  primary: "#14B8A6", // Teal - Modern & Professional
  primaryDark: "#0D9488",
  primaryLight: "#2DD4BF",

  secondary: "#06B6D4", // Cyan - Fresh & Clean
  secondaryDark: "#0891B2",
  secondaryLight: "#22D3EE",

  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",

  white: "#FFFFFF",
  black: "#000000",

  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  background: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#E5E7EB",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",

  // Role specific colors
  citizen: "#14B8A6", // Teal
  shipper: "#F59E0B", // Orange
};

const tintColorLight = AppColors.primary;
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: AppColors.textPrimary,
    background: AppColors.background,
    tint: tintColorLight,
    icon: AppColors.gray[500],
    tabIconDefault: AppColors.gray[400],
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
