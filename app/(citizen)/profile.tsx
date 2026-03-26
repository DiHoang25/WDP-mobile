import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const reduxPoints = useSelector((state: RootState) => state.user.points);
  const { t, language, setLanguage } = useLanguage();
  const { showAlert } = useAlert();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, []),
  );

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await logout();
      } catch (e) {
        console.error("Logout error:", e);
      }
      router.replace("/login");
    };

    if (Platform.OS === "web") {
      await doLogout();
    } else {
      showAlert(t("profile.logout"), t("profile.logoutConfirm"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("profile.logout"), style: "destructive", onPress: doLogout },
      ]);
    }
  };

  const menuItems = [
    ...(user?.roleId === 1
      ? [
        {
          icon: "business",
          title: t("profile.menu.registerEnterprise"),
          subtitle: t("profile.menu.registerEnterpriseSubtitle"),
          onPress: () =>
            router.push({
              pathname: "/(citizen)/register-enterprise-form",
              params: { source: "profile" },
            } as any),
          highlight: true,
        },
      ]
      : []),
    {
      icon: "document-text",
      title: t("profile.menu.history"),
      subtitle: t("profile.menu.historySubtitle"),
      onPress: () =>
        router.push({
          pathname: "/(citizen)/history",
          params: { source: "profile" },
        } as any),
      highlight: true,
    },
    {
      icon: "gift",
      title: t("profile.menu.rewards"),
      subtitle: t("profile.menu.rewardsSubtitle"),
      onPress: () =>
        router.push({
          pathname: "/(citizen)/rewards",
          params: { source: "profile" },
        } as any),
      highlight: true,
    },
    {
      icon: "chatbox-ellipses",
      title: "Lịch sử khiếu nại",
      subtitle: "Theo dõi tình trạng xử lý khiếu nại",
      onPress: () =>
        router.push({
          pathname: "/(citizen)/complaint-history",
          params: { source: "profile" },
        } as any),
      highlight: true,
    },
    {
      icon: "person",
      title: t("profile.menu.profileInfo"),
      subtitle: t("profile.menu.profileInfoSubtitle"),
      onPress: () => router.push("/(citizen)/profile-detail"),
    },
    {
      icon: "language",
      title: t("profile.menu.language"),
      subtitle: language === "vi" ? "Tiếng Việt 🇻🇳" : "English 🇺🇸",
      onPress: () => setShowLanguageModal(true),
    },
    {
      icon: "help-circle",
      title: t("profile.menu.help"),
      subtitle: t("profile.menu.helpSubtitle"),
      onPress: () => showAlert(t("common.notice"), t("common.featureInDev")),
    },
    {
      icon: "document",
      title: t("profile.menu.terms"),
      subtitle: t("profile.menu.termsSubtitle"),
      onPress: () => showAlert(t("common.notice"), t("common.featureInDev")),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        showBack={false}
      />

      {/* Profile Card */}
      <View style={styles.profileSection}>
        <Card variant="elevated">
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    user?.avatar ||
                    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Ionicons name="person" size={12} color={AppColors.primary} />
                <Text style={styles.roleBadgeText}>{t("profile.citizen")}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Ionicons name="star" size={12} color={AppColors.warning} />
                <Text style={styles.pointsBadgeText}>
                  {reduxPoints} {t("profile.points") || "điểm"}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.highlightedMenuContainer}>
              <View style={styles.highlightedMenuInner}>
                <View style={styles.highlightedIconBox}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={AppColors.primary}
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.highlightedMenuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={AppColors.gray[400]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Button
          title={t("profile.logout")}
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>ECONNET v1.0.0</Text>
        <Text style={styles.appInfoText}>
          © 2026 ECONNET. All rights reserved.
        </Text>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("profile.selectLanguage")}</Text>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === "vi" && styles.languageOptionActive,
              ]}
              onPress={() => {
                setLanguage("vi");
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.languageFlag}>🇻🇳</Text>
              <Text
                style={[
                  styles.languageText,
                  language === "vi" && styles.languageTextActive,
                ]}
              >
                Tiếng Việt
              </Text>
              {language === "vi" && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={AppColors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === "en" && styles.languageOptionActive,
              ]}
              onPress={() => {
                setLanguage("en");
                setShowLanguageModal(false);
              }}
            >
              <Text style={styles.languageFlag}>🇺🇸</Text>
              <Text
                style={[
                  styles.languageText,
                  language === "en" && styles.languageTextActive,
                ]}
              >
                English
              </Text>
              {language === "en" && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={AppColors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t("common.cancel")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: AppColors.primary + "30",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AppColors.primary + "30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: AppColors.primary + "30",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
    color: AppColors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.primary + "15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.primary,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 5,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: AppColors.warning + "15",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: AppColors.warning,
  },
  menuContainer: {
    padding: 20,
    gap: 10,
  },
  highlightedMenuContainer: {
    backgroundColor: "#EAEDED",
    padding: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  highlightedMenuInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  highlightedIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  highlightedMenuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 2,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoutButton: {
    borderColor: AppColors.error,
  },
  appInfo: {
    alignItems: "center",
    paddingBottom: 30,
  },
  appInfoText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 5,
  },
  // Language Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 24,
    width: "85%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: AppColors.gray[100],
  },
  languageOptionActive: {
    backgroundColor: AppColors.primary + "15",
    borderWidth: 1.5,
    borderColor: AppColors.primary,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  languageText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textPrimary,
    flex: 1,
  },
  languageTextActive: {
    color: AppColors.primary,
  },
  modalCloseBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AppColors.gray[200],
    alignItems: "center",
  },
  modalCloseBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textSecondary,
  },
});
