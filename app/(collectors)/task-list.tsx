import { EmptyState } from "@/components/common";
import { TaskCard } from "@/components/collector";
import { AppColors } from "@/constants/theme";
import { CollectorTask } from "@/types/collector";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "pending" | "active";

export default function TaskListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - thay bằng API call
  const pendingTasks: CollectorTask[] = [
    {
      id: "1",
      reportId: "R001",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      latitude: 10.7769,
      longitude: 106.7009,
      distanceKm: 1.2,
      wasteTypes: ["ORGANIC", "RECYCLABLE"],
      estimatedWeightKg: 15,
      description: "Rác hữu cơ + chai nhựa",
      images: [],
      citizenId: "C001",
      citizenName: "Nguyễn Văn A",
      citizenPhone: "0901234567",
      status: "PENDING_ACCEPT",
      createdAt: new Date().toISOString(),
      assignedAt: new Date().toISOString(),
      acceptDeadline: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 phút sau
      citizenConfirmedPresence: false,
    },
  ];

  const activeTasks: CollectorTask[] = [
    {
      id: "2",
      reportId: "R002",
      address: "456 Lê Lợi, Quận 1, TP.HCM",
      latitude: 10.7709,
      longitude: 106.6969,
      distanceKm: 2.5,
      wasteTypes: ["HAZARDOUS"],
      estimatedWeightKg: 8,
      description: "Pin cũ, bóng đèn hỏng",
      images: [],
      citizenId: "C002",
      citizenName: "Trần Thị B",
      citizenPhone: "0907654321",
      status: "ASSIGNED",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      assignedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      acceptedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      citizenConfirmedPresence: false,
    },
  ];

  const tasks = activeTab === "pending" ? pendingTasks : activeTasks;

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Load data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleTaskPress = (taskId: string) => {
    router.push(`/(collectors)/task-detail?id=${taskId}` as any);
  };

  const getCountdown = (task: CollectorTask): number | undefined => {
    if (task.status === "PENDING_ACCEPT" && task.acceptDeadline) {
      const now = new Date().getTime();
      const deadline = new Date(task.acceptDeadline).getTime();
      return Math.max(0, Math.floor((deadline - now) / 1000));
    }
    return undefined;
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            Đang chờ xác nhận
          </Text>
          {pendingTasks.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingTasks.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Đang thực hiện
          </Text>
          {activeTasks.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeTasks.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Task list */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title={activeTab === "pending" ? "Chưa có nhiệm vụ chờ" : "Chưa có nhiệm vụ đang làm"}
            message="Các nhiệm vụ mới sẽ xuất hiện ở đây"
          />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task.id)}
              showTimer={task.status === "PENDING_ACCEPT"}
              countdown={getCountdown(task)}
            />
          ))
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
  tabs: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: AppColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: AppColors.gray[600],
  },
  tabTextActive: {
    fontWeight: "700",
    color: AppColors.primary,
  },
  badge: {
    backgroundColor: AppColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
