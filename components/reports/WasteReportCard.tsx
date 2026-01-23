import Badge from "@/components/common/Badge";
import { AppColors } from "@/constants/theme";
import { WasteReport } from "@/types";
import {
  getStatusColor,
  getStatusText,
  getWasteTypeLabel,
} from "@/utils/helpers";
import { Ionicons } from "@expo/vector-icons";
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
  const { wasteItems, weight, address, status, points, createdAt, district, wasteType } =
    report;

  // Calculate display values based on backend wasteItems or fallback to legacy fields
  const displayType = wasteItems && wasteItems.length > 0
    ? getWasteTypeLabel(wasteItems[0].wasteType.toLowerCase())
    : getWasteTypeLabel(wasteType);

  const displayTitle = wasteItems && wasteItems.length > 1
    ? `${displayType} (+${wasteItems.length - 1})`
    : displayType;

  const displayWeight = wasteItems && wasteItems.length > 0
    ? wasteItems.reduce((sum, item) => sum + item.weight, 0).toFixed(1)
    : weight;

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
        <Text style={styles.wasteType}>{displayTitle}</Text>
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
        <Ionicons
          name="scale"
          size={16}
          color={AppColors.gray[500]}
          style={styles.icon}
        />
        <Text style={styles.detail}>{displayWeight} kg</Text>
      </View>

      <View style={styles.row}>
        <Ionicons
          name="location"
          size={16}
          color={AppColors.gray[500]}
          style={styles.icon}
        />
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
            <Ionicons
              name="star"
              size={14}
              color={AppColors.warning}
              style={styles.pointsIcon}
            />
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
    marginRight: 4,
  },
  points: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.warning,
  },
});
