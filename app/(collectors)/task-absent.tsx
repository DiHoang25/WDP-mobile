import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { collectorService } from "@/services/collector.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TaskAbsentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();

  const canReport = true;
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const handleConfirm = () => {
    if (!canReport) {
      showAlert("Lỗi", "Chức năng này chỉ khả dụng sau 20 phút kể từ khi bạn check-in");
      return;
    }

    showAlert(
      "Xác nhận",
      "Bạn có chắc chắn muốn báo Công dân vắng mặt? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await collectorService.markNoResponse(Number(id));
              if (res.success) {
                showToast("Đã gửi báo cáo vắng khách", "success");
                setTimeout(() => {
                  router.replace("/(collectors)" as any);
                }, 1500);
              } else {
                showToast(res.message || "Không thể gửi báo cáo", "error");
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
              { borderColor: AppColors.warning, backgroundColor: AppColors.warning + "10" },
            ]}
          >
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={32} color={AppColors.warning} />
              <Text style={styles.warningTitle}>Chú ý</Text>
            </View>
            <Text style={styles.warningText}>
              Chức năng này chỉ khả dụng sau{" "}
              <Text style={styles.warningHighlight}>20 phút</Text> kể từ khi bạn check-in tại địa
              điểm.
            </Text>
          </Card>

          {/* Info */}
          <Card variant="elevated" style={styles.infoCard}>
            <Text style={styles.infoTitle}>Hệ quả của báo cáo này</Text>
            <View style={styles.infoItem}>
              <Ionicons name="document-text" size={20} color={AppColors.info} />
              <Text style={styles.infoText}>
                Báo cáo sẽ chuyển sang trạng thái <Text style={styles.bold}>"Vắng khách"</Text>
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="close-circle" size={20} color={AppColors.info} />
              <Text style={styles.infoText}>
                Đơn hàng của bạn sẽ được đóng, không bị tính lỗi
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="people" size={20} color={AppColors.info} />
              <Text style={styles.infoText}>
                Công dân sẽ được thông báo về việc vắng mặt
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color={AppColors.info} />
              <Text style={styles.infoText}>
                Công dân có thể đặt lịch thu gom lại sau
              </Text>
            </View>
          </Card>

          {/* Timeline */}
          <Card variant="outlined" style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Lịch sử</Text>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineText}>Đã check-in: 14:00</Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineText}>Thời gian chờ: 20 phút</Text>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: AppColors.error }]} />
              <Text style={styles.timelineText}>Deadline: 14:20 (đã qua)</Text>
            </View>
          </Card>

          {/* Confirmation */}
          {!canReport && (
            <Card
              variant="outlined"
              style={[
                styles.blockedCard,
                { borderColor: AppColors.error, backgroundColor: AppColors.error + "10" },
              ]}
            >
              <Ionicons name="lock-closed" size={24} color={AppColors.error} />
              <Text style={[styles.blockedText, { color: AppColors.error }]}>
                Bạn cần chờ đủ 20 phút trước khi có thể báo vắng khách
              </Text>
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Xác nhận Báo Vắng"
              onPress={handleConfirm}
              disabled={!canReport || submitting}
              loading={submitting}
              style={[
                canReport && {
                  backgroundColor: AppColors.warning,
                  borderColor: AppColors.warning,
                },
              ]}
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
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.warning,
    marginLeft: 12,
  },
  warningText: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 20,
  },
  warningHighlight: {
    fontWeight: "700",
    color: AppColors.warning,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 12,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
  },
  timelineCard: {
    marginBottom: 20,
    backgroundColor: AppColors.gray[50],
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
    marginRight: 12,
  },
  timelineText: {
    fontSize: 14,
    color: AppColors.gray[700],
  },
  blockedCard: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
  },
  blockedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
});
