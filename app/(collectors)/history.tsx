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
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "ACCEPTED" | "COMPLETED";

export default function HistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("ACCEPTED");
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
      } else {
        data = await collectorService.getCompletedTasks();
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
    switch (status) {
      case "ACCEPTED": return { label: "Đang xử lý", color: AppColors.info };
      case "ON_THE_WAY": return { label: "Đang di chuyển", color: AppColors.primary };
      case "ARRIVED": return { label: "Đã đến nơi", color: AppColors.secondary };
      case "COLLECTING": return { label: "Đang thu gom", color: AppColors.warning };
      case "COMPLETED": return { label: "Hoàn thành", color: AppColors.success };
      case "REJECTED": return { label: "Bị từ chối", color: AppColors.error };
      default: return { label: status, color: AppColors.gray[500] };
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
          onPress={() => setActiveTab("ACCEPTED")}
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
      </View>

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
        ) : !Array.isArray(tasks) || tasks.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={activeTab === "ACCEPTED" ? "Không có đơn đang xử lý" : "Chưa có đơn hoàn thành"}
            message={activeTab === "ACCEPTED" ? "Các đơn bạn chấp nhận sẽ hiện ở đây" : "Danh sách các đơn bạn đã hoàn thành việc thu gom"}
          />
        ) : (
          tasks.map((task: any) => {
            // Determine structure style
            const isHistoryItem = activeTab === "COMPLETED" && !task.report;

            // Extract common display data
            const report = isHistoryItem ? task : (task.report || {});
            const dateStr = isHistoryItem ? task.completedAt : task.createdAt;
            const displayAddress = isHistoryItem ? task.address : (report.address || "N/A");
            const firstImage = !isHistoryItem ? (report.images?.[0]?.imageUrl) : null;
            const wasteItems = report.wasteItems || [];
            const totalWeight = isHistoryItem
              ? (task.actualWeight || wasteItems.reduce((sum: number, item: any) => sum + (item.weight || 0), 0))
              : wasteItems.reduce((sum: number, item: any) => sum + (item.weightKg || 0), 0);
            const citizenName = report.citizen?.fullName || "N/A";

            const statusInfo = getStatusLabel(task.status || (isHistoryItem ? "COMPLETED" : ""));

            return (
              <TouchableOpacity key={task.id || task.reportId} onPress={() => handleTaskPress(task)}>
                <Card variant="elevated" style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "15" }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                    <Text style={styles.taskDate}>{formatDate(dateStr)}</Text>
                  </View>

                  <View style={styles.cardMain}>
                    {!!firstImage && (
                      <Image source={{ uri: firstImage }} style={styles.thumbImage} />
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {displayAddress}
                      </Text>
                      <View style={styles.wasteRow}>
                        <View style={styles.weightTag}>
                          <Ionicons name="scale" size={14} color={AppColors.gray[500]} />
                          <Text style={styles.weightText}>{totalWeight.toFixed(1)} kg</Text>
                        </View>
                        {!!citizenName && citizenName !== "N/A" && (
                          <>
                            <Text style={styles.separator}>•</Text>
                            <Text style={styles.citizenLabel}>{citizenName}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.wasteTags}>
                      {wasteItems.slice(0, 2).map((item: any, idx: number) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>
                            {getWasteTypeLabel(item.wasteType || item.type)}
                          </Text>
                        </View>
                      ))}
                      {wasteItems.length > 2 && (
                        <Text style={styles.moreText}>+{wasteItems.length - 2}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward-circle" size={24} color={AppColors.primary} />
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
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[500],
  },
  activeTabText: {
    color: AppColors.primary,
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
  taskCard: {
    marginBottom: 16,
    padding: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  taskDate: {
    fontSize: 11,
    color: AppColors.gray[500],
    fontWeight: "500",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: AppColors.gray[100],
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[800],
    lineHeight: 20,
    marginBottom: 4,
  },
  wasteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  weightTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weightText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.gray[600],
  },
  separator: {
    marginHorizontal: 8,
    color: AppColors.gray[300],
  },
  citizenLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    fontWeight: "500",
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wasteTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: AppColors.gray[600],
  },
  moreText: {
    fontSize: 11,
    color: AppColors.gray[400],
    marginLeft: 2,
  },
});
