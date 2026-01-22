import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
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

      // Redirect based on user role
      if (user?.role === "citizen") {
        router.replace("/(citizen)" as any);
      } else if (user?.role === "shipper") {
        router.replace("/(shipper)" as any);
      } else {
        router.replace("/login");
      }
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
