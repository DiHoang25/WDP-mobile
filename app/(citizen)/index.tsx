import { Card, EmptyState } from "@/components/common";
import { WasteReportCard } from "@/components/reports";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notification.service";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function CitizenHomeScreen() {
  const { user, refreshProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [allReports, setAllReports] = useState<WasteReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const recentReports = allReports.slice(0, 3);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      checkUnreadNotifications();
      fetchReports();
    }, [])
  );

  const checkUnreadNotifications = async () => {
    const count = await notificationService.countUnread();
    setUnreadCount(count);
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await wasteService.getHistory();
      if (response.success && response.data) {
        // Robust extraction logic
        let reportsList: WasteReport[] = [];
        const rawData = response.data;

        if (Array.isArray(rawData)) {
          reportsList = rawData;
        } else if (rawData.data && Array.isArray(rawData.data)) {
          reportsList = rawData.data;
        } else if (rawData.items && Array.isArray(rawData.items)) {
          reportsList = rawData.items;
        } else if (rawData.reports && Array.isArray(rawData.reports)) {
          reportsList = rawData.reports;
        } else if (typeof rawData === 'object' && rawData !== null) {
          const firstArrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
          if (firstArrayKey) reportsList = rawData[firstArrayKey];
        }

        setAllReports(reportsList);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const stats = [
    {
      label: "Điểm tích lũy",
      value: user?.points || 0,

      color: AppColors.warning,
    },
    {
      label: "Báo cáo",
      value: allReports.filter((r) => r.status?.toLowerCase() !== "completed").length,

      color: AppColors.primary,
    },
    {
      label: "Đã thu gom",
      value: allReports.filter((r) => r.status?.toLowerCase() === "completed").length,

      color: AppColors.success,
    },
  ];

  const quickActions = [
    {
      title: "Lịch sử",
      subtitle: "Xem các báo cáo",
      icon: "document-text",
      color: AppColors.secondary,
      route: "/(citizen)/history",
    },
    {
      title: "Xếp hạng",
      subtitle: "Top công dân",
      icon: "trophy",
      color: AppColors.warning,
      route: "/(citizen)/leaderboard",
    },
    {
      title: "Đổi thưởng",
      subtitle: "Phần thưởng",
      icon: "gift",
      color: AppColors.error,
      route: "/(citizen)/rewards",
    },
    {
      title: "Đăng ký DN",
      subtitle: "Trở thành đối tác",
      icon: "business",
      color: AppColors.primary,
      route: "/(citizen)/register-enterprise-form",
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Xin chào!</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.location}>{user?.district}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/(citizen)/notifications")}
            >
              <Ionicons name="notifications" size={24} color={AppColors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatar}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "?"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: "rgba(255, 255, 255, 0.95)" },
              ]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Main Action - Create Report */}
      <View style={styles.mainActionSection}>
        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={() => router.push("/(citizen)/create-report")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryDark]}
            style={styles.mainActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.mainActionContent}>
              <View style={styles.mainActionIconContainer}>
                <Ionicons name="create" size={28} color={AppColors.white} />
              </View>
              <View style={styles.mainActionTextContainer}>
                <Text style={styles.mainActionTitle}>Tạo báo cáo rác</Text>
                <Text style={styles.mainActionSubtitle}>
                  Báo cáo vị trí rác thải ngay
                </Text>
              </View>
              <View style={styles.mainActionArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={28}
                  color={AppColors.white}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chức năng</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${action.color}20` },
                ]}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Báo cáo gần đây</Text>
          <TouchableOpacity
            onPress={() => router.push("/(citizen)/history")}
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>Xem tất cả</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={AppColors.primary}
            />
          </TouchableOpacity>
        </View>

        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <WasteReportCard
              key={report.id}
              report={report}
              onPress={() => router.push({
                pathname: "/report-detail",
                params: { id: report.id }
              })}
            />
          ))
        ) : (
          <EmptyState
            icon="document-text"
            title="Chưa có báo cáo nào"
            message="Tạo báo cáo đầu tiên để bắt đầu thu gom rác"
            action={{
              label: "Tạo báo cáo",
              onPress: () => router.push("/(citizen)/create-report"),
            }}
          />
        )}
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Card variant="outlined" style={styles.tipCard}>
          <View style={styles.tipContent}>
            <Ionicons name="bulb" size={24} color={AppColors.warning} />
            <View style={styles.tipTextContainer}>
              <Text style={styles.tipTitle}>Mẹo thu gom rác</Text>
              <Text style={styles.tipText}>
                Phân loại rác trước khi báo cáo để nhận thêm điểm thưởng!
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.white,
    marginTop: 5,
  },
  location: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.white,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: AppColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  mainActionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: AppColors.background,
  },
  mainActionButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainActionGradient: {
    padding: 24,
  },
  mainActionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  mainActionTextContainer: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.white,
    marginBottom: 4,
  },
  mainActionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  mainActionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - 55) / 3,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    alignItems: "center",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  tipCard: {
    backgroundColor: AppColors.secondary + "10",
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});
