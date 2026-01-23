import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { getRouteByRoleId } from "@/utils/roleHelper";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Delay navigation to ensure Root Layout is mounted
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      // Redirect based on user roleId
      // roleId: 1 = citizen, 2 = enterprise, 3 = collector/shipper, 4 = admin
      const route = getRouteByRoleId(user?.roleId);
      router.replace(route as any);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

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
