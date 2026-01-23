import { Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_LEADERBOARD } from "@/data/mockData";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const userEntry = MOCK_LEADERBOARD.find((e) => e.userId === user?.id);

  return (
    <View style={styles.container}>
      <Header
        title="Bảng xếp hạng"
        subtitle={user?.district || ""}
        showBack={false}
      />

      {/* User Rank Card */}
      {userEntry && (
        <View style={styles.userRankSection}>
          <Card variant="elevated">
            <View style={styles.userRankContent}>
              <Text style={styles.userRankLabel}>Hạng của bạn</Text>
              <Text style={styles.userRankNumber}>#{userEntry.rank}</Text>
            </View>
            <View style={styles.userRankStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userEntry.points}</Text>
                <Text style={styles.statLabel}>Điểm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userEntry.reportsCount}</Text>
                <Text style={styles.statLabel}>Báo cáo</Text>
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
          <Text style={styles.listHeaderText}>Top người dùng tháng này</Text>
        </View>

        {MOCK_LEADERBOARD.map((entry, index) => {
          const isCurrentUser = entry.userId === user?.id;
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
                        {entry.userName.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{entry.userName}</Text>
                  <Text style={styles.userDistrict}>{entry.district}</Text>
                </View>

                <View style={styles.userStats}>
                  <Text style={styles.userPoints}>{entry.points}</Text>
                  <Text style={styles.userPointsLabel}>điểm</Text>
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
});
