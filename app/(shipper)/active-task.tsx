import { Button, Card, Header } from "@/components/common";
import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ActiveTaskScreen() {
  const activeTask = {
    id: "report2",
    type: "Giấy",
    weight: 3.2,
    address: "123 Lê Lợi, Quận 1",
    customer: "Nguyễn Văn A",
    phone: "0901234567",
    status: "on-way",
  };

  const handleComplete = () => {
    Alert.alert("Hoàn thành đơn", "Xác nhận đã thu gom xong?", [
      { text: "Chưa", style: "cancel" },
      {
        text: "Hoàn thành",
        onPress: () => Alert.alert("Thành công", "Đơn hàng đã hoàn thành!"),
      },
    ]);
  };

  const handleCall = () => {
    Alert.alert("Gọi khách hàng", `Gọi đến số ${activeTask.phone}?`);
  };

  return (
    <View style={styles.container}>
      <Header
        title="Đơn đang làm"
        subtitle="Đang trên đường đến địa chỉ"
        showBack={false}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="outlined" style={styles.statusCard}>
          <View style={styles.statusContent}>
            <Ionicons
              name="car"
              size={48}
              color={AppColors.shipper}
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>Đang trên đường đến địa chỉ</Text>
          </View>
        </Card>

        <Card variant="elevated" style={styles.taskCard}>
          <View style={styles.taskSection}>
            <Text style={styles.taskLabel}>Loại rác</Text>
            <Text style={styles.taskValue}>{activeTask.type}</Text>
          </View>

          <View style={styles.taskSection}>
            <Text style={styles.taskLabel}>Khối lượng ước tính</Text>
            <Text style={styles.taskValue}>{activeTask.weight} kg</Text>
          </View>

          <View style={styles.taskSection}>
            <Text style={styles.taskLabel}>Địa chỉ thu gom</Text>
            <View style={styles.locationCard}>
              <Ionicons
                name="location"
                size={24}
                color={AppColors.primary}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText}>{activeTask.address}</Text>
            </View>
          </View>

          <View style={styles.taskSection}>
            <Text style={styles.taskLabel}>Khách hàng</Text>
            <View style={styles.customerCard}>
              <View>
                <Text style={styles.customerName}>{activeTask.customer}</Text>
                <Text style={styles.customerPhone}>{activeTask.phone}</Text>
              </View>
              <Button
                title="Gọi"
                onPress={handleCall}
                size="small"
                variant="outline"
              />
            </View>
          </View>
        </Card>

        <Button
          title="Hoàn thành thu gom"
          onPress={handleComplete}
          style={styles.completeButton}
        />

        <Card variant="outlined" style={styles.noteCard}>
          <View style={styles.noteContent}>
            <Ionicons
              name="bulb"
              size={24}
              color={AppColors.warning}
              style={styles.noteIcon}
            />
            <Text style={styles.noteText}>
              Nhấn "Hoàn thành" sau khi đã thu gom và xác nhận với khách hàng
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    marginBottom: 20,
    backgroundColor: AppColors.shipper + "20",
    borderColor: AppColors.shipper,
  },
  statusContent: {
    alignItems: "center",
  },
  statusIcon: {
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.shipper,
  },
  taskCard: {
    marginBottom: 20,
  },
  taskSection: {
    marginBottom: 20,
  },
  taskLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  taskValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.gray[50],
    padding: 15,
    borderRadius: 12,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    flex: 1,
  },
  customerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: AppColors.gray[50],
    padding: 15,
    borderRadius: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
  },
  customerPhone: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 3,
  },
  completeButton: {
    marginBottom: 15,
  },
  noteCard: {
    backgroundColor: AppColors.secondary + "10",
  },
  noteContent: {
    flexDirection: "row",
  },
  noteIcon: {
    marginRight: 10,
  },
  noteText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
