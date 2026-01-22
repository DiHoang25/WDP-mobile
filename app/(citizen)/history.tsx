import { EmptyState, Header } from "@/components/common";
import { WasteReportCard } from "@/components/reports";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_WASTE_REPORTS } from "@/data/mockData";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HistoryScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const userReports = MOCK_WASTE_REPORTS.filter(
    (r) => r.citizenId === user?.id,
  );
  const filteredReports =
    filter === "all"
      ? userReports
      : userReports.filter((r) =>
          filter === "completed"
            ? r.status === "completed"
            : r.status !== "completed",
        );

  const filters = [
    { value: "all" as const, label: "Tất cả", count: userReports.length },
    {
      value: "pending" as const,
      label: "Đang xử lý",
      count: userReports.filter((r) => r.status !== "completed").length,
    },
    {
      value: "completed" as const,
      label: "Hoàn thành",
      count: userReports.filter((r) => r.status === "completed").length,
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Lịch sử báo cáo"
        subtitle={`Tổng cộng: ${userReports.length} báo cáo`}
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
        {filteredReports.map((report) => (
          <WasteReportCard key={report.id} report={report} />
        ))}

        {filteredReports.length === 0 && (
          <EmptyState
            icon="📋"
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
});
