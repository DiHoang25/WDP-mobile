import { AppColors } from "@/constants/theme";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  variant?: "default" | "elevated" | "outlined";
}

export default function Card({
  children,
  style,
  padding = 20,
  variant = "default",
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === "elevated" && styles.elevated,
        variant === "outlined" && styles.outlined,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: AppColors.gray[200],
    shadowOpacity: 0,
    elevation: 0,
  },
});
