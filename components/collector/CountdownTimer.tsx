import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface CountdownTimerProps {
  deadline: string; // ISO date string
  onExpire?: () => void;
  size?: "small" | "large";
  type?: "accept" | "waiting";
}

export function CountdownTimer({
  deadline,
  onExpire,
  size = "large",
  type = "accept",
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = Math.max(0, Math.floor((deadlineTime - now) / 1000));
      setRemainingSeconds(diff);

      if (diff === 0 && onExpire) {
        onExpire();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const formatTime = () => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isUrgent = remainingSeconds < 60;
  const isExpired = remainingSeconds === 0;

  const getMessage = () => {
    if (isExpired) {
      return type === "accept" ? "Hết thời gian chấp nhận" : "Hết thời gian chờ";
    }
    return type === "accept"
      ? "Thời gian còn lại để chấp nhận"
      : "Thời gian chờ Công dân";
  };

  return (
    <View
      style={[
        styles.container,
        size === "large" && styles.large,
        isUrgent && styles.urgent,
        isExpired && styles.expired,
      ]}
    >
      <Ionicons
        name={isExpired ? "alert-circle" : "time"}
        size={size === "large" ? 32 : 20}
        color={isExpired ? AppColors.error : isUrgent ? AppColors.warning : AppColors.primary}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.label, size === "large" && styles.labelLarge]}>
          {getMessage()}
        </Text>
        <Text
          style={[
            styles.time,
            size === "large" && styles.timeLarge,
            isUrgent && styles.timeUrgent,
            isExpired && styles.timeExpired,
          ]}
        >
          {formatTime()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.info + "20",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: AppColors.info,
  },
  large: {
    padding: 16,
    borderRadius: 16,
  },
  urgent: {
    backgroundColor: AppColors.warning + "20",
    borderColor: AppColors.warning,
  },
  expired: {
    backgroundColor: AppColors.error + "20",
    borderColor: AppColors.error,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: AppColors.gray[700],
    marginBottom: 4,
  },
  labelLarge: {
    fontSize: 16,
    fontWeight: "600",
  },
  time: {
    fontSize: 24,
    fontWeight: "800",
    color: AppColors.primary,
  },
  timeLarge: {
    fontSize: 36,
  },
  timeUrgent: {
    color: AppColors.warning,
  },
  timeExpired: {
    color: AppColors.error,
  },
});
