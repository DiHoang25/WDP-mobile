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

const getComplaintTypeLabel = (type?: string) => {
  switch (type) {
    case "ATTITUDE":
      return "Thái độ phục vụ";
    case "WEIGHT_MISMATCH":
      return "Khối lượng không khớp";
    case "UNAUTHORIZED_FEE":
      return "Phí không hợp lệ";
    case "OTHER":
      return "Khác";
    default:
      return type || "Khiếu nại";
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
                  <View style={styles.headerLeft}>
                    <View style={styles.reportBadge}>
                      <Ionicons
                        name="receipt-outline"
                        size={14}
                        color={AppColors.primary}
                      />
                      <Text style={styles.reportIdText}>#{item.reportId}</Text>
                    </View>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>
                        {getComplaintTypeLabel(item.type)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusWrapper}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Text style={[styles.statusLabel, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {item.reportInfo?.address && (
                  <View style={styles.addressContainer}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={AppColors.gray[400]}
                    />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {item.reportInfo.address}
                    </Text>
                  </View>
                )}

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

                  {item.evidenceImages?.length > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="images-outline"
                        size={14}
                        color={AppColors.gray[400]}
                      />
                      <Text style={styles.metaText}>
                        {item.evidenceImages?.length} ảnh
                      </Text>
                    </View>
                  )}
                </View>

                {!!item.adminResponse && (
                  <View style={[styles.responseBox, { borderColor: statusColor + "40" }]}>
                    <View style={styles.responseHeader}>
                      <View style={[styles.responseIcon, { backgroundColor: statusColor + "15" }]}>
                        <Ionicons
                          name="chatbox-ellipses"
                          size={14}
                          color={statusColor}
                        />
                      </View>
                      <Text style={[styles.responseTitle, { color: statusColor }]}>
                        Phản hồi: {statusLabel}
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
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  reportIdText: {
    fontSize: 12,
    fontWeight: "800",
    color: AppColors.primary,
  },
  typeBadge: {
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "700",
    color: AppColors.textSecondary,
    textTransform: "uppercase",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 12,
    color: AppColors.gray[500],
    flex: 1,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textPrimary,
    fontWeight: "500",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: AppColors.gray[400],
  },
  responseBox: {
    marginTop: 4,
    borderRadius: 12,
    padding: 12,
    backgroundColor: AppColors.gray[50] + "80",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  responseIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textPrimary,
    fontStyle: "italic",
  },
});
