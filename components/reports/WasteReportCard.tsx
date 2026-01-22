import Badge from "@/components/common/Badge";
import { AppColors } from "@/constants/theme";
import { WasteReport } from "@/types";
import {
    getStatusColor,
    getStatusText,
    getWasteTypeLabel,
} from "@/utils/helpers";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WasteReportCardProps {
  report: WasteReport;
  onPress?: () => void;
}

export default function WasteReportCard({
  report,
  onPress,
}: WasteReportCardProps) {
  const { wasteType, weight, address, status, points, createdAt, district } =
    report;
  const statusColor = getStatusColor(status);
  const statusText = getStatusText(status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.wasteType}>{getWasteTypeLabel(wasteType)}</Text>
        <Badge
          label={statusText}
          color={
            status === "completed"
              ? "success"
              : status === "pending"
                ? "warning"
                : "info"
          }
          size="small"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.icon}>⚖️</Text>
        <Text style={styles.detail}>{weight} kg</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.detail} numberOfLines={1}>
          {address}, {district}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>
          {new Date(createdAt).toLocaleDateString("vi-VN")}
        </Text>
        {points && (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.points}>+{points} điểm</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  wasteType: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  detail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  date: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  points: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.warning,
  },
});
