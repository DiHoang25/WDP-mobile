import { Button, Card } from "@/components/common";
import { StatusBadge } from "@/components/collector";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { CollectorProfile } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CollectorProfileScreen() {
  const { user, logout } = useAuth();

  // Mock data - thay bằng API call
  const [profile, setProfile] = useState<CollectorProfile>({
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

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const getZoneText = () => {
    const primary = profile.zones.find((z) => z.isPrimary);
    const secondary = profile.zones.filter((z) => !z.isPrimary);
    return {
      primary: primary?.name || "Chưa có",
      secondary: secondary.map((z) => z.name).join(", ") || "Không có",
    };
  };

  const zoneInfo = getZoneText();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={AppColors.white} />
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.code}>Mã NV: {profile.employeeCode}</Text>
        <Text style={styles.enterprise}>{profile.enterpriseName}</Text>
      </View>

      <View style={styles.content}>
        {/* Trust Score Card */}
        <Card variant="elevated" style={styles.trustCard}>
          <Text style={styles.cardTitle}>⭐ Điểm tin cậy</Text>
          <View style={styles.trustScoreContainer}>
            <View style={styles.circularProgress}>
              <Text style={styles.scoreValue}>{profile.trustScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View style={styles.trustInfo}>
              <View style={styles.trustRow}>
                <Text style={styles.trustLabel}>Mức đánh giá</Text>
                <Text style={[styles.trustValue, { color: getTrustColor(profile.trustScore) }]}>
                  {getTrustRating(profile.trustScore)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Stats Card */}
        <Card variant="elevated" style={styles.statsCard}>
          <Text style={styles.cardTitle}>📊 Thống kê</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalCompleted}</Text>
              <Text style={styles.statLabel}>Tổng đơn hoàn thành</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: AppColors.error }]}>
                {profile.skipCount}
              </Text>
              <Text style={styles.statLabel}>Số lần từ chối</Text>
            </View>
          </View>
          <View style={[styles.statsGrid, { marginTop: 16 }]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.todayTaskCount}</Text>
              <Text style={styles.statLabel}>Nhiệm vụ hôm nay</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <StatusBadge status={profile.status} size="small" />
              <Text style={[styles.statLabel, { marginTop: 8 }]}>Trạng thái hiện tại</Text>
            </View>
          </View>
        </Card>

        {/* Zone Card */}
        <Card variant="elevated" style={styles.zoneCard}>
          <Text style={styles.cardTitle}>📍 Khu vực làm việc</Text>
          <View style={styles.zoneRow}>
            <Text style={styles.zoneLabel}>Zone chính:</Text>
            <Text style={styles.zoneValue}>{zoneInfo.primary}</Text>
          </View>
          <View style={styles.zoneRow}>
            <Text style={styles.zoneLabel}>Zone phụ:</Text>
            <Text style={styles.zoneValue}>{zoneInfo.secondary}</Text>
          </View>
        </Card>

        {/* Contact Card */}
        <Card variant="elevated" style={styles.contactCard}>
          <Text style={styles.cardTitle}>📞 Thông tin liên hệ</Text>
          <View style={styles.contactRow}>
            <Ionicons name="mail" size={20} color={AppColors.gray[600]} />
            <Text style={styles.contactValue}>{profile.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="call" size={20} color={AppColors.gray[600]} />
            <Text style={styles.contactValue}>{profile.phone}</Text>
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Đăng xuất"
          onPress={handleLogout}
          variant="outlined"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
}

function getTrustRating(score: number): string {
  if (score >= 90) return "Xuất sắc";
  if (score >= 75) return "Tốt";
  if (score >= 60) return "Trung bình";
  return "Cần cải thiện";
}

function getTrustColor(score: number): string {
  if (score >= 90) return AppColors.success;
  if (score >= 75) return AppColors.primary;
  if (score >= 60) return AppColors.warning;
  return AppColors.error;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.primary,
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: AppColors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.white,
    marginBottom: 4,
  },
  code: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  enterprise: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
  },
  content: {
    padding: 20,
  },
  trustCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.gray[800],
    marginBottom: 16,
  },
  trustScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  circularProgress: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primary + "20",
    borderWidth: 8,
    borderColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 24,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "800",
    color: AppColors.primary,
  },
  scoreMax: {
    fontSize: 16,
    color: AppColors.gray[600],
  },
  trustInfo: {
    flex: 1,
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  trustLabel: {
    fontSize: 14,
    color: AppColors.gray[600],
  },
  trustValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: AppColors.gray[600],
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: AppColors.gray[200],
    marginHorizontal: 16,
  },
  zoneCard: {
    marginBottom: 16,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  zoneLabel: {
    fontSize: 14,
    color: AppColors.gray[600],
    fontWeight: "500",
  },
  zoneValue: {
    fontSize: 14,
    color: AppColors.gray[800],
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  contactCard: {
    marginBottom: 24,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactValue: {
    fontSize: 15,
    color: AppColors.gray[700],
    marginLeft: 12,
  },
  logoutButton: {
    marginBottom: 32,
  },
});
