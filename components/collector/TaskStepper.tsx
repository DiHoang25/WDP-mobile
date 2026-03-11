import { AppColors } from "@/constants/theme";
import { TaskStatus } from "@/types/collector";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TaskStepperProps {
  currentStatus: TaskStatus;
}

interface Step {
  status: TaskStatus;
  label: string;
  icon: string;
}

const steps: Step[] = [
  { status: "ASSIGNED", label: "Đã nhận", icon: "checkmark-circle" },
  { status: "ON_THE_WAY", label: "Đang di chuyển", icon: "car" },
  { status: "ARRIVED", label: "Đã đến", icon: "location" },
  { status: "COMPLETED", label: "Hoàn tất", icon: "checkmark-done-circle" },
];

export function TaskStepper({ currentStatus }: TaskStepperProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.status === currentStatus);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <React.Fragment key={step.status}>
            {/* Step circle */}
            <View style={styles.stepContainer}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isCurrent && styles.circleCurrent,
                  isUpcoming && styles.circleUpcoming,
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={20}
                  color={
                    isCompleted || isCurrent ? AppColors.white : AppColors.gray[400]
                  }
                />
              </View>
              <Text
                style={[
                  styles.label,
                  (isCompleted || isCurrent) && styles.labelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  isCompleted && styles.lineCompleted,
                  isCurrent && styles.lineCurrent,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.gray[300],
    marginBottom: 8,
  },
  circleCompleted: {
    backgroundColor: AppColors.success,
  },
  circleCurrent: {
    backgroundColor: AppColors.primary,
  },
  circleUpcoming: {
    backgroundColor: AppColors.gray[200],
  },
  label: {
    fontSize: 12,
    color: AppColors.gray[600],
    textAlign: "center",
  },
  labelActive: {
    fontWeight: "600",
    color: AppColors.gray[800],
  },
  line: {
    height: 3,
    flex: 1,
    backgroundColor: AppColors.gray[300],
    marginTop: -28,
    marginHorizontal: 4,
  },
  lineCompleted: {
    backgroundColor: AppColors.success,
  },
  lineCurrent: {
    backgroundColor: AppColors.primary,
  },
});
