import { AppColors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: [string, string];
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightComponent,
  style,
  colors = [AppColors.primary, AppColors.primaryDark],
}: HeaderProps) {
  return (
    <LinearGradient colors={colors} style={[styles.header, style]}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress || (() => router.back())}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightComponent && (
          <View style={styles.rightComponent}>{rightComponent}</View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
    color: AppColors.white,
    fontWeight: "600",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.white,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "400",
  },
  rightComponent: {
    marginLeft: 12,
  },
});
