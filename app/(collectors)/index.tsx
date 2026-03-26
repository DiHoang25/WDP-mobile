import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { collectorService } from "@/services/collector.service";
import { CollectorProfile, CollectorStatus } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function CollectorDashboard() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<CollectorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false, message: "", type: "success",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(refreshing ? false : true);
      const data = await collectorService.getProfile();
      console.log("👤 Collector Profile:", JSON.stringify({
        id: data.id,
        code: data.employeeCode,
        enterprise: data.enterprise?.name || "N/A",
        availability: data.status?.availability || "OFFLINE"
      }));
      setProfile(data);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleShift = async () => {
    if (!profile) return;

    const isOffline = profile.status?.availability === "OFFLINE";
    if (isOffline) {
      // Check working hours before toggling ON
      const now = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayKey = dayNames[now.getDay()] as keyof typeof profile.workingHours;
      const todaySchedule = profile.workingHours[todayKey];
      const dayVN = translateDay(todayKey);

      if (!todaySchedule || !todaySchedule.active) {
        showAlert("Ngoài lịch làm việc", `Hôm nay (${dayVN}) không phải ngày làm việc của bạn. Bạn không thể bật trạng thái hoạt động.`);
        return;
      }

      const [sH, sM] = todaySchedule.start.split(":").map(Number);
      const [eH, eM] = todaySchedule.end.split(":").map(Number);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (nowMin < sH * 60 + sM || nowMin >= eH * 60 + eM) {
        showAlert("Ngoài giờ làm việc", `Giờ làm việc hôm nay (${dayVN}) là ${todaySchedule.start} - ${todaySchedule.end}.\nBạn không thể bật trạng thái hoạt động lúc này.`);
        return;
      }

      confirmToggleShift(true);
    } else {
      showAlert(
        "Tắt hoạt động",
        "Bạn có chắc muốn tắt trạng thái hoạt động?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Tắt", style: "destructive", onPress: () => confirmToggleShift(false) },
        ],
      );
    }
  };

  const confirmToggleShift = async (start: boolean) => {
    try {
      setUpdatingStatus(true);
      const nextStatus: CollectorStatus = start ? "ONLINE_AVAILABLE" : "OFFLINE";

      const res = await collectorService.updateStatus(nextStatus);

      if (res.success) {
        // Optimistic update — just change the local state, no full reload
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: { ...prev.status, availability: nextStatus },
          };
        });
        showToast(
          start ? "Đã bật trạng thái hoạt động" : "Đã tắt trạng thái hoạt động",
          start ? "success" : "info"
        );
      } else {
        showToast("Không thể cập nhật trạng thái", "error");
      }
    } catch (error) {
      showToast("Đã có lỗi xảy ra", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tải được dữ liệu.</Text>
        <Button title="Thử lại" onPress={fetchData} />
      </View>
    );
  }

  const isOnline = profile.status?.availability === "ONLINE_AVAILABLE" || profile.status?.availability === "ONLINE_BUSY";

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[AppColors.primary, AppColors.primaryDark]} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    profile.user?.avatar ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
                }}
                style={styles.avatarImg}
              />
              <View>
                <Text style={styles.headerName}>{profile.user?.fullName || "Người dùng"}</Text>
                <Text style={styles.headerCode}>Mã NV: {profile.employeeCode || "—"}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push("/(collectors)/notifications")}>
              <Ionicons name="notifications-outline" size={28} color={AppColors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Status Card */}
        <View style={styles.statusCardContainer}>
          <Card variant="elevated" style={styles.statusCard}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? AppColors.success : AppColors.gray[400] }]} />
            <Text style={styles.statusTitle}>
              {isOnline ? "Bạn đang sẵn sàng nhận đơn" : "Bạn đang ngoại tuyến"}
            </Text>

            <View style={{ width: '100%' }}>
              <Button
                key={isOnline ? "btn-online" : "btn-offline"}
                title={isOnline ? "Tắt hoạt động" : "Bật hoạt động"}
                onPress={handleToggleShift}
                variant={isOnline ? "outline" : "primary"}
                loading={updatingStatus}
              />
            </View>

            <View style={styles.enterpriseInfo}>
              <Ionicons name="business" size={18} color={AppColors.gray[600]} />
              <Text style={styles.enterpriseText}>{profile.enterprise?.name || "N/A"}</Text>
            </View>
          </Card>
        </View>

        {/* Shortcuts */}
        <View style={styles.shortcutsContainer}>
          <TouchableOpacity
            style={styles.shortcutButton}
            onPress={() => router.push(`/(collectors)/task-list?refreshKey=${Date.now()}` as any)}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: AppColors.primary + "20" }]}>
              <Ionicons name="list" size={28} color={AppColors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>Đơn hàng</Text>
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
            onPress={() => router.push("/(collectors)/active-task")}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: AppColors.success + "20" }]}>
              <Ionicons name="map" size={28} color={AppColors.success} />
            </View>
            <Text style={styles.shortcutLabel}>Đơn đang xử lý</Text>
          </TouchableOpacity>
        </View>

        {/* Working Schedule Table */}
        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleSectionTitle}>📅 Lịch làm việc trong tuần</Text>
          <Card variant="elevated" style={styles.scheduleCard}>
            {/* Table Header */}
            <View style={styles.scheduleHeaderRow}>
              <Text style={styles.scheduleHeaderCell}>Ngày</Text>
              <Text style={[styles.scheduleHeaderCell, { textAlign: 'right' }]}>Giờ làm việc</Text>
            </View>
            {/* Table Body - Monday to Sunday */}
            {(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const).map((day) => {
              const hours = profile?.workingHours?.[day];
              const now = new Date();
              const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              const isToday = dayNames[now.getDay()] === day;
              return (
                <View key={day} style={[styles.scheduleRow, isToday && styles.scheduleRowToday]}>
                  <View style={styles.scheduleDayCell}>
                    {isToday && <View style={styles.todayDot} />}
                    <Text style={[styles.scheduleDayText, isToday && styles.scheduleDayTextToday]}>
                      {translateDay(day)}
                    </Text>
                  </View>
                  <View style={[styles.scheduleTimeCell, !hours?.active && styles.scheduleTimeCellOff]}>
                    {hours?.active ? (
                      <Text style={styles.scheduleTimeText}>{hours.start} - {hours.end}</Text>
                    ) : (
                      <Text style={styles.scheduleTimeTextOff}>Nghỉ</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        </View>

        <Card variant="outlined" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={24} color={AppColors.warning} />
            <Text style={styles.tipTitle}>Hướng dẫn nhanh</Text>
          </View>
          <Text style={styles.tipText}>
            • Bật GPS để hệ thống điều phối Đơn hàng gần bạn nhất.{"\n"}
            • Kiểm tra lịch làm việc của bạn trong phần Cá nhân/Profile.
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 24,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.white,
  },
  headerCode: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statusCardContainer: {
    paddingHorizontal: 20,
    marginTop: -60,
  },
  statusCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.gray[700],
    marginBottom: 16,
  },
  toggleBtn: {
    alignSelf: 'stretch',
    borderRadius: 12,
  },
  enterpriseInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
    width: '100%',
    justifyContent: 'center',
  },
  enterpriseText: {
    fontSize: 13,
    color: AppColors.gray[600],
    marginLeft: 6,
  },
  shortcutsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 16,
  },
  shortcutButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: AppColors.white,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  shortcutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.gray[700],
  },
  tipCard: {
    margin: 20,
    backgroundColor: AppColors.warning + "10",
    borderColor: AppColors.warning + "30",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginLeft: 8,
  },
  tipText: {
    fontSize: 13,
    color: AppColors.gray[600],
    lineHeight: 20,
  },
  scheduleSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  scheduleSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 12,
    marginLeft: 4,
  },
  scheduleCard: {
    padding: 0,
    borderRadius: 16,
    overflow: "hidden",
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.primary + "10",
  },
  scheduleHeaderCell: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
    flex: 1,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  scheduleRowToday: {
    backgroundColor: AppColors.primary + "08",
  },
  scheduleDayCell: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.primary,
    marginRight: 8,
  },
  scheduleDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: AppColors.gray[700],
  },
  scheduleDayTextToday: {
    fontWeight: "700",
    color: AppColors.primary,
  },
  scheduleTimeCell: {
    backgroundColor: AppColors.gray[50],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  scheduleTimeCellOff: {
    backgroundColor: AppColors.gray[100],
  },
  scheduleTimeText: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
  },
  scheduleTimeTextOff: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.gray[400],
  },
});

const translateDay = (day: string) => {
  const days: Record<string, string> = {
    Monday: "Thứ Hai",
    Tuesday: "Thứ Ba",
    Wednesday: "Thứ Tư",
    Thursday: "Thứ Năm",
    Friday: "Thứ Sáu",
    Saturday: "Thứ Bảy",
    Sunday: "Chủ Nhật",
  };
  return days[day] || day;
};
