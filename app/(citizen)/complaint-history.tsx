import {
  EmptyState,
  Header,
  Loading,
  Toast,
  ToastType,
} from "@/components/common";
import { AppColors } from "@/constants/theme";
import { citizenService, ComplaintItem } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const getComplaintStatusLabel = (status: ComplaintItem["status"]) => {
  switch (status) {
    case "OPEN":
      return "Đang xử lý";
    case "PROCESSED":
      return "Đã xử lý";
    case "REJECTED":
      return "Từ chối";
    default:
      return status;
  }
};

const getComplaintStatusColor = (status: ComplaintItem["status"]) => {
  switch (status) {
    case "OPEN":
      return AppColors.warning;
    case "PROCESSED":
      return AppColors.success;
    case "REJECTED":
      return AppColors.error;
    default:
      return AppColors.gray[500];
  }
};

export default function ComplaintHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const summary = useMemo(() => {
    const open = complaints.filter((item) => item.status === "OPEN").length;
    const processed = complaints.filter(
      (item) => item.status === "PROCESSED",
    ).length;
    const rejected = complaints.filter(
      (item) => item.status === "REJECTED",
    ).length;

    return { open, processed, rejected, total: complaints.length };
  }, [complaints]);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ visible: true, message, type });
  };

  const fetchComplaints = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await citizenService.getMyComplaints();

      if (response.success && response.data) {
        const sorted = [...response.data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setComplaints(sorted);
      } else {
        setComplaints([]);
        showToast(
          response.error || "Không thể tải lịch sử khiếu nại.",
          "error",
        );
      }
    } catch (error) {
      setComplaints([]);
      showToast("Đã có lỗi khi tải lịch sử khiếu nại.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [fetchComplaints]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints(true);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Lịch sử khiếu nại"
        subtitle={`Tổng cộng: ${summary.total} khiếu nại`}
        showBack={true}
      />

      {loading ? (
        <Loading />
      ) : complaints.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
            />
          }
        >
          <EmptyState
            icon="alert-circle"
            title="Chưa có khiếu nại"
            message="Bạn chưa gửi khiếu nại nào."
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[AppColors.primary]}
            />
          }
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{summary.open}</Text>
              <Text style={styles.summaryLabel}>Đang xử lý</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{summary.processed}</Text>
              <Text style={styles.summaryLabel}>Đã xử lý</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>{summary.rejected}</Text>
              <Text style={styles.summaryLabel}>Từ chối</Text>
            </View>
          </View>

          {complaints.map((item) => {
            const statusColor = getComplaintStatusColor(item.status);
            const statusLabel = getComplaintStatusLabel(item.status);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/(citizen)/complaint-detail",
                    params: { complaintId: String(item.id) },
                  } as any)
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.reportRefContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color={AppColors.primary}
                    />
                    <View>
                      <Text style={styles.reportRefText}>
                        Báo cáo #{item.reportId}
                      </Text>
                      {item.reportInfo?.address && (
                        <Text style={styles.addressText} numberOfLines={1}>
                          {item.reportInfo.address}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusColor}20` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.contentText} numberOfLines={3}>
                  {item.content}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={AppColors.gray[500]}
                    />
                    <Text style={styles.metaText}>
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons
                      name="images-outline"
                      size={14}
                      color={AppColors.gray[500]}
                    />
                    <Text style={styles.metaText}>
                      {item.evidenceImages?.length || 0} ảnh
                    </Text>
                  </View>
                </View>

                {!!item.adminResponse && (
                  <View style={styles.responseBox}>
                    <View style={styles.responseHeader}>
                      <Ionicons
                        name="chatbox-ellipses-outline"
                        size={15}
                        color={AppColors.primary}
                      />
                      <Text style={styles.responseTitle}>
                        Phản hồi từ hệ thống
                      </Text>
                    </View>
                    <Text style={styles.responseText}>
                      {item.adminResponse}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    marginBottom: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: AppColors.gray[200],
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reportRefContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportRefText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  addressText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textPrimary,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  responseBox: {
    marginTop: 10,
    borderRadius: 10,
    padding: 10,
    backgroundColor: AppColors.primary + "10",
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  responseTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
  },
  responseText: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.textPrimary,
  },
});
