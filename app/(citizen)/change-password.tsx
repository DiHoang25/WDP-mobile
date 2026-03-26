import { Button, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { profileService } from "@/services/profile.service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(t("common.error"), t("changePassword.fillAll"));
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(t("common.error"), t("changePassword.mismatch"));
      return;
    }

    if (newPassword.length < 6) {
      showAlert(t("common.error"), t("changePassword.tooShort"));
      return;
    }

    if (currentPassword === newPassword) {
      showAlert(t("common.error"), t("changePassword.mismatch"));
      return;
    }

    setLoading(true);
    try {
      const response = await profileService.changePassword({
        currentPassword,
        newPassword,
      });

      if (response.error) {
        showAlert(t("common.error"), response.error || t("common.error"));
      } else {
        showAlert(t("common.success"), t("changePassword.success"), [
          {
            text: "OK",
            onPress: async () => {
              await logout();
              router.replace("/login");
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Change password error:", error);
      showAlert(t("common.error"), t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title={t("changePassword.title")} showBack={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Illustration/Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed"
                size={40}
                color={AppColors.primary}
              />
            </View>
            <Text style={styles.hintText}>
              {t("changePassword.newPlaceholder")}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("changePassword.currentPassword")}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t("changePassword.currentPlaceholder")}
                  secureTextEntry={!showCurrent}
                  placeholderTextColor={AppColors.gray[400]}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrent(!showCurrent)}
                >
                  <Ionicons
                    name={showCurrent ? "eye-off" : "eye"}
                    size={20}
                    color={AppColors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("changePassword.newPassword")}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t("changePassword.newPlaceholder")}
                  secureTextEntry={!showNew}
                  placeholderTextColor={AppColors.gray[400]}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNew(!showNew)}
                >
                  <Ionicons
                    name={showNew ? "eye-off" : "eye"}
                    size={20}
                    color={AppColors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("changePassword.confirmPassword")}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t("changePassword.confirmPlaceholder")}
                  secureTextEntry={!showConfirm}
                  placeholderTextColor={AppColors.gray[400]}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirm(!showConfirm)}
                >
                  <Ionicons
                    name={showConfirm ? "eye-off" : "eye"}
                    size={20}
                    color={AppColors.gray[500]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title={t("changePassword.submit")}
              onPress={handleChangePassword}
              loading={loading}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  hintText: {
    textAlign: "center",
    color: AppColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  eyeIcon: {
    padding: 12,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
  },
});
