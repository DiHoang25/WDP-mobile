import { EmptyState, Header } from "@/components/common";
import { WasteReportCard } from "@/components/reports";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { citizenService } from "@/services/citizen.service";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import { getCancelledReportIds, getKnownReportIds, removeCancelledReportId, removeKnownReportIds } from "@/utils/cancelledReports";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HistoryScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ source?: string }>();
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const backFallbackRoute =
    source === "profile" ? "/(citizen)/profile" : "/(citizen)";
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "processing" | "completed" | "cancelled">("all");

  // Define status groups
  const processingStatuses = ["PENDING", "ACCEPTED", "ASSIGNED", "ON_THE_WAY", "ARRIVED", "COLLECTING", "COLLECTED"];
  const completedStatuses = ["COMPLETED"];
  const cancelledStatuses = ["CANCELLED", "REJECTED", "FAILED", "FAILED_NO_RESPONSE", "FAILED_CITIZEN_NOT_HOME"];

  // Re-fetch data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory(true);
    }, []),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHistory(false);
  }, []);

  const fetchHistory = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [reportsRes, pointsRes] = await Promise.all([
        wasteService.getHistory(),
        citizenService.getMyRedemptions("EARN")
      ]);

      // Helper: extract list from API response
      const extractList = (res: any): WasteReport[] => {
        if (!res?.success || !res?.data) return [];
        const raw = res.data;
        if (Array.isArray(raw)) return raw;
        if (raw.data && Array.isArray(raw.data)) return raw.data;
        if (raw.items && Array.isArray(raw.items)) return raw.items;
        return [];
      };

      const mainList = extractList(reportsRes);
      const existingIds = new Set(mainList.map((r: any) => r.id));

      // Đọc các ID đã hủy + ID mới tạo từ AsyncStorage, fetch detail cho những cái thiếu
      const [cancelledIds, knownIds] = await Promise.all([
        getCancelledReportIds(),
        getKnownReportIds(),
      ]);
      // Gộp 2 danh sách, loại trùng
      const allLocalIds = Array.from(new Set([...cancelledIds, ...knownIds]));
      const missingIds = allLocalIds.filter((id) => !existingIds.has(id));

      let localReports: WasteReport[] = [];
      if (missingIds.length > 0) {
        const detailResults = await Promise.allSettled(
          missingIds.map((id: number) => wasteService.getReportById(id))
        );
        detailResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value?.success && result.value?.data) {
            localReports.push(result.value.data as WasteReport);
          }
        });
      }

      // Cleanup: xóa IDs đã được API list trả về rồi
      const foundIds = allLocalIds.filter((id) => existingIds.has(id));
      foundIds.forEach((id: number) => removeCancelledReportId(id));
      removeKnownReportIds(foundIds);

      // Merge: main list + local cache
      const merged: WasteReport[] = [...mainList, ...localReports];

      // Map points from redemptions (reportId -> amount)
      const pointsMap: Record<string | number, number> = {};
      if (pointsRes.success && Array.isArray(pointsRes.data)) {
        pointsRes.data.forEach((tx: any) => {
          if (tx.reportId) pointsMap[tx.reportId] = tx.amount;
        });
      }

      // Inject points into reports (ưu tiên earnedPoints từ API)
      const enrichedReports = merged.map(report => ({
        ...report,
        points: (report as any).earnedPoints ?? pointsMap[report.id] ?? (report as any).points ?? (report as any).rewardPoints
      }));

      setReports(enrichedReports);
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const filteredReports = reports.filter((r) => {
    const s = r.status?.toUpperCase();
    if (filter === "all") return true;
    if (filter === "completed") return completedStatuses.includes(s);
    if (filter === "cancelled") return cancelledStatuses.includes(s);
    if (filter === "processing") return processingStatuses.includes(s);
    return true;
  });

  const filters = [
    { value: "all" as const, label: t("common.all"), count: reports.length },
    {
      value: "processing" as const,
      label: t("history.pending"),
      count: reports.filter((r) => processingStatuses.includes(r.status?.toUpperCase())).length,
    },
    {
      value: "completed" as const,
      label: t("history.completed"),
      count: reports.filter((r) => completedStatuses.includes(r.status?.toUpperCase())).length,
    },
    {
      value: "cancelled" as const,
      label: t("history.cancelled"),
      count: reports.filter((r) => cancelledStatuses.includes(r.status?.toUpperCase())).length,
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title={t("history.title")}
        subtitle={t("history.totalReports", { count: reports.length })}
        showBack={true}
        backFallbackRoute={backFallbackRoute}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterButton,
              filter === f.value && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(f.value)}
          >
            <Text
              style={[
                styles.filterLabel,
                filter === f.value && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
            <Text
              style={[
                styles.filterCount,
                filter === f.value && styles.filterTextActive,
              ]}
            >
              ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      <View style={{ flex: 1 }}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>{t("history.loading")}</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <WasteReportCard
                report={item}
                onPress={() =>
                  router.push({
                    pathname: "/report-detail",
                    params: { id: item.id },
                  })
                }
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[AppColors.primary]}
              />
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[AppColors.primary]}
              />
            }
          >
            <EmptyState
              icon="clipboard"
              title={t("history.noReports")}
              message={
                filter === "all"
                  ? t("history.noReportsAll")
                  : filter === "processing"
                    ? t("history.noReportsPending")
                    : filter === "completed"
                      ? t("history.noReportsCompleted")
                      : t("history.noReportsCancelled")
              }
            />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  filtersContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  filterButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  filterCount: {
    fontSize: 11,
    fontWeight: "500",
    color: AppColors.gray[500],
    textAlign: "center",
  },
  filterTextActive: {
    color: AppColors.white,
  },
  reportsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -50,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: AppColors.textSecondary,
    fontSize: 14,
  },
});
