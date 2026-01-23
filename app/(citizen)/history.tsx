import { EmptyState, Header } from "@/components/common";
import { WasteReportCard } from "@/components/reports";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { wasteService } from "@/services/waste.service";
import { WasteReport } from "@/types";
import React, { useEffect, useState } from "react";
import {
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
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await wasteService.getHistory();
      if (response.success && response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    if (filter === "completed") return r.status === "completed";
    return r.status !== "completed";
  });

  const filters = [
    { value: "all" as const, label: "Tất cả", count: reports.length },
    {
      value: "pending" as const,
      label: "Đang xử lý",
      count: reports.filter((r) => r.status !== "completed").length,
    },
    {
      value: "completed" as const,
      label: "Hoàn thành",
      count: reports.filter((r) => r.status === "completed").length,
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Lịch sử báo cáo"
        subtitle={`Tổng cộng: ${reports.length} báo cáo`}
        showBack={false}
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
                styles.filterButtonText,
                filter === f.value && styles.filterButtonTextActive,
              ]}
            >
              {f.label} ({f.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.reportsList}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
          </View>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <WasteReportCard key={report.id} report={report} />
          ))
        ) : (
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
        )}
      </ScrollView>
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    alignItems: "center",
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
  reportsList: {
    flex: 1,
    paddingHorizontal: 20,
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
