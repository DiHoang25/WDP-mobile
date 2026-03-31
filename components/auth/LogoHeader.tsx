import { AppColors } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface LogoHeaderProps {
  appName: string;
  tagline: string;
}

export default function LogoHeader({ appName, tagline }: LogoHeaderProps) {
  return (
    <LinearGradient
      colors={[AppColors.primary, AppColors.primaryDark]}
      style={styles.header}
    >
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Image
            source={require("@/assets/images/logo.jpg")}
            style={styles.logoImage}
          />
        </View>
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: "cover",
  },
  appName: {
    fontSize: 40,
    fontWeight: "800",
    color: AppColors.white,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
});
