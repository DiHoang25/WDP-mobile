import { Card, EmptyState, Header, Loading } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { citizenService, ComplaintItem } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

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

const getComplaintTypeLabel = (
  type: ComplaintItem["type"],
  typeLabel?: string,
) => {
  if (typeLabel) return typeLabel;

  switch (type) {
    case "ATTITUDE":
      return "Thái độ phục vụ";
    case "WEIGHT_MISMATCH":
      return "Sai lệch cân nặng";
    case "UNAUTHORIZED_FEE":
      return "Thu phí không hợp lệ";
    case "NO_SHOW":
      return "Không đến thu gom";
    case "OTHER":
    default:
      return "Khác";
  }
};

export default function ComplaintDetailScreen() {
  const params = useLocalSearchParams<{
    complaintId?: string;
    source?: string;
    reportId?: string;
  }>();

  const complaintId = useMemo(() => {
    const raw = Array.isArray(params.complaintId)
      ? params.complaintId[0]
      : params.complaintId;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.complaintId]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);

  const fetchComplaintDetail = useCallback(async () => {
    if (!complaintId) {
      setComplaint(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const rawId = String(complaintId || "");
      if (!rawId || rawId === "undefined") {
        setComplaint(null);
        setLoading(false);
        return;
      }

      const searchIdNumber = Number(rawId.replace('r', ''));
      const isReportLookup = rawId.startsWith('r');

      let found = null;

      // 1. Luôn ưu tiên quét danh sách tổng để tìm kiếm chéo linh hoạt nhất
      const listRes = await citizenService.getMyComplaints();
      if (listRes.success && listRes.data) {
        // Tìm kiếm SIÊU CẤP: thử mọi khả năng (ID khiếu nại hoặc ID báo cáo)
        // Bóc tách số từ chuỗi (loại bỏ 'r' nếu có)
        const idToSearch = Number(rawId.replace('r', ''));

        found = listRes.data.find(item =>
          Number(item.id) === idToSearch || String(item.id) === String(idToSearch) ||
          Number(item.reportId) === idToSearch || String(item.reportId) === String(idToSearch)
        );
      }

      // 2. Fallback: Nếu vẫn ko thấy, thử gọi API chi tiết theo ID trực tiếp (nếu là số hợp lệ)
      const numericId = Number(rawId.replace('r', ''));
      if (!found && !isNaN(numericId)) {
        try {
          const directRes = await citizenService.getComplaintDetail(searchIdNumber);
          if (directRes.success && directRes.data) {
            found = directRes.data;
          }
        } catch (e) {
          console.log("Direct fetch fallback failed");
        }
      }

      setComplaint(found || null);
    } catch (error) {
      setComplaint(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  useFocusEffect(
    useCallback(() => {
      fetchComplaintDetail();
    }, [fetchComplaintDetail]),
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Chi tiết khiếu nại" showBack={true} />
        <Loading />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.container}>
        <Header title="Chi tiết khiếu nại" showBack={true} />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchComplaintDetail}
              colors={[AppColors.primary]}
            />
          }
          contentContainerStyle={{ flex: 1 }}
        >
          <EmptyState
            icon="alert-circle"
            title="Không tìm thấy khiếu nại"
            message="Khiếu nại có thể đã bị xóa hoặc bạn không có quyền truy cập. Hãy kéo xuống để thử lại."
          />
        </ScrollView>
      </View>
    );
  }

  const statusColor = getComplaintStatusColor(complaint.status);
  const statusLabel = getComplaintStatusLabel(complaint.status);
  const typeLabel = getComplaintTypeLabel(complaint.type, complaint.typeLabel);

  return (
    <View style={styles.container}>
      <Header
        title="Chi tiết khiếu nại"
        subtitle={`Mã #${complaint.id}`}
        showBack={true}
        backFallbackRoute={
          params.source === "report-detail"
            ? `/report-detail?id=${params.reportId}`
            : "/(citizen)/complaint-history"
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchComplaintDetail}
            colors={[AppColors.primary]}
          />
        }
      >
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIconCircle, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name={complaint.status === "OPEN" ? "time-outline" : complaint.status === "PROCESSED" ? "checkmark-circle-outline" : "close-circle-outline"} size={28} color={statusColor} />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabelTitle}>Trạng thái khiếu nại</Text>
            <Text style={[styles.statusValueText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={12} color={AppColors.gray[500]} />
            <Text style={styles.dateBadgeText}>
              {new Date(complaint.createdAt).toLocaleDateString("vi-VN")}
            </Text>
          </View>
        </View>

        {/* Complaint Origin Card */}
        <Card variant="elevated" style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{typeLabel}</Text>
            </View>
            <Text style={styles.reportIdHeader}>ĐƠN #{complaint.reportId}</Text>
          </View>

          <View style={styles.complaintBody}>
            <Text style={styles.contentTitle}>Nội dung khiếu nại</Text>
            <Text style={styles.contentText}>{complaint.content}</Text>
          </View>

          {/* Evidence Images */}
          {complaint.evidenceImages?.length > 0 && (
            <View style={styles.evidenceSection}>
              <Text style={styles.subTitle}>Minh chứng đi kèm ({complaint.evidenceImages.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {complaint.evidenceImages.map((imageUrl, index) => (
                  <View key={`${imageUrl}-${index}`} style={styles.evidenceImageWrapper}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.evidenceImage}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Card>

        {/* System Response Section */}
        <Card variant="elevated" style={[styles.responseCard, !!complaint.adminResponse && { borderColor: AppColors.primary + '20', borderWidth: 1 }]}>
          <View style={styles.responseHeader}>
            <Ionicons name="shield-checkmark" size={20} color={complaint.adminResponse ? AppColors.primary : AppColors.gray[400]} />
            <Text style={[styles.responseTitle, !complaint.adminResponse && { color: AppColors.gray[400] }]}>PHẢN HỒI TỪ HỆ THỐNG</Text>
          </View>
          <View style={styles.responseBody}>
            {!!complaint.adminResponse ? (
              <Text style={styles.responseText}>{complaint.adminResponse}</Text>
            ) : (
              <Text style={styles.pendingResponseText}>Kỹ thuật viên đang xem xét khiếu nại của bạn. Vui lòng chờ kết quả.</Text>
            )}
            {complaint.status === "PROCESSED" && (
              <View style={styles.processedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={AppColors.white} />
                <Text style={styles.processedBadgeText}>Xác nhận bởi Admin</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Related Report Context */}
        {complaint.reportInfo && (
          <View style={styles.contextSection}>
            <Text style={styles.contextSectionTitle}>Bối cảnh báo cáo liên quan</Text>

            <Card variant="outlined" style={styles.contextCard}>
              <View style={styles.contextInfoRow}>
                <View style={styles.contextIconWrap}>
                  <Ionicons name="location" size={18} color={AppColors.primary} />
                </View>
                <Text style={styles.contextAddress} numberOfLines={2}>
                  {complaint.reportInfo.address}
                </Text>
              </View>

              <View style={styles.contextDivider} />

              <View style={styles.actorsContainer}>
                {complaint.reportInfo.collectorName && (
                  <View style={styles.actorItem}>
                    <View style={styles.actorAvatar}>
                      {complaint.reportInfo.collectorAvatar ? (
                        <Image source={{ uri: complaint.reportInfo.collectorAvatar }} style={styles.actorImg} />
                      ) : (
                        <View style={styles.actorPlaceholder}>
                          <Ionicons name="person" size={16} color={AppColors.gray[400]} />
                        </View>
                      )}
                    </View>
                    <View style={styles.actorMeta}>
                      <Text style={styles.actorLabel}>Tài xế thực hiện</Text>
                      <Text style={styles.actorName} numberOfLines={1}>{complaint.reportInfo.collectorName}</Text>
                    </View>
                  </View>
                )}

                {complaint.reportInfo.enterpriseName && (
                  <View style={styles.actorItem}>
                    <View style={styles.actorAvatar}>
                      {complaint.reportInfo.enterpriseAvatar ? (
                        <Image source={{ uri: complaint.reportInfo.enterpriseAvatar }} style={styles.actorImg} />
                      ) : (
                        <View style={styles.actorPlaceholder}>
                          <Ionicons name="business" size={16} color={AppColors.gray[400]} />
                        </View>
                      )}
                    </View>
                    <View style={styles.actorMeta}>
                      <Text style={styles.actorLabel}>Đơn vị thu gom</Text>
                      <Text style={styles.actorName} numberOfLines={1}>{complaint.reportInfo.enterpriseName}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}
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
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  statusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  statusInfo: {
    flex: 1,
    marginLeft: 14,
  },
  statusLabelTitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  statusValueText: {
    fontSize: 18,
    fontWeight: "800",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.gray[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  dateBadgeText: {
    fontSize: 11,
    color: AppColors.gray[600],
    fontWeight: "600",
  },
  mainCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: AppColors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  typeTag: {
    backgroundColor: AppColors.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
  },
  reportIdHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textSecondary,
  },
  complaintBody: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.gray[700],
  },
  evidenceSection: {
    padding: 16,
    paddingTop: 0,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.gray[500],
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imagesScroll: {
    flexDirection: "row",
  },
  evidenceImageWrapper: {
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  evidenceImage: {
    width: 120,
    height: 120,
    backgroundColor: AppColors.gray[100],
  },
  responseCard: {
    padding: 16,
    backgroundColor: AppColors.white,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: AppColors.primary,
    letterSpacing: 0.5,
  },
  responseBody: {
    backgroundColor: AppColors.gray[50],
    padding: 14,
    borderRadius: 12,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textPrimary,
    fontWeight: "500",
  },
  pendingResponseText: {
    fontSize: 14,
    color: AppColors.gray[500],
    fontStyle: "italic",
    lineHeight: 20,
  },
  processedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: AppColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 10,
    gap: 4,
  },
  processedBadgeText: {
    fontSize: 10,
    color: AppColors.white,
    fontWeight: "700",
  },
  contextSection: {
    marginTop: 8,
  },
  contextSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: AppColors.textPrimary,
    marginBottom: 12,
    marginLeft: 4,
  },
  contextCard: {
    padding: 14,
    backgroundColor: AppColors.white,
    borderRadius: 16,
  },
  contextInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contextIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  contextAddress: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: "600",
    lineHeight: 20,
  },
  contextDivider: {
    height: 1,
    backgroundColor: AppColors.gray[100],
    marginVertical: 14,
  },
  actorsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  actorItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: AppColors.gray[100],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  actorImg: {
    width: "100%",
    height: "100%",
  },
  actorPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actorMeta: {
    flex: 1,
  },
  actorLabel: {
    fontSize: 10,
    color: AppColors.gray[500],
    fontWeight: "600",
    marginBottom: 1,
  },
  actorName: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
});
