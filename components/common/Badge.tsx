import { AppColors } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  color?:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "primary"
    | "secondary"
    | "default";
  size?: "small" | "medium";
  style?: ViewStyle;
}

export default function Badge({
  label,
  color = "default",
  size = "medium",
  style,
}: BadgeProps) {
  const colors = {
    success: { bg: "#D1FAE5", text: "#065F46" },
    warning: { bg: "#FEF3C7", text: "#92400E" },
    error: { bg: "#FEE2E2", text: "#991B1B" },
    info: { bg: "#DBEAFE", text: "#1E40AF" },
    primary: { bg: AppColors.primary + "20", text: AppColors.primary },
    secondary: { bg: AppColors.secondary + "20", text: AppColors.secondary },
    default: { bg: AppColors.gray[200], text: AppColors.gray[700] },
  }[color];

  const sizeStyle = size === "small" ? styles.small : styles.medium;

  return (
    <View
      style={[styles.badge, sizeStyle, { backgroundColor: colors.bg }, style]}
    >
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
