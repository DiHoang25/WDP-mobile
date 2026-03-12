import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getRouteByRoleId } from "@/utils/roleHelper";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, user, isLoading, pendingPayment } = useAuth();

  useEffect(() => {
    // Đợi quá trình kiểm tra token từ AsyncStorage hoàn tất
    if (isLoading) return;

    // Trì hoãn một chút để đảm bảo Root Layout đã gắn kết xong
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      // Điều hướng tới đúng phân hệ dựa trên roleId
      // roleId: 1 = citizen, 2 = enterprise, 3 = collector/shipper, 4 = admin
      if (user?.roleId === 2 && pendingPayment) {
        router.replace({
          pathname: "/payment",
          params: { referenceCode: pendingPayment.referenceCode }
        });
        return;
      }

      const route = getRouteByRoleId(user?.roleId);
      router.replace(route as any);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, isLoading, pendingPayment]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: AppColors.background,
      }}
    >
      <ActivityIndicator size="large" color={AppColors.primary} />
    </View>
  );
}
