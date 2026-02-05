import { EmptyState, Header } from "@/components/common";
import { WasteReportCard } from "@/components/reports";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function HistoryScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  // Re-fetch data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory(true);
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchHistory(false);
  }, []);

  const fetchHistory = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await wasteService.getHistory();
      if (response.success && response.data) {
        // Robust extraction logic
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
        } else if (typeof rawData === 'object' && rawData !== null) {
          // Check for any first child that is an array
          const firstArrayKey = Object.keys(rawData).find(key => Array.isArray(rawData[key]));
          if (firstArrayKey) reportsList = rawData[firstArrayKey];
        }

        setReports(reportsList);
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    if (filter === "completed") return r.status?.toLowerCase() === "completed";
    return r.status?.toLowerCase() !== "completed";
  });

  const filters = [
    { value: "all" as const, label: "Tất cả", count: reports.length },
    {
      value: "pending" as const,
      label: "Đang xử lý",
      count: reports.filter((r) => r.status?.toLowerCase() !== "completed").length,
    },
    {
      value: "completed" as const,
      label: "Hoàn thành",
      count: reports.filter((r) => r.status?.toLowerCase() === "completed").length,
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Lịch sử báo cáo"
        subtitle={`Tổng cộng: ${reports.length} báo cáo`}
        showBack={true}
        onBackPress={() => router.push("/(citizen)")}
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
            <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <WasteReportCard
                report={item}
                onPress={() => router.push({
                  pathname: "/report-detail",
                  params: { id: item.id }
                })}
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
              title="Không có báo cáo nào"
              message={
                filter === "all"
                  ? "Bạn chưa tạo báo cáo nào"
                  : filter === "pending"
                    ? "Không có báo cáo đang xử lý"
                    : "Không có báo cáo hoàn thành"
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
