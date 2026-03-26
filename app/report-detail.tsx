import { Card, Header, Loading, Toast, ToastType } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { saveCancelledReportId } from "../utils/cancelledReports";
import { extractMediaUrls } from "../utils/media";

export default function ReportDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  const {
    id,
    content: notificationContent,
    senderName,
  } = useLocalSearchParams();
  const currentReportId = Number(Array.isArray(id) ? id[0] : id) || 0;
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
  const [hasComplaintForReport, setHasComplaintForReport] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const complaintCheckRequestRef = useRef(0);

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

  const CANCELLED_STATUSES = ["CANCELLED", "REJECTED", "FAILED", "FAILED_NO_RESPONSE", "FAILED_CITIZEN_NOT_HOME"];

  const fetchReportDetail = async (reportId: string) => {
    try {
      setLoading(true);
      setError(false);
      const response = await wasteService.getReportById(Number(reportId));
      if (response.success && response.data) {
        setReport(response.data);
        // Tự động lưu ID nếu đơn bị hủy (phục vụ hiển thị trong lịch sử)
        if (CANCELLED_STATUSES.includes(response.data.status?.toUpperCase())) {
          await saveCancelledReportId(Number(reportId));
        }
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


  useEffect(() => {
    if (report?.status?.toUpperCase() === "COMPLETED" && report?.id) {
      const fetchPoints = async () => {
        try {
          const res = await citizenService.getMyRedemptions("EARN");
          if (res.success && res.data) {
            const reportTransaction = res.data.find(
              (t) => Number(t.reportId) === Number(report.id),
            );
            if (reportTransaction) {
              setEarnedPoints(reportTransaction.amount);
            }
          }
        } catch (err) {
          console.error("Error fetching points for report:", err);
        }
      };
      fetchPoints();
    }
  }, [report?.status, report?.id]);

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
  const canComplain =
    user?.roleId === 1 &&
    (status?.toUpperCase() === "COMPLETED" ||
      status?.toUpperCase() === "CANCELLED");

  const checkComplaintForCurrentReport = useCallback(async () => {
    const requestId = ++complaintCheckRequestRef.current;

    if (!currentReportId || user?.roleId !== 1) {
      if (requestId === complaintCheckRequestRef.current) {
        setHasComplaintForReport(false);
      }
      return;
    }

    try {
      const response = await citizenService.getMyComplaints();
      if (requestId !== complaintCheckRequestRef.current) {
        return;
      }

      if (response.success && response.data) {
        const existed = response.data.some(
          (item) => Number(item.reportId) === Number(currentReportId),
        );
        setHasComplaintForReport(existed);
      } else {
        setHasComplaintForReport(false);
      }
    } catch (error) {
      if (requestId === complaintCheckRequestRef.current) {
        setHasComplaintForReport(false);
      }
    }
  }, [currentReportId, user?.roleId]);

  useEffect(() => {
    checkComplaintForCurrentReport();
  }, [checkComplaintForCurrentReport]);

  const handleCancel = async () => {
    if (!report) return;

    showAlert(
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
                await saveCancelledReportId(Number(report.id));  // lưu ID để hiển thị trong lịch sử
                showAlert("Thành công", "Báo cáo của bạn đã được hủy.");
                fetchReportDetail(report.id); // Tải lại dữ liệu
              } else {
                showAlert("Lỗi", response.error || "Không thể hủy báo cáo.");
              }
            } catch (error) {
              showAlert("Lỗi", "Đã xảy ra lỗi khi kết nối hệ hệ thống.");
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
          showAlert(
            "Thành công",
            "Bạn đã xác nhận đang có mặt. Shipper sẽ tiến hành thu gom ngay.",
          );
        } else {
          console.log("✅ [ConfirmPresence] Success (Web)");
        }
        fetchReportDetail(report.id);
      } else {
        if (Platform.OS !== "web") {
          showAlert("Lỗi", res.error || "Không thể xác nhận có mặt.");
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
            showAlert(
              "Thông báo",
              "Bạn đã báo vắng mặt. Đơn hàng sẽ được cập nhật.",
            );
          } else {
            console.log("✅ [ReportAbsent] Success (Web)");
          }
          fetchReportDetail(report.id);
        } else {
          if (Platform.OS !== "web") {
            showAlert("Lỗi", res.error || "Không thể báo vắng mặt.");
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
      showAlert(
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
          (Number(
            item?.weight ||
            item?.weightKg ||
            item?.WeightKg ||
            item?.weight_kg,
          ) || 0),
        0,
      )
      : Number(
        getVal(report, ["weight", "weightKg", "WeightKg", "weight_kg"]),
      ) || 0;

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
              {status?.toUpperCase() === "COMPLETED" && earnedPoints !== null && (
                <Text style={styles.pointsEarnedText}>
                  +{earnedPoints} Điểm
                </Text>
              )}
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
        {/* 2. Content (From Notification or Report) */}
        {!!displayContent && (
          <Card
            variant="elevated"
            style={[
              styles.sectionCard,
              String(displayContent).toLowerCase().includes("sự cố") || String(displayContent).toLowerCase().includes("tranh chấp")
                ? { borderColor: AppColors.error + "30", borderWidth: 1 }
                : {},
            ]}
          >
            <View style={styles.incidentHeaderRow}>
              <Ionicons
                name={
                  String(displayContent).toLowerCase().includes("sự cố")
                    ? "warning"
                    : "document-text"
                }
                size={20}
                color={
                  String(displayContent).toLowerCase().includes("sự cố")
                    ? AppColors.error
                    : AppColors.primary
                }
              />
              <Text
                style={[
                  styles.sectionTitle,
                  String(displayContent).toLowerCase().includes("sự cố") && {
                    color: AppColors.error,
                    borderLeftColor: AppColors.error,
                  },
                ]}
              >
                {String(displayContent).toLowerCase().includes("sự cố")
                  ? "Báo cáo sự cố"
                  : "Nội dung báo cáo"}
              </Text>
            </View>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{String(displayContent)}</Text>
            </View>
            {String(displayContent).toLowerCase().includes("sự cố") && (
              <View style={styles.incidentNotice}>
                <Text style={styles.incidentNoticeText}>
                  Tài xế đã ghi nhận một sự cố trong quá trình thu gom. Nếu bạn
                  thấy thông tin này không chính xác, hãy sử dụng chức năng
                  Khiếu nại.
                </Text>
              </View>
            )}
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

            {/* Waste Details Comparison (Only for COMPLETED) */}
            {status?.toUpperCase() === "COMPLETED" && (
              <Card variant="elevated" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>So sánh khối lượng rác</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.typeCol,
                        styles.headerText,
                      ]}
                    >
                      Loại rác
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.weightCol,
                        styles.headerText,
                      ]}
                    >
                      Dự kiến
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.weightCol,
                        styles.headerText,
                      ]}
                    >
                      Thực tế
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.weightCol,
                        styles.headerText,
                      ]}
                    >
                      Độ sai lệch
                    </Text>
                  </View>

                  {(() => {
                    const types = [
                      { key: "ORGANIC", label: "Hữu cơ" },
                      { key: "RECYCLABLE", label: "Tái chế" },
                      { key: "HAZARDOUS", label: "Nguy hại" },
                    ];

                    return types.map((type, idx) => {
                      const citizenItem = normalizedItems.find(
                        (i: any) =>
                          String(
                            i.wasteType ||
                            i.type ||
                            i.WasteType ||
                            i.waste_type ||
                            "",
                          ).toUpperCase() === type.key,
                      );
                      const citizenWeight = Number(
                        (citizenItem as any)?.weight ||
                        (citizenItem as any)?.weightKg ||
                        (citizenItem as any)?.WeightKg ||
                        (citizenItem as any)?.weight_kg ||
                        0,
                      );

                      const collectorItem = (
                        (report as any).actualWasteItems || []
                      ).find(
                        (i: any) =>
                          String(i.wasteType || i.type || "").toUpperCase() ===
                          type.key,
                      );
                      const collectorWeight = Number(
                        (collectorItem as any)?.weight ||
                        (collectorItem as any)?.weightKg ||
                        (collectorItem as any)?.WeightKg ||
                        (collectorItem as any)?.weight_kg ||
                        0,
                      );

                      const diff = collectorWeight - citizenWeight;
                      const diffColor =
                        diff > 0
                          ? AppColors.success
                          : diff < 0
                            ? AppColors.error
                            : AppColors.textSecondary;

                      return (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.typeCol]}>
                            {type.label}
                          </Text>
                          <Text style={[styles.tableCell, styles.weightCol]}>
                            {citizenWeight.toFixed(1)}kg
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.weightCol,
                              { fontWeight: "700" },
                            ]}
                          >
                            {collectorWeight.toFixed(1)}kg
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.weightCol,
                              { color: diffColor, fontWeight: "600" },
                            ]}
                          >
                            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                          </Text>
                        </View>
                      );
                    });
                  })()}

                  <View style={[styles.tableRow, styles.totalRowTable]}>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.typeCol,
                        styles.totalLabelTable,
                      ]}
                    >
                      Tổng cộng
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.weightCol,
                        styles.totalValueTable,
                      ]}
                    >
                      {totalWeight.toFixed(1)}kg
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.weightCol,
                        styles.totalValueTable,
                        { color: AppColors.primary },
                      ]}
                    >
                      {((report as any).actualWeight || 0).toFixed(1)}kg
                    </Text>
                    <Text style={[styles.tableCell, styles.weightCol]}></Text>
                  </View>
                </View>

                {(report as any).accuracyBucket && (
                  <View style={styles.accuracyContainer}>
                    <Text style={styles.accuracyLabel}>Độ chính xác:</Text>
                    <View
                      style={[
                        styles.accuracyBadge,
                        {
                          backgroundColor:
                            (report as any).accuracyBucket === "MATCH"
                              ? AppColors.success + "20"
                              : (report as any).accuracyBucket === "MODERATE"
                                ? AppColors.warning + "20"
                                : AppColors.error + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.accuracyValue,
                          {
                            color:
                              (report as any).accuracyBucket === "MATCH"
                                ? AppColors.success
                                : (report as any).accuracyBucket === "MODERATE"
                                  ? AppColors.warning
                                  : AppColors.error,
                          },
                        ]}
                      >
                        {(report as any).accuracyBucket === "MATCH"
                          ? "Khớp hoàn toàn"
                          : (report as any).accuracyBucket === "MODERATE"
                            ? "Lệch nhẹ"
                            : "Sai lệch nhiều"}
                      </Text>
                    </View>
                  </View>
                )}
              </Card>
            )}

            {/* Waste Details (Only if NOT COMPLETED) */}
            {status?.toUpperCase() !== "COMPLETED" && (
              <Card variant="elevated" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Thông tin rác dự kiến</Text>

                <View style={styles.wasteList}>
                  {(() => {
                    // Group items by waste type and sum weights
                    const grouped =
                      normalizedItems.length > 0
                        ? normalizedItems.reduce(
                          (
                            acc: Array<{
                              wasteType: string;
                              weightKg: number;
                            }>,
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
                          [] as Array<{
                            wasteType: string;
                            weightKg: number;
                          }>,
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
                    <Text style={styles.totalLabel}>
                      Tổng khối lượng dự kiến
                    </Text>
                    <Text style={styles.totalValue}>
                      {totalWeight.toFixed(1)} kg
                    </Text>
                  </View>

                  {points !== undefined && (
                    <View style={styles.pointsRow}>
                      <Text style={styles.pointsLabel}>
                        Điểm thưởng dự kiến
                      </Text>
                      <Text style={styles.pointsValue}>+{points} điểm</Text>
                    </View>
                  )}
                </View>
              </Card>
            )}

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

            {canComplain && (
              <TouchableOpacity
                style={[
                  styles.complaintButton,
                  hasComplaintForReport && styles.complaintButtonDisabled,
                ]}
                onPress={() => {
                  if (hasComplaintForReport) return;
                  router.push({
                    pathname: "/(citizen)/complain",
                    params: {
                      reportId: String(currentReportId || ""),
                      source: "report-detail",
                    },
                  } as any);
                }}
                disabled={hasComplaintForReport}
              >
                <Text
                  style={[
                    styles.complaintButtonText,
                    hasComplaintForReport && styles.complaintButtonTextDisabled,
                  ]}
                >
                  {hasComplaintForReport
                    ? "Đã gửi khiếu nại"
                    : "Khiếu nại báo cáo"}
                </Text>
              </TouchableOpacity>
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
  complaintButton: {
    backgroundColor: AppColors.error,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 6,
  },
  complaintButtonText: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  complaintButtonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  complaintButtonTextDisabled: {
    color: AppColors.gray[700],
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
  // Table styles
  table: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    borderRadius: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: AppColors.gray[50],
  },
  headerText: {
    fontWeight: "700",
    color: AppColors.gray[600],
    fontSize: 12,
  },
  tableCell: {
    fontSize: 13,
    color: AppColors.gray[800],
  },
  typeCol: {
    flex: 1.5,
  },
  weightCol: {
    flex: 1,
    textAlign: "center",
  },
  totalRowTable: {
    backgroundColor: AppColors.primary + "10",
    borderBottomWidth: 0,
  },
  totalLabelTable: {
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  totalValueTable: {
    fontWeight: "800",
    textAlign: "center",
  },
  accuracyContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    gap: 12,
  },
  accuracyLabel: {
    fontSize: 14,
    color: AppColors.gray[600],
    fontWeight: "600",
  },
  accuracyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  incidentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  incidentNotice: {
    marginTop: 12,
    padding: 10,
    backgroundColor: AppColors.error + "10",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.error,
  },
  incidentNoticeText: {
    fontSize: 12,
    color: AppColors.error,
    lineHeight: 18,
    fontStyle: "italic",
  },
  pointsEarnedText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.primary,
    marginTop: 4,
  },
});
