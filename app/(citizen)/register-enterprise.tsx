import { Button, Card, Header, Loading } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { businessService } from "@/services/business.service";
import { SubscriptionPlan } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function RegisterEnterprisePlansScreen() {
  const params = useLocalSearchParams();
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
      Alert.alert("Thông báo", "Vui lòng chọn một gói đăng ký");
      return;
    }

    setLoading(true);
    try {
      // Parse service areas from JSON string
      const serviceAreas: any[] = params.serviceAreas
        ? JSON.parse(params.serviceAreas as string)
        : [];

      // Parse waste types from JSON string
      const wasteTypes: string[] = params.wasteTypes
        ? JSON.parse(params.wasteTypes as string)
        : [];

      const registrationData: any = {
        name: params.name,
        address: params.address,
        latitude: params.latitude ? parseFloat(params.latitude as string) : 10.762622,
        longitude: params.longitude ? parseFloat(params.longitude as string) : 106.660172,
        capacityKg: parseFloat(params.capacityKg as string),
        serviceAreas: serviceAreas.length > 0 ? serviceAreas : [
          {
            provinceCode: "",
            districtCode: null,
            wardCode: null,
          }
        ],
        wasteTypes: wasteTypes.length > 0
          ? wasteTypes.map(type => ({ wasteType: type }))
          : [{ wasteType: "ORGANIC" }, { wasteType: "RECYCLABLE" }],
        workingHour: {
          startTime: params.startTime,
          endTime: params.endTime
        },
        subscriptionPlanConfigId: selectedPlanId
      };

      const response = await businessService.registerBusiness(registrationData);

      if (response.success && response.data) {
        const { enterprise, payment, qrCode } = response.data;
        const bankInfo = qrCode?.bankInfo;

        // Navigate to payment
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
        Alert.alert("Lỗi", response.error || "Đăng ký không thành công");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại.");
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
      <Header title="Chọn gói đăng ký" subtitle="Nâng tầm doanh nghiệp của bạn" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.9}
              onPress={() => setSelectedPlanId(plan.id)}
            >
              <Card
                variant={selectedPlanId === plan.id ? "elevated" : "outlined"}
                style={[
                  styles.planCard,
                  selectedPlanId === plan.id && styles.selectedCard,
                ]}
              >
                {selectedPlanId === plan.id && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>Đang chọn</Text>
                  </View>
                )}

                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.priceCurrency}>đ</Text>
                  <Text style={styles.priceValue}>
                    {Number(plan.price).toLocaleString("vi-VN")}
                  </Text>
                  <Text style={styles.priceDuration}>/{plan.durationMonths} tháng</Text>
                </View>

                {plan.features && plan.features.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={AppColors.primary}
                          />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Đăng ký & Thanh toán"
          onPress={handleRegister}
          loading={loading}
          disabled={!selectedPlanId}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  plansContainer: {
    gap: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 20,
  },
  errorText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    minWidth: 150,
  },
  planCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: AppColors.white,
    position: "relative",
    overflow: "hidden",
  },
  selectedCard: {
    borderColor: AppColors.primary,
    borderWidth: 2,
    backgroundColor: AppColors.primary + "05",
  },
  bestValueBadge: {
    position: "absolute",
    top: 12,
    right: -30,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 40,
    paddingVertical: 5,
    transform: [{ rotate: "45deg" }],
  },
  bestValueText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  planName: {
    fontSize: 22,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: "600",
    color: AppColors.primary,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: AppColors.primary,
  },
  priceDuration: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.gray[200],
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: AppColors.textPrimary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: AppColors.white,
    borderTopWidth: 1,
    borderTopColor: AppColors.gray[200],
  },
});
