import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  citizenService,
  Gift,
  GiftType,
  PointTransaction,
  PointTransactionType,
} from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type TabType = "gifts" | "history";
type GiftTypeFilter = "all" | GiftType;
type HistoryFilter = "all" | "earn" | "spend" | "compensation";

type VoucherView = {
  id: number;
  giftType: string;
  imageSource: ImageSourcePropType;
  code: string;
  redeemCode: string;
  giftName: string;
  categoryLabel: string;
  statusLabel: string;
  statusColor: string;
  usedPoints: number;
  createdAt: string;
};

const GIFT_TYPE_LABEL: Record<GiftTypeFilter, string> = {
  all: "Tất cả",
  FOOD: "Ăn uống",
  SHOPPING: "Mua sắm",
  OTHER: "Khác",
};

const GIFT_TYPE_PREFIX: Record<string, string> = {
  FOOD: "FD",
  SHOPPING: "SH",
  OTHER: "OT",
};

const GIFT_TYPE_IMAGE: Record<string, ImageSourcePropType> = {
  FOOD: require("../../assets/images/food.jpg"),
  SHOPPING: require("../../assets/images/shopping.jpg"),
  OTHER: require("../../assets/images/other.jpg"),
};

function formatDateCode(input: string) {
  const date = new Date(input);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${month}${day}`;
}

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fakeToken(seedInput: string, length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let seed = hashSeed(seedInput);
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += chars[seed % chars.length];
    seed = Math.floor(seed / chars.length) + i + 11;
  }
  return output;
}

function buildVoucherView(transaction: PointTransaction): VoucherView | null {
  if (transaction.type !== "SPEND") return null;

  const gift =
    transaction.breakdown?.source === "GIFT_REDEEM"
      ? transaction.breakdown.gift
      : transaction.gift;

  if (!gift) return null;

  const prefix = GIFT_TYPE_PREFIX[gift.type] || "OT";
  const imageSource = gift.imageUrl
    ? ({ uri: gift.imageUrl } as ImageSourcePropType)
    : GIFT_TYPE_IMAGE[gift.type] || GIFT_TYPE_IMAGE.OTHER;
  const code = `${prefix}-${fakeToken(`${transaction.id}-MAIN`, 4)}-${fakeToken(`${transaction.id}-TAIL`, 4)}`;
  const redeemCode = `RV-${fakeToken(`${transaction.id}-REDEEM`, 6)}`;

  const created = new Date(transaction.createdAt).getTime();
  const daysSinceCreated = (Date.now() - created) / (1000 * 60 * 60 * 24);
  const isExpired = daysSinceCreated > 30;

  return {
    id: transaction.id,
    giftType: gift.type,
    imageSource,
    code,
    redeemCode,
    giftName: gift.name,
    categoryLabel: GIFT_TYPE_LABEL[gift.type] || "Khác",
    statusLabel: isExpired ? "Hết hạn" : "Sẵn sàng sử dụng",
    statusColor: isExpired ? AppColors.error : AppColors.success,
    usedPoints: transaction.amount,
    createdAt: transaction.createdAt,
  };
}

const Barcode = ({ code }: { code: string }) => {
  return (
    <View style={styles.barcodeContainer}>
      <View style={styles.barcodeLines}>
        {[...Array(45)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.barcodeLine,
              {
                width: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
                marginLeft: i % 7 === 0 ? 2 : 1,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.barcodeBottomText}>{code}</Text>
    </View>
  );
};

export default function RewardsScreen() {
  const { user, refreshProfile, refreshPoints } = useAuth();
  const { t } = useLanguage();
  const { showAlert } = useAlert();
  const params = useLocalSearchParams<{
    source?: string;
    initialTab?: TabType;
    initialFilter?: HistoryFilter;
  }>();
  const source = Array.isArray(params.source)
    ? params.source[0]
    : params.source;
  const initialTabParam = Array.isArray(params.initialTab)
    ? params.initialTab[0]
    : params.initialTab;
  const initialFilterParam = Array.isArray(params.initialFilter)
    ? params.initialFilter[0]
    : params.initialFilter;
  const initialTab: TabType =
    initialTabParam === "history" || initialTabParam === "gifts"
      ? initialTabParam
      : "gifts";
  const initialFilter: HistoryFilter =
    initialFilterParam === "all" ||
      initialFilterParam === "earn" ||
      initialFilterParam === "spend" ||
      initialFilterParam === "compensation"
      ? initialFilterParam
      : "all";
  const backFallbackRoute =
    source === "profile" ? "/(citizen)/profile" : "/(citizen)";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [giftTypeFilter, setGiftTypeFilter] = useState<GiftTypeFilter>("all");
  const [historyFilter, setHistoryFilter] =
    useState<HistoryFilter>(initialFilter);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [redemptions, setRedemptions] = useState<PointTransaction[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherView | null>(
    null,
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      refreshPoints();
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
      await fetchGifts();
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
        showAlert(
          "Lỗi",
          response.error || "Không thể tải danh sách quà tặng",
        );
      }
    } catch (error) {
      console.error("Fetch gifts error:", error);
    }
  };


  const fetchRedemptions = async () => {
    try {
      let type: PointTransactionType | undefined;
      if (historyFilter === "earn") type = "EARN";
      else if (historyFilter === "spend") type = "SPEND";
      else if (historyFilter === "compensation") type = "COMPENSATION";

      const response = await citizenService.getMyRedemptions(type);
      if (response.success && response.data) {
        setRedemptions(response.data);
      } else {
        showAlert("Lỗi", response.error || "Không thể tải lịch sử giao dịch");
      }
    } catch (error) {
      console.error("Fetch redemptions error:", error);
    }
  };

  const handleRedeem = async (gift: Gift) => {
    const points = user?.points || 0;
    if (points < gift.requiredPoints) {
      showAlert(
        "Không đủ điểm",
        `Bạn cần ${gift.requiredPoints - points} điểm nữa để đổi quà này.`,
      );
      return;
    }

    showAlert(
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
                showAlert(
                  "Thành công!",
                  response.message ||
                  "Đã đổi quà thành công. Vui lòng kiểm tra lịch sử.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Refresh data
                        fetchGifts();
                        refreshPoints();
                      },
                    },
                  ],
                );
              } else {
                showAlert("Lỗi", response.error || "Không thể đổi quà");
              }
            } catch (error) {
              console.error("Redeem gift error:", error);
              showAlert("Lỗi", "Không thể đổi quà");
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

  const displayedGifts = gifts.filter((gift) => {
    if (giftTypeFilter === "all") return true;
    return gift.type === giftTypeFilter;
  });

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
              <Text style={styles.pointsValue}> {user?.points || 0}</Text>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
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

          <TouchableOpacity
            style={[
              styles.filterButton,
              historyFilter === "compensation" && styles.filterButtonActive,
            ]}
            onPress={() => setHistoryFilter("compensation")}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={
                historyFilter === "compensation"
                  ? AppColors.white
                  : AppColors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                historyFilter === "compensation" &&
                styles.filterButtonTextActive,
              ]}
            >
              Bồi thường
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Content */}
      {activeTab === "gifts" ? (
        <ScrollView
          style={styles.contentList}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {(Object.keys(GIFT_TYPE_LABEL) as GiftTypeFilter[]).map(
              (typeKey) => (
                <TouchableOpacity
                  key={typeKey}
                  style={[
                    styles.filterButton,
                    giftTypeFilter === typeKey && styles.filterButtonActive,
                  ]}
                  onPress={() => setGiftTypeFilter(typeKey)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      giftTypeFilter === typeKey &&
                      styles.filterButtonTextActive,
                    ]}
                  >
                    {GIFT_TYPE_LABEL[typeKey]}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>

          {displayedGifts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="gift-outline"
                size={64}
                color={AppColors.gray[400]}
              />
              <Text style={styles.emptyText}>Không có quà thuộc nhóm này</Text>
            </View>
          ) : (
            displayedGifts.map((gift) => {
              const canAfford = (user?.points || 0) >= gift.requiredPoints;
              const isOutOfStock = gift.stock <= 0;

              return (
                <Card key={gift.id} variant="elevated" style={styles.giftCard}>
                  <View style={styles.giftImageContainer}>
                    {gift.imageUrl ? (
                      <Image
                        source={{ uri: gift.imageUrl }}
                        style={styles.giftImage}
                        resizeMode="cover"
                      />
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
                    <Text style={styles.giftTypeLabel}>
                      {GIFT_TYPE_LABEL[gift.type] || "Khác"}
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
                            : (user?.points || 0) >= gift.requiredPoints
                              ? "Đổi ngay"
                              : "Chưa đủ điểm"
                        }
                        onPress={() => handleRedeem(gift)}
                        disabled={!((user?.points || 0) >= gift.requiredPoints) || isOutOfStock || submitting}
                        variant={
                          (user?.points || 0) >= gift.requiredPoints && !isOutOfStock ? "primary" : "outline"
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
                    : historyFilter === "compensation"
                      ? "Chưa có lịch sử bồi thường"
                      : "Chưa có giao dịch nào"}
              </Text>
            </View>
          ) : (
            redemptions.map((transaction) => {
              const isEarn = transaction.type === "EARN";
              const isSpend = transaction.type === "SPEND";
              const isCompensation = transaction.type === "COMPENSATION";
              const iconName = isEarn
                ? "add-circle"
                : isSpend
                  ? "gift"
                  : "shield-checkmark";
              const iconColor = isEarn
                ? AppColors.success
                : isSpend
                  ? AppColors.primary
                  : AppColors.warning;
              const voucher = buildVoucherView(transaction);
              const title = isEarn
                ? transaction.description || "Cộng điểm từ báo cáo"
                : isSpend
                  ? transaction.breakdown?.gift?.name ||
                  transaction.gift?.name ||
                  "Đổi quà"
                  : transaction.description || "Bồi thường khiếu nại";

              return (
                <TouchableOpacity
                  key={transaction.id}
                  activeOpacity={isSpend ? 0.9 : 1}
                  disabled={!isSpend || !voucher}
                  onPress={() => {
                    if (voucher) setSelectedVoucher(voucher);
                  }}
                >
                  <Card variant="elevated" style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <View
                        style={[
                          styles.historyIconContainer,
                          {
                            backgroundColor:
                              isSpend && voucher
                                ? "transparent"
                                : iconColor + "20",
                          },
                        ]}
                      >
                        {isSpend && voucher ? (
                          <Image
                            source={voucher.imageSource}
                            style={styles.historyGiftImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons
                            name={iconName}
                            size={24}
                            color={iconColor}
                          />
                        )}
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyTitle}>{title}</Text>
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
                            isEarn || isCompensation
                              ? { color: AppColors.success }
                              : { color: AppColors.error },
                          ]}
                        >
                          {isSpend ? "-" : "+"}
                          {transaction.amount}
                        </Text>
                        <Text style={styles.historyPointsLabel}>điểm</Text>
                      </View>
                    </View>

                    {isEarn &&
                      transaction.breakdown?.source === "REPORT" &&
                      transaction.breakdown.items &&
                      transaction.breakdown.items.length > 0 && (
                        <View style={styles.breakdownContainer}>
                          <Text style={styles.breakdownTitle}>
                            Chi tiết cộng điểm
                          </Text>
                          {transaction.breakdown.items.map((item, index) => (
                            <Text
                              key={`${transaction.id}-${index}`}
                              style={styles.breakdownLine}
                            >
                              {item.wasteType}:{" "}
                              {Number(item.weightKg).toFixed(2)}kg {"->"} +
                              {item.pointsEarned} điểm
                            </Text>
                          ))}
                        </View>
                      )}

                    {transaction.description && !isEarn && (
                      <Text style={styles.historyDescription}>
                        {transaction.description}
                      </Text>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal
        visible={!!selectedVoucher}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedVoucher(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedVoucher(null)}
            >
              <Ionicons
                name="close"
                size={22}
                color={AppColors.textSecondary}
              />
            </TouchableOpacity>

            {selectedVoucher && (
              <>
                <Image
                  source={selectedVoucher.imageSource}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>
                  {selectedVoucher.giftName}
                </Text>
                <Text style={styles.modalCategory}>
                  {selectedVoucher.categoryLabel}
                </Text>

                <View style={styles.modalInfoBlock}>
                  <Text style={styles.modalInfoLabel}>Mã voucher</Text>
                  <Text style={styles.modalInfoValue}>
                    {selectedVoucher.code}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoCol}>
                    <Text style={styles.modalInfoLabel}>Redeem code</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedVoucher.redeemCode}
                    </Text>
                  </View>
                  <View style={styles.modalInfoCol}>
                    <Text style={styles.modalInfoLabel}>Ngày hiệu lực</Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDateCode(selectedVoucher.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalMetaText}>
                    Loại: {selectedVoucher.giftType}
                  </Text>
                  <Text style={styles.modalMetaText}>
                    -{selectedVoucher.usedPoints} điểm
                  </Text>
                </View>

                {/* Fake Barcode for Realism */}
                <Barcode code={selectedVoucher.code} />

                <Text
                  style={[
                    styles.modalStatus,
                    { color: selectedVoucher.statusColor },
                  ]}
                >
                  {selectedVoucher.statusLabel}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  filterScroll: {
    maxHeight: 48,
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
  giftTypeLabel: {
    alignSelf: "flex-start",
    backgroundColor: AppColors.gray[100],
    color: AppColors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
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
    marginBottom: 4,
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
  historyGiftImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  historyDescription: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  breakdownContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    gap: 2,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  breakdownLine: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: 4,
  },
  modalImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  modalCategory: {
    marginTop: 2,
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 10,
  },
  modalInfoBlock: {
    backgroundColor: AppColors.gray[100],
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  modalInfoCol: {
    flex: 1,
    backgroundColor: AppColors.gray[100],
    borderRadius: 10,
    padding: 10,
  },
  modalInfoLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  modalInfoValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  modalMetaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  modalStatus: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
  },
  barcodeContainer: {
    marginTop: 20,
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  barcodeLines: {
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeLine: {
    height: "100%",
    backgroundColor: AppColors.textPrimary,
  },
  barcodeBottomText: {
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 4,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
});


