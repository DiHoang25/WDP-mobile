import { Button, Card } from "@/components/common";
import { StatusBadge } from "@/components/collector";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { CollectorProfile } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CollectorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - thay bằng API call thực tế
  const [collectorProfile, setCollectorProfile] = useState<CollectorProfile>({
    id: "1",
    employeeCode: "COL001",
    fullName: user?.name || "Nguyễn Văn A",
    email: user?.email || "collector@example.com",
    phone: "0901234567",
    enterpriseId: "1",
    enterpriseName: "Công ty Thu gom ABC",
    status: "OFFLINE",
    zones: [
      { id: "1", name: "Quận 1", districtCode: "001", isPrimary: true },
      { id: "2", name: "Phường Bến Nghé", districtCode: "001", wardCode: "001", isPrimary: false },
    ],
    trustScore: 95,
    totalCompleted: 248,
    skipCount: 3,
    todayTaskCount: 5,
    queueLength: 2,
    maxQueueLength: 6,
  });

  const handleToggleShift = () => {
    if (collectorProfile.status === "OFFLINE") {
      router.push("/(collectors)/shift-control");
    } else {
      Alert.alert(
        "Kết thúc ca làm",
        "Bạn có chắc muốn kết thúc ca làm việc?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Kết thúc",
            style: "destructive",
            onPress: () => {
              setCollectorProfile({ ...collectorProfile, status: "OFFLINE" });
              Alert.alert("Thành công", "Đã kết thúc ca làm việc");
            },
          },
        ],
      );
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Load data from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getZoneText = () => {
    const primary = collectorProfile.zones.find((z) => z.isPrimary);
    const secondary = collectorProfile.zones.filter((z) => !z.isPrimary);
    if (secondary.length > 0) {
      return `${primary?.name} – ${secondary.map((z) => z.name).join(", ")}`;
    }
    return primary?.name || "Chưa có khu vực";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[AppColors.primary, AppColors.primaryDark]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color={AppColors.white} />
              </View>
              <View>
                <Text style={styles.headerName}>{collectorProfile.fullName}</Text>
                <Text style={styles.headerCode}>Mã NV: {collectorProfile.employeeCode}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push("/(collectors)/notifications")}>
              <Ionicons name="notifications-outline" size={28} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Status Card - Nổi bật nhất */}
        <View style={styles.statusCardContainer}>
          <Card variant="elevated" style={styles.statusCard}>
            <StatusBadge status={collectorProfile.status} size="large" />

            <Text style={styles.statusTitle}>
              {collectorProfile.status === "OFFLINE"
                ? "Bạn chưa bắt đầu ca làm"
                : collectorProfile.status === "AVAILABLE"
                  ? "Bạn đang sẵn sàng nhận đơn"
                  : "Bạn đang bận"}
            </Text>

            <Button
              title={collectorProfile.status === "OFFLINE" ? "Bắt đầu ca làm" : "Kết thúc ca"}
              onPress={handleToggleShift}
              variant={collectorProfile.status === "OFFLINE" ? "primary" : "outlined"}
            />

            {/* Khu vực làm việc */}
            <View style={styles.zoneInfo}>
              <Ionicons name="location" size={18} color={AppColors.gray[600]} />
              <Text style={styles.zoneText}>{getZoneText()}</Text>
            </View>
          </Card>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {collectorProfile.queueLength} / {collectorProfile.maxQueueLength}
            </Text>
            <Text style={styles.statLabel}>📦 Hàng chờ</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{collectorProfile.trustScore}</Text>
            <Text style={styles.statLabel}>⭐ Điểm tin cậy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{collectorProfile.todayTaskCount}</Text>
            <Text style={styles.statLabel}>✅ Nhiệm vụ hôm nay</Text>
          </View>
        </View>

        {/* Shortcut Buttons */}
        <View style={styles.shortcutsContainer}>
          <TouchableOpacity
            style={styles.shortcutButton}
            onPress={() => router.push("/(collectors)/task-list")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: AppColors.primary + "20" }]}>
              <Ionicons name="list" size={28} color={AppColors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>Xem nhiệm vụ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutButton}
            onPress={() => router.push("/(collectors)/history")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: AppColors.secondary + "20" }]}>
              <Ionicons name="time" size={28} color={AppColors.secondary} />
            </View>
            <Text style={styles.shortcutLabel}>Lịch sử</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutButton}
            onPress={() => router.push("/(collectors)/profile")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: AppColors.success + "20" }]}>
              <Ionicons name="stats-chart" size={28} color={AppColors.success} />
            </View>
            <Text style={styles.shortcutLabel}>Thống kê</Text>
          </TouchableOpacity>
        </View>

        {/* Hướng dẫn cho người dùng mới */}
        <Card variant="outlined" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={24} color={AppColors.warning} />
            <Text style={styles.tipTitle}>Hướng dẫn sử dụng</Text>
          </View>
          <Text style={styles.tipText}>
            • Bấm "Bắt đầu ca làm" để nhận nhiệm vụ mới{"\n"}
            • Kiểm tra GPS đã được bật trước khi bắt đầu{"\n"}
            • Bạn có 5 phút để chấp nhận mỗi nhiệm vụ mới{"\n"}
            • Liên hệ quản lý nếu gặp vấn đề
          </Text>
        </Card>
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
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerName: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.white,
  },
  headerCode: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  statusCardContainer: {
    paddingHorizontal: 20,
    marginTop: -60,
  },
  statusCard: {
    alignItems: "center",
    padding: 24,
  },
  statusTitle: {
    fontSize: 16,
    color: AppColors.gray[700],
    textAlign: "center",
    marginVertical: 16,
  },
  zoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  zoneText: {
    fontSize: 14,
    color: AppColors.gray[700],
    marginLeft: 6,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 13,
    color: AppColors.gray[600],
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: AppColors.gray[200],
    marginHorizontal: 8,
  },
  shortcutsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  shortcutButton: {
    flex: 1,
    alignItems: "center",
  },
  shortcutIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.gray[700],
    textAlign: "center",
  },
  tipCard: {
    margin: 20,
    backgroundColor: AppColors.info + "10",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: AppColors.gray[700],
    lineHeight: 22,
  },
});

