import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { citizenService, Complaint } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function ComplaintsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const reportIdFromParams = params.reportId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [complaintContent, setComplaintContent] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await citizenService.getMyComplaints();

      if (response.success && response.data) {
        setComplaints(response.data);
      } else {
        Alert.alert(
          "Lỗi",
          response.error || "Không thể tải danh sách khiếu nại",
        );
      }
    } catch (error) {
      console.error("Fetch complaints error:", error);
      Alert.alert("Lỗi", "Không thể tải danh sách khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // Nếu có reportId từ params, tự động mở modal tạo khiếu nại
    if (reportIdFromParams) {
      console.log('[Complaints] Opening modal for reportId:', reportIdFromParams);
      setShowCreateModal(true);
    }
  }, [reportIdFromParams]);

  const handleCreateComplaint = async () => {
    if (!complaintContent.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập nội dung khiếu nại");
      return;
    }

    if (!reportIdFromParams) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin báo cáo");
      return;
    }

    const reportIdNum = parseInt(reportIdFromParams);
    if (isNaN(reportIdNum)) {
      Alert.alert("Lỗi", "Mã báo cáo không hợp lệ");
      return;
    }

    console.log('[Complaints] Submitting complaint:', {
      reportId: reportIdNum,
      contentLength: complaintContent.trim().length,
    });

    try {
      setSubmitting(true);
      const response = await citizenService.createComplaint({
        reportId: reportIdNum,
        content: complaintContent.trim(),
      });

      console.log('[Complaints] API response:', response);

      if (response.success) {
        Alert.alert("Thành công", "Khiếu nại đã được gửi", [
          {
            text: "OK",
            onPress: () => {
              setShowCreateModal(false);
              setComplaintContent("");
              fetchComplaints();
              router.back();
            },
          },
        ]);
      } else {
        // Hiển thị lỗi chi tiết từ API
        let errorMsg = response.error || "Không thể gửi khiếu nại";

        // Thêm gợi ý cho các lỗi phổ biến
        if (errorMsg.includes("không tìm thấy")) {
          errorMsg += "\n\nGợi ý: Vui lòng kiểm tra lại mã báo cáo.";
        } else if (errorMsg.includes("không có quyền")) {
          errorMsg +=
            "\n\nGợi ý: Bạn chỉ có thể khiếu nại báo cáo của chính mình.";
        } else if (
          errorMsg.includes("PENDING") ||
          errorMsg.includes("chưa được tiếp nhận")
        ) {
          errorMsg +=
            "\n\nGợi ý: Báo cáo cần được xử lý trước khi có thể khiếu nại.";
        }

        Alert.alert("Không thể gửi khiếu nại", errorMsg);
      }
    } catch (error) {
      console.error("Create complaint error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi khiếu nại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return AppColors.warning;
      case "RESOLVED":
        return AppColors.success;
      case "REJECTED":
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Đang xử lý";
      case "RESOLVED":
        return "Đã giải quyết";
      case "REJECTED":
        return "Đã từ chối";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Khiếu nại"
          subtitle="Quản lý khiếu nại của bạn"
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Khiếu nại"
        subtitle="Quản lý khiếu nại của bạn"
        showBack={true}
      />

      <ScrollView
        style={styles.contentList}
        showsVerticalScrollIndicator={false}
      >
        {complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={64}
              color={AppColors.gray[400]}
            />
            <Text style={styles.emptyText}>Chưa có khiếu nại nào</Text>
            <Text style={styles.emptySubtext}>
              Bạn có thể tạo khiếu nại về báo cáo hoặc người thu gom
            </Text>
          </View>
        ) : (
          complaints.map((complaint) => (
            <Card
              key={complaint.id}
              variant="elevated"
              style={styles.complaintCard}
            >
              <View style={styles.complaintHeader}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportLabel}>
                    Báo cáo #{complaint.reportId}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(complaint.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(complaint.status) },
                      ]}
                    >
                      {getStatusText(complaint.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.complaintDate}>
                  {new Date(complaint.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>

              <Text style={styles.complaintContent}>{complaint.content}</Text>

              {complaint.resolvedAt && (
                <View style={styles.resolvedInfo}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={AppColors.success}
                  />
                  <Text style={styles.resolvedText}>
                    Đã giải quyết vào{" "}
                    {new Date(complaint.resolvedAt).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create Complaint Modal - Chỉ hiện khi có reportId từ params */}
      {reportIdFromParams && (
        <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateModal(false);
          setComplaintContent("");
          router.back();
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowCreateModal(false);
            setComplaintContent("");
            router.back();
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Khiếu nại báo cáo #{reportIdFromParams}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCreateModal(false);
                      setComplaintContent("");
                      router.back();
                    }}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={AppColors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.inputLabel}>Nội dung khiếu nại</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                    multiline
                    numberOfLines={6}
                      textAlignVertical="top"
                      value={complaintContent}
                      onChangeText={setComplaintContent}
                      autoFocus
                    />

                    <View style={styles.modalActions}>
                      <Button
                        title="Hủy"
                        variant="outline"
                        onPress={() => {
                          setShowCreateModal(false);
                          setComplaintContent("");
                          router.back();
                        }}
                        style={styles.modalButton}
                      />
                      <Button
                        title={submitting ? "Đang gửi..." : "Gửi khiếu nại"}
                        variant="primary"
                        onPress={handleCreateComplaint}
                        disabled={submitting}
                        style={styles.modalButton}
                      />
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  contentList: {
    flex: 1,
    paddingTop: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  complaintCard: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  complaintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  complaintDate: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  complaintContent: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textPrimary,
  },
  resolvedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  resolvedText: {
    fontSize: 12,
    color: AppColors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.white,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
});
