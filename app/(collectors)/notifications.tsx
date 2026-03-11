import { EmptyState } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { notificationService } from "@/services/notification.service";
import { Notification } from "@/types";
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

export default function CollectorNotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications(1, 50);
      if (response.success && response.data) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
      } catch (error) {
        console.error("Mark as read error:", error);
      }
    }

    // Navigate to task detail if has reportId or taskId
    if (notification.meta?.taskId) {
      router.push({
        pathname: "/(collectors)/task-detail",
        params: { id: String(notification.meta.taskId) },
      } as any);
    } else if (notification.meta?.reportId) {
      router.push({
        pathname: "/(collectors)/task-detail",
        params: { id: String(notification.meta.reportId), reportId: String(notification.meta.reportId) },
      } as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "REPORT_STATUS_CHANGED":
        return { name: "document-text", color: AppColors.primary };
      case "TASK_ASSIGNED":
      case "NEW_TASK":
        return { name: "add-circle", color: AppColors.primary };
      case "TASK_ACCEPTED":
      case "CITIZEN_PRESENT":
        return { name: "checkmark-circle", color: AppColors.success };
      case "TASK_COMPLETED":
        return { name: "checkmark-done-circle", color: AppColors.success };
      case "WARNING":
        return { name: "warning", color: AppColors.warning };
      case "BROADCAST":
      case "SYSTEM":
        return { name: "information-circle", color: AppColors.info };
      default:
        return { name: "notifications", color: AppColors.gray[600] };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const time = new Date(dateString).getTime();
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  // Dịch status raw sang tiếng Việt
  const translateContent = (text: string) => {
    const statusMap: Record<string, string> = {
      "COLLECTOR_PENDING": "Đang chờ xác nhận",
      "PENDING_COLLECTOR": "Đang chờ xác nhận",
      "PENDING": "Đang chờ xử lý",
      "ACCEPTED": "Đã chấp nhận",
      "REJECTED": "Đã từ chối",
      "ON_THE_WAY": "Đang di chuyển",
      "ARRIVED": "Đã đến nơi",
      "COLLECTING": "Đang thu gom",
      "COMPLETED": "Hoàn thành",
      "CANCELLED": "Đã huỷ",
      "EXPIRED": "Hết hạn",
      "CITIZEN_ABSENT": "Vắng khách",
      "REPORTED_ISSUE": "Có sự cố",
      "ENTERPRISE_PENDING": "Chờ doanh nghiệp",
      "ENTERPRISE_ACCEPTED": "Doanh nghiệp đã nhận",
      "ENTERPRISE_REJECTED": "Doanh nghiệp từ chối",
      "IN_PROGRESS": "Đang xử lý",
      "VERIFIED": "Đã xác minh",
      "APPROVED": "Đã duyệt",
      "PROCESSING": "Đang xử lý",
    };

    let result = text;
    for (const [eng, vi] of Object.entries(statusMap)) {
      result = result.replace(new RegExp(eng, "gi"), vi);
    }
    return result;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[AppColors.primary, AppColors.primaryDark]} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Thông báo</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Safe area */}
      <LinearGradient colors={[AppColors.primary, AppColors.primaryDark]} style={styles.headerGradient}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <Text style={styles.headerSubtitle}>{unreadCount} thông báo chưa đọc</Text>
        )}
      </LinearGradient>

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
                      {translateContent(notification.title)}
                      {!notification.isRead && <Text style={styles.newBadge}> • MỚI</Text>}
                    </Text>
                    <Text style={styles.notificationTime}>{getTimeAgo(notification.createdAt)}</Text>
                  </View>
                  <Text style={styles.notificationText} numberOfLines={2}>
                    {translateContent(notification.content)}
                  </Text>
                </View>

                {!notification.isRead && <View style={styles.unreadDot} />}
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    borderBottomColor: AppColors.gray[100],
  },
  unread: {
    backgroundColor: AppColors.primary + "08",
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
