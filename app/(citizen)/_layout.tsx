import { TabIcon } from "@/components/ui";
import { AppColors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";

export default function CitizenLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: AppColors.white,
          borderTopWidth: 1,
          borderTopColor: AppColors.gray[200],
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "600",
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
        name="leaderboard"
        options={{
          title: "Xếp hạng",
          tabBarIcon: ({ color }) => <TabIcon name="trophy" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />

      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="create-report"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="register-enterprise"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="register-enterprise-form"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile-edit"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="profile-detail"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
