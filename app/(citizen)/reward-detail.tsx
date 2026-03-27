import { Header, Card } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { PointTransaction, WasteType, AccuracyBucket, GiftType } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
} from "react-native";

// Waste type translation
const WASTE_TYPE_VI: Record<WasteType, string> = {
  ORGANIC: "Rác hữu cơ",
  RECYCLABLE: "Rác tái chế",
  HAZARDOUS: "Rác nguy hiểm",
};

// Accuracy bucket translation
const ACCURACY_BUCKET_VI: Record<AccuracyBucket, string> = {
  MATCH: "Chính xác",
  MODERATE: "Trung bình",
  HEAVY: "Không chính xác",
};

// Gift type translation
const GIFT_TYPE_VI: Record<GiftType, string> = {
  FOOD: "Ăn uống",
  SHOPPING: "Mua sắm",
  OTHER: "Khác",
};

export default function RewardDetailScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ transaction?: string }>();
  const [transaction, setTransaction] = useState<PointTransaction | null>(null);

  useEffect(() => {
    if (params.transaction) {
      try {
        const tx = JSON.parse(params.transaction);
        setTransaction(tx);
      } catch (error) {
        console.error("Failed to parse transaction:", error);
        router.back();
      }
    }
  }, [params.transaction]);

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Header title="Chi tiết giao dịch" showBack={true} backFallbackRoute="/(citizen)/rewards" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      </View>
    );
  }

  // This screen is only for collection history detail (EARN from report).
  if (transaction.type !== "EARN") {
    return (
      <View style={styles.container}>
        <Header title="Chi tiết lịch sử thu gom" showBack={true} backFallbackRoute="/(citizen)/rewards" />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyMessage}>Chi tiết này chỉ áp dụng cho lịch sử thu gom.</Text>
        </View>
      </View>
    );
  }

  const isEarn = true;
  const iconName = "add-circle";
  const iconColor = AppColors.success;

  const title = transaction.description || "Cộng điểm từ báo cáo";

  const typeLabel = "Kiếm điểm";

  const createdDate = new Date(transaction.createdAt);
  const formattedDate = createdDate.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.container}>
      <Header title="Chi tiết lịch sử thu gom" showBack={true} backFallbackRoute="/(citizen)/rewards" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transaction Header */}
        <View style={styles.headerSection}>
          <Card variant="elevated">
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: iconColor + "20" },
                ]}
              >
                <Ionicons name={iconName} size={32} color={iconColor} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.typeLabel}>{typeLabel}</Text>
                <Text style={styles.title}>{title}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Points Display */}
        <View style={styles.pointsSection}>
          <Card variant="elevated">
            <View style={styles.pointsContent}>
              <Text style={styles.pointsLabel}>Điểm giao dịch</Text>
              <View style={styles.pointsValueRow}>
                <Text
                  style={[
                    styles.pointsValue,
                    { color: AppColors.success },
                  ]}
                >
                  +
                  {transaction.amount}
                </Text>
                <Text style={styles.pointsUnit}>điểm</Text>
              </View>
              <Text style={styles.balanceLabel}>Số dư sau giao dịch</Text>
              <Text style={styles.balanceValue}>{transaction.balanceAfter}</Text>
            </View>
          </Card>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsSection}>
          <Card variant="elevated">
            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Loại giao dịch</Text>
                <Text style={styles.detailValue}>{typeLabel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ngày giao dịch</Text>
                <Text style={styles.detailValue}>{formattedDate}</Text>
              </View>

              {transaction.reportId && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mã báo cáo</Text>
                    <Text style={styles.detailValue}>#{transaction.reportId}</Text>
                  </View>
                </>
              )}

              {transaction.giftId && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mã quà tặng</Text>
                    <Text style={styles.detailValue}>#{transaction.giftId}</Text>
                  </View>
                </>
              )}
            </View>
          </Card>
        </View>

        {/* Breakdown Details for EARN transactions */}
        {isEarn &&
          transaction.breakdown?.source === "REPORT" &&
          transaction.breakdown.items &&
          transaction.breakdown.items.length > 0 && (
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownSectionTitle}>
                Chi tiết cộng điểm theo loại rác
              </Text>
              <Card variant="elevated">
                {transaction.breakdown.items.map((item, index) => (
                  <View
                    key={`${transaction.id}-${index}`}
                    style={styles.breakdownItem}
                  >
                    <View style={styles.breakdownItemRow}>
                      <View style={styles.wasteTypeInfo}>
                        <Text style={styles.wasteTypeName}>
                          {WASTE_TYPE_VI[item.wasteType as WasteType] || item.wasteType}
                        </Text>
                        <Text style={styles.wasteTypeWeight}>
                          {Number(item.weightKg).toFixed(2)} kg
                        </Text>
                      </View>
                      <View style={styles.pointsCalculation}>
                        <Text style={styles.calculationLabel}>
                          {item.basePoints} × {item.accuracyMultiplier} × {item.wasteMultiplier} = {item.pointsEarned}
                        </Text>
                        <Text style={styles.earnedPoints}>
                          +{item.pointsEarned} điểm
                        </Text>
                      </View>
                    </View>
                    {index <
                      (transaction.breakdown?.items?.length ?? 0) - 1 && (
                      <View style={styles.itemDivider} />
                    )}
                  </View>
                ))}

                {transaction.breakdown.accuracyBucket && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.accuracyInfo}>
                      <Text style={styles.accuracyLabel}>Độ chính xác</Text>
                      <Text style={styles.accuracyValue}>
                        {ACCURACY_BUCKET_VI[transaction.breakdown.accuracyBucket as AccuracyBucket] || transaction.breakdown.accuracyBucket}
                      </Text>
                    </View>
                  </>
                )}
              </Card>
            </View>
          )}

        {/* Description */}
        {transaction.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>Ghi chú</Text>
            <Card variant="elevated">
              <Text style={styles.descriptionText}>
                {transaction.description}
              </Text>
            </Card>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessage: {
    fontSize: 15,
    color: AppColors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  pointsSection: {
    marginBottom: 20,
  },
  pointsContent: {
    alignItems: "center",
    paddingVertical: 4,
  },
  pointsLabel: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  pointsValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: "900",
    marginRight: 6,
  },
  pointsUnit: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  balanceLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginTop: 4,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsContent: {
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    textAlign: "right",
    maxWidth: "60%",
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
  },
  breakdownSection: {
    marginBottom: 20,
  },
  breakdownSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  breakdownItem: {
    paddingVertical: 12,
  },
  breakdownItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  wasteTypeInfo: {
    flex: 1,
  },
  wasteTypeName: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  wasteTypeWeight: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  pointsCalculation: {
    alignItems: "flex-end",
  },
  calculationLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  earnedPoints: {
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.success,
  },
  itemDivider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginTop: 12,
  },
  accuracyInfo: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accuracyLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  accuracyValue: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});
