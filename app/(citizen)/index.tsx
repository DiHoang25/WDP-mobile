import { EmptyState, Toast, ToastType } from "@/components/common";
import { WasteReportCard } from "@/components/reports";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { businessService } from "@/services/business.service";
import { notificationService } from "@/services/notification.service";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function CitizenHomeScreen() {
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [allReports, setAllReports] = useState<WasteReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [hasPendingPaymentAlertShown, setHasPendingPaymentAlertShown] =
    useState(false);
  const [presenceSubmitting, setPresenceSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    reportId?: string | number;
  }>({
    visible: false,
    message: "",
    type: "info",
    reportId: undefined,
  });

  const recentReports = allReports.slice(0, 3);
  const latestArrivedReport = allReports
    .filter((r) => r.status?.toString().toUpperCase() === "ARRIVED")
    .sort(
      (a, b) =>
        new Date(b.updatedAt || (b.createdAt as any)).getTime() -
        new Date(a.updatedAt || (a.createdAt as any)).getTime(),
    )[0];

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      checkUnreadNotifications();
      fetchReports();
    }, []),
  );

  const checkUnreadNotifications = async () => {
    const count = await notificationService.countUnread();
    setUnreadCount(count);
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await wasteService.getHistory();
      if (response.success && response.data) {
        let reportsList: WasteReport[] = [];
        const rawData = response.data;

        if (Array.isArray(rawData)) {
          reportsList = rawData;
        } else if (rawData.data && Array.isArray(rawData.data)) {
          reportsList = rawData.data;
        } else if (rawData.items && Array.isArray(rawData.items)) {
          reportsList = rawData.items;
        } else if (rawData.reports && Array.isArray(rawData.reports)) {
          reportsList = rawData.reports;
        } else if (typeof rawData === "object" && rawData !== null) {
          const firstArrayKey = Object.keys(rawData).find((key) =>
            Array.isArray(rawData[key]),
          );
          if (firstArrayKey) reportsList = rawData[firstArrayKey];
        }

        setAllReports(reportsList);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleOpenLatestArrivedDetail = () => {
    if (!latestArrivedReport) return;
    router.push({
      pathname: "/report-detail",
      params: { id: latestArrivedReport.id },
    } as any);
  };

  const checkPendingEnterpriseSubscription = async () => {
    if (checkingSubscription) return;

    try {
      setCheckingSubscription(true);
      const response = await businessService.getSubscription();
      console.log("[CitizenHome] Subscription info:", JSON.stringify(response));
      if (!response.success || !response.data) return;

      const data: any = response.data;
      const rawStatus = (
        data.status ||
        data.subscriptionStatus ||
        data.enterpriseStatus ||
        ""
      )
        .toString()
        .toUpperCase();

      // Chỉ quan tâm khi đang chờ thanh toán
      if (rawStatus !== "PENDING") return;
      if (hasPendingPaymentAlertShown) return;

      // Cố gắng trích thông tin payment để mở lại màn thanh toán
      const payment =
        data.pendingPayment || // cấu trúc mới từ BE
        data.payment ||
        data.latestPayment ||
        data.currentPayment ||
        data.transaction ||
        (Array.isArray(data.transactions) ? data.transactions[0] : undefined);

      const referenceCode =
        payment?.referenceCode || payment?.code || data.referenceCode || "";

      const amount = Number(payment?.amount || data.amount || 0);

      const planName =
        payment?.planName ||
        data.plan?.name ||
        data.subscriptionPlan?.name ||
        data.planName ||
        "Gói đăng ký";

      const qrCode = payment?.qrCode || data.qrCode || {};
      const qrUrl = qrCode.qrUrl || "";
      const bankInfo = qrCode.bankInfo || payment?.bankInfo || {};
      const bankName = bankInfo.bankCode || bankInfo.bankName || "";
      const accountNumber = bankInfo.accountNumber || "";
      const accountHolder = bankInfo.accountHolder || "";
      const transferContent =
        bankInfo.transferContent ||
        payment?.referenceCode ||
        referenceCode ||
        "";

      if (!referenceCode) {
        console.warn(
          "[CitizenHome] Pending subscription detected but no referenceCode found",
        );
        return;
      }

      setHasPendingPaymentAlertShown(true);

      Alert.alert(
        "Dịch vụ chưa thanh toán",
        "Bạn có 1 dịch vụ chưa thanh toán, vui lòng thanh toán.",
        [
          {
            text: "Thanh toán ngay",
            onPress: () => {
              router.push({
                pathname: "/payment",
                params: {
                  referenceCode,
                  amount: amount.toString(),
                  planName,
                  qrUrl,
                  bankName,
                  accountNumber,
                  accountHolder,
                  transferContent,
                },
              } as any);
            },
          },
        ],
      );
    } catch (error) {
      console.error(
        "[CitizenHome] checkPendingEnterpriseSubscription error:",
        error,
      );
    } finally {
      setCheckingSubscription(false);
    }
  };

  // Show top toast when there is an ARRIVED report
  useFocusEffect(
    useCallback(() => {
      if (latestArrivedReport) {
        setToast({
          visible: true,
          message: "Shipper đã đến nơi! Chạm để xem chi tiết báo cáo.",
          type: "info",
          reportId: latestArrivedReport.id,
        });
      }
    }, [latestArrivedReport?.id]),
  );

  const stats = [
    {
      label: t("home.stats.points"),
      value: user?.points || 0,
      color: AppColors.warning,
    },
    {
      label: "Báo cáo",
      value: allReports.filter((r) => r.status?.toLowerCase() !== "completed")
        .length,

      color: AppColors.primary,
    },
    {
      label: "Đã thu gom",
      value: allReports.filter((r) => r.status?.toLowerCase() === "completed")
        .length,

      color: AppColors.success,
    },
  ];

  const quickActions = [
    {
      title: "Lịch sử",

      icon: "document-text",
      color: AppColors.secondary,
      route: "/(citizen)/history",
    },
    {
      title: "Xếp hạng",

      icon: "trophy",
      color: AppColors.warning,
      route: "/(citizen)/leaderboard",
    },
    {
      title: "Đổi thưởng",

      icon: "gift",
      color: AppColors.error,
      route: "/(citizen)/rewards",
    },
    {
      title: "Đăng ký DN",

      icon: "business",
      color: AppColors.primary,
      route: "/(citizen)/register-enterprise-form",
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[AppColors.primary, AppColors.primaryDark]}
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + (Platform.OS === 'android' ? 10 : 0), Platform.OS === 'android' ? 45 : 10),
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{t("home.greeting")}</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push("/(citizen)/notifications")}
            >
              <Ionicons
                name="notifications"
                size={24}
                color={AppColors.white}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push("/(citizen)/profile")}
            >
              {user?.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: "rgba(255, 255, 255, 0.95)" },
              ]}
            >
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Main Action - Create Report */}
      <View style={styles.mainActionSection}>
        <TouchableOpacity
          style={styles.mainActionButton}
          onPress={() => router.push("/(citizen)/create-report")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[AppColors.primary, AppColors.primaryDark]}
            style={styles.mainActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.mainActionContent}>
              <View style={styles.mainActionIconContainer}>
                <Ionicons name="create" size={28} color={AppColors.white} />
              </View>
              <View style={styles.mainActionTextContainer}>
                <Text style={styles.mainActionTitle}>
                  {t("home.createReport")}
                </Text>
                <Text style={styles.mainActionSubtitle}>
                  {t("home.createReportSubtitle")}
                </Text>
              </View>
              <View style={styles.mainActionArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={28}
                  color={AppColors.white}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("home.features")}</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => {
                if (
                  action.route === "/(citizen)/history" ||
                  action.route === "/(citizen)/rewards" ||
                  action.route === "/(citizen)/register-enterprise-form"
                ) {
                  router.push({
                    pathname: action.route as any,
                    params: { source: "home" },
                  } as any);
                  return;
                }

                router.push(action.route as any);
              }}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${action.color}20` },
                ]}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.recentReports")}</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(citizen)/history",
                params: { source: "home" },
              } as any)
            }
            style={styles.seeAllButton}
          >
            <Text style={styles.seeAllText}>{t("common.seeAll")}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={AppColors.primary}
            />
          </TouchableOpacity>
        </View>

        {recentReports.length > 0 ? (
          recentReports.map((report) => (
            <WasteReportCard
              key={report.id}
              report={report}
              onPress={() =>
                router.push({
                  pathname: "/report-detail",
                  params: { id: report.id },
                })
              }
            />
          ))
        ) : (
          <EmptyState
            icon="document-text"
            title={t("home.noReports")}
            message={t("home.noReportsMsg")}
            action={{
              label: t("home.createReport"),
              onPress: () => router.push("/(citizen)/create-report"),
            }}
          />
        )}
      </View>

      {/* Top toast notification (e.g., Shipper đã đến nơi) */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={10000}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
        onPress={handleOpenLatestArrivedDetail}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.white,
    marginTop: 5,
  },
  location: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.white,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: AppColors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  badgeText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  mainActionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: AppColors.background,
  },
  mainActionButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainActionGradient: {
    padding: 24,
  },
  mainActionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  mainActionTextContainer: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.white,
    marginBottom: 4,
  },
  mainActionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  mainActionArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: AppColors.primary,
    fontWeight: "600",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    backgroundColor: AppColors.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 18,
    minHeight: 122,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
    lineHeight: 18,
  },
  actionSubtitle: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  tipCard: {
    backgroundColor: AppColors.secondary + "10",
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  // Shipper arrived banner styles
  presenceWrapper: {
    paddingHorizontal: 20,
    marginTop: -10,
  },
  presenceCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primary + "08",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  presenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  presenceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  presenceDesc: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  presenceActions: {
    flexDirection: "row",
    gap: 10,
  },
  confirmBtn: {
    flex: 1.4,
    backgroundColor: AppColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  confirmBtnText: {
    color: AppColors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  absentBtn: {
    flex: 1,
    backgroundColor: AppColors.gray[100],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  absentBtnText: {
    color: AppColors.textSecondary,
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
