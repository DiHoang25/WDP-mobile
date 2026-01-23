import LogoHeader from "@/components/auth/LogoHeader";
import { Button, Input } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      router.replace("/");
    } else {
      setError("Email hoặc mật khẩu không đúng");
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
        <LogoHeader
          appName="EcoCollect"
          tagline="Bảo vệ môi trường - Thu gom rác thông minh"
        />

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Chào mừng trở lại!</Text>
          <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

          <Input
            label="Email"
            icon=""
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            required
          />

          <Input
            label="Mật khẩu"
            icon=""
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            required
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title="Đăng nhập"
            onPress={handleLogin}
            loading={loading}
            icon=""
            style={styles.loginButton}
          />

          {/* Register Link / Button */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={styles.registerLink}>Đăng ký tài khoản</Text>
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
    padding: 28,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: AppColors.textSecondary,
    marginBottom: 32,
    fontWeight: "400",
  },
  errorText: {
    color: AppColors.error,
    fontSize: 14,
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  businessButton: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "700",
  },
});
