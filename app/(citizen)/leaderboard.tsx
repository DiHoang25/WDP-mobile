import { Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  citizenService,
  LeaderboardCategory,
  LeaderboardResponse,
  LeaderboardTimeframe,
} from "@/services/citizen.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LeaderboardScreen() {
  const { user, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>(
    LeaderboardCategory.POINTS,
  );
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<LeaderboardTimeframe>(LeaderboardTimeframe.MONTHLY);
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      fetchLeaderboard();
    }, [selectedCategory, selectedTimeframe]),
  );

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await citizenService.getLeaderboard(
        selectedCategory,
        selectedTimeframe,
      );

      if (response.success && response.data) {
        setLeaderboardData(response.data);
      } else {
        Alert.alert("Lỗi", response.error || "Không thể tải bảng xếp hạng");
      }
    } catch (error) {
      console.error("Fetch leaderboard error:", error);
      Alert.alert("Lỗi", "Không thể tải bảng xếp hạng");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: LeaderboardCategory) => {
    switch (category) {
      case LeaderboardCategory.POINTS:
        return "Điểm";
      case LeaderboardCategory.ECO_WARRIORS:
        return "Số đơn";
      case LeaderboardCategory.WASTE_IMPACT:
        return "Khối lượng";
    }
  };

  const getTimeframeLabel = (timeframe: LeaderboardTimeframe) => {
    switch (timeframe) {
      case LeaderboardTimeframe.WEEKLY:
        return "Tuần";
      case LeaderboardTimeframe.MONTHLY:
        return "Tháng";
      case LeaderboardTimeframe.ALL_TIME:
        return "Tất cả";
    }
  };

  const getValueUnit = () => {
    switch (selectedCategory) {
      case LeaderboardCategory.POINTS:
        return "điểm";
      case LeaderboardCategory.ECO_WARRIORS:
        return "đơn";
      case LeaderboardCategory.WASTE_IMPACT:
        return "kg";
    }
  };

  const userEntry = leaderboardData?.myRank;

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title="Bảng xếp hạng"
          subtitle="Thành tích của bạn"
          showBack={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Bảng xếp hạng"
        subtitle="Thành tích của bạn"
        showBack={true}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {Object.values(LeaderboardCategory).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === category &&
                    styles.filterButtonTextActive,
                ]}
              >
                {getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Timeframe Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {Object.values(LeaderboardTimeframe).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.filterButtonSmall,
                selectedTimeframe === timeframe && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text
                style={[
                  styles.filterButtonSmallText,
                  selectedTimeframe === timeframe &&
                    styles.filterButtonTextActive,
                ]}
              >
                {getTimeframeLabel(timeframe)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* User Rank Card */}
      {userEntry && (
        <View style={styles.userRankSection}>
          <Card variant="elevated">
            <View style={styles.userRankContent}>
              <Text style={styles.userRankLabel}>
                {t("leaderboard.yourRank")}
              </Text>
              <Text style={styles.userRankNumber}>#{userEntry.rank}</Text>
            </View>
            <View style={styles.userRankStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userEntry.value}</Text>
                <Text style={styles.statLabel}>{getValueUnit()}</Text>
              </View>
            </View>
          </Card>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.leaderboardList}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            Top người dùng {getTimeframeLabel(selectedTimeframe).toLowerCase()}
          </Text>
        </View>

        {leaderboardData?.topRankings.map((entry, index) => {
          const isCurrentUser = entry.userId === Number(user?.id);
          const isTopThree = index < 3;

          const cardStyle = [
            styles.leaderboardCard,
            isCurrentUser && styles.leaderboardCardHighlight,
            isTopThree && styles.topThreeCard,
          ].filter(Boolean);

          return (
            <Card
              key={entry.userId}
              variant={isCurrentUser ? "outlined" : "elevated"}
              style={cardStyle as any}
            >
              <View style={styles.cardContent}>
                <View style={styles.rankBadge}>
                  {index < 3 ? (
                    <Ionicons
                      name="medal"
                      size={32}
                      color={getMedalColor(index)}
                    />
                  ) : (
                    <Text style={styles.rankNumber}>#{entry.rank}</Text>
                  )}
                </View>

                <View style={styles.avatarContainer}>
                  {entry.avatar ? (
                    <Image
                      source={{ uri: entry.avatar }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {entry.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{entry.fullName}</Text>
                  <Text style={styles.userDistrict}>
                    Người dùng #{entry.userId}
                  </Text>
                </View>

                <View style={styles.userStats}>
                  <Text style={styles.userPoints}>{entry.value}</Text>
                  <Text style={styles.userPointsLabel}>{getValueUnit()}</Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

function getMedalColor(index: number) {
  const colors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, Silver, Bronze
  return colors[index];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  userRankSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  userRankContent: {
    alignItems: "center",
    marginBottom: 15,
  },
  userRankLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 5,
  },
  userRankNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  userRankStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: AppColors.gray[300],
  },
  leaderboardList: {
    flex: 1,
    paddingTop: 20,
  },
  listHeader: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  leaderboardCard: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  leaderboardCardHighlight: {
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  topThreeCard: {
    backgroundColor: "#FFFBEB",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankBadge: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankMedal: {
    fontSize: 32,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textSecondary,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: AppColors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  userDistrict: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  userStats: {
    alignItems: "flex-end",
  },
  userPoints: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  userPointsLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
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
  filtersContainer: {
    paddingVertical: 10,
    backgroundColor: AppColors.white,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  filterRow: {
    paddingHorizontal: 20,
    marginVertical: 5,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: AppColors.gray[100],
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: AppColors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
  filterButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.gray[100],
    marginRight: 8,
  },
  filterButtonSmallText: {
    fontSize: 13,
    fontWeight: "500",
    color: AppColors.textSecondary,
  },
});
