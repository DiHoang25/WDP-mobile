import { EmptyState, Header, Loading } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { citizenService, ComplaintItem } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

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
  const params = useLocalSearchParams<{ complaintId?: string }>();

  const complaintId = useMemo(() => {
    const raw = Array.isArray(params.complaintId)
      ? params.complaintId[0]
      : params.complaintId;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.complaintId]);

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);

  const fetchComplaintDetail = useCallback(async () => {
    if (!complaintId) {
      setComplaint(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await citizenService.getMyComplaints();
      if (response.success && response.data) {
        const found = response.data.find(
          (item) => Number(item.id) === Number(complaintId),
        );
        setComplaint(found || null);
      } else {
        setComplaint(null);
      }
    } catch (error) {
      setComplaint(null);
    } finally {
      setLoading(false);
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
        <EmptyState
          icon="alert-circle"
          title="Không tìm thấy khiếu nại"
          message="Khiếu nại có thể đã bị xóa hoặc bạn không có quyền truy cập."
        />
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
        subtitle={`Mã khiếu nại #${complaint.id}`}
        showBack={true}
        backFallbackRoute="/(citizen)/complaint-history"
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.reportRefContainer}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={AppColors.primary}
              />
              <Text style={styles.reportRefText}>
                Báo cáo #{complaint.reportId}
              </Text>
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

          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Loại khiếu nại</Text>
              <Text style={styles.metaValue}>{typeLabel}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Ngày gửi</Text>
              <Text style={styles.metaValue}>
                {new Date(complaint.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Nội dung</Text>
            <Text style={styles.sectionText}>{complaint.content}</Text>
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>
              Ảnh bằng chứng ({complaint.evidenceImages?.length || 0})
            </Text>
            {complaint.evidenceImages?.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesRow}
              >
                {complaint.evidenceImages.map((imageUrl, index) => (
                  <Image
                    key={`${imageUrl}-${index}`}
                    source={{ uri: imageUrl }}
                    style={styles.evidenceImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyImageText}>
                Không có ảnh bằng chứng.
              </Text>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Phản hồi từ hệ thống</Text>
            {!!complaint.adminResponse ? (
              <Text style={styles.sectionText}>{complaint.adminResponse}</Text>
            ) : (
              <Text style={styles.pendingText}>Chưa có phản hồi.</Text>
            )}
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
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    padding: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  metaGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },
  metaCell: {
    flex: 1,
    backgroundColor: AppColors.gray[50],
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  metaLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  sectionBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textPrimary,
  },
  imagesRow: {
    gap: 8,
  },
  evidenceImage: {
    width: 140,
    height: 110,
    borderRadius: 10,
    backgroundColor: AppColors.gray[100],
  },
  emptyImageText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  pendingText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontStyle: "italic",
  },
});
