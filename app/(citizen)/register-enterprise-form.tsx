import { Header, Input } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { WasteType } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Danh sách các quận/huyện tại TP. Hồ Chí Minh
const HCM_DISTRICTS = [
  { id: "Q1", name: "Quận 1" },
  { id: "Q2", name: "Quận 2" },
  { id: "Q3", name: "Quận 3" },
  { id: "Q4", name: "Quận 4" },
  { id: "Q5", name: "Quận 5" },
  { id: "Q6", name: "Quận 6" },
  { id: "Q7", name: "Quận 7" },
  { id: "Q8", name: "Quận 8" },
  { id: "Q9", name: "Quận 9" },
  { id: "Q10", name: "Quận 10" },
  { id: "Q11", name: "Quận 11" },
  { id: "Q12", name: "Quận 12" },
  { id: "TB", name: "Quận Tân Bình" },
  { id: "TP", name: "Quận Tân Phú" },
  { id: "BT", name: "Quận Bình Tân" },
  { id: "BTH", name: "Quận Bình Thạnh" },
  { id: "PN", name: "Quận Phú Nhuận" },
  { id: "GV", name: "Quận Gò Vấp" },
  { id: "TD", name: "Quận Thủ Đức" },
  { id: "BC", name: "Huyện Bình Chánh" },
  { id: "HC", name: "Huyện Hóc Môn" },
  { id: "CG", name: "Huyện Củ Chi" },
  { id: "NH", name: "Huyện Nhà Bè" },
  { id: "CC", name: "Huyện Cần Giờ" },
];

export default function RegisterEnterpriseFormScreen() {
  const params = useLocalSearchParams();
  const planId = params.planId as string;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    capacityKg: "",
    serviceAreas: [] as string[],
    wasteTypes: [] as WasteType[],
    startTime: "08:00",
    endTime: "17:00",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleServiceArea = (districtId: string) => {
    setFormData((prev) => {
      const serviceAreas = prev.serviceAreas.includes(districtId)
        ? prev.serviceAreas.filter((id) => id !== districtId)
        : [...prev.serviceAreas, districtId];
      return { ...prev, serviceAreas };
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên doanh nghiệp";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ";
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Vui lòng chọn vị trí trên bản đồ";
    }

    if (!formData.capacityKg || parseInt(formData.capacityKg) <= 0) {
      newErrors.capacityKg = "Vui lòng nhập công suất xử lý";
    }

    if (formData.serviceAreas.length === 0) {
      newErrors.serviceAreas = "Vui lòng chọn ít nhất 1 khu vực phục vụ";
    }

    if (formData.wasteTypes.length === 0) {
      newErrors.wasteTypes = "Vui lòng chọn ít nhất 1 loại rác";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin");
      return;
    }

    // Chuyển sang màn hình chọn gói thanh toán
    router.push({
      pathname: "/(citizen)/register-enterprise" as any,
      params: {
        ...formData,
        serviceAreas: JSON.stringify(formData.serviceAreas),
        wasteTypes: JSON.stringify(formData.wasteTypes),
      },
    });
  };

  const pickLocation = () => {
    // TODO: Implement map picker
    Alert.alert(
      "Chọn vị trí",
      "Tính năng chọn vị trí trên bản đồ đang phát triển",
      [
        {
          text: "Nhập thủ công",
          onPress: () => {
            // Set sample coordinates
            handleInputChange("latitude", "21.0285");
            handleInputChange("longitude", "105.8542");
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header
        title="Thông tin doanh nghiệp"
        subtitle="Điền đầy đủ thông tin đăng ký"
        showBack={true}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

          <Input
            label="Tên doanh nghiệp *"
            placeholder="VD: Công ty TNHH Xử lý rác ABC"
            value={formData.name}
            onChangeText={(value) => handleInputChange("name", value)}
            error={errors.name}
          />

          <Input
            label="Địa chỉ *"
            placeholder="VD: 123 Đường ABC, Phường XYZ"
            value={formData.address}
            onChangeText={(value) => handleInputChange("address", value)}
            error={errors.address}
            multiline
          />

          {/* Location Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vị trí trên bản đồ *</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={pickLocation}
            >
              <Text style={styles.locationButtonIcon}>📍</Text>
              <View style={styles.locationButtonContent}>
                {formData.latitude && formData.longitude ? (
                  <>
                    <Text style={styles.locationButtonText}>
                      Đã chọn vị trí
                    </Text>
                    <Text style={styles.locationCoords}>
                      {formData.latitude}, {formData.longitude}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.locationButtonText}>
                    Chọn vị trí trên bản đồ
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
          </View>

          <Input
            label="Công suất xử lý (kg/ngày) *"
            placeholder="VD: 1000"
            value={formData.capacityKg}
            onChangeText={(value) => handleInputChange("capacityKg", value)}
            keyboardType="numeric"
            error={errors.capacityKg}
          />
        </View>

        {/* Service Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khu vực phục vụ (TP.HCM) *</Text>
          <Text style={styles.sectionSubtitle}>
            Chọn các quận/huyện bạn có thể phục vụ tại TP. Hồ Chí Minh
          </Text>

          <View style={styles.areasGrid}>
            {HCM_DISTRICTS.map((district) => (
              <TouchableOpacity
                key={district.id}
                style={[
                  styles.areaChip,
                  formData.serviceAreas.includes(district.id) &&
                    styles.areaChipSelected,
                ]}
                onPress={() => toggleServiceArea(district.id)}
              >
                <Text
                  style={[
                    styles.areaChipText,
                    formData.serviceAreas.includes(district.id) &&
                      styles.areaChipTextSelected,
                  ]}
                >
                  {district.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.serviceAreas && (
            <Text style={styles.errorText}>{errors.serviceAreas}</Text>
          )}
        </View>

        {/* Waste Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loại rác xử lý *</Text>
          <Text style={styles.sectionSubtitle}>
            Chọn các loại rác doanh nghiệp có thể xử lý
          </Text>

          <View style={styles.wasteTypesGrid}>
            {[
              { value: "organic", label: "Rác hữu cơ", icon: "🥬" },
              { value: "plastic", label: "Nhựa", icon: "🥤" },
              { value: "paper", label: "Giấy", icon: "📄" },
              { value: "metal", label: "Kim loại", icon: "🔩" },
              { value: "glass", label: "Thủy tinh", icon: "🍾" },
              { value: "electronic", label: "Điện tử", icon: "📱" },
              { value: "hazardous", label: "Nguy hại", icon: "☢️" },
              { value: "mixed", label: "Hỗn hợp", icon: "♻️" },
            ].map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.wasteTypeChip,
                  formData.wasteTypes.includes(type.value as WasteType) &&
                    styles.wasteTypeChipSelected,
                ]}
                onPress={() => {
                  const newTypes = formData.wasteTypes.includes(type.value as WasteType)
                    ? formData.wasteTypes.filter((t) => t !== type.value)
                    : [...formData.wasteTypes, type.value as WasteType];
                  handleInputChange("wasteTypes", newTypes);
                }}
              >
                <Text style={styles.wasteTypeIcon}>{type.icon}</Text>
                <Text
                  style={[
                    styles.wasteTypeText,
                    formData.wasteTypes.includes(type.value as WasteType) &&
                      styles.wasteTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.wasteTypes && (
            <Text style={styles.errorText}>{errors.wasteTypes}</Text>
          )}
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Giờ làm việc</Text>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Giờ mở cửa</Text>
              <TextInput
                style={styles.timeField}
                value={formData.startTime}
                onChangeText={(value) => handleInputChange("startTime", value)}
                placeholder="08:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <Text style={styles.timeSeparator}>-</Text>

            <View style={styles.timeInput}>
              <Text style={styles.inputLabel}>Giờ đóng cửa</Text>
              <TextInput
                style={styles.timeField}
                value={formData.endTime}
                onChangeText={(value) => handleInputChange("endTime", value)}
                placeholder="17:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteIcon}>ℹ️</Text>
          <Text style={styles.noteText}>
            Sau khi đăng ký, hệ thống sẽ xem xét và phê duyệt trong vòng 1-2
            ngày làm việc.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Tiếp tục chọn gói</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  locationButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationButtonContent: {
    flex: 1,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.textPrimary,
  },
  locationCoords: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  areasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  areaChipSelected: {
    backgroundColor: AppColors.primary + "15",
    borderColor: AppColors.primary,
  },
  areaChipText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  areaChipTextSelected: {
    color: AppColors.primary,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeField: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: AppColors.textPrimary,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  timeSeparator: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textSecondary,
    marginTop: 24,
  },
  noteSection: {
    flexDirection: "row",
    margin: 20,
    marginTop: 10,
    padding: 16,
    backgroundColor: AppColors.info + "10",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.info,
  },
  noteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
  },
  wasteTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wasteTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    gap: 6,
  },
  wasteTypeChipSelected: {
    backgroundColor: AppColors.success + "15",
    borderColor: AppColors.success,
  },
  wasteTypeIcon: {
    fontSize: 16,
  },
  wasteTypeText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  wasteTypeTextSelected: {
    color: AppColors.success,
    fontWeight: "600",
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
});
