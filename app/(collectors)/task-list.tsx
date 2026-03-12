import type { ToastType } from "@/components/common";
import { Card, EmptyState, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { collectorService } from "@/services/collector.service";
import { CollectorTaskItem } from "@/types/collector";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TaskListScreen() {
  const router = useRouter();
  const { refreshKey } = useLocalSearchParams<{ refreshKey?: string }>();
  const [tasks, setTasks] = useState<CollectorTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const [pending, accepted] = await Promise.all([
        collectorService.getTasks(),
        collectorService.getAcceptedTasks()
      ]);
      console.log(`[task-list] Fetched ${pending?.length || 0} pending and ${accepted?.length || 0} accepted tasks`);

      // Combine and filter unique cases if necessary, but usually they are distinct status-wise
      const combined = [...(pending || []), ...(accepted || [])];
      setTasks(combined);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showToast("Lỗi khi tải danh sách đơn hàng", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks, refreshKey])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleTaskPress = (task: CollectorTaskItem) => {
    router.push(`/(collectors)/task-detail?id=${task.id}` as any);
  };

  const handleRespond = (task: CollectorTaskItem, accept: boolean) => {
    Alert.alert(
      accept ? "Xác nhận đơn" : "Từ chối đơn",
      accept
        ? `Bạn có chắc muốn chấp nhận đơn #${task.reportId}?`
        : `Bạn có chắc muốn từ chối đơn #${task.reportId}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: accept ? "Chấp nhận" : "Từ chối",
          style: accept ? "default" : "destructive",
          onPress: async () => {
            try {
              setRespondingId(task.id);
              const res = await collectorService.respondTask(task.id, accept);
              if (res.success) {
                if (accept) {
                  showToast("Đã chấp nhận đơn hàng! Đang chuyển...", "success");
                  setTimeout(() => {
                    router.push(`/(collectors)/active-task?id=${task.id}` as any);
                  }, 800);
                } else {
                  showToast("Đã từ chối đơn hàng", "info");
                  fetchTasks(); // Refresh list
                }
              } else {
                showToast("Không thể xử lý yêu cầu", "error");
              }
            } catch (error) {
              showToast("Đã có lỗi xảy ra", "error");
            } finally {
              setRespondingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING_COLLECTOR": return { label: "Chờ xác nhận", color: AppColors.warning };
      case "ACCEPTED": return { label: "Đã chấp nhận", color: AppColors.success };
      case "ON_THE_WAY": return { label: "Đang di chuyển", color: AppColors.info };
      case "ARRIVED": return { label: "Đã đến nơi", color: AppColors.primary };
      case "COMPLETED": return { label: "Hoàn thành", color: AppColors.success };
      case "REJECTED": return { label: "Đã từ chối", color: AppColors.error };
      case "EXPIRED": return { label: "Hết hạn", color: AppColors.gray[400] };
      default: return { label: status, color: AppColors.gray[500] };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  const displayTasks = tasks.filter(t =>
    ["PENDING_COLLECTOR", "COLLECTOR_PENDING", "ACCEPTED", "ON_THE_WAY", "ARRIVED", "COLLECTED"].includes(t.status)
  );

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
            <Text style={styles.headerTitle}>Đơn hàng</Text>
            <Text style={styles.headerSubtitle}>
              {displayTasks.length > 0
                ? `${displayTasks.length} đơn cần xử lý`
                : "Không có đơn nào cần xử lý"}
            </Text>
          </View>
          {!!(displayTasks.length > 0) && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{displayTasks.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Task list */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {!Array.isArray(displayTasks) || displayTasks.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="Chưa có đơn hàng nào"
            message="Các đơn hàng mới và đang xử lý sẽ xuất hiện ở đây"
          />
        ) : (
          displayTasks.map((task: any) => {
            // Backend có thể trả task dạng attempt, luôn fallback về task nếu thiếu report
            const report = (task?.report || task) as any;
            const statusInfo = getStatusLabel(task.status);
            const firstImage = report.images?.[0]?.imageUrl;
            const totalWeight = Array.isArray(report.wasteItems)
              ? report.wasteItems.reduce((sum: number, item: any) => sum + Number(item?.weightKg || item?.weight || 0), 0)
              : 0;
            const isResponding = respondingId === task.id;

            return (
              <TouchableOpacity key={task.id} onPress={() => handleTaskPress(task)}>
                <Card variant="elevated" style={styles.taskCard}>
                  {/* Status badge */}
                  <View style={styles.taskHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                    </View>
                    <Text style={styles.taskDate}>{formatDate(task.createdAt)}</Text>
                  </View>

                  {/* Image */}
                  {!!firstImage && (
                    <Image source={{ uri: firstImage }} style={styles.taskImage} />
                  )}

                  {/* Address */}
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={18} color={AppColors.primary} />
                    <Text style={styles.addressText} numberOfLines={2}>{report.address || task.address || "—"}</Text>
                  </View>

                  {/* Waste types */}
                  <View style={styles.wasteRow}>
                    {(Array.isArray(report.wasteItems) ? report.wasteItems : []).map((item: any, idx: number) => (
                      <View key={idx} style={styles.wasteTag}>
                        <Text style={styles.wasteTagText}>{getWasteTypeLabel(item.wasteType)}</Text>
                      </View>
                    ))}
                    <View style={styles.weightTag}>
                      <Ionicons name="scale" size={14} color={AppColors.gray[600]} />
                      <Text style={styles.weightText}>~{totalWeight.toFixed(1)} kg</Text>
                    </View>
                  </View>

                  {/* Citizen */}
                  {!!report?.citizen && (
                    <View style={styles.citizenRow}>
                      <View style={styles.citizenAvatar}>
                        {report.citizen.avatar ? (
                          <Image source={{ uri: report.citizen.avatar }} style={styles.avatarImage} />
                        ) : (
                          <Ionicons name="person" size={16} color={AppColors.white} />
                        )}
                      </View>
                      <View style={styles.citizenInfoContainer}>
                        <Text style={styles.citizenName}>{report.citizen.fullName}</Text>
                        <Text style={styles.citizenPhone}>{report.citizen.phone}</Text>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    {task.status === "PENDING_COLLECTOR" || task.status === "COLLECTOR_PENDING" ? (
                      <>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={(e) => { e.stopPropagation(); handleRespond(task, false); }}
                          disabled={isResponding}
                        >
                          {isResponding ? (
                            <ActivityIndicator size="small" color={AppColors.error} />
                          ) : (
                            <>
                              <Ionicons name="close-circle" size={18} color={AppColors.error} />
                              <Text style={styles.rejectText}>Từ chối</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.acceptButton}
                          onPress={(e) => { e.stopPropagation(); handleRespond(task, true); }}
                          disabled={isResponding}
                        >
                          {isResponding ? (
                            <ActivityIndicator size="small" color={AppColors.white} />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={18} color={AppColors.white} />
                              <Text style={styles.acceptText}>Chấp nhận</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        style={styles.activeTaskButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/(collectors)/active-task?id=${task.id}` as any);
                        }}
                      >
                        <Ionicons name="play-circle" size={20} color={AppColors.white} />
                        <Text style={styles.acceptText}>Tiếp tục nhiệm vụ</Text>
                      </TouchableOpacity>
                    )}
                  </View>


                </Card>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
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
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  headerBadge: {
    backgroundColor: AppColors.white,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    marginBottom: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  taskDate: {
    fontSize: 12,
    color: AppColors.gray[500],
  },
  taskImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.gray[800],
    marginLeft: 8,
    lineHeight: 20,
  },
  wasteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  wasteTag: {
    backgroundColor: AppColors.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  wasteTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.primary,
  },
  weightTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 4,
  },
  weightText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.gray[700],
  },
  citizenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  citizenAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  citizenInfoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  citizenName: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.gray[800],
  },
  citizenPhone: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginTop: 2,
  },
  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AppColors.error,
    backgroundColor: AppColors.error + "08",
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.error,
  },
  acceptButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.white,
  },
  activeTaskButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.info,
  },
});
