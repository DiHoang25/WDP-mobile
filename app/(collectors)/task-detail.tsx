import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { collectorService } from "@/services/collector.service";
import { CollectorTaskItem } from "@/types/collector";
import { getStatusText, getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { extractMediaUrls } from "../../utils/media";

export default function TaskDetailScreen() {
  const { id, reportId: paramReportId, data: initialData } = useLocalSearchParams<{
    id: string;
    reportId?: string;
    data?: string;
  }>();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [task, setTask] = useState<CollectorTaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Check if we already have the data in navigation params (History items use this)
      if (initialData) {
        try {
          const parsed = JSON.parse(decodeURIComponent(initialData));
          if (parsed) {
            const normalized = parsed.reportId && !parsed.report
              ? { ...parsed, report: parsed, status: parsed.status || "COMPLETED" }
              : parsed;
            setTask(normalized);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing initialData:", e);
        }
      }

      // 2. Try fetching by task ID
      if (id && id !== "NaN" && id !== "undefined") {
        try {
          const data = await collectorService.getTaskById(Number(id));
          if (data) {
            setTask(data);
            return;
          }
        } catch (e) {
          console.log("Not found by task ID, trying by report ID...");
        }
      }

      // 3. Try finding task by reportId (from notification)
      const searchReportId = paramReportId || id;
      if (searchReportId && searchReportId !== "NaN" && searchReportId !== "undefined") {
        console.log(`Searching for task by reportId: ${searchReportId}`);
        try {
          // Search in pending tasks
          const pendingTasks = await collectorService.getTasks();
          console.log(`pendingTasks length: ${pendingTasks?.length}`);
          if (pendingTasks?.length > 0) {
            console.log("FIRST PENDING TASK DUMP:", JSON.stringify(pendingTasks[0], null, 2));
          }
          const foundTask = pendingTasks.find(
            (t: any) => String(t.reportId) === String(searchReportId) || String(t.report?.id) === String(searchReportId) || String(t.id) === String(searchReportId)
          );
          if (foundTask) {
            console.log(`Found task in pendingTasks with ID: ${foundTask.id}`);
            setTask(foundTask);
            return;
          }

          // Search in accepted tasks
          const acceptedTasks = await collectorService.getAcceptedTasks();
          console.log(`acceptedTasks length: ${acceptedTasks?.length}`);
          const foundAccepted = acceptedTasks.find(
            (t: any) => String(t.reportId) === String(searchReportId) || String(t.report?.id) === String(searchReportId)
          );
          if (foundAccepted) {
            console.log(`Found task in acceptedTasks with ID: ${foundAccepted.id}`);
            setTask(foundAccepted);
            return;
          }

          // 4. Try finding in history if still not found
          console.log(`Searching for report in history: ${searchReportId}`);
          const historyTasks = await collectorService.getCompletedTasks();
          const foundHistory = historyTasks.find(
            (t: any) => String(t.id) === String(searchReportId) || String(t.reportId) === String(searchReportId)
          );
          if (foundHistory) {
            console.log(`Found task in history with ID: ${foundHistory.id || foundHistory.reportId}`);
            // Completed tasks are usually reports directly
            const normalizedHistory = {
              ...foundHistory,
              report: foundHistory,
              status: foundHistory.status || "COMPLETED"
            };
            setTask(normalizedHistory);
            return;
          }
        } catch (e) {
          console.log("Error finding task by report ID in task lists", e);
        }
      }

      console.log("All methods to find task failed.");
      showToast("Không tìm thấy thông tin đơn hàng", "error");
    } catch (error) {
      console.error("Error fetching detail:", error);
      showToast("Lỗi tải thông tin", "error");
    } finally {
      setLoading(false);
    }
  }, [id, paramReportId, initialData]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleRespond = (accept: boolean) => {
    showAlert(
      accept ? "Xác nhận đơn" : "Từ chối đơn",
      accept
        ? "Bạn có chắc muốn chấp nhận đơn hàng này?"
        : "Bạn có chắc muốn từ chối đơn hàng này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: accept ? "Chấp nhận" : "Từ chối",
          style: accept ? "default" : "destructive",
          onPress: async () => {
            try {
              setResponding(true);
              console.log(`Calling respondTask with ID: ${id}, accept: ${accept}`);
              const res = await collectorService.respondTask(Number(id), accept);
              console.log("handleRespond result:", res);
              if (res.success) {
                if (accept) {
                  showToast("Đã chấp nhận đơn hàng! Đang chuyển...", "success");
                  setTimeout(() => {
                    router.replace(`/(collectors)/active-task?id=${id}` as any);
                  }, 800);
                } else {
                  showToast("Đã từ chối đơn hàng", "info");
                  setTimeout(() => router.replace("/(collectors)"), 1500);
                }
              } else {
                showToast(res.message || "Không thể xử lý yêu cầu", "error");
              }
            } catch (error) {
              console.error("handleRespond catch error:", error);
              showToast("Đã có lỗi xảy ra", "error");
            } finally {
              setResponding(false);
            }
          },
        },
      ]
    );
  };



  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "không có";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getRemainingTime = (expiredAt: string) => {
    const exp = new Date(expiredAt).getTime();
    const diff = exp - now.getTime();
    if (diff <= 0) return "00:00";

    const totalSeconds = Math.floor(diff / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const getTimeStatusColor = (expiredAt: string) => {
    const exp = new Date(expiredAt).getTime();
    const diff = exp - now.getTime();
    if (diff < 60000) return AppColors.error;
    if (diff < 180000) return AppColors.warning;
    return AppColors.success;
  };

  const getStatusLabel = (status: string) => {
    const label = getStatusText(status);
    switch (status) {
      case "PENDING_COLLECTOR":
      case "COLLECTOR_PENDING": return { label, color: AppColors.warning, icon: "time-outline" as const };
      case "ACCEPTED": return { label, color: AppColors.success, icon: "checkmark-circle" as const };
      case "ON_THE_WAY": return { label, color: AppColors.info, icon: "car" as const };
      case "ARRIVED": return { label, color: AppColors.primary, icon: "location" as const };
      case "COLLECTING": return { label, color: AppColors.secondary, icon: "cube" as const };
      case "COMPLETED": return { label, color: AppColors.success, icon: "checkmark-done-circle" as const };
      case "CITIZEN_ABSENT": return { label: getStatusText("FAILED_CITIZEN_NOT_HOME"), color: AppColors.warning, icon: "person-remove" as const };
      case "REPORTED_ISSUE": return { label: "Có sự cố", color: AppColors.error, icon: "warning" as const };
      case "REJECTED": return { label, color: AppColors.error, icon: "close-circle" as const };
      case "EXPIRED": return { label, color: AppColors.gray[400], icon: "timer" as const };
      default: return { label, color: AppColors.gray[500], icon: "help-circle" as const };
    }
  };

  const getReportStatusLabel = (status: string) => {
    if (!status) return "không có";
    return getStatusText(status);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={AppColors.gray[400]} />
        <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
      </View>
    );
  }

  const report = task.report || (task as any);
  const statusInfo = getStatusLabel(task.status || ((task as any).completedAt ? "COMPLETED" : ""));
  const wasteItems = report.wasteItems || [];
  const totalWeight = wasteItems.reduce((sum: number, item: any) => sum + (item.weightKg || item.weight || 0), 0);
  const citizen = report.citizen;
  const taskId = task.id || task.reportId || id;

  // Extract & normalize images (string absolute URLs) from various possible fields based on API
  const reportImages = extractMediaUrls((report as any).images || (report as any).files);
  const evidenceImages = extractMediaUrls((report as any).evidenceImages || (report as any).collectorImages);

  console.log(`[task-detail] Rendering ID ${taskId}`);
  console.log(`[task-detail] Found ${reportImages.length} customer images, ${evidenceImages.length} evidence images`);

  if (reportImages.length === 0 && evidenceImages.length === 0) {
    console.log(`[task-detail] No images found. Available keys:`, Object.keys(report));
    console.log(`[task-detail] Data snippet:`, JSON.stringify(report).substring(0, 300));
  }

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Expiration Notice */}
        {task.expiredAt && (task.status === "PENDING_COLLECTOR" || task.status === "COLLECTOR_PENDING") && (
          new Date(task.expiredAt).getTime() < now.getTime() ? (
            <View style={styles.expirationBanner}>
              <Ionicons name="alert-circle" size={20} color={AppColors.error} />
              <Text style={styles.expirationText}>Đơn hàng này đã hết hạn xác nhận và được chuyển cho người khác.</Text>
            </View>
          ) : (
            <View style={[styles.timerBanner, { backgroundColor: getTimeStatusColor(task.expiredAt) + "10" }]}>
              <Ionicons name="timer" size={22} color={getTimeStatusColor(task.expiredAt)} />
              <View style={styles.timerContent}>
                <Text style={styles.timerLabel}>Thời gian xác nhận còn lại</Text>
                <Text style={[styles.timerDisplay, { color: getTimeStatusColor(task.expiredAt) }]}>
                  {getRemainingTime(task.expiredAt)}
                </Text>
              </View>
            </View>
          )
        )}

        {/* Status Header */}
        <View style={[styles.statusHeader, { backgroundColor: statusInfo.color + "10" }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              const status = task.status as any;
              if (initialData || status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED" || status === "FAILED") {
                router.push("/(collectors)/history");
              } else {
                // For pending or active tasks, explicitly go back to the main tasks tab
                router.replace("/(collectors)");
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={AppColors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.statusTitleContainer}>
            <Ionicons name={statusInfo.icon} size={22} color={statusInfo.color} />
            <Text style={[styles.statusHeaderText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Task Info Card */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>

            <InfoRow icon="document-text" label="Mã đơn" value={`#${task.reportId || report.id}`} />
            <InfoRow
              icon="flag"
              label="Trạng thái"
              value={getReportStatusLabel(report.status || task.status)}
            />
            <InfoRow
              icon="calendar"
              label={task.status === "COMPLETED" || (report as any).completedAt ? "Ngày hoàn tất" : "Ngày tạo"}
              value={formatDate(report.createdAt || (report as any).completedAt)}
            />
            {task.expiredAt && (
              <InfoRow icon="timer" label="Hạn xác nhận" value={formatDate(task.expiredAt)} />
            )}
          </Card>

          {/* Citizen Info */}
          {citizen && (
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
              <InfoRow icon="person" label="Tên" value={citizen.fullName || (citizen as any).name || (report as any).fullName || (report as any).citizenName || (report as any).name || "không có"} />
              <InfoRow icon="call" label="Số điện thoại" value={citizen.phone || "không có"} />
              <InfoRow icon="mail" label="Email" value={citizen.email || "không có"} />
            </Card>
          )}

          {/* Report Images */}
          {reportImages.length > 0 && (
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Hình ảnh từ khách hàng</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesRow}>
                  {reportImages.map((img: any, idx: number) => (
                    <Image
                      key={`img-${idx}`}
                      source={{ uri: img }}
                      style={styles.reportImage}
                    />
                  ))}
                </View>
              </ScrollView>
            </Card>
          )}

          {/* Report Detail Card */}
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết báo cáo</Text>

            <InfoRow icon="location" label="Địa chỉ" value={report.address || "không có"} />
            <InfoRow icon="chatbox" label="Mô tả" value={report.description || "không có"} />
            {report.actualWeight !== null && report.actualWeight !== undefined && <InfoRow icon="scale" label="Khối lượng thực tế" value={`${report.actualWeight} kg`} />}
            {!!report.accuracyBucket && <InfoRow icon="analytics" label="Mức độ chính xác" value={
              report.accuracyBucket === "MATCH" ? "Chính xác" :
                report.accuracyBucket === "MODERATE" ? "Tương đối" :
                  report.accuracyBucket === "HEAVY" ? "Chênh lệch lớn" : report.accuracyBucket
            } />}
          </Card>

          {/* Weight Comparison Table (Only for COMPLETED) */}
          {task.status === "COMPLETED" && (
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>So sánh khối lượng rác </Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.typeCol, styles.headerText]}>Loại rác</Text>
                  <Text style={[styles.tableCell, styles.weightCol, styles.headerText]}>Đã tạo</Text>
                  <Text style={[styles.tableCell, styles.weightCol, styles.headerText]}>Thực tế</Text>
                  <Text style={[styles.tableCell, styles.weightCol, styles.headerText]}>Lệch</Text>
                </View>

                {(() => {
                  const types = [
                    { key: 'ORGANIC', label: 'Hữu cơ' },
                    { key: 'RECYCLABLE', label: 'Tái chế' },
                    { key: 'HAZARDOUS', label: 'Nguy hại' }
                  ];

                  return types.map((type, idx) => {
                    const citizenItem = wasteItems.find((i: any) =>
                      String(i.wasteType || i.type || "").toUpperCase() === type.key
                    );
                    const citizenWeight = Number(
                      (citizenItem as any)?.weight ||
                      (citizenItem as any)?.weightKg ||
                      (citizenItem as any)?.WeightKg ||
                      (citizenItem as any)?.weight_kg || 0
                    );

                    const collectorItem = ((report as any).actualWasteItems || []).find((i: any) =>
                      String(i.wasteType || i.type || "").toUpperCase() === type.key
                    );
                    const collectorWeight = Number(
                      (collectorItem as any)?.weight ||
                      (collectorItem as any)?.weightKg ||
                      (collectorItem as any)?.WeightKg ||
                      (collectorItem as any)?.weight_kg || 0
                    );

                    const diff = collectorWeight - citizenWeight;
                    const diffColor = diff > 0 ? AppColors.success : diff < 0 ? AppColors.error : AppColors.gray[500];

                    return (
                      <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.typeCol]}>{type.label}</Text>
                        <Text style={[styles.tableCell, styles.weightCol]}>{citizenWeight.toFixed(1)}kg</Text>
                        <Text style={[styles.tableCell, styles.weightCol, { fontWeight: '700' }]}>{collectorWeight.toFixed(1)}kg</Text>
                        <Text style={[styles.tableCell, styles.weightCol, { color: diffColor, fontWeight: '600' }]}>
                          {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                        </Text>
                      </View>
                    );
                  });
                })()}

                <View style={[styles.tableRow, styles.totalRowTable]}>
                  <Text style={[styles.tableCell, styles.typeCol, styles.totalLabelTable]}>Tổng cộng</Text>
                  <Text style={[styles.tableCell, styles.weightCol, styles.totalValueTable]}>
                    {wasteItems.reduce((sum: number, i: any) => sum + (Number(i.weight || i.weightKg || i.WeightKg || i.weight_kg) || 0), 0).toFixed(1)}kg
                  </Text>
                  <Text style={[styles.tableCell, styles.weightCol, styles.totalValueTable, { color: AppColors.primary }]}>
                    {((report as any).actualWeight || 0).toFixed(1)}kg
                  </Text>
                  <Text style={[styles.tableCell, styles.weightCol]}></Text>
                </View>
              </View>

              {(report as any).accuracyBucket && (
                <View style={styles.accuracyContainer}>
                  <Text style={styles.accuracyLabel}>Độ chính xác:</Text>
                  <View style={[
                    styles.accuracyBadge,
                    { backgroundColor: (report as any).accuracyBucket === 'MATCH' ? AppColors.success + '20' : (report as any).accuracyBucket === 'MODERATE' ? AppColors.warning + '20' : AppColors.error + '20' }
                  ]}>
                    <Text style={[
                      styles.accuracyValue,
                      { color: (report as any).accuracyBucket === 'MATCH' ? AppColors.success : (report as any).accuracyBucket === 'MODERATE' ? AppColors.warning : AppColors.error }
                    ]}>
                      {(report as any).accuracyBucket === 'MATCH' ? 'Khớp hoàn toàn' : (report as any).accuracyBucket === 'MODERATE' ? 'Lệch nhẹ' : 'Sai lệch nhiều'}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Waste Items */}
          {wasteItems.length > 0 && task.status !== "COMPLETED" && (
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Phân loại rác dự kiến</Text>
              {wasteItems.map((item: any, idx: number) => (
                <View key={idx} style={styles.wasteItemRow}>
                  <View style={styles.wasteItemTag}>
                    <Text style={styles.wasteItemType}>{getWasteTypeLabel(item.wasteType || item.type)}</Text>
                  </View>
                  <Text style={styles.wasteItemWeight}>{(item.weightKg || item.weight || 0).toFixed(1)} kg</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng dự kiến:</Text>
                <Text style={styles.totalValue}>{totalWeight.toFixed(1)} kg</Text>
              </View>
            </Card>
          )}

          {/* Evidence Images */}
          {evidenceImages.length > 0 && (
            <Card variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Ảnh bằng chứng thu gom</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesRow}>
                  {evidenceImages.map((img: any, idx: number) => (
                    <Image
                      key={`evid-${idx}`}
                      source={{ uri: img }}
                      style={styles.reportImage}
                    />
                  ))}
                </View>
              </ScrollView>
            </Card>
          )}

          {/* Action Buttons */}
          {(task.status === "PENDING_COLLECTOR" || task.status === "COLLECTOR_PENDING") && (
            <View style={styles.actionButtons}>
              <View style={{ width: '100%' }}>
                <Button
                  key="accept-btn"
                  title="Chấp nhận đơn"
                  onPress={() => handleRespond(true)}
                  loading={responding}
                  disabled={task.expiredAt ? new Date(task.expiredAt).getTime() < now.getTime() : false}
                />
              </View>
              <View style={{ width: '100%', marginTop: 12 }}>
                <Button
                  key="reject-btn"
                  title="Từ chối đơn"
                  variant="outline"
                  onPress={() => handleRespond(false)}
                  loading={responding}
                  disabled={task.expiredAt ? new Date(task.expiredAt).getTime() < now.getTime() : false}
                />
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={AppColors.primary} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  expirationBanner: {
    backgroundColor: AppColors.error + "15",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.error + "30",
    gap: 8,
  },
  expirationText: {
    flex: 1,
    fontSize: 13,
    color: AppColors.error,
    fontWeight: "600",
  },
  timerBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 12,
  },
  timerContent: {
    flex: 1,
  },
  timerLabel: {
    fontSize: 12,
    color: AppColors.gray[600],
    marginBottom: 2,
  },
  timerDisplay: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  errorText: {
    fontSize: 15,
    color: AppColors.gray[500],
    marginTop: 12,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  statusTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusHeaderText: {
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[800],
    lineHeight: 20,
  },
  imagesRow: {
    flexDirection: "row",
    gap: 10,
  },
  reportImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  wasteItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  wasteItemTag: {
    backgroundColor: AppColors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  wasteItemType: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  wasteItemWeight: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.gray[700],
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.primary,
  },
  actionButtons: {
    marginTop: 8,
    alignItems: "center",
  },
  // Table styles
  table: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: AppColors.gray[50],
  },
  headerText: {
    fontWeight: '700',
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
    textAlign: 'center',
  },
  totalRowTable: {
    backgroundColor: AppColors.primary + "05",
    borderBottomWidth: 0,
  },
  totalLabelTable: {
    fontWeight: '700',
    color: AppColors.gray[800],
  },
  totalValueTable: {
    fontWeight: '800',
    textAlign: 'center',
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    gap: 12,
  },
  accuracyLabel: {
    fontSize: 14,
    color: AppColors.gray[600],
    fontWeight: '600',
  },
  accuracyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: '700',
  }
});
