import type { ToastType } from "@/components/common";
import { Button, Card, Input, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { collectorService } from "@/services/collector.service";
import { AccuracyRating } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TaskCompleteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [weightOrganic, setWeightOrganic] = useState("");
  const [weightRecyclable, setWeightRecyclable] = useState("");
  const [weightHazardous, setWeightHazardous] = useState("");
  const [accuracy, setAccuracy] = useState<AccuracyRating>("MATCH");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const accuracyOptions = [
    { label: "✅ Khớp hoàn toàn", value: "MATCH" },
    { label: "🟡 Chênh lệch vừa", value: "MODERATE" },
    { label: "🔴 Sai sót lớn", value: "HEAVY" },
  ];

  const handlePickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const wOrg = parseFloat(weightOrganic) || 0;
    const wRec = parseFloat(weightRecyclable) || 0;
    const wHaz = parseFloat(weightHazardous) || 0;

    if (wOrg <= 0 && wRec <= 0 && wHaz <= 0) {
      showAlert("Lỗi", "Vui lòng nhập ít nhất một loại khối lượng rác");
      return;
    }

    if (images.length === 0) {
      showAlert("Lỗi", "Vui lòng chụp ít nhất 1 ảnh bằng chứng");
      return;
    }

    showAlert("Xác nhận", "Hoàn tất thu gom Đơn hàng này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xác nhận",
        onPress: async () => {
          try {
            setSubmitting(true);
            const res = await collectorService.completeTask({
              reportId: Number(id),
              weightOrganic: wOrg || undefined,
              weightRecyclable: wRec || undefined,
              weightHazardous: wHaz || undefined,
              accuracyBucket: accuracy as any,
              files: images,
            });
            if (res.success) {
              showToast("Đã hoàn tất Đơn hàng!", "success");
              setTimeout(() => {
                router.replace("/(collectors)" as any);
              }, 1500);
            } else {
              showToast(res.message || "Không thể hoàn tất Đơn hàng", "error");
            }
          } catch (error) {
            console.error("completeTask error:", error);
            showToast("Đã có lỗi xảy ra", "error");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Weight input */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Khối lượng thu gom thực tế</Text>
            <View style={{ gap: 12 }}>
              <Input
                label="Rác Hữu cơ (kg)"
                value={weightOrganic}
                onChangeText={setWeightOrganic}
                placeholder="0.0"
                keyboardType="numeric"
                icon="leaf"
              />
              <Input
                label="Rác Tái chế (kg)"
                value={weightRecyclable}
                onChangeText={setWeightRecyclable}
                placeholder="0.0"
                keyboardType="numeric"
                icon="refresh"
              />
              <Input
                label="Rác Nguy hại (kg)"
                value={weightHazardous}
                onChangeText={setWeightHazardous}
                placeholder="0.0"
                keyboardType="numeric"
                icon="warning"
              />
            </View>
          </Card>

          {/* Accuracy rating */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá độ chính xác</Text>
            <Text style={styles.sectionDescription}>
              So sánh với khối lượng ước tính ban đầu
            </Text>
            <View style={styles.accuracyOptions}>
              {accuracyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.accuracyOption,
                    accuracy === option.value && styles.accuracyOptionActive,
                  ]}
                  onPress={() => setAccuracy(option.value as AccuracyRating)}
                >
                  <View
                    style={[
                      styles.radio,
                      accuracy === option.value && styles.radioActive,
                    ]}
                  >
                    {accuracy === option.value && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.accuracyLabel,
                      accuracy === option.value && styles.accuracyLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Image upload */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh bằng chứng *</Text>
            <Text style={styles.sectionDescription}>
              Chụp ảnh rác đã thu gom (tối thiểu 1 ảnh)
            </Text>

            <View style={styles.imagesGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close-circle" size={28} color={AppColors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
                  <Ionicons name="camera" size={32} color={AppColors.primary} />
                  <Text style={styles.addImageText}>Chụp ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Info */}
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={20} color={AppColors.info} />
              <Text style={styles.infoText}>
                Sau khi hoàn tất, bạn và Công dân đều cần xác nhận Đơn hàng đã được thực hiện
              </Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Xác nhận hoàn tất"
              onPress={handleSubmit}
              disabled={(parseFloat(weightOrganic) || 0) + (parseFloat(weightRecyclable) || 0) + (parseFloat(weightHazardous) || 0) <= 0 || images.length === 0 || submitting}
              loading={submitting}
            />
            <Button title="Hủy" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      </ScrollView>
    </View>
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: AppColors.gray[600],
    marginBottom: 16,
  },
  accuracyOptions: {
    gap: 12,
  },
  accuracyOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    backgroundColor: AppColors.white,
  },
  accuracyOptionActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.gray[400],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioActive: {
    borderColor: AppColors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary,
  },
  accuracyLabel: {
    fontSize: 15,
    color: AppColors.gray[700],
  },
  accuracyLabelActive: {
    fontWeight: "600",
    color: AppColors.primary,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: AppColors.white,
    borderRadius: 14,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    color: AppColors.primary,
    marginTop: 4,
    fontWeight: "600",
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: AppColors.info + "10",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
