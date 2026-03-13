import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { collectorService } from "@/services/collector.service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function TaskReportIssueScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

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
    if (description.trim().length < 5) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả sự cố (tối thiểu 5 ký tự)");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chụp ít nhất 1 ảnh bằng chứng");
      return;
    }

    Alert.alert(
      "Xác nhận",
      "Gửi báo cáo sự cố? Công dân sẽ bị trừ 50 điểm uy tín.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi báo cáo",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await collectorService.reportDispute(Number(id), {
                reason: description.trim(),
                files: images,
              });
              if (res.success) {
                showToast("Đã gửi báo cáo sự cố", "success");
                setTimeout(() => {
                  router.replace("/(collectors)" as any);
                }, 1500);
              } else {
                showToast("Không thể gửi báo cáo", "error");
              }
            } catch (error) {
              showToast("Đã có lỗi xảy ra", "error");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
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
          {/* Warning banner */}
          <Card
            variant="outlined"
            style={[
              styles.warningCard,
              { borderColor: AppColors.error, backgroundColor: AppColors.error + "10" },
            ]}
          >
            <View style={styles.warningHeader}>
              <Ionicons name="alert-circle" size={32} color={AppColors.error} />
              <Text style={styles.warningTitle}>⚠️ Cảnh báo quan trọng</Text>
            </View>
            <Text style={styles.warningText}>
              Chỉ dùng khi Công dân đã xác nhận có mặt nhưng không cung cấp rác hoặc có hành vi gian
              lận. Báo cáo sai có thể ảnh hưởng đến điểm tin cậy của bạn.
            </Text>
          </Card>

          {/* Description */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sự cố *</Text>
            <Text style={styles.sectionDescription}>
              Nhập chi tiết về sự cố (tối thiểu 5 ký tự)
            </Text>
            <TextInput
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Ví dụ: Công dân bấm 'Tôi có mặt' nhưng không có rác tại địa điểm, cửa đóng..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length} / 500 ký tự</Text>
          </Card>

          {/* Image upload */}
          <Card variant="elevated" style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh bằng chứng *</Text>
            <Text style={styles.sectionDescription}>
              Chụp ảnh tại chỗ làm bằng chứng (bắt buộc tối thiểu 1 ảnh)
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
                  <Ionicons name="camera" size={32} color={AppColors.error} />
                  <Text style={styles.addImageText}>Chụp ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>

          {/* Consequences */}
          <Card variant="outlined" style={styles.consequenceCard}>
            <Text style={styles.consequenceTitle}>Hệ quả của báo cáo này</Text>
            <View style={styles.consequenceItem}>
              <Ionicons name="trending-down" size={20} color={AppColors.error} />
              <Text style={styles.consequenceText}>
                Công dân sẽ bị trừ <Text style={styles.bold}>50 điểm uy tín</Text>
              </Text>
            </View>
            <View style={styles.consequenceItem}>
              <Ionicons name="document-text" size={20} color={AppColors.error} />
              <Text style={styles.consequenceText}>Báo cáo sẽ được quản lý xem xét</Text>
            </View>
            <View style={styles.consequenceItem}>
              <Ionicons name="people" size={20} color={AppColors.error} />
              <Text style={styles.consequenceText}>
                Nếu Công dân tiếp tục vi phạm, tài khoản có thể bị khóa
              </Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Gửi báo cáo sự cố"
              onPress={handleSubmit}
              disabled={description.trim().length < 5 || images.length === 0 || submitting}
              loading={submitting}
              variant="primary"
              style={{
                backgroundColor: AppColors.error,
                borderColor: AppColors.error,
              }}
            />
            <Button title="Huỷ" variant="outline" onPress={() => router.back()} />
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
  warningCard: {
    marginBottom: 20,
    borderWidth: 2,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.error,
    marginLeft: 12,
  },
  warningText: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 22,
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
  textarea: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: AppColors.gray[800],
    backgroundColor: AppColors.white,
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: AppColors.gray[500],
    textAlign: "right",
    marginTop: 8,
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
    borderColor: AppColors.error,
    backgroundColor: AppColors.error + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  addImageText: {
    fontSize: 12,
    color: AppColors.error,
    marginTop: 4,
    fontWeight: "600",
  },
  consequenceCard: {
    marginBottom: 24,
    backgroundColor: AppColors.error + "05",
    borderColor: AppColors.error + "40",
  },
  consequenceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 16,
  },
  consequenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  consequenceText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 12,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
    color: AppColors.error,
  },
  actions: {
    gap: 12,
  },
});
