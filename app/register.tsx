import { Button, Header, Input } from "@/components/common";
import RoleSelector from "@/components/forms/RoleSelector";
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
  const [selectedRole, setSelectedRole] = useState<UserRole>("citizen");

  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("Quận 1");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

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
      role: selectedRole,
    };

    if (selectedRole === "citizen") {
      const addressError = validateRequired(address, "Địa chỉ");
      if (addressError) {
        setError(addressError);
        return;
      }
      userData.address = address;
      userData.district = district;
      userData.points = 0;
    } else if (selectedRole === "shipper") {
      const vehicleTypeError = validateRequired(
        vehicleType,
        "Loại phương tiện",
      );
      const vehicleNumberError = validateRequired(vehicleNumber, "Biển số xe");
      if (vehicleTypeError || vehicleNumberError) {
        setError(vehicleTypeError || vehicleNumberError || "");
        return;
      }
      userData.vehicleType = vehicleType;
      userData.vehicleNumber = vehicleNumber;
    }

    setLoading(true);
    const success = await register(userData);
    setLoading(false);

    if (success) {
      if (selectedRole === "citizen") {
        router.replace("/(citizen)/" as any);
      } else if (selectedRole === "shipper") {
        router.replace("/(shipper)/" as any);
      }
    } else {
      setError("Đăng ký thất bại. Vui lòng thử lại");
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
          <RoleSelector
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />

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

          {selectedRole === "citizen" && (
            <>
              <Input
                label="Địa chỉ"
                icon="location"
                placeholder="123 Lê Lợi, Quận 1"
                value={address}
                onChangeText={setAddress}
                required
              />
              <Input
                label="Quận/Huyện"
                icon="business"
                value={district}
                editable={false}
              />
            </>
          )}

          {selectedRole === "shipper" && (
            <>
              <Input
                label="Loại phương tiện"
                icon="car"
                placeholder="Xe máy / Xe tải nhỏ"
                value={vehicleType}
                onChangeText={setVehicleType}
                required
              />
              <Input
                label="Biển số xe"
                icon="card"
                placeholder="59A-12345"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                required
              />
            </>
          )}

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
