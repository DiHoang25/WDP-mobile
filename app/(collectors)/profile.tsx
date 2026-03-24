import type { ToastType } from "@/components/common";
import { Button, Card, Toast } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { collectorService } from "@/services/collector.service";
import { CollectorProfile, CollectorStatus } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

export default function CollectorProfileScreen() {
  const { logout } = useAuth();
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Fetch profile, history (completed), and accepted tasks (pending) in parallel
      const [profileData, historyData, acceptedData] = await Promise.all([
        collectorService.getProfile(),
        collectorService.getCompletedTasks().catch(() => []),
        collectorService.getAcceptedTasks().catch(() => [])
      ]);

      const mergedProfile = {
        ...profileData,
        totalCompleted: historyData.length,
        queueLength: acceptedData.length
      };
      setProfile(mergedProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;

    const currentAvailability = profile.status?.availability;
    const isOffline = currentAvailability === "OFFLINE";

    // --- Block toggling ON outside working hours ---
    if (isOffline) {
      const now = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayKey = dayNames[now.getDay()] as keyof typeof profile.workingHours;
      const todaySchedule = profile.workingHours?.[todayKey];

      if (!todaySchedule || !todaySchedule.active) {
        Alert.alert(
          "Ngoài lịch làm việc",
          `Hôm nay (${translateDay(todayKey)}) không phải ngày làm việc của bạn. Bạn không thể bật trạng thái hoạt động.`
        );
        return;
      }

      // Parse start/end times
      const [startH, startM] = todaySchedule.start.split(":").map(Number);
      const [endH, endM] = todaySchedule.end.split(":").map(Number);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (nowMinutes < startMinutes || nowMinutes >= endMinutes) {
        Alert.alert(
          "Ngoài giờ làm việc",
          `Giờ làm việc hôm nay (${translateDay(todayKey)}) là ${todaySchedule.start} - ${todaySchedule.end}.\nHiện tại ngoài khung giờ này, bạn không thể bật trạng thái hoạt động.`
        );
        return;
      }
    }

    const nextStatus: CollectorStatus = isOffline ? "ONLINE_AVAILABLE" : "OFFLINE";

    try {
      setUpdatingStatus(true);

      const res = await collectorService.updateStatus(nextStatus);

      if (res.success) {
        // Optimistic update — just change local state
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: { ...prev.status, availability: nextStatus },
          };
        });
        showToast(
          isOffline ? "Đã bật trạng thái hoạt động" : "Đã tắt trạng thái hoạt động",
          isOffline ? "success" : "info"
        );
      } else {
        showToast("Không thể cập nhật trạng thái", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
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

  if (!profile || !profile.user || !profile.status) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={AppColors.error} />
        <Text style={styles.errorText}>Không thể tải thông tin hồ sơ</Text>
        <Button title="Thử lại" onPress={fetchProfile} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const { user, enterprise, status, workingHours, employeeCode, totalCompleted, queueLength, zones } = profile;
  const isOnline = status?.availability === "ONLINE_AVAILABLE" || status?.availability === "ONLINE_BUSY";

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerCode}>#{employeeCode}</Text>
          </View>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={AppColors.white} />
              </View>
            )}
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? AppColors.success : AppColors.gray[400] }]} />
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? AppColors.success : AppColors.gray[400] }]} />
            <Text style={styles.statusText}>{isOnline ? "Đang trực" : "Ngoại tuyến"}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Stats Section */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalCompleted || 0}</Text>
              <Text style={styles.statLabel}>Đã hoàn thành</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: AppColors.warning }]}>{queueLength || 0}</Text>
              <Text style={styles.statLabel}>Đang chờ xử lý</Text>
            </View>
          </View>

          {/* Availability Toggle */}
          <Card variant="elevated" style={styles.actionCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Trạng thái công việc</Text>
                <Text style={styles.toggleDesc}>
                  {isOnline ? "Bạn đang sẵn sàng nhận đơn hàng mới" : "Bật để bắt đầu nhận đơn thu gom"}
                </Text>
              </View>
              <Button
                title={isOnline ? "Tắt" : "Bật"}
                onPress={toggleAvailability}
                loading={updatingStatus}
                size="small"
                style={[styles.toggleBtn, isOnline ? styles.toggleBtnOffline : styles.toggleBtnOnline]}
              />
            </View>
          </Card>

          {/* Personal Info */}
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <Card variant="elevated" style={styles.infoCard}>
            <InfoRow icon="call-outline" label="Số điện thoại" value={user.phone} />
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <InfoRow icon="business-outline" label="Doanh nghiệp" value={enterprise?.name || "N/A"} />
          </Card>

          {/* Zones Section */}
          {zones && zones.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Khu vực phụ trách</Text>
              <Card variant="elevated" style={styles.zonesCard}>
                <View style={styles.zonesList}>
                  {zones.map((zone, idx) => (
                    <View key={zone.id || idx} style={styles.zoneTag}>
                      <Ionicons name="location-outline" size={14} color={AppColors.primary} />
                      <Text style={styles.zoneText}>{zone.name}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </>
          )}

          {/* Working Schedule */}
          <Text style={styles.sectionTitle}>Lịch làm việc cố định</Text>
          <Card variant="elevated" style={styles.scheduleCard}>
            {workingHours && Object.keys(workingHours).map((day) => {
              const schedule = (workingHours as any)[day];
              return (
                <View key={day} style={styles.scheduleRow}>
                  <Text style={styles.dayLabel}>{translateDay(day)}</Text>
                  {schedule?.active ? (
                    <View style={styles.timeContainer}>
                      <Text style={styles.timeValue}>{schedule.start} - {schedule.end}</Text>
                    </View>
                  ) : (
                    <Text style={styles.timeOff}>Nghỉ</Text>
                  )}
                </View>
              );
            })}
          </Card>

          <View style={styles.footer}>
            <Button
              title="Đăng xuất"
              variant="outline"
              onPress={async () => {
                const doLogout = async () => {
                  try {
                    await logout();
                  } catch (e) {
                    console.error("Logout error:", e);
                  }
                  router.replace("/login");
                };

                if (Platform.OS === "web") {
                  await doLogout();
                } else {
                  Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
                    { text: "Hủy", style: "cancel" },
                    { text: "Đăng xuất", style: "destructive", onPress: doLogout },
                  ]);
                }
              }}
              style={styles.logoutBtn}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon as any} size={20} color={AppColors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const translateDay = (day: string) => {
  const days: any = {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 16,
    color: AppColors.gray[600],
    marginTop: 12,
    textAlign: "center",
  },
  header: {
    backgroundColor: AppColors.white,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTop: {
    position: "absolute",
    top: 50,
    right: 24,
  },
  headerCode: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
    backgroundColor: AppColors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: AppColors.primary + "10",
  },
  avatarPlaceholder: {
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.gray[900],
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.gray[600],
  },
  content: {
    padding: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.white,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginTop: 4,
  },
  actionCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderColor: AppColors.primary + "20",
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.gray[900],
  },
  toggleDesc: {
    fontSize: 12,
    color: AppColors.gray[500],
    marginTop: 2,
  },
  toggleBtn: {
    width: 80,
    borderRadius: 12,
  },
  toggleBtnOnline: {
    backgroundColor: AppColors.success,
  },
  toggleBtnOffline: {
    backgroundColor: AppColors.gray[800],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: AppColors.gray[800],
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: AppColors.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.gray[900],
    marginTop: 1,
  },
  zonesCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  zonesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  zoneTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.primary + "08",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  zoneText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.gray[700],
  },
  scheduleCard: {
    padding: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[50],
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.gray[700],
  },
  timeContainer: {
    backgroundColor: AppColors.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.primary,
  },
  timeOff: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.gray[400],
    fontStyle: "italic",
  },
  footer: {
    marginBottom: 40,
  },
  logoutBtn: {
    borderColor: AppColors.error,
    borderWidth: 1,
  },
});
