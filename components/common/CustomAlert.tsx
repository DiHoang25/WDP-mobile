import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export type AlertType = "success" | "error" | "warning" | "info";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  buttons?: AlertButton[];
  onClose: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  type = "info",
  buttons,
  onClose,
}: CustomAlertProps) {
  const config = {
    success: {
      icon: "checkmark-circle",
      color: AppColors.success,
      bg: "#ECFDF5",
    },
    error: { icon: "close-circle", color: AppColors.error, bg: "#FEF2F2" },
    warning: { icon: "warning", color: "#F59E0B", bg: "#FFFBEB" },
    info: {
      icon: "information-circle",
      color: AppColors.primary,
      bg: "#EFF6FF",
    },
  }[type];

  const defaultButtons: AlertButton[] = [{ text: "Đồng ý", onPress: onClose }];
  const currentButtons = buttons || defaultButtons;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
            <Ionicons
              name={config.icon as any}
              size={40}
              color={config.color}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {currentButtons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  btn.style === "cancel"
                    ? styles.cancelButton
                    : btn.style === "destructive"
                      ? styles.destructiveButton
                      : styles.primaryButton,
                  currentButtons.length > 2
                    ? { width: "100%", marginBottom: 8 }
                    : { flex: 1, marginHorizontal: 4 },
                ]}
                onPress={() => {
                  onClose();
                  if (btn.onPress) {
                    setTimeout(() => {
                      btn.onPress?.();
                    }, 0);
                  }
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    btn.style === "cancel"
                      ? styles.cancelButtonText
                      : styles.primaryButtonText,
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: width * 0.85,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: AppColors.primary,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  destructiveButton: {
    backgroundColor: AppColors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButtonText: {
    color: "#fff",
  },
  cancelButtonText: {
    color: "#4B5563",
  },
});
