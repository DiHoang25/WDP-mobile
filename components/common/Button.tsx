import { AppColors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: string;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const buttonSize = {
    small: { padding: 10, fontSize: 14 },
    medium: { padding: 16, fontSize: 16 },
    large: { padding: 20, fontSize: 18 },
  }[size];

  if (variant === "primary") {
    return (
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[AppColors.primary, AppColors.primaryDark]}
          style={[styles.gradient, { padding: buttonSize.padding }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color={AppColors.white} />
          ) : (
            <>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={[styles.text, { fontSize: buttonSize.fontSize }]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          styles.outlineButton,
          { padding: buttonSize.padding },
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={AppColors.primary} />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text
              style={[styles.outlineText, { fontSize: buttonSize.fontSize }]}
            >
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles.secondaryButton,
        { padding: buttonSize.padding },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={AppColors.white} />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { fontSize: buttonSize.fontSize }]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  gradient: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    color: AppColors.white,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  outlineButton: {
    backgroundColor: AppColors.white,
    borderWidth: 2,
    borderColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  outlineText: {
    color: AppColors.primary,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: AppColors.gray[600],
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});
