import { Button, Card, Header, Toast, ToastType } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { citizenService } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

export default function CreateComplaintScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reportId?: string; source?: string }>();

  const reportId = useMemo(() => {
    const raw = Array.isArray(params.reportId)
      ? params.reportId[0]
      : params.reportId;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.reportId]);

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyComplained, setAlreadyComplained] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const checkExistingComplaint = async () => {
      if (!reportId) return;
      try {
        const response = await citizenService.getMyComplaints();
        if (response.success && response.data) {
          const existed = response.data.some(
            (item) => Number(item.reportId) === Number(reportId),
          );
          setAlreadyComplained(existed);
        }
      } catch (error) {
        setAlreadyComplained(false);
      }
    };

    checkExistingComplaint();
  }, [reportId]);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Thiếu quyền",
        "Vui lòng cấp quyền thư viện ảnh để đính kèm bằng chứng.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const message = content.trim();

    if (alreadyComplained) {
      Alert.alert("Đã gửi khiếu nại", "Báo cáo này đã có khiếu nại trước đó.");
      return;
    }

    if (!reportId) {
      Alert.alert(
        "Thiếu dữ liệu",
        "Không tìm thấy mã báo cáo để gửi khiếu nại.",
      );
      return;
    }

    if (!message) {
      Alert.alert("Thiếu nội dung", "Vui lòng nhập nội dung khiếu nại.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await citizenService.createComplaint({
        reportId,
        type: "OTHER",
        content: message,
        files: images,
      });

      if (response.success) {
        showToast("Đã gửi khiếu nại thành công", "success");
        setTimeout(() => {
          router.back();
        }, 700);
      } else {
        Alert.alert("Lỗi", response.error || "Không thể gửi khiếu nại.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi gửi khiếu nại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Gửi khiếu nại"
        subtitle={`Báo cáo #${reportId || "-"}`}
        showBack={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.label}>Nội dung khiếu nại</Text>
          {alreadyComplained && (
            <Text style={styles.warningText}>
              Báo cáo này đã được gửi khiếu nại trước đó. Bạn không thể gửi lại.
            </Text>
          )}
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Ảnh bằng chứng (không bắt buộc)</Text>

          <View style={styles.imagesWrap}>
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imageItem}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={AppColors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.addImageBtn}
            onPress={handlePickImage}
            disabled={alreadyComplained || submitting}
          >
            <Ionicons name="image" size={16} color={AppColors.primary} />
            <Text style={styles.addImageText}>Thêm ảnh</Text>
          </TouchableOpacity>

          <Text style={styles.hintText}>
            Hệ thống sẽ tự gửi loại khiếu nại mặc định và mã báo cáo hiện tại.
          </Text>
        </Card>

        <Button
          title={submitting ? "Đang gửi..." : "Gửi khiếu nại"}
          onPress={handleSubmit}
          disabled={submitting || alreadyComplained}
          variant="primary"
          style={styles.submitBtn}
        />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    fontSize: 14,
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  addImageBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "10",
  },
  addImageText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.primary,
  },
  imagesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  imageItem: {
    width: 74,
    height: 74,
    borderRadius: 10,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    borderRadius: 999,
    backgroundColor: AppColors.white,
  },
  hintText: {
    marginTop: 6,
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  warningText: {
    fontSize: 12,
    color: AppColors.error,
    marginBottom: 10,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 2,
  },
});
