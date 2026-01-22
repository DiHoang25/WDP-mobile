import { Badge, Card, EmptyState, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_WASTE_REPORTS } from "@/data/mockData";
import { getWasteTypeLabel } from "@/utils/helpers";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function ShipperHistoryScreen() {
  const { user } = useAuth();

  const completedReports = MOCK_WASTE_REPORTS.filter(
    (r) => r.status === "completed",
  );

  return (
    <View style={styles.container}>
      <Header
        title="Lịch sử thu gom"
        subtitle={`Tổng: ${completedReports.length} đơn đã hoàn thành`}
        showBack={false}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {completedReports.map((report) => (
          <Card key={report.id} variant="elevated" style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Badge label="✅ Hoàn thành" color="success" size="small" />
              <Text style={styles.reportDate}>
                {new Date(report.collectedAt!).toLocaleDateString("vi-VN")}
              </Text>
            </View>

            <Text style={styles.reportType}>
              {getWasteTypeLabel(report.wasteType)}
            </Text>
            <Text style={styles.reportWeight}>
              Khối lượng: {report.weight} kg
            </Text>

            <View style={styles.reportLocation}>
              <Text style={styles.locationIcon}>📍</Text>
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>{report.address}</Text>
                <Text style={styles.locationDistrict}>{report.district}</Text>
              </View>
            </View>

            <View style={styles.reportCustomer}>
              <Text style={styles.customerIcon}>👤</Text>
              <Text style={styles.customerName}>{report.citizenName}</Text>
            </View>
          </Card>
        ))}

        {completedReports.length === 0 && (
          <EmptyState
            icon="📦"
            title="Chưa có đơn hoàn thành"
            message="Các đơn đã hoàn thành sẽ xuất hiện ở đây"
          />
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
  content: {
    flex: 1,
    padding: 20,
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportDate: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  reportType: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  reportWeight: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 10,
  },
  reportLocation: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    padding: 10,
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  locationDistrict: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  reportCustomer: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  customerName: {
    fontSize: 14,
    color: AppColors.textPrimary,
  },
});
