import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  citizenService,
  Gift,
  PointTransaction,
  PointTransactionType,
} from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "gifts" | "history";
type HistoryFilter = "all" | "earn" | "spend";

export default function RewardsScreen() {
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const backFallbackRoute =
    source === "profile" ? "/(citizen)/profile" : "/(citizen)";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("gifts");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [redemptions, setRedemptions] = useState<PointTransaction[]>([]);
  const [currentPoints, setCurrentPoints] = useState<number>(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      fetchInitialData();
    }, []),
  );

  useEffect(() => {
    if (activeTab === "history") {
      fetchRedemptions();
    }
  }, [activeTab, historyFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchGifts(), fetchPoints()]);
    } catch (error) {
      console.error("Fetch initial data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await citizenService.getGifts();
      if (response.success && response.data) {
        setGifts(response.data);
      } else {
        Alert.alert(
          "Lỗi",
          response.error || "Không thể tải danh sách quà tặng",
        );
      }
    } catch (error) {
      console.error("Fetch gifts error:", error);
    }
  };

  const fetchPoints = async () => {
    try {
      const response = await citizenService.getMyPoints();
      if (response.success && response.data) {
        setCurrentPoints(response.data.points);
      }
    } catch (error) {
      console.error("Fetch points error:", error);
    }
  };

  const fetchRedemptions = async () => {
    try {
      let type: PointTransactionType | undefined;
      if (historyFilter === "earn") type = "EARN";
      else if (historyFilter === "spend") type = "SPEND";

      const response = await citizenService.getMyRedemptions(type);
      if (response.success && response.data) {
        setRedemptions(response.data);
      } else {
        Alert.alert("Lỗi", response.error || "Không thể tải lịch sử giao dịch");
      }
    } catch (error) {
      console.error("Fetch redemptions error:", error);
    }
  };

  const handleRedeem = async (gift: Gift) => {
    if (currentPoints < gift.requiredPoints) {
      Alert.alert(
        "Không đủ điểm",
        `Bạn cần ${gift.requiredPoints - currentPoints} điểm nữa để đổi quà này.`,
      );
      return;
    }

    Alert.alert(
      "Xác nhận đổi quà",
      `Đổi ${gift.requiredPoints} điểm lấy ${gift.name}?`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: "Đổi ngay",
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await citizenService.redeemGift({
                giftId: gift.id,
              });

              if (response.success) {
                Alert.alert(
                  "Thành công!",
                  response.message ||
                    "Đã đổi quà thành công. Vui lòng kiểm tra lịch sử.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Refresh data
                        fetchGifts();
                        fetchPoints();
                      },
                    },
                  ],
                );
              } else {
                Alert.alert("Lỗi", response.error || "Không thể đổi quà");
              }
            } catch (error) {
              console.error("Redeem gift error:", error);
              Alert.alert("Lỗi", "Không thể đổi quà");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Đổi thưởng"
          subtitle="Đổi điểm lấy quà hấp dẫn"
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Đổi thưởng"
        subtitle="Đổi điểm lấy quà hấp dẫn"
        showBack={true}
        backFallbackRoute={backFallbackRoute}
      />

      {/* Points Card */}
      <View style={styles.pointsSection}>
        <Card variant="elevated">
          <View style={styles.pointsCard}>
            <Text style={styles.pointsLabel}>{t("rewards.yourPoints")}</Text>
            <View style={styles.pointsValueContainer}>
              <Ionicons name="star" size={24} color={AppColors.warning} />
              <Text style={styles.pointsValue}> {currentPoints}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "gifts" && styles.tabActive]}
          onPress={() => setActiveTab("gifts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "gifts" && styles.tabTextActive,
            ]}
          >
            Quà tặng
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.tabTextActive,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* History Filter Buttons - Show only when history tab is active */}
      {activeTab === "history" && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setHistoryFilter("all")}
          >
            <Ionicons
              name="list"
              size={16}
              color={
                historyFilter === "all"
                  ? AppColors.white
                  : AppColors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === "all" && styles.filterButtonTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "earn" && styles.filterButtonActive,
            ]}
            onPress={() => setHistoryFilter("earn")}
          >
            <Ionicons
              name="add-circle"
              size={16}
              color={
                historyFilter === "earn"
                  ? AppColors.white
                  : AppColors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === "earn" && styles.filterButtonTextActive,
              ]}
            >
              Kiếm điểm
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "spend" && styles.filterButtonActive,
            ]}
            onPress={() => setHistoryFilter("spend")}
          >
            <Ionicons
              name="gift"
              size={16}
              color={
                historyFilter === "spend"
                  ? AppColors.white
                  : AppColors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === "spend" && styles.filterButtonTextActive,
              ]}
            >
              Đổi quà
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {activeTab === "gifts" ? (
        <ScrollView
          style={styles.contentList}
          showsVerticalScrollIndicator={false}
        >
          {gifts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="gift-outline"
                size={64}
                color={AppColors.gray[400]}
              />
              <Text style={styles.emptyText}>Chưa có quà tặng nào</Text>
            </View>
          ) : (
            gifts.map((gift) => {
              const canAfford = currentPoints >= gift.requiredPoints;
              const isOutOfStock = gift.stock <= 0;

              return (
                <Card key={gift.id} variant="elevated" style={styles.giftCard}>
                  <View style={styles.giftImageContainer}>
                    {gift.imageUrl ? (
                      <View style={styles.giftImage}>
                        {/* Could add Image component here */}
                        <Ionicons
                          name="gift"
                          size={32}
                          color={AppColors.primary}
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.giftImage,
                          { backgroundColor: AppColors.gray[200] },
                        ]}
                      >
                        <Ionicons
                          name="gift"
                          size={32}
                          color={AppColors.gray[500]}
                        />
                      </View>
                    )}
                    <View style={styles.giftPointsBadge}>
                      <Ionicons name="star" size={12} color={AppColors.white} />
                      <Text style={styles.giftPointsText}>
                        {" "}
                        {gift.requiredPoints}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.giftContent}>
                    <Text style={styles.giftTitle} numberOfLines={2}>
                      {gift.name}
                    </Text>
                    {gift.description && (
                      <Text style={styles.giftDescription} numberOfLines={2}>
                        {gift.description}
                      </Text>
                    )}
                    <View style={styles.giftFooter}>
                      <View>
                        <Text style={styles.giftStock}>
                          {isOutOfStock ? "Hết hàng" : `Còn ${gift.stock} suất`}
                        </Text>
                      </View>
                      <Button
                        title={
                          isOutOfStock
                            ? "Hết hàng"
                            : canAfford
                              ? "Đổi ngay"
                              : "Chưa đủ điểm"
                        }
                        onPress={() => handleRedeem(gift)}
                        disabled={!canAfford || isOutOfStock || submitting}
                        variant={
                          canAfford && !isOutOfStock ? "primary" : "outline"
                        }
                        size="small"
                      />
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.contentList}
          showsVerticalScrollIndicator={false}
        >
          {redemptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={AppColors.gray[400]}
              />
              <Text style={styles.emptyText}>
                {historyFilter === "earn"
                  ? "Chưa có lịch sử kiếm điểm"
                  : historyFilter === "spend"
                    ? "Chưa có lịch sử đổi quà"
                    : "Chưa có giao dịch nào"}
              </Text>
            </View>
          ) : (
            redemptions.map((transaction) => {
              const isEarn = transaction.type === "EARN";
              const iconName = isEarn ? "add-circle" : "gift";
              const iconColor = isEarn ? AppColors.success : AppColors.primary;

              return (
                <Card
                  key={transaction.id}
                  variant="elevated"
                  style={styles.historyCard}
                >
                  <View style={styles.historyHeader}>
                    <View
                      style={[
                        styles.historyIconContainer,
                        { backgroundColor: iconColor + "20" },
                      ]}
                    >
                      <Ionicons name={iconName} size={24} color={iconColor} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle}>
                        {isEarn
                          ? transaction.description || "Kiếm điểm"
                          : transaction.gift?.name || "Đổi quà"}
                      </Text>
                      <Text style={styles.historyDate}>
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </Text>
                    </View>
                    <View style={styles.historyPoints}>
                      <Text
                        style={[
                          styles.historyPointsValue,
                          isEarn
                            ? { color: AppColors.success }
                            : { color: AppColors.error },
                        ]}
                      >
                        {isEarn ? "+" : "-"}
                        {transaction.amount}
                      </Text>
                      <Text style={styles.historyPointsLabel}>điểm</Text>
                    </View>
                  </View>
                  {transaction.description && !isEarn && (
                    <Text style={styles.historyDescription}>
                      {transaction.description}
                    </Text>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      )}
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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  pointsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pointsCard: {
    alignItems: "center",
  },
  pointsLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 5,
  },
  pointsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: AppColors.gray[100],
  },
  tabActive: {
    backgroundColor: AppColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  tabTextActive: {
    color: AppColors.white,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  filterButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
  contentList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: AppColors.textSecondary,
  },
  giftCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    flexDirection: "row",
  },
  giftImageContainer: {
    position: "relative",
    marginRight: 15,
  },
  giftImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  giftPointsBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  giftPointsText: {
    fontSize: 11,
    fontWeight: "bold",
    color: AppColors.white,
  },
  giftContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  giftTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  giftDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  giftFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  giftStock: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  historyCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  historyPoints: {
    alignItems: "flex-end",
  },
  historyPointsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.error,
  },
  historyPointsLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
  historyDescription: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    fontSize: 13,
    color: AppColors.textSecondary,
  },
});
