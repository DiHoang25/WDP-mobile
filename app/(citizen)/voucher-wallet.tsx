import { Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { citizenService, PointTransaction } from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const GIFT_TYPE_LABEL: Record<string, string> = {
  FOOD: "Voucher ăn uống",
  SHOPPING: "Voucher mua sắm",
  OTHER: "Quà tặng khác",
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
    categoryLabel: GIFT_TYPE_LABEL[gift.type] || "Quà tặng khác",
    statusLabel: isExpired ? "Hết hạn" : "Sẵn sàng sử dụng",
    statusColor: isExpired ? AppColors.error : AppColors.success,
    usedPoints: transaction.amount,
    createdAt: transaction.createdAt,
  };
}

export default function VoucherWalletScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = Array.isArray(params.source)
    ? params.source[0]
    : params.source;
  const backFallbackRoute =
    source === "profile" ? "/(citizen)/profile" : "/(citizen)";

  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<VoucherView[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherView | null>(
    null,
  );

  const fetchVoucherWallet = async () => {
    try {
      setLoading(true);
      const response = await citizenService.getMyRedemptions("SPEND");
      if (response.success && response.data) {
        const voucherList = response.data
          .map(buildVoucherView)
          .filter((item): item is VoucherView => item !== null);
        setVouchers(voucherList);
      } else {
        setVouchers([]);
      }
    } catch (error) {
      console.error("Fetch voucher wallet error:", error);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchVoucherWallet();
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Ví voucher"
          subtitle="Quản lý voucher đã đổi"
          showBack={true}
          backFallbackRoute={backFallbackRoute}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>
            {t("common.loading") || "Đang tải..."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Ví voucher"
        subtitle="Quản lý voucher đã đổi"
        showBack={true}
        backFallbackRoute={backFallbackRoute}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="wallet-outline"
              size={64}
              color={AppColors.gray[400]}
            />
            <Text style={styles.emptyTitle}>Chưa có voucher nào</Text>
            <Text style={styles.emptyText}>
              Hãy đổi điểm trong mục Đổi thưởng để nhận voucher.
            </Text>
          </View>
        ) : (
          vouchers.map((voucher) => (
            <TouchableOpacity
              key={voucher.id}
              activeOpacity={0.9}
              onPress={() => setSelectedVoucher(voucher)}
            >
              <Card variant="elevated" style={styles.voucherCard}>
                <View style={styles.voucherHeader}>
                  <View style={styles.voucherIconContainer}>
                    <Ionicons
                      name="pricetag"
                      size={22}
                      color={AppColors.primary}
                    />
                  </View>
                  <View style={styles.voucherInfo}>
                    <Text style={styles.voucherName}>{voucher.giftName}</Text>
                    <Text style={styles.voucherCategory}>
                      {voucher.categoryLabel}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>Mã voucher</Text>
                <Text style={styles.voucherCode}>{voucher.code}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>
                    Đã đổi:{" "}
                    {new Date(voucher.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                  <Text style={styles.metaText}>
                    -{voucher.usedPoints} điểm
                  </Text>
                </View>

                <Text
                  style={[styles.statusText, { color: voucher.statusColor }]}
                >
                  {voucher.statusLabel}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
  content: {
    flex: 1,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  voucherCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  voucherIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${AppColors.primary}20`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  voucherInfo: {
    flex: 1,
  },
  voucherName: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  voucherCategory: {
    marginTop: 2,
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginTop: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  voucherCode: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "800",
    color: AppColors.primary,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  statusText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
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
