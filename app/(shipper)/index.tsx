import { Badge, Button, Card, EmptyState } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_WASTE_REPORTS } from "@/data/mockData";
import { getWasteTypeLabel } from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ShipperHomeScreen() {
  const { user } = useAuth();

  const assignedReports = MOCK_WASTE_REPORTS.filter(
    (r) => r.status === "assigned" || r.status === "pending",
  );

  const stats = [
    {
      label: "Đơn hôm nay",
      value: "3",
      icon: "list",
      color: AppColors.shipper,
    },
    { label: "Đang làm", value: "1", icon: "car", color: AppColors.secondary },
    {
      label: "Hoàn thành",
      value: "45",
      icon: "checkmark-circle",
      color: AppColors.success,
    },
  ];

  const handleAcceptTask = (reportId: string, isAssigned: boolean) => {
    Alert.alert(
      isAssigned ? "Bắt đầu thu gom" : "Nhận đơn",
      isAssigned
        ? "Bạn xác nhận bắt đầu thu gom?"
        : "Bạn xác nhận nhận đơn này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: isAssigned ? "Bắt đầu" : "Nhận đơn",
          onPress: () => {
            Alert.alert(
              "Thành công",
              isAssigned
                ? "Đã bắt đầu thu gom. Vui lòng đến địa chỉ."
                : "Đã nhận đơn. Vui lòng đến địa chỉ thu gom.",
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[AppColors.shipper, "#D97706"]}
        style={styles.header}
      >
        <Text style={styles.greeting}>Chào buổi sáng!</Text>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.vehicle}>
          {user?.vehicleType} • {user?.vehicleNumber}
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Available Tasks */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn hàng mới</Text>

          {assignedReports.map((report) => {
            const isAssigned = report.status === "assigned";

            return (
              <Card key={report.id} variant="elevated" style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Badge
                    label={isAssigned ? "Đã phân công" : "Mới"}
                    color={isAssigned ? "secondary" : "warning"}
                    size="small"
                  />
                  <Text style={styles.taskDate}>
                    {new Date(report.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                </View>

                <View style={styles.taskContent}>
                  <Text style={styles.taskType}>
                    {getWasteTypeLabel(report.wasteType)}
                  </Text>
                  <Text style={styles.taskWeight}>
                    Khối lượng: {report.weight} kg
                  </Text>
                </View>

                <View style={styles.taskLocation}>
                  <Ionicons name="location" size={20} color={AppColors.error} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationAddress}>{report.address}</Text>
                    <Text style={styles.locationDistrict}>
                      {report.district}
                    </Text>
                  </View>
                </View>

                <View style={styles.taskCustomer}>
                  <Ionicons
                    name="person"
                    size={18}
                    color={AppColors.textSecondary}
                  />
                  <Text style={styles.customerName}>{report.citizenName}</Text>
                </View>

                {report.description && (
                  <View style={styles.taskNote}>
                    <Text style={styles.noteLabel}>Ghi chú:</Text>
                    <Text style={styles.noteText}>{report.description}</Text>
                  </View>
                )}

                <View style={styles.taskActions}>
                  <Button
                    title={isAssigned ? "Bắt đầu thu gom" : "Nhận đơn"}
                    onPress={() => handleAcceptTask(report.id, isAssigned)}
                  />
                </View>
              </Card>
            );
          })}

          {assignedReports.length === 0 && (
            <EmptyState
              icon=""
              title="Chưa có đơn hàng mới"
              message="Các đơn hàng mới sẽ xuất hiện ở đây"
            />
          )}
        </View>

        {/* Tips */}
        <Card variant="outlined" style={styles.tipCard}>
          <View style={styles.tipContent}>
            <Ionicons name="bulb" size={24} color={AppColors.warning} />
            <View style={styles.tipTextContainer}>
              <Text style={styles.tipTitle}>Lưu ý khi thu gom</Text>
              <Text style={styles.tipText}>
                • Kiểm tra rác đã được phân loại đúng{"\n"}• Đeo găng tay bảo hộ
                khi xử lý{"\n"}• Xác nhận với khách hàng trước khi rời đi
              </Text>
            </View>
          </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  vehicle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 5,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 15,
  },
  taskCard: {
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.shipper,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  taskDate: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  taskContent: {
    marginBottom: 12,
  },
  taskType: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  taskWeight: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  taskLocation: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  locationDistrict: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  taskCustomer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  customerName: {
    fontSize: 14,
    color: AppColors.textPrimary,
  },
  taskNote: {
    backgroundColor: AppColors.secondary + "10",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
    marginBottom: 3,
  },
  noteText: {
    fontSize: 13,
    color: AppColors.textPrimary,
  },
  taskActions: {
    marginTop: 5,
  },
  tipCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: AppColors.secondary + "10",
  },
  tipContent: {
    flexDirection: "row",
    gap: 12,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});
