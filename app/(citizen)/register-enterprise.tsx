import { Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function RegisterEnterpriseScreen() {
  const params = useLocalSearchParams();

  // Parse form data from previous screen
  const formData = params.name
    ? {
        name: params.name as string,
        address: params.address as string,
        latitude: params.latitude as string,
        longitude: params.longitude as string,
        capacityKg: params.capacityKg as string,
        serviceAreas: params.serviceAreas
          ? JSON.parse(params.serviceAreas as string)
          : [],
        wasteTypes: params.wasteTypes
          ? JSON.parse(params.wasteTypes as string)
          : [],
        startTime: params.startTime as string,
        endTime: params.endTime as string,
      }
    : null;

  const subscriptionPlans = [
    {
      id: 1,
      name: "Gói 3 tháng",
      duration: "3 tháng",
      price: 2999000,
      pricePerMonth: 999000,
      features: [
        "✓ Nhận báo cáo rác từ công dân",
        "✓ Quản lý khu vực thu gom",
        "✓ Hỗ trợ kỹ thuật 24/7",
        "✓ Báo cáo thống kê chi tiết",
      ],
      recommended: false,
    },
    {
      id: 2,
      name: "Gói 6 tháng",
      duration: "6 tháng",
      price: 4999000,
      pricePerMonth: 833000,
      features: [
        "✓ Tất cả tính năng gói 3 tháng",
        "✓ Giảm 17% so với trả theo tháng",
        "✓ Ưu tiên nhận báo cáo",
        "✓ Dashboard nâng cao",
      ],
      recommended: true,
      badge: "Phổ biến nhất",
    },
    {
      id: 3,
      name: "Gói 1 năm",
      duration: "12 tháng",
      price: 7999000,
      pricePerMonth: 666000,
      features: [
        "✓ Tất cả tính năng gói 6 tháng",
        "✓ Giảm 33% so với trả theo tháng",
        "✓ Tích hợp API không giới hạn",
        "✓ Tư vấn tối ưu hoạt động",
      ],
      recommended: false,
      badge: "Tiết kiệm nhất",
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const handleContinue = () => {
    if (!selectedPlan) {
      Alert.alert("Thông báo", "Vui lòng chọn gói đăng ký");
      return;
    }

    // TODO: Gọi API đăng ký doanh nghiệp với formData và selectedPlan
    // POST /enterprise/register với body: { ...formData, subscriptionPlanId: selectedPlan }
    // Sau đó chuyển sang màn hình thanh toán hoặc hiển thị thông báo thành công

    Alert.alert(
      "Thành công",
      "Đăng ký doanh nghiệp thành công! Vui lòng đợi phê duyệt.",
      [
        {
          text: "OK",
          onPress: () => router.replace("/(citizen)" as any),
        },
      ],
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN") + "đ";
  };

  return (
    <View style={styles.container}>
      <Header
        title="Đăng ký doanh nghiệp"
        subtitle="Chọn gói đăng ký phù hợp"
        showBack={true}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Summary */}
        {formData && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Thông tin đã nhập</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelContainer}>
                  <Ionicons
                    name="business"
                    size={16}
                    color={AppColors.primary}
                  />
                  <Text style={styles.summaryLabelText}> Doanh nghiệp:</Text>
                </View>
                <Text style={styles.summaryValue}>{formData.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelContainer}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={AppColors.primary}
                  />
                  <Text style={styles.summaryLabelText}> Địa chỉ:</Text>
                </View>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {formData.address}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLabelContainer}>
                  <Ionicons name="cog" size={16} color={AppColors.primary} />
                  <Text style={styles.summaryLabelText}> Công suất:</Text>
                </View>
                <Text style={styles.summaryValue}>
                  {formData.capacityKg} kg/ngày
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons
              name="business"
              size={48}
              color={AppColors.primary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoTitle}>Trở thành đối tác</Text>
            <Text style={styles.infoText}>
              Đăng ký doanh nghiệp để nhận báo cáo rác từ công dân và tham gia
              bảo vệ môi trường
            </Text>
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Chọn gói đăng ký</Text>

          {subscriptionPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.recommended && styles.planCardRecommended,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === plan.id && (
                    <View style={styles.planRadioSelected} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDuration}>{plan.duration}</Text>
                </View>
              </View>

              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>{formatPrice(plan.price)}</Text>
                <Text style={styles.planPricePerMonth}>
                  {formatPrice(plan.pricePerMonth)}/tháng
                </Text>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <Text key={index} style={styles.planFeature}>
                    {feature}
                  </Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Lợi ích khi tham gia</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons
                name="location"
                size={32}
                color={AppColors.primary}
                style={styles.benefitIcon}
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Mở rộng khu vực</Text>
                <Text style={styles.benefitText}>
                  Nhận báo cáo từ nhiều khu vực khác nhau
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons
                name="stats-chart"
                size={32}
                color={AppColors.primary}
                style={styles.benefitIcon}
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Quản lý hiệu quả</Text>
                <Text style={styles.benefitText}>
                  Dashboard chi tiết và báo cáo thống kê
                </Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons
                name="people"
                size={32}
                color={AppColors.primary}
                style={styles.benefitIcon}
              />
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Hỗ trợ tận tình</Text>
                <Text style={styles.benefitText}>
                  Đội ngũ hỗ trợ 24/7 và tư vấn chuyên nghiệp
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedPlan && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedPlan}
        >
          <Text style={styles.continueButtonText}>
            {formData ? "Hoàn tất đăng ký" : "Tiếp tục đăng ký"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollView: {
    flex: 1,
  },
  summarySection: {
    padding: 20,
    paddingBottom: 10,
  },
  summaryCard: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primary,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  summaryLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 120,
  },
  summaryLabelText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    fontWeight: "500",
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  infoSection: {
    padding: 20,
    paddingTop: 10,
  },
  infoCard: {
    backgroundColor: AppColors.primary + "10",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  infoIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  plansSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    position: "relative",
  },
  planCardSelected: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "05",
  },
  planCardRecommended: {
    borderColor: AppColors.warning + "80",
  },
  planBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: AppColors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.white,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  planRadioSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: AppColors.primary,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  planDuration: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  planPricing: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  planPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: AppColors.primary,
    marginBottom: 4,
  },
  planPricePerMonth: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  planFeatures: {
    gap: 8,
  },
  planFeature: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 20,
  },
  benefitsSection: {
    padding: 20,
    paddingTop: 0,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    backgroundColor: AppColors.white,
    borderRadius: 12,
    padding: 16,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  continueButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  continueButtonDisabled: {
    backgroundColor: AppColors.gray[300],
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.white,
  },
});
