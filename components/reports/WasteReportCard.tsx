import Badge from "@/components/common/Badge";
import { AppColors } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
  // Debug log để kiểm tra cấu trúc dữ liệu từ API
  console.log(`[DEBUG] Card ID: ${report.id} - Data:`, JSON.stringify(report, null, 2));

  const { wasteItems, weightKg, address, status, createdAt, district, wasteType } =
    report;

  // Super robust case-insensitive field extractor
  const findVal = (obj: any, targetKeys: string[]) => {
    if (!obj || typeof obj !== 'object') return undefined;

    // 1. Direct match with common variants
    for (const key of targetKeys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }

    // 2. Case-insensitive search through all object keys
    const allKeys = Object.keys(obj);
    for (const target of targetKeys) {
      const lowerTarget = target.toLowerCase();
      const foundKey = allKeys.find(k => k.toLowerCase() === lowerTarget);
      if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
        return obj[foundKey];
      }
    }
    return undefined;
  };

  const points = findVal(report, ['points', 'Points', 'reward_points', 'eco_points', 'EcoPoints', 'rewardPoints']);

  const getBackendWasteType = (item: any) => findVal(item, ['wasteType', 'waste_type', 'type', 'label', 'wasteTypeLabel']);
  const getBackendWeight = (item: any) => findVal(item, ['weightKg', 'weight_kg', 'weight', 'estimatedWeight', 'weight_Kg', 'WeightKg']) || 0;

  // Sometimes backend returns JSON as a string, need to parse safely
  const rawItems = findVal(report, ['wasteItems', 'waste_items', 'items', 'WasteItems']);
  let parsedItems: any[] = [];
  try {
    if (Array.isArray(rawItems)) {
      parsedItems = rawItems;
    } else if (rawItems && typeof rawItems === 'object') {
      // Handle case where it's a single object instead of an array
      parsedItems = [rawItems];
    } else if (typeof rawItems === 'string' && rawItems.trim() !== '') {
      const trimmed = rawItems.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        parsedItems = Array.isArray(parsed) ? parsed : [parsed];
      }
    }
  } catch (e) {
    console.error("Error parsing wasteItems in WasteReportCard", e);
  }

  // Final display values with multiple fallbacks
  const displayTypeRaw = (parsedItems && parsedItems.length > 0)
    ? getBackendWasteType(parsedItems[0])
    : findVal(report, ['wasteType', 'waste_type', 'type', 'WasteType']);

  console.log(`[DEBUG] Card ID: ${report.id} - rawItems type: ${typeof rawItems}`);
  console.log(`[DEBUG] Card ID: ${report.id} - parsedItems length: ${parsedItems.length}`);
  console.log(`[DEBUG] Card ID: ${report.id} - displayTypeRaw:`, displayTypeRaw);

  const displayType = getWasteTypeLabel(displayTypeRaw);

  const displayTitle = displayType;

  const totalWeight = (parsedItems && parsedItems.length > 0)
    ? parsedItems.reduce((sum, item) => sum + (Number(getBackendWeight(item)) || 0), 0)
    : (Number(findVal(report, ['weightKg', 'weight_kg', 'weight', 'estimatedWeight', 'WeightKg'])) || 0);

  console.log(`[DEBUG] Card ID: ${report.id} - totalWeight calculated:`, totalWeight);

  const displayWeight = isNaN(totalWeight) ? "0.0" : totalWeight.toFixed(1);

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
        <View style={styles.titleContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text" size={16} color={AppColors.primary} />
          </View>
          <Text style={styles.cardTitle}>{t("reportCard.title")}</Text>
        </View>
        <Badge
          label={statusText}
          color={
            status?.toLowerCase() === "completed" || status?.toLowerCase() === "collected"
              ? "success"
              : ["pending", "accepted", "assigned", "on_the_way", "arrived", "collector_pending"].includes(status?.toLowerCase() || "")
                ? "warning"
                : ["failed", "rejected", "cancelled", "failed_no_response", "failed_citizen_not_home"].includes(status?.toLowerCase() || "")
                  ? "error"
                  : "info"
          }
          size="small"
        />
      </View>

      <View style={styles.mainContent}>
        {/* Row: Waste Type & Weight in a Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.gridItem}>
            <Text style={styles.infoLabel}>{t("reportCard.wasteType")}</Text>
            <View style={styles.valueRow}>
              <Ionicons name="trash-outline" size={16} color={AppColors.primary} />
              <Text style={styles.infoValue} numberOfLines={1}>
                {displayTitle}
              </Text>
            </View>
          </View>

          <View style={styles.gridDivider} />

          <View style={styles.gridItem}>
            <Text style={styles.infoLabel}>{t("reportCard.weight")}</Text>
            <View style={styles.valueRow}>
              <Ionicons name="scale-outline" size={16} color={AppColors.primary} />
              <Text style={styles.infoValue}>{displayWeight} kg</Text>
            </View>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.addressSection}>
          <Text style={styles.infoLabel}>{t("reportCard.address")}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={18} color={AppColors.gray[400]} />
            <Text style={styles.addressValue} numberOfLines={2}>
              {address && (address.includes(',') || address.length > 20)
                ? address
                : `${address}${district ? `, ${district}` : ''}`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={14} color={AppColors.gray[400]} />
          <Text style={styles.dateText}>
            {new Date(createdAt).toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {(points !== undefined && points !== null) && (
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={12} color={AppColors.warning} />
            <Text style={styles.pointsText}>+{points} Điểm </Text>
          </View>
        )}
      </View>
    </TouchableOpacity >
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[100],
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  mainContent: {
    marginVertical: 12,
  },
  infoGrid: {
    flexDirection: "row",
    backgroundColor: AppColors.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[100],
  },
  gridItem: {
    flex: 1,
  },
  gridDivider: {
    width: 1,
    height: "100%",
    backgroundColor: AppColors.gray[200],
    marginHorizontal: 15,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: AppColors.gray[500],
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  addressSection: {
    paddingHorizontal: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  addressValue: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[100],
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.warning + "15",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.warning,
  },
});
