import { Button, Header, Input, MapLocationPicker } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { District, locationService, Province, Ward } from "@/services/location.service";
import { UserRole } from "@/types";
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
} from "@/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

  // Location dynamic data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Selection
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [wardId, setWardId] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Map location data
  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    rawAddress?: any;
  } | null>(null);

  // Helper to normalize and compare Vietnamese location names
  const normalizeLocationName = (name: string): string => {
    if (!name) return "";
    return name
      .toLowerCase()
      .replace(/^(tỉnh|thành phố|thành phồ|quận|huyện|thị xã|phường|xã|thị trấn|p\.|q\.)\s*/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Auto-fill address elements when map location is selected
  const handleMapLocationSelect = async (loc: any) => {
    setMapLocation(loc);

    if (loc.rawAddress) {
      const raw = loc.rawAddress;

      // 1. Fill detailed address
      const streetPart = [raw.name, raw.street].filter(Boolean).join(" ");
      if (streetPart) setAddress(streetPart);

      // 2. Try to match Province
      const provinceName = raw.region || raw.city || "";
      const normProvince = normalizeLocationName(provinceName);

      if (normProvince && provinces.length > 0) {
        const matchedProvince = provinces.find(p => {
          const pNorm = normalizeLocationName(p.name);
          return normProvince.includes(pNorm) || pNorm.includes(normProvince);
        });

        if (matchedProvince) {
          setProvinceId(matchedProvince.code);

          // 3. Load and match District
          const distRes = await locationService.getDistricts(matchedProvince.code);
          if (distRes.success && distRes.data) {
            setDistricts(distRes.data);
            const districtName = raw.district || raw.city_district || raw.suburb || "";
            const normDistrict = normalizeLocationName(districtName);

            const matchedDistrict = distRes.data.find(d => {
              const dNorm = normalizeLocationName(d.name);
              return normDistrict.includes(dNorm) || dNorm.includes(normDistrict);
            });

            if (matchedDistrict) {
              setDistrictId(matchedDistrict.code);

              // 4. Load and match Ward
              const wardRes = await locationService.getWards(matchedDistrict.code);
              if (wardRes.success && wardRes.data) {
                setWards(wardRes.data);

                // Smart search for Ward: check multiple raw fields from Nominatim
                const wardCandidates = [
                  raw.ward,
                  raw.suburb,
                  raw.subdistrict,
                  raw.neighbourhood,
                  raw.quarter,
                  raw.hamlet,
                  raw.village
                ].filter(Boolean);

                let matchedWard = null;
                for (const candidate of wardCandidates) {
                  const normCandidate = normalizeLocationName(candidate);
                  matchedWard = wardRes.data.find(w => {
                    const wNorm = normalizeLocationName(w.name);
                    return normCandidate.includes(wNorm) || wNorm.includes(normCandidate);
                  });
                  if (matchedWard) break;
                }

                if (matchedWard) setWardId(matchedWard.code);
              }
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (provinceId) {
      loadDistricts(provinceId);
    } else {
      setDistricts([]);
      setDistrictId("");
      setWards([]);
      setWardId("");
    }
  }, [provinceId]);

  useEffect(() => {
    if (districtId) {
      loadWards(districtId);
    } else {
      setWards([]);
      setWardId("");
    }
  }, [districtId]);

  const loadProvinces = async () => {
    const res = await locationService.getProvinces();
    if (res.success && res.data) setProvinces(res.data);
  };

  const loadDistricts = async (id: string) => {
    const res = await locationService.getDistricts(id);
    if (res.success && res.data) setDistricts(res.data);
  };

  const loadWards = async (id: string) => {
    const res = await locationService.getWards(id);
    if (res.success && res.data) setWards(res.data);
  };

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

    const addressError = validateRequired(address, "Địa chỉ chi tiết");
    if (addressError) {
      setError(addressError);
      return;
    }

    if (!mapLocation) {
      setError("Vui lòng chọn vị trí trên bản đồ");
      return;
    }

    userData.address = address;
    userData.latitude = mapLocation.latitude;
    userData.longitude = mapLocation.longitude;
    userData.provinceCode = provinceId;
    userData.districtCode = districtId;
    userData.wardCode = wardId;
    userData.points = 0;

    setLoading(true);
    const success = await register(userData);
    setLoading(false);

    if (success) {
      alert("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      router.replace("/login");
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


          <MapLocationPicker
            label="Chọn vị trí chính xác trên bản đồ"
            onLocationSelect={handleMapLocationSelect}
          />

          {mapLocation && (
            <View style={styles.addressDisplayCard}>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={20} color={AppColors.primary} />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Khu vực phục vụ đã xác định:</Text>
                  <Text style={styles.fullAddressText}>
                    {[
                      wards.find(w => w.code === wardId)?.name,
                      districts.find(d => d.code === districtId)?.name,
                      provinces.find(p => p.code === provinceId)?.name
                    ].filter(Boolean).join(", ") || "Đang xác định khu vực..."}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Input
            label="Địa chỉ chi tiết (nhập thủ công nếu cần)"
            icon="location-outline"
            placeholder="Số nhà, ngõ, tên đường..."
            value={address}
            onChangeText={setAddress}
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
