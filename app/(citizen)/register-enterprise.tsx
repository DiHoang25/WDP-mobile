import { Button, Header, Loading } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { businessService } from "@/services/business.service";
import { SubscriptionPlan } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterEnterprisePlansScreen() {
  const params = useLocalSearchParams();
  const { showAlert } = useAlert();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await businessService.getSubscriptionPlans();
      if (response.success && response.data) {
        setPlans(response.data);
        if (response.data.length > 0) {
          setSelectedPlanId(response.data[0].id);
        }
      } else {
        setError(response.error || "Không thể tải danh sách gói đăng ký");
      }
    } catch (err: any) {
      console.error("Fetch plans error:", err);
      setError("Đã có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedPlanId) {
      showAlert("Thông báo", "Vui lòng chọn một gói đăng ký");
      return;
    }

    setLoading(true);
    try {
      const serviceAreas: any[] = params.serviceAreas
        ? JSON.parse(params.serviceAreas as string)
        : [];
      const wasteTypes: string[] = params.wasteTypes
        ? JSON.parse(params.wasteTypes as string)
        : [];

      const registrationData: any = {
        name: params.name,
        address: params.address,
        latitude: params.latitude ? parseFloat(params.latitude as string) : 10.762622,
        longitude: params.longitude ? parseFloat(params.longitude as string) : 106.660172,
        capacityKg: parseFloat(params.capacityKg as string),
        serviceAreas: serviceAreas.length > 0 ? serviceAreas : [{
          provinceCode: "",
          districtCode: null,
          wardCode: null,
        }],
        wasteTypes: wasteTypes.length > 0
          ? wasteTypes.map(type => ({ wasteType: type }))
          : [{ wasteType: "ORGANIC" }, { wasteType: "RECYCLABLE" }],
        subscriptionPlanConfigId: selectedPlanId
      };

      const response = await businessService.registerBusiness(registrationData);
      if (response.success && response.data) {
        const { enterprise, payment, qrCode } = response.data;
        const bankInfo = qrCode?.bankInfo;

        router.push({
          pathname: "/payment",
          params: {
            registrationId: enterprise?.id || "mock-id",
            referenceCode: payment?.referenceCode || "PAY-UNKNOWN",
            amount: payment?.amount || "0",
            planName: payment?.subscriptionPlanConfig?.name || "Gói đăng ký",
            qrUrl: qrCode?.qrUrl || "",
            bankName: bankInfo?.bankCode || "",
            accountNumber: bankInfo?.accountNumber || "",
            accountHolder: bankInfo?.accountHolder || "",
            transferContent: bankInfo?.transferContent || payment?.referenceCode || ""
          }
        } as any);
      } else {
        showAlert("Lỗi", response.error || "Đăng ký không thành công");
      }
    } catch (error) {
      showAlert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && plans.length === 0) return <Loading />;

  if (error && plans.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Chọn gói đăng ký" showBack />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={AppColors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Thử lại" onPress={fetchPlans} style={styles.retryButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Chọn gói đăng ký" subtitle="Đầu tư cho sự phát triển bền vững" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Ionicons name="trophy" size={32} color={AppColors.warning} />
          <Text style={styles.heroTitle}>Chọn gói phù hợp nhất</Text>
          <Text style={styles.heroSubtitle}>Nâng tầm doanh nghiệp, mở rộng cơ hội kinh doanh</Text>
        </View>

        {plans.map((plan, index) => {
          const isSelected = selectedPlanId === plan.id;
          const isRecommended = index === 1; // Second plan is recommended

          return (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              onPress={() => setSelectedPlanId(plan.id)}
              style={styles.cardWrapper}
            >
              <View style={[
                styles.planCard,
                isSelected && styles.selectedCard,
                isRecommended && styles.recommendedCard
              ]}>

                {/* Selection Check */}
                <View style={styles.selectionCheck}>
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                {/* Plan Content */}
                <View style={styles.planContent}>
                  {/* Header Section */}
                  <View style={styles.headerSection}>
                    <View style={styles.planTitleRow}>
                      <View style={[styles.planIconBadge, isSelected && styles.planIconBadgeSelected]}>
                        <Ionicons
                          name={index === 0 ? "briefcase" : index === 1 ? "rocket" : "trophy"}
                          size={24}
                          color={isSelected ? AppColors.white : AppColors.primary}
                        />
                      </View>
                      <View style={styles.planTitleContent}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planTagline}>{plan.description}</Text>
                      </View>
                    </View>

                  </View>

                  {/* Price Section */}
                  <View style={styles.priceSection}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceAmount}>
                        {Number(plan.price).toLocaleString("vi-VN")}
                      </Text>
                      <Text style={styles.priceCurrency}>đ</Text>
                    </View>
                    <Text style={styles.pricePeriod}>
                      Cam kết {plan.durationMonths} tháng
                    </Text>
                  </View>

                  {/* Description Highlights */}
                  <View style={styles.highlightsSection}>
                    {index === 0 ? (
                      <>
                        <View style={styles.highlightItem}>
                          <Ionicons name="location-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Nhận báo cáo trong khu vực</Text>
                        </View>
                        <View style={styles.highlightItem}>
                          <Ionicons name="notifications-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Thông báo real-time</Text>
                        </View>
                        <View style={styles.highlightItem}>
                          <Ionicons name="stats-chart-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Theo dõi hiệu suất cơ bản</Text>
                        </View>
                      </>
                    ) : index === 1 ? (
                      <>
                        <View style={styles.highlightItem}>
                          <Ionicons name="expand-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Mở rộng phạm vi hoạt động</Text>
                        </View>
                        <View style={styles.highlightItem}>
                          <Ionicons name="pie-chart-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Thống kê doanh thu chi tiết</Text>
                        </View>
                        <View style={styles.highlightItem}>
                          <Ionicons name="call-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Hỗ trợ kỹ thuật ưu tiên</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.highlightItem}>
                          <Ionicons name="earth-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Phủ sóng toàn quốc</Text>
                        </View>
                        <View style={styles.highlightItem}>
                          <Ionicons name="sync-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Tích hợp hệ thống tự động</Text>
                        </View>
                        <View style={styles.highlightItem}>
                          <Ionicons name="headset-outline" size={16} color={AppColors.primary} />
                          <Text style={styles.highlightText}>Tư vấn & hỗ trợ 24/7</Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Benefits Section */}
                  {plan.features && plan.features.length > 0 && (
                    <View style={styles.benefitsSection}>
                      <Text style={styles.benefitsTitle}>Quyền lợi nổi bật:</Text>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.benefitItem}>
                          <View style={styles.benefitIconWrapper}>
                            <Ionicons name="checkmark-circle" size={18} color={AppColors.success} />
                          </View>
                          <Text style={styles.benefitText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Value Proposition */}
                  <View style={styles.valueSection}>
                    <View style={styles.valueItem}>
                      <Ionicons name="shield-checkmark" size={16} color={AppColors.success} />
                      <Text style={styles.valueText}>Thanh toán an toàn</Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Ionicons name="headset" size={16} color={AppColors.primary} />
                      <Text style={styles.valueText}>Hỗ trợ 24/7</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <Button
            title={selectedPlanId ? "Tiếp tục thanh toán" : "Chọn gói đăng ký"}
            onPress={handleRegister}
            loading={loading}
            disabled={!selectedPlanId}
          />
          {selectedPlanId && (
            <Text style={styles.bottomNote}>
              Bạn đang chọn: <Text style={styles.bottomNoteHighlight}>
                {plans.find(p => p.id === selectedPlanId)?.name}
              </Text>
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  scrollContent: { padding: 20, paddingBottom: 160 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 20 },
  errorText: { fontSize: 16, color: AppColors.textSecondary, textAlign: "center", lineHeight: 24 },
  retryButton: { minWidth: 150 },

  heroBanner: {
    backgroundColor: AppColors.primary + "12",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AppColors.primary + "30",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: "center",
  },

  cardWrapper: { marginBottom: 20 },
  planCard: {
    borderRadius: 24,
    backgroundColor: AppColors.white,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  selectedCard: {
    borderColor: AppColors.primary,
    borderWidth: 3,
    shadowColor: AppColors.primary,
    shadowOpacity: 0.3,
    elevation: 8,
  },
  recommendedCard: {
    borderColor: AppColors.warning + "60",
  },

  recommendedBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  recommendedText: {
    color: AppColors.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  selectionCheck: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 2,
  },
  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: AppColors.gray[300],
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
  },
  radioOuterSelected: {
    borderColor: AppColors.primary,
    borderWidth: 3,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: AppColors.primary,
  },

  planContent: { padding: 24, paddingTop: 32 },

  headerSection: { marginBottom: 20 },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  planIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: AppColors.primary + "30",
  },
  planIconBadgeSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  planTitleContent: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: "900",
    color: AppColors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  planTagline: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },

  highlightsSection: {
    marginBottom: 20,
    gap: 10,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  highlightText: {
    fontSize: 14,
    color: AppColors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },

  priceSection: {
    backgroundColor: AppColors.primary + "08",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AppColors.primary + "20",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  priceAmount: {
    fontSize: 44,
    fontWeight: "900",
    color: AppColors.primary,
    letterSpacing: -2,
  },
  priceCurrency: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primary,
    marginLeft: 6,
  },
  pricePeriod: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 12,
    fontWeight: "500",
  },
  priceHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: AppColors.warning + "15",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  priceHighlightText: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: "600",
  },

  benefitsSection: { marginBottom: 20 },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: 14,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  benefitIconWrapper: {
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: AppColors.textPrimary,
    lineHeight: 22,
  },

  valueSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 16,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  valueText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },

  bottomSpacer: { height: 20 },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomContent: { padding: 20 },
  bottomNote: {
    textAlign: "center",
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 12,
  },
  bottomNoteHighlight: {
    fontWeight: "700",
    color: AppColors.primary,
  },
});
