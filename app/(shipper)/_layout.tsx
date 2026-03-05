import { TabIcon } from "@/components/ui";
import { AppColors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";

export default function ShipperLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.shipper,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopWidth: 1,
          borderTopColor: AppColors.gray[200],
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="active-task"
        options={{
          title: "Đang làm",
          tabBarIcon: ({ color }) => <TabIcon name="car" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Lịch sử",
          tabBarIcon: ({ color }) => <TabIcon name="time" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
