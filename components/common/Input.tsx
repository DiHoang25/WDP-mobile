import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string; // Ionicons name
  required?: boolean;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  icon,
  required,
  secureTextEntry,
  containerStyle,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          error && styles.inputError,
          isFocused && styles.inputFocused,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={isFocused ? AppColors.primary : AppColors.gray[400]}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={AppColors.gray[400]}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={AppColors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  required: {
    color: AppColors.error,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppColors.gray[200],
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFocused: {
    borderColor: AppColors.primary,
    shadowOpacity: 0.1,
  },
  inputError: {
    borderColor: AppColors.error,
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AppColors.textPrimary,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 6,
    marginLeft: 6,
    fontWeight: "500",
  },
});
