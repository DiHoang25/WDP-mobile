import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function EnterpriseHomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Xin chào,</Text>
          <Text style={styles.userName}>{user?.name || user?.email}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={40} color={AppColors.primary} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={AppColors.primary} />
          <Text style={styles.infoText}>
            Giao diện Doanh nghiệp đang được phát triển
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.white,
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray[200],
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.textPrimary,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: AppColors.white,
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: AppColors.gray[200],
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});
