import { AppColors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  backFallbackRoute?: string;
  rightComponent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  colors?: [string, string];
}

export default function Header({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  backFallbackRoute,
  rightComponent,
  style,
  colors = [AppColors.primary, AppColors.primaryDark],
}: HeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    // For shared screens opened from multiple entry points, honor context first.
    if (backFallbackRoute) {
      router.replace(backFallbackRoute as any);
      return;
    }

    if (navigation.canGoBack()) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <LinearGradient
      colors={colors}
      style={[
        styles.header,
        { paddingTop: Math.max(insets.top + (Platform.OS === 'android' ? 8 : 0), Platform.OS === 'android' ? 45 : 10) },
        style
      ]}
    >
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
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
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
  },
  backIcon: {
    fontSize: 20,
    color: AppColors.white,
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.white,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },
  rightComponent: {
    marginLeft: 12,
  },
});
