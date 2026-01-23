import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface QuickLoginButtonProps {
  email: string;
  icon: string;
  label: string;
  color: string;
  onPress: (email: string) => void;
}

export default function QuickLoginButton({
  email,
  icon,
  label,
  color,
  onPress,
}: QuickLoginButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: color }]}
      onPress={() => onPress(email)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={28}
        color={color}
        style={styles.icon}
      />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    backgroundColor: AppColors.white,
    minWidth: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
});
