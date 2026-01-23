import { AppColors } from "@/constants/theme";
import { UserRole } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const ROLES = [
  {
    value: "citizen" as UserRole,
    label: "Công dân",
    icon: "person",
    color: AppColors.citizen,
    description: "Thu gom rác, tích điểm",
  },
  {
    value: "shipper" as UserRole,
    label: "Shipper",
    icon: "car",
    color: AppColors.shipper,
    description: "Nhận đơn, thu gom",
  },
];

export default function RoleSelector({
  selectedRole,
  onSelectRole,
}: RoleSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vai trò của bạn:</Text>
      <View style={styles.roleButtons}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleButton,
              selectedRole === role.value && {
                backgroundColor: role.color,
                borderColor: role.color,
              },
            ]}
            onPress={() => onSelectRole(role.value)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={role.icon as any}
              size={32}
              color={selectedRole === role.value ? "#FFFFFF" : role.color}
            />
            <Text
              style={[
                styles.roleLabel,
                selectedRole === role.value && styles.roleLabelActive,
              ]}
            >
              {role.label}
            </Text>
            <Text
              style={[
                styles.roleDescription,
                selectedRole === role.value && styles.roleDescriptionActive,
              ]}
            >
              {role.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: AppColors.gray[200],
    backgroundColor: AppColors.white,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: "700",
    marginBottom: 4,
  },
  roleLabelActive: {
    color: AppColors.white,
  },
  roleDescription: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: "center",
  },
  roleDescriptionActive: {
    color: "rgba(255, 255, 255, 0.9)",
  },
});
