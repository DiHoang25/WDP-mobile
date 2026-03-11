import { TabIcon } from "@/components/ui";
import { AppColors } from "@/constants/theme";
import { Tabs } from "expo-router";
import React from "react";

export default function CollectorLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AppColors.primary,
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
          title: "Trang chủ",
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="task-list"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
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
          title: "Cá nhân",
          tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
        }}
      />

      {/* Hidden screens - không hiển thị trong tab bar */}
      <Tabs.Screen
        name="shift-control"
        options={{
          href: null,
          title: "Bật/Tắt ca làm",
        }}
      />
      <Tabs.Screen
        name="task-detail"
        options={{
          href: null,
          title: "Chi tiết Đơn hàng",
        }}
      />
      <Tabs.Screen
        name="task-checkin"
        options={{
          href: null,
          title: "Check-in",
        }}
      />
      <Tabs.Screen
        name="task-complete"
        options={{
          href: null,
          title: "Hoàn tất",
        }}
      />
      <Tabs.Screen
        name="task-absent"
        options={{
          href: null,
          title: "Báo vắng",
        }}
      />
      <Tabs.Screen
        name="task-report-issue"
        options={{
          href: null,
          title: "Báo cáo sự cố",
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: "Thông báo",
        }}
      />
      <Tabs.Screen
        name="active-task"
        options={{
          href: null,
          title: "Đơn hàng đang xử lý",
        }}
      />
    </Tabs>
  );
}
