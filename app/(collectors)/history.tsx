import type { ToastType } from "@/components/common";
import { Card, EmptyState, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { collectorService } from "@/services/collector.service";
import { CollectorTaskItem } from "@/types/collector";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "ACCEPTED" | "COMPLETED" | "CANCELLED";

const PROCESSING_STATUSES = ["ALL", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "COLLECTING"] as const;
type ProcessingFilter = typeof PROCESSING_STATUSES[number];

export default function HistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("ACCEPTED");
  const [processingFilter, setProcessingFilter] = useState<ProcessingFilter>("ALL");
  const [tasks, setTasks] = useState<CollectorTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      let data: CollectorTaskItem[] = [];
      if (activeTab === "ACCEPTED") {
        data = await collectorService.getAcceptedTasks();
      } else if (activeTab === "COMPLETED") {
        data = await collectorService.getCompletedTasks();
      } else {
        // CANCELLED: get completed tasks filtered by cancelled/rejected statuses
        const all = await collectorService.getCompletedTasks();
        data = all.filter((t: any) =>
          ["CANCELLED", "REJECTED", "FAILED", "FAILED_NO_RESPONSE", "FAILED_CITIZEN_NOT_HOME"].includes(
            (t.status || "").toUpperCase()
          )
        );
      }
      setTasks(data);
    } catch (error) {
      console.error("Error fetching history tasks:", error);
      setToast({ visible: true, message: "Lỗi khi tải dữ liệu", type: "error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleTaskPress = (task: any) => {
    const taskId = task.id || task.reportId;
    if (!taskId) return;

    // Pass the full task object as a string to avoid fetching from non-existent endpoints
    const taskData = encodeURIComponent(JSON.stringify(task));
    router.push(`/(collectors)/task-detail?id=${taskId}&data=${taskData}` as any);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED": return { label: "Đang xử lý", color: AppColors.info };
      case "ON_THE_WAY": return { label: "Đang di chuyển", color: AppColors.primary };
      case "ARRIVED": return { label: "Đã đến nơi", color: AppColors.secondary };
      case "COLLECTING": return { label: "Đang thu gom", color: AppColors.warning };
      case "COMPLETED": return { label: "Hoàn thành", color: AppColors.success };
      case "REJECTED": return { label: "Bị từ chối", color: AppColors.error };
      case "CANCELLED": return { label: "Đã hủy", color: AppColors.error };
      case "FAILED": return { label: "Thất bại", color: AppColors.error };
      case "FAILED_NO_RESPONSE": return { label: "Không phản hồi", color: AppColors.error };
      case "FAILED_CITIZEN_NOT_HOME": return { label: "Vắng nhà", color: AppColors.error };
      default: return { label: status, color: AppColors.gray[500] };
    }
  };

  // Filter tasks by selected processing status
  const displayedTasks = (activeTab === "ACCEPTED" && processingFilter !== "ALL")
    ? tasks.filter((t: any) => (t.status || "").toUpperCase() === processingFilter)
    : tasks;

  const getProcessingFilterLabel = (f: ProcessingFilter) => {
    switch (f) {
      case "ALL": return "Tất cả";
      case "ACCEPTED": return "Chờ xử lý";
      case "ON_THE_WAY": return "Di chuyển";
      case "ARRIVED": return "Đã đến";
      case "COLLECTING": return "Thu gom";
    }
  };

  const getProcessingFilterColor = (f: ProcessingFilter) => {
    switch (f) {
      case "ALL": return AppColors.gray[600];
      case "ACCEPTED": return AppColors.info;
      case "ON_THE_WAY": return AppColors.primary;
      case "ARRIVED": return AppColors.secondary;
      case "COLLECTING": return AppColors.warning;
    }
  };

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
      />

      {/* Header */}
      <LinearGradient colors={[AppColors.primary, AppColors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Lịch sử</Text>
            <Text style={styles.headerSubtitle}>QUẢN LÝ CÁC ĐƠN HÀNG</Text>
          </View>
          <Ionicons name="receipt-outline" size={32} color={AppColors.white} style={{ opacity: 0.8 }} />
        </View>
      </LinearGradient>

      {/* Custom Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "ACCEPTED" && styles.activeTab]}
          onPress={() => { setActiveTab("ACCEPTED"); setProcessingFilter("ALL"); }}
        >
          <Text style={[styles.tabText, activeTab === "ACCEPTED" && styles.activeTabText]}>
            Đang xử lý
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "COMPLETED" && styles.activeTab]}
          onPress={() => setActiveTab("COMPLETED")}
        >
          <Text style={[styles.tabText, activeTab === "COMPLETED" && styles.activeTabText]}>
            Hoàn tất
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "CANCELLED" && styles.cancelledTab]}
          onPress={() => setActiveTab("CANCELLED")}
        >
          <Text style={[styles.tabText, activeTab === "CANCELLED" && styles.cancelledTabText]}>
            Đã hủy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips (only for ACCEPTED tab) */}
      {activeTab === "ACCEPTED" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          {PROCESSING_STATUSES.map((f) => {
            const isActive = processingFilter === f;
            const color = getProcessingFilterColor(f);
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.chip,
                  isActive && { backgroundColor: color, borderColor: color },
                ]}
                onPress={() => setProcessingFilter(f)}
              >
                {isActive && <View style={[styles.chipDot, { backgroundColor: AppColors.white }]} />}
                <Text style={[styles.chipText, isActive && { color: AppColors.white }]}>
                  {getProcessingFilterLabel(f)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
          </View>
        ) : !Array.isArray(displayedTasks) || displayedTasks.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={
              activeTab === "ACCEPTED" ? "Không có đơn đang xử lý" :
                activeTab === "COMPLETED" ? "Chưa có đơn hoàn thành" :
                  "Không có đơn bị hủy"
            }
            message={
              activeTab === "ACCEPTED" ? "Các đơn bạn chấp nhận sẽ hiện ở đây" :
                activeTab === "COMPLETED" ? "Danh sách các đơn bạn đã hoàn thành việc thu gom" :
                  "Các đơn bị từ chối hoặc hủy sẽ hiện ở đây"
            }
          />
        ) : (
          displayedTasks.map((task: any) => {
            // Determine structure style
            const isHistoryItem = activeTab === "COMPLETED" && !task.report;

            // Extract common display data
            const report = isHistoryItem ? task : (task.report || {});
            const dateStr = isHistoryItem ? task.completedAt : task.createdAt;
            const displayAddress = isHistoryItem ? task.address : (report.address || "");

            const wasteItems = report.wasteItems || [];
            const totalWeight = isHistoryItem
              ? (task.actualWeight || wasteItems.reduce((sum: number, item: any) => sum + (item.weight || 0), 0))
              : wasteItems.reduce((sum: number, item: any) => sum + (item.weightKg || 0), 0);

            const citizenNameRaw =
              report.citizen?.fullName ||
              report.fullName ||
              report.citizenName ||
              report.name ||
              (task as any).citizenName ||
              "";
            const citizenName = citizenNameRaw && citizenNameRaw !== "N/A" ? citizenNameRaw : "";

            const statusInfo = getStatusLabel(task.status || (isHistoryItem ? "COMPLETED" : ""));

            return (
              <TouchableOpacity key={task.id || task.reportId} onPress={() => handleTaskPress(task)} activeOpacity={0.7}>
                <Card variant="elevated" style={styles.historyCard}>
                  {/* Card Header: ID & Status */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.taskIdText}>ĐƠN #{task.reportId || task.id}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "15" }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBodyNew}>
                    <View style={styles.leftIconWrap}>
                      <View style={styles.leftIconCircle}>
                        <Ionicons name="location" size={18} color={AppColors.primary} />
                      </View>
                    </View>

                    <View style={styles.mainInfo}>
                      <Text style={styles.historyAddress} numberOfLines={2}>
                        {displayAddress || "—"}
                      </Text>

                      <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                          <Ionicons name="calendar-outline" size={13} color={AppColors.gray[500]} />
                          <Text style={styles.metaText}>{formatDate(dateStr).split(" ")[0]}</Text>
                        </View>

                        <View style={styles.metaPill}>
                          <Ionicons name="scale-outline" size={13} color={AppColors.primary} />
                          <Text style={[styles.metaText, { color: AppColors.primary, fontWeight: "800" }]}>
                            {Number.isFinite(totalWeight) ? totalWeight.toFixed(1) : "0.0"} kg
                          </Text>
                        </View>
                      </View>

                      {/* Không hiển thị field N/A */}
                      {!!citizenName && (
                        <View style={styles.customerRow}>
                          <Ionicons name="person-circle-outline" size={16} color={AppColors.gray[500]} />
                          <Text style={styles.customerName} numberOfLines={1}>{citizenName}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.chevronWrap}>
                      <Ionicons name="chevron-forward" size={18} color={AppColors.gray[300]} />
                    </View>
                  </View>

                  {/* Card Footer: Waste Tags */}
                  <View style={styles.historyFooter}>
                    <View style={styles.wasteTagsList}>
                      {wasteItems.slice(0, 3).map((item: any, idx: number) => (
                        <View key={idx} style={styles.minimalTag}>
                          <Text style={styles.minimalTagText}>
                            {getWasteTypeLabel(item.wasteType || item.type)}
                          </Text>
                        </View>
                      ))}
                      {wasteItems.length > 3 && (
                        <Text style={styles.moreCount}>+{wasteItems.length - 3}</Text>
                      )}
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
    textTransform: "uppercase",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    marginHorizontal: 16,
    marginTop: -15,
    borderRadius: 12,
    padding: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: AppColors.primary + "10",
  },
  cancelledTab: {
    backgroundColor: AppColors.error + "10",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[500],
  },
  activeTabText: {
    color: AppColors.primary,
  },
  cancelledTabText: {
    color: AppColors.error,
  },
  chipScroll: {
    maxHeight: 48,
  },
  chipContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: AppColors.gray[200],
    backgroundColor: AppColors.white,
    gap: 6,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.gray[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  centerContainer: {
    marginTop: 100,
    alignItems: "center",
  },
  historyCard: {
    marginBottom: 16,
    padding: 0, // We'll use internal padding for sections
    overflow: 'hidden',
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[50],
  },
  taskIdText: {
    fontSize: 11,
    fontWeight: "800",
    color: AppColors.gray[400],
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: "row",
    padding: 16,
  },
  // New Card Body (no images / no N/A)
  cardBodyNew: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "flex-start",
  },
  leftIconWrap: {
    paddingTop: 2,
    paddingRight: 12,
  },
  leftIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  mainInfo: {
    flex: 1,
  },
  chevronWrap: {
    paddingLeft: 10,
    paddingTop: 6,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  historyAddress: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "800",
    color: AppColors.gray[800],
    lineHeight: 18,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColors.gray[50],
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  metaText: {
    fontSize: 12,
    color: AppColors.gray[600],
    fontWeight: "600",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: AppColors.gray[600],
    fontWeight: "500",
  },
  detailDivider: {
    width: 1,
    height: 12,
    backgroundColor: AppColors.gray[200],
    marginHorizontal: 12,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  customerName: {
    fontSize: 12,
    color: AppColors.gray[600],
    fontWeight: "500",
    flex: 1,
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.gray[50] + "50",
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[50],
  },
  wasteTagsList: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  minimalTag: {
    backgroundColor: AppColors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  minimalTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: AppColors.gray[500],
  },
  moreCount: {
    fontSize: 10,
    color: AppColors.gray[400],
    fontWeight: "600",
  },
});
