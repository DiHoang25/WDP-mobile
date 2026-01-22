import { Button, Card, Header, Input } from "@/components/common";
import { WasteTypeSelector } from "@/components/waste";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { WASTE_TYPES } from "@/data/mockData";
import { validateRequired } from "@/utils/validators";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateReportScreen() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ type?: string; weight?: string }>({});

  const validate = () => {
    const newErrors: { type?: string; weight?: string } = {};

    const typeError = validateRequired(selectedType, "Loại rác");
    if (typeError) newErrors.type = typeError;

    const weightError = validateRequired(weight, "Khối lượng");
    if (weightError) {
      newErrors.weight = weightError;
    } else if (parseFloat(weight) <= 0) {
      newErrors.weight = "Khối lượng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const wasteType = WASTE_TYPES.find((t) => t.value === selectedType);
    const estimatedPoints = Math.round(
      parseFloat(weight) * (wasteType?.points || 10),
    );

    Alert.alert(
      "Tạo báo cáo thành công!",
      `Bạn sẽ nhận được ${estimatedPoints} điểm khi báo cáo được hoàn thành.\n\nShipper sẽ đến thu gom trong 24-48 giờ.`,
      [
        {
          text: "OK",
          onPress: () => {
            setSelectedType("");
            setWeight("");
            setDescription("");
            setErrors({});
          },
        },
      ],
    );
  };

  const estimatedPoints =
    weight && selectedType
      ? Math.round(
          parseFloat(weight || "0") *
            (WASTE_TYPES.find((t) => t.value === selectedType)?.points || 10),
        )
      : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Tạo báo cáo rác"
        subtitle="Phân loại rác giúp môi trường sạch hơn"
        showBack={false}
      />

      <View style={styles.content}>
        {/* Address Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ thu gom</Text>
          <Card variant="elevated">
            <View style={styles.addressCard}>
              <Text style={styles.addressIcon}></Text>
              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>{user?.address}</Text>
                <Text style={styles.districtText}>{user?.district}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Waste Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Loại rác <Text style={styles.required}>*</Text>
          </Text>
          <WasteTypeSelector
            selectedType={selectedType}
            onSelect={(value) => {
              setSelectedType(value);
              setErrors({ ...errors, type: undefined });
            }}
          />
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        </View>

        {/* Weight Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Khối lượng (kg) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 5.5"
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                setErrors({ ...errors, weight: undefined });
              }}
              keyboardType="decimal-pad"
              placeholderTextColor={AppColors.gray[400]}
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>
          {errors.weight && (
            <Text style={styles.errorText}>{errors.weight}</Text>
          )}

          {estimatedPoints > 0 && (
            <View style={styles.pointsEstimate}>
              <Text style={styles.estimateLabel}>Điểm dự kiến:</Text>
              <Text style={styles.estimateValue}>+{estimatedPoints} điểm</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả (tùy chọn)</Text>
          <Input
            placeholder="Ví dụ: Chai nhựa đã rửa sạch, xếp gọn trong túi..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Text style={styles.infoIcon}>💡</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Lưu ý:</Text>
              <Text style={styles.infoText}>
                • Phân loại rác đúng loại để nhận thêm điểm{"\n"}• Rửa sạch và
                để khô trước khi đóng gói{"\n"}• Shipper sẽ đến trong 24-48 giờ
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit Button */}
        <Button title="Tạo báo cáo" onPress={handleSubmit} icon="📝" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  required: {
    color: AppColors.error,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  districtText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    paddingRight: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  inputUnit: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    color: AppColors.error,
    fontSize: 12,
    marginTop: 5,
  },
  pointsEstimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    backgroundColor: AppColors.warning + "20",
    borderRadius: 12,
  },
  estimateLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  infoCard: {
    marginBottom: 25,
    backgroundColor: AppColors.secondary + "10",
  },
  infoContent: {
    flexDirection: "row",
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});
