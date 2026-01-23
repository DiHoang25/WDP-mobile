import { TabIcon } from "@/components/ui";
import { AppColors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";

export default function EnterpriseLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopWidth: 1,
          borderTopColor: AppColors.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
