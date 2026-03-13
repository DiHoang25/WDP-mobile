import { Card, Header, Loading, Toast, ToastType } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { citizenService } from "@/services/citizen.service";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import {
  getStatusColor,
  getStatusText,
  getWasteTypeLabel,
} from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { extractMediaUrls } from "../utils/media";

export default function ReportDetailScreen() {
  const { user } = useAuth();
  const {
    id,
    content: notificationContent,
    senderName,
  } = useLocalSearchParams();
  const [report, setReport] = useState<WasteReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [locationNames, setLocationNames] = useState({
    province: "",
    district: "",
    ward: "",
  });
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    if (id) {
      fetchReportDetail(id as string);
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (report) {
      fetchLocationNames();
    }
  }, [report]);

  const [hasShownArrivedToast, setHasShownArrivedToast] = useState(false);

  // Polling for shipper arrival
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const currentStatus = report?.status?.toUpperCase();

    // Show toast immediately if it's already ARRIVED
    if (currentStatus === "ARRIVED" && !hasShownArrivedToast) {
      showToast("Shipper đã đến nơi! Vui lòng xác nhận sự có mặt.", "info");
      setHasShownArrivedToast(true);
    }

    if (
      (currentStatus === "ACCEPTED" ||
        currentStatus === "ON_THE_WAY" ||
        currentStatus === "ARRIVED") &&
      report?.id
    ) {
      const pollStatus = async () => {
        try {
          const res = await wasteService.getReportById(Number(report.id));
          if (res.success && res.data) {
            const newStatus = res.data.status?.toUpperCase();
            if (newStatus === "ARRIVED" && !hasShownArrivedToast) {
              setReport(res.data);
              showToast(
                "Shipper đã đến nơi! Vui lòng xác nhận sự có mặt.",
                "info",
              );
              setHasShownArrivedToast(true);
            } else if (newStatus !== currentStatus) {
              setReport(res.data);
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      };

      interval = setInterval(pollStatus, 7000); // Poll every 7s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [report?.status, report?.id, hasShownArrivedToast]);

  const fetchReportDetail = async (reportId: string) => {
    try {
      setLoading(true);
      setError(false);
      const response = await wasteService.getReportById(Number(reportId));
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Fetch report detail error:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationNames = async () => {
    if (!report) return;

    const names = { ...locationNames };

    try {
      if (report.provinceCode) {
        const pRes = await fetch(
          `https://provinces.open-api.vn/api/p/${report.provinceCode}`,
        );
        const pData = await pRes.json();
        names.province = pData.name;
      }
      if (report.districtCode) {
        const dRes = await fetch(
          `https://provinces.open-api.vn/api/d/${report.districtCode}`,
        );
        const dData = await dRes.json();
        names.district = dData.name;
      }
      if (report.wardCode) {
        const wRes = await fetch(
          `https://provinces.open-api.vn/api/w/${report.wardCode}`,
        );
        const wData = await wRes.json();
        names.ward = wData.name;
      }
      setLocationNames(names);
    } catch (err) {
      console.error("Error fetching location names:", err);
    }
  };

  // Derived values
  const enterpriseDisplayName =
    report?.enterprise?.name ||
    report?.enterpriseName ||
    (senderName as string) ||
    null;
  const displaySender = enterpriseDisplayName;
  const displayContent =
    notificationContent || report?.content || report?.description;

  // Use reported data or fallbacks
  const status = report?.status;
  const canCancel =
    status?.toUpperCase() === "PENDING" || status?.toUpperCase() === "ACCEPTED";

  const handleCancel = async () => {
    if (!report) return;

    Alert.alert(
      "Xác nhận hủy",
      "Bạn có chắc chắn muốn hủy báo cáo này không?",
      [
        { text: "Bỏ qua", style: "cancel" },
        {
          text: "Đồng ý hủy",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await wasteService.cancelReport(
                Number(report.id),
                "Người dùng hủy qua ứng dụng",
              );
              if (response.success) {
                Alert.alert("Thành công", "Báo cáo của bạn đã được hủy.");
                fetchReportDetail(report.id); // Tải lại dữ liệu
              } else {
                Alert.alert("Lỗi", response.error || "Không thể hủy báo cáo.");
              }
            } catch (error) {
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi kết nối hệ hệ thống.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmPresence = async () => {
    console.log(
      "👆 [handleConfirmPresence] Button clicked, report.id:",
      report?.id,
    );
    if (!report) return;
    try {
      setSubmitting(true);
      const res = await citizenService.confirmPresence(Number(report.id));
      if (res.success) {
        if (Platform.OS !== "web") {
          Alert.alert(
            "Thành công",
            "Bạn đã xác nhận đang có mặt. Shipper sẽ tiến hành thu gom ngay.",
          );
        } else {
          console.log("✅ [ConfirmPresence] Success (Web)");
        }
        fetchReportDetail(report.id);
      } else {
        if (Platform.OS !== "web") {
          Alert.alert("Lỗi", res.error || "Không thể xác nhận có mặt.");
        } else {
          console.error("❌ [ConfirmPresence] Error (Web):", res.error);
        }
      }
    } catch (error) {
      console.error("Confirm presence error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportAbsent = async () => {
    console.log(
      "👆 [handleReportAbsent] Button clicked, report.id:",
      report?.id,
    );
    if (!report) {
      console.warn("⚠️ [handleReportAbsent] No report data found!");
      return;
    }

    const executeReportAbsent = async () => {
      try {
        setSubmitting(true);
        const res = await citizenService.reportAbsent(Number(report.id));
        if (res.success) {
          if (Platform.OS !== "web") {
            Alert.alert(
              "Thông báo",
              "Bạn đã báo vắng mặt. Đơn hàng sẽ được cập nhật.",
            );
          } else {
            console.log("✅ [ReportAbsent] Success (Web)");
          }
          fetchReportDetail(report.id);
        } else {
          if (Platform.OS !== "web") {
            Alert.alert("Lỗi", res.error || "Không thể báo vắng mặt.");
          } else {
            console.error("❌ [ReportAbsent] Error (Web):", res.error);
          }
        }
      } catch (error) {
        console.error("Report absent error:", error);
      } finally {
        setSubmitting(false);
      }
    };

    if (Platform.OS === "web") {
      console.log(
        "🌐 Web platform detected, proceeding without Alert confirmation",
      );
      await executeReportAbsent();
    } else {
      console.log("📱 Showing Alert.alert for absence confirmation...");
      Alert.alert(
        "Xác nhận vắng mặt",
        "Bạn chắc chắn muốn báo vắng mặt? Shipper sẽ không thể thu gom rác của bạn trong đơn này.",
        [
          {
            text: "Hủy",
            style: "cancel",
            onPress: () => console.log("✖️ Absence confirmation cancelled"),
          },
          {
            text: "Xác nhận",
            style: "destructive",
            onPress: executeReportAbsent,
          },
        ],
      );
    }
  };
  const createdAt = report?.createdAt;
  const updatedAt = report?.updatedAt;
  const address = report?.address;
  const wasteItems = report?.wasteItems;
  const points = report?.points;
  // Normalize image fields: backend có thể trả images/files/evidenceImages dưới nhiều dạng
  const images = extractMediaUrls(
    (report as any)?.images || (report as any)?.files,
  );
  const evidenceImages = extractMediaUrls(
    (report as any)?.evidenceImages || (report as any)?.collectorImages,
  );
  const enterprise = report?.enterprise;
  const collector = report?.collector;
  const cancelReason = report?.cancelReason;

  // Check if we should show error (only if we have NO data to show)
  const showLoadError = !loading && error && !report && !displayContent;

  // Case-insensitive key extraction
  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return undefined;
  };

  // Unified waste items extraction
  const rawItems = getVal(report, ["wasteItems", "WasteItems", "waste_items"]);
  let normalizedItems: any[] = [];
  if (Array.isArray(rawItems)) {
    normalizedItems = rawItems;
  } else if (rawItems && typeof rawItems === "object") {
    normalizedItems = [rawItems];
  }

  const totalWeight =
    normalizedItems.length > 0
      ? normalizedItems.reduce(
          (sum, item) =>
            sum +
            (Number(item?.weightKg || item?.WeightKg || item?.weight_kg) || 0),
          0,
        )
      : Number(getVal(report, ["weightKg", "WeightKg", "weight_kg"])) || 0;

  // Unified address logic: reuse the full address from backend if available
  // Otherwise build it from component names
  const addressStr = address || "";
  const isFullAddress =
    addressStr.includes(",") &&
    (addressStr.toLowerCase().includes("phường") ||
      addressStr.toLowerCase().includes("quận") ||
      addressStr.toLowerCase().includes("tỉnh") ||
      addressStr.toLowerCase().includes("thành phố"));

  const fullAddress = isFullAddress
    ? addressStr
    : [
        addressStr,
        locationNames.ward,
        locationNames.district,
        locationNames.province,
      ]
        .filter(Boolean)
        .join(", ");

  return (
    <View style={styles.container}>
      <Header title="Chi tiết báo cáo" showBack={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card - Always show if we have status */}
        {(status || report) && (
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.label}>Trạng thái</Text>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(status!).text },
                ]}
              >
                {getStatusText(status!)}
              </Text>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.label}>Cập nhật lúc</Text>
              <Text style={styles.value}>
                {new Date(updatedAt || createdAt!).toLocaleString("vi-VN")}
              </Text>
            </View>
          </View>
        )}

        {/* Presence confirmation - New compact banner */}
        {status?.toUpperCase() === "ARRIVED" && (
          <View style={styles.arrivedBanner}>
            <View style={styles.arrivedInfoRow}>
              <View style={styles.arrivedIconCircle}>
                <Ionicons
                  name="notifications"
                  size={18}
                  color={AppColors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.arrivedTitle}>Shipper đã đến điểm hẹn</Text>
                <Text style={styles.arrivedSubtitle}>
                  Hãy xác nhận bạn đang có mặt hoặc báo vắng mặt để Shipper xử
                  lý đơn.
                </Text>
              </View>
            </View>

            <View style={styles.arrivedActions}>
              <TouchableOpacity
                style={[
                  styles.arrivedPrimaryBtn,
                  submitting && styles.disabledButton,
                ]}
                onPress={handleConfirmPresence}
                disabled={submitting}
              >
                <Ionicons name="home" size={18} color={AppColors.white} />
                <Text style={styles.arrivedPrimaryText}>Tôi đang ở nhà</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.arrivedGhostBtn,
                  submitting && styles.disabledButton,
                ]}
                onPress={handleReportAbsent}
                disabled={submitting}
              >
                <Ionicons
                  name="walk"
                  size={18}
                  color={AppColors.textSecondary}
                />
                <Text style={styles.arrivedGhostText}>Tôi vắng mặt</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Collector Info */}
        {collector && (
          <Card variant="elevated" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Người thu gom</Text>
            <View style={styles.userInfoRow}>
              {collector.avatar ? (
                <Image
                  source={{ uri: collector.avatar }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color={AppColors.white} />
                </View>
              )}
              <View style={styles.userMeta}>
                <Text style={styles.userName}>{collector.fullName}</Text>
                <Text style={styles.userPhone}>
                  {collector.phone || "Đang thực hiện thu gom"}
                </Text>
              </View>
              {collector.phone && (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    /* Handle call */
                  }}
                >
                  <Ionicons name="call" size={20} color={AppColors.white} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* 2. Content (From Notification or Report) */}
        {displayContent && (
          <Card variant="elevated" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nội dung báo cáo</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{displayContent}</Text>
            </View>
          </Card>
        )}

        {/* Cancel Reason */}
        {cancelReason && (
          <Card
            variant="elevated"
            style={[
              styles.sectionCard,
              { borderColor: AppColors.error, borderWidth: 1 },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: AppColors.error, borderLeftColor: AppColors.error },
              ]}
            >
              Lý do hủy
            </Text>
            <View style={styles.contentBox}>
              <Text style={[styles.contentText, { color: AppColors.error }]}>
                {cancelReason}
              </Text>
            </View>
          </Card>
        )}

        {/* Loading State for Report Details */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Loading />
          </View>
        )}

        {/* Error State - ONLY show if we have absolutely nothing to show */}
        {showLoadError && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={AppColors.error}
            />
            <Text style={styles.errorText}>
              Không thể tải thông tin chi tiết báo cáo gốc.
              {"\n"}Có thể báo cáo đã bị xóa hoặc bạn không có quyền truy cập.
            </Text>
          </View>
        )}

        {/* 3. Full Report Details (Only if loaded) */}
        {!loading && report && (
          <>
            {/* Location Info */}
            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Địa điểm</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={20} color={AppColors.primary} />
                <Text style={styles.infoText}>{fullAddress}</Text>
              </View>
            </Card>

            {/* Waste Details */}
            <Card variant="elevated" style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Thông tin rác</Text>

              <View style={styles.wasteList}>
                {(() => {
                  // Group items by waste type and sum weights
                  const grouped =
                    normalizedItems.length > 0
                      ? normalizedItems.reduce(
                          (
                            acc: Array<{ wasteType: string; weightKg: number }>,
                            item: any,
                          ) => {
                            const wasteType =
                              item.wasteType ||
                              item.WasteType ||
                              item.waste_type;
                            const weightKg =
                              Number(
                                item.weightKg ||
                                  item.WeightKg ||
                                  item.weight_kg,
                              ) || 0;

                            const existing = acc.find(
                              (i: { wasteType: string; weightKg: number }) =>
                                i.wasteType === wasteType,
                            );
                            if (existing) {
                              existing.weightKg += weightKg;
                            } else {
                              acc.push({ wasteType, weightKg });
                            }
                            return acc;
                          },
                          [] as Array<{ wasteType: string; weightKg: number }>,
                        )
                      : [
                          {
                            wasteType:
                              report.wasteType ||
                              (report as any).WasteType ||
                              (report as any).waste_type,
                            weightKg: Number(
                              report.weightKg ||
                                (report as any).WeightKg ||
                                (report as any).weight_kg ||
                                0,
                            ),
                          },
                        ];

                  return grouped.map(
                    (
                      item: { wasteType: string; weightKg: number },
                      index: number,
                    ) => (
                      <View key={index} style={styles.wasteItem}>
                        <Text style={styles.wasteType}>
                          {getWasteTypeLabel(item.wasteType)}
                        </Text>
                        <Text style={styles.wasteWeight}>
                          {item.weightKg.toFixed(1)} kg
                        </Text>
                      </View>
                    ),
                  );
                })()}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng khối lượng</Text>
                  <Text style={styles.totalValue}>
                    {totalWeight.toFixed(1)} kg
                  </Text>
                </View>

                {points !== undefined && (
                  <View style={styles.pointsRow}>
                    <Text style={styles.pointsLabel}>Điểm thưởng dự kiến</Text>
                    <Text style={styles.pointsValue}>+{points} điểm</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Images */}
            {images && images.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Hình ảnh đính kèm</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {images.map((img, index) => (
                    <Image
                      key={index}
                      source={{ uri: img }}
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Cancel Button */}
            {canCancel && (
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  submitting && styles.disabledButton,
                ]}
                onPress={handleCancel}
                disabled={submitting}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={AppColors.white}
                />
                <Text style={styles.cancelButtonText}>
                  {submitting ? "Đang xử lý..." : "Hủy báo cáo này"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Evidence Images (collector upload) if present */}
            {evidenceImages && evidenceImages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Ảnh bằng chứng thu gom</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {evidenceImages.map((img, index) => (
                    <Image
                      key={`evid-${index}`}
                      source={{ uri: img }}
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
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
    padding: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginVertical: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  label: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  value: {
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.primary,
    paddingLeft: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: AppColors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  wasteList: {
    marginTop: 5,
  },
  wasteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  wasteType: {
    fontSize: 15,
    color: AppColors.textPrimary,
  },
  wasteWeight: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: AppColors.warning + "15",
    padding: 8,
    borderRadius: 8,
  },
  pointsLabel: {
    fontSize: 14,
    color: AppColors.warning,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  contentBox: {
    marginTop: 5,
    padding: 12,
    backgroundColor: AppColors.gray[50], // Light gray background for content
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  contentText: {
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  imageScroll: {
    flexDirection: "row",
  },
  detailImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: AppColors.gray[200],
  },
  bottomSpacer: {
    height: 40,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.gray[200],
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  userPhone: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  callButton: {
    backgroundColor: AppColors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: AppColors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
    shadowColor: AppColors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  trackingButton: {
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  trackingButtonText: {
    color: AppColors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  closeModalBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  pollingText: {
    textAlign: "center",
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  doneBtn: {
    backgroundColor: AppColors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  arrivedBanner: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: AppColors.primary + "07",
    borderWidth: 1,
    borderColor: AppColors.primary + "40",
  },
  arrivedInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    columnGap: 10,
  },
  arrivedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  arrivedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 2,
  },
  arrivedSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  arrivedActions: {
    flexDirection: "row",
    columnGap: 10,
  },
  arrivedPrimaryBtn: {
    flex: 1.3,
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    paddingVertical: 10,
    columnGap: 6,
  },
  arrivedPrimaryText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  arrivedGhostBtn: {
    flex: 1,
    backgroundColor: AppColors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    columnGap: 6,
  },
  arrivedGhostText: {
    color: AppColors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
