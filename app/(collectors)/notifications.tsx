import { EmptyState } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { CollectorNotification } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
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

export default function NotificationsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - thay bằng API call
  const [notifications, setNotifications] = useState<CollectorNotification[]>([
    {
      id: "1",
      type: "NEW_TASK",
      title: "Nhiệm vụ thu gom mới",
      content: "Bạn có 5 phút để xác nhận nhiệm vụ thu gom #R123",
      taskId: "123",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      isRead: false,
      priority: "URGENT",
    },
    {
      id: "2",
      type: "CITIZEN_PRESENT",
      title: "Công dân đã xác nhận có mặt",
      content: "Nguyễn Văn A đã xác nhận có mặt. Bạn có thể tiến hành thu gom.",
      taskId: "122",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isRead: false,
      priority: "HIGH",
    },
    {
      id: "3",
      type: "TASK_COMPLETED",
      title: "Nhiệm vụ hoàn thành",
      content: "Nhiệm vụ #R121 đã được hoàn thành thành công. +10 điểm tin cậy",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      priority: "MEDIUM",
    },
    {
      id: "4",
      type: "WARNING",
      title: "Cảnh báo timeout",
      content: "Nhiệm vụ #R120 đã hết thời gian chấp nhận. -5 điểm tin cậy.",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      priority: "HIGH",
    },
    {
      id: "5",
      type: "SYSTEM",
      title: "Hệ thống tự động offline",
      content: "Bạn đã tự động chuyển sang trạng thái ngoại tuyến do lâu không hoạt động.",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      priority: "LOW",
    },
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Load data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleNotificationPress = (notification: CollectorNotification) => {
    // Mark as read
    setNotifications(
      notifications.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );

    // Navigate if has taskId
    if (notification.taskId) {
      router.push(`/(collectors)/task-detail?id=${notification.taskId}` as any);
    }
  };

  const getNotificationIcon = (type: CollectorNotification["type"]) => {
    switch (type) {
      case "NEW_TASK":
        return { name: "add-circle", color: AppColors.primary };
      case "CITIZEN_PRESENT":
        return { name: "checkmark-circle", color: AppColors.success };
      case "TASK_COMPLETED":
        return { name: "checkmark-done-circle", color: AppColors.success };
      case "WARNING":
        return { name: "warning", color: AppColors.warning };
      case "SYSTEM":
        return { name: "information-circle", color: AppColors.info };
      default:
        return { name: "notifications", color: AppColors.gray[600] };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const time = new Date(dateString).getTime();
    const diff = Math.floor((now - time) / 1000); // seconds

    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.unreadText}>
            Bạn có {unreadCount} thông báo chưa đọc
          </Text>
        </View>
      )}

      {/* Notification list */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            title="Chưa có thông báo"
            message="Các thông báo sẽ xuất hiện ở đây"
          />
        ) : (
          notifications.map((notification) => {
            const iconInfo = getNotificationIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationItem, !notification.isRead && styles.unread]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={[styles.iconContainer, { backgroundColor: iconInfo.color + "20" }]}>
                  <Ionicons name={iconInfo.name as any} size={24} color={iconInfo.color} />
                </View>

                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                      {!notification.isRead && <Text style={styles.newBadge}> • NEW</Text>}
                    </Text>
                    <Text style={styles.notificationTime}>{getTimeAgo(notification.createdAt)}</Text>
                  </View>
                  <Text style={styles.notificationText} numberOfLines={2}>
                    {notification.content}
                  </Text>
                </View>

                {!notification.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
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
  header: {
    backgroundColor: AppColors.primary + "10",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.primary + "30",
  },
  unreadText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  unread: {
    backgroundColor: AppColors.primary + "05",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.gray[800],
  },
  newBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
  },
  notificationTime: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 14,
    color: AppColors.gray[600],
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
    marginLeft: 8,
    marginTop: 4,
  },
});
