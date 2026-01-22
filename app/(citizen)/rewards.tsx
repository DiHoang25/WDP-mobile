import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_VOUCHERS } from "@/data/mockData";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function RewardsScreen() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "Tất cả" },
    { value: "E-commerce", label: "Mua sắm" },
    { value: "Cà phê", label: "Cà phê" },
    { value: "Di chuyển", label: "Di chuyển" },
  ];

  const filteredVouchers =
    selectedCategory === "all"
      ? MOCK_VOUCHERS
      : MOCK_VOUCHERS.filter((v) => v.category === selectedCategory);

  const handleRedeem = (voucher: any) => {
    if ((user?.points || 0) < voucher.pointsCost) {
      Alert.alert(
        "Không đủ điểm",
        `Bạn cần ${voucher.pointsCost - (user?.points || 0)} điểm nữa để đổi voucher này.`,
      );
      return;
    }

    Alert.alert(
      "Xác nhận đổi thưởng",
      `Đổi ${voucher.pointsCost} điểm lấy ${voucher.title}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đổi ngay",
          onPress: () => {
            Alert.alert(
              "Thành công!",
              "Voucher đã được gửi đến email của bạn.",
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="🎁 Đổi thưởng"
        subtitle="Đổi điểm lấy voucher hấp dẫn"
        showBack={false}
      />

      {/* Points Card */}
      <View style={styles.pointsSection}>
        <Card variant="elevated">
          <View style={styles.pointsCard}>
            <Text style={styles.pointsLabel}>Điểm của bạn</Text>
            <Text style={styles.pointsValue}>⭐ {user?.points || 0}</Text>
          </View>
        </Card>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryButton,
              selectedCategory === category.value &&
                styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.value &&
                  styles.categoryButtonTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Vouchers List */}
      <ScrollView
        style={styles.vouchersList}
        showsVerticalScrollIndicator={false}
      >
        {filteredVouchers.map((voucher) => {
          const canAfford = (user?.points || 0) >= voucher.pointsCost;

          return (
            <Card
              key={voucher.id}
              variant="elevated"
              style={styles.voucherCard}
            >
              <View style={styles.voucherImageContainer}>
                <View
                  style={[
                    styles.voucherImage,
                    { backgroundColor: AppColors.gray[200] },
                  ]}
                >
                  <Text style={styles.voucherBrand}>{voucher.brandName}</Text>
                </View>
                <View style={styles.voucherPointsBadge}>
                  <Text style={styles.voucherPointsText}>
                    ⭐ {voucher.pointsCost}
                  </Text>
                </View>
              </View>

              <View style={styles.voucherContent}>
                <Text style={styles.voucherTitle} numberOfLines={2}>
                  {voucher.title}
                </Text>
                <Text style={styles.voucherDescription} numberOfLines={1}>
                  {voucher.description}
                </Text>
                <View style={styles.voucherFooter}>
                  <View>
                    <Text style={styles.voucherValue}>
                      {voucher.value.toLocaleString("vi-VN")}đ
                    </Text>
                    <Text style={styles.voucherExpiry}>
                      Hạn:{" "}
                      {new Date(voucher.expiryDate).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                  <Button
                    title={canAfford ? "Đổi ngay" : "Chưa đủ điểm"}
                    onPress={() => handleRedeem(voucher)}
                    disabled={!canAfford}
                    variant={canAfford ? "primary" : "outline"}
                    size="small"
                  />
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
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
  pointsValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  categoriesContainer: {
    maxHeight: 60,
    marginTop: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
  },
  categoryButtonActive: {
    backgroundColor: AppColors.error,
    borderColor: AppColors.error,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  categoryButtonTextActive: {
    color: AppColors.white,
  },
  vouchersList: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  voucherCard: {
    marginBottom: 15,
    overflow: "hidden",
    padding: 0,
  },
  voucherImageContainer: {
    position: "relative",
  },
  voucherImage: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  voucherBrand: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  voucherPointsBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: AppColors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  voucherPointsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.white,
  },
  voucherContent: {
    padding: 15,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  voucherDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 12,
  },
  voucherFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  voucherValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.error,
  },
  voucherExpiry: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
});
