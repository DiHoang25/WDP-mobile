import { Button, Header, Input } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
} from "@/utils/validators";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole] = useState<UserRole>("citizen");



  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();





  const handleRegister = async () => {
    setError("");

    // Validation
    const nameError = validateRequired(name, "Họ và tên");
    if (nameError) {
      setError(nameError);
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }

    if (!validatePhone(phone)) {
      setError("Số điện thoại không hợp lệ");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || "Mật khẩu không hợp lệ");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    const userData: any = {
      name,
      email,
      phone,
      password,
    };


    userData.points = 0;

    setLoading(true);
    const response = await register(userData);
    setLoading(false);

    if (response.success) {
      alert("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      router.replace("/login");
    } else {
      setError(response.error || "Đăng ký thất bại. Vui lòng thử lại");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title="Đăng ký tài khoản"
          subtitle="Tham gia cộng đồng bảo vệ môi trường"
          showBack
        />

        <View style={styles.formContainer}>
          <Input
            label="Họ và tên"
            icon="person"
            placeholder="Nguyễn Văn A"
            value={name}
            onChangeText={setName}
            required
          />

          <Input
            label="Email"
            icon="mail"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Input
            label="Số điện thoại"
            icon="call"
            placeholder="0901234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            required
          />



          <Input
            label="Mật khẩu"
            icon="lock-closed"
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
          />

          <Input
            label="Xác nhận mật khẩu"
            icon="lock-closed"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            required
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
  },
  addressDisplayCard: {
    backgroundColor: AppColors.primary + "10",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressInfo: {
    marginLeft: 12,
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  fullAddressText: {
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 22,
    fontWeight: "600",
  },
  warningText: {
    fontSize: 11,
    color: AppColors.error,
    marginTop: 6,
    fontStyle: "italic",
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "700",
  },
});
